# Plano de Ação - Correções Críticas .com.rich

**Data:** 13 de Novembro de 2025
**Objetivo:** Corrigir 4 riscos críticos em **2 semanas** (80h de desenvolvimento)
**Equipe sugerida:** 2 devs full-stack OU 1 dev full-stack + 1 dev backend

---

## 📋 VISÃO GERAL DO PLANO

### Timeline
```
Sprint 1 (Semana 1): Riscos 1 e 2 + Testes
Sprint 2 (Semana 2): Riscos 3 e 4 + Validação
```

### Distribuição de Esforço
```
Backend:  45h (56%)
Frontend: 20h (25%)
Database: 10h (13%)
Testing:   5h (6%)
Total:    80h (2 semanas com 2 devs)
```

---

## 🔴 RISCO 1: PAYMENT RECONCILIATION (16h total)

### Problema
Webhooks do PayPal podem falhar → Pagamento confirmado mas domínio não ativado → Perda de receita

### Solução
Criar sistema de reconciliação automática que roda a cada 6h e corrige discrepâncias

---

### TAREFA 1.1: Criar Tabela de Reconciliação (2h)

**Responsável:** Backend Dev
**Arquivo:** `supabase/migrations/20251113100000_payment_reconciliation.sql`

```sql
/*
  # Payment Reconciliation System

  1. Tables
    - payment_reconciliation_log: Track all reconciliation attempts
    - payment_discrepancies: Store found discrepancies

  2. Functions
    - log_reconciliation_attempt()
    - mark_discrepancy_resolved()
*/

-- Log de tentativas de reconciliação
CREATE TABLE payment_reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text CHECK (status IN ('running', 'completed', 'failed')),
  paypal_transactions_checked int DEFAULT 0,
  db_orders_checked int DEFAULT 0,
  discrepancies_found int DEFAULT 0,
  discrepancies_resolved int DEFAULT 0,
  error_message text,
  execution_time_ms int
);

-- Discrepâncias encontradas
CREATE TABLE payment_discrepancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid REFERENCES payment_reconciliation_log(id),
  discrepancy_type text CHECK (discrepancy_type IN (
    'missing_in_db',
    'status_mismatch',
    'amount_mismatch',
    'duplicate_payment'
  )),
  paypal_transaction_id text,
  paypal_amount numeric(10,2),
  paypal_status text,
  db_order_id uuid REFERENCES orders(id),
  db_amount numeric(10,2),
  db_status text,
  auto_resolved boolean DEFAULT false,
  resolution_action text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reconciliation_log_started ON payment_reconciliation_log(started_at DESC);
CREATE INDEX idx_discrepancies_resolved ON payment_discrepancies(auto_resolved, resolved_at);
CREATE INDEX idx_discrepancies_paypal_id ON payment_discrepancies(paypal_transaction_id);

-- RLS
ALTER TABLE payment_reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_discrepancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliation logs"
  ON payment_reconciliation_log FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view discrepancies"
  ON payment_discrepancies FOR ALL
  TO authenticated
  USING (is_admin());

-- Função helper
CREATE OR REPLACE FUNCTION log_reconciliation_attempt(
  p_status text,
  p_paypal_checked int,
  p_db_checked int,
  p_discrepancies_found int,
  p_discrepancies_resolved int,
  p_execution_time_ms int,
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO payment_reconciliation_log (
    status,
    paypal_transactions_checked,
    db_orders_checked,
    discrepancies_found,
    discrepancies_resolved,
    execution_time_ms,
    error_message,
    completed_at
  ) VALUES (
    p_status,
    p_paypal_checked,
    p_db_checked,
    p_discrepancies_found,
    p_discrepancies_resolved,
    p_execution_time_ms,
    p_error_message,
    now()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;
```

**Validação:**
```sql
-- Testar criação de log
SELECT log_reconciliation_attempt('completed', 100, 98, 2, 2, 1500, NULL);

-- Verificar estrutura
\d payment_reconciliation_log
\d payment_discrepancies
```

---

### TAREFA 1.2: Edge Function de Reconciliação (8h)

**Responsável:** Backend Dev
**Arquivo:** `supabase/functions/payment-reconciliation/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PayPalTransaction {
  id: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'CANCELLED';
  amount: {
    value: string;
    currency_code: string;
  };
  create_time: string;
  update_time: string;
  custom_id?: string; // Nossa order_id
}

interface PayPalListResponse {
  transactions: PayPalTransaction[];
  total_items: number;
  links: Array<{ href: string; rel: string }>;
}

// Função para obter token do PayPal
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const isProduction = Deno.env.get('PAYPAL_MODE') === 'production';

  const baseURL = isProduction
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get PayPal token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Função para buscar transações do PayPal
async function fetchPayPalTransactions(
  token: string,
  startDate: string,
  endDate: string
): Promise<PayPalTransaction[]> {
  const isProduction = Deno.env.get('PAYPAL_MODE') === 'production';
  const baseURL = isProduction
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  // PayPal Transactions API
  const url = new URL(`${baseURL}/v1/reporting/transactions`);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);
  url.searchParams.append('fields', 'all');
  url.searchParams.append('page_size', '500');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PayPal transactions: ${response.statusText}`);
  }

  const data: PayPalListResponse = await response.json();
  return data.transactions || [];
}

// Função principal
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    console.log('Starting payment reconciliation...');

    // 1. Definir período de reconciliação (últimas 24h)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    console.log(`Checking period: ${startISO} to ${endISO}`);

    // 2. Buscar transações do PayPal
    const paypalToken = await getPayPalAccessToken();
    const paypalTransactions = await fetchPayPalTransactions(
      paypalToken,
      startISO,
      endISO
    );

    console.log(`Found ${paypalTransactions.length} PayPal transactions`);

    // 3. Buscar orders do DB no mesmo período
    const { data: dbOrders, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (dbError) throw dbError;

    console.log(`Found ${dbOrders?.length || 0} DB orders`);

    // 4. Reconciliar
    const discrepancies: any[] = [];
    let resolvedCount = 0;

    // Criar log de reconciliação
    const { data: logData } = await supabase.rpc('log_reconciliation_attempt', {
      p_status: 'running',
      p_paypal_checked: paypalTransactions.length,
      p_db_checked: dbOrders?.length || 0,
      p_discrepancies_found: 0,
      p_discrepancies_resolved: 0,
      p_execution_time_ms: 0
    });

    const reconciliationId = logData;

    // Verificar cada transação do PayPal
    for (const transaction of paypalTransactions) {
      // Pular se não for COMPLETED
      if (transaction.status !== 'COMPLETED') continue;

      const dbOrder = dbOrders?.find(
        o => o.paypal_order_id === transaction.id ||
             o.id === transaction.custom_id
      );

      if (!dbOrder) {
        // DISCREPÂNCIA: Pagamento existe no PayPal mas não no DB
        discrepancies.push({
          reconciliation_id: reconciliationId,
          discrepancy_type: 'missing_in_db',
          paypal_transaction_id: transaction.id,
          paypal_amount: parseFloat(transaction.amount.value),
          paypal_status: transaction.status,
          db_order_id: null,
          db_amount: null,
          db_status: null,
          notes: 'Payment completed in PayPal but not found in database'
        });

        console.warn(`Missing in DB: ${transaction.id}`);

      } else if (dbOrder.status === 'pending') {
        // DISCREPÂNCIA: Pagamento completo no PayPal mas pending no DB
        discrepancies.push({
          reconciliation_id: reconciliationId,
          discrepancy_type: 'status_mismatch',
          paypal_transaction_id: transaction.id,
          paypal_amount: parseFloat(transaction.amount.value),
          paypal_status: transaction.status,
          db_order_id: dbOrder.id,
          db_amount: dbOrder.total_amount,
          db_status: dbOrder.status,
          notes: 'Payment completed in PayPal but pending in database'
        });

        // AUTO-CORRIGIR: Atualizar status no DB
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            completed_at: new Date(transaction.update_time),
            updated_at: new Date()
          })
          .eq('id', dbOrder.id);

        if (!updateError) {
          // Ativar domínio se ainda não estiver ativo
          const { data: domain } = await supabase
            .from('domains')
            .select('status')
            .eq('id', dbOrder.domain_id)
            .single();

          if (domain && domain.status !== 'active') {
            await supabase
              .from('domains')
              .update({
                status: 'active',
                activated_at: new Date(),
                lifecycle_status: 'active'
              })
              .eq('id', dbOrder.domain_id);

            // Criar profile se não existir
            await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/auto-create-profile`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: dbOrder.user_id,
                  domainId: dbOrder.domain_id
                })
              }
            );
          }

          // Marcar como auto-resolvido
          await supabase
            .from('payment_discrepancies')
            .update({
              auto_resolved: true,
              resolution_action: 'Updated order status to completed and activated domain',
              resolved_at: new Date()
            })
            .eq('paypal_transaction_id', transaction.id);

          resolvedCount++;
          console.log(`Auto-resolved: ${transaction.id}`);
        }

      } else if (Math.abs(parseFloat(transaction.amount.value) - dbOrder.total_amount) > 0.01) {
        // DISCREPÂNCIA: Valores não batem
        discrepancies.push({
          reconciliation_id: reconciliationId,
          discrepancy_type: 'amount_mismatch',
          paypal_transaction_id: transaction.id,
          paypal_amount: parseFloat(transaction.amount.value),
          paypal_status: transaction.status,
          db_order_id: dbOrder.id,
          db_amount: dbOrder.total_amount,
          db_status: dbOrder.status,
          notes: `Amount mismatch: PayPal=${transaction.amount.value}, DB=${dbOrder.total_amount}`
        });

        console.warn(`Amount mismatch: ${transaction.id}`);
      }
    }

    // 5. Salvar discrepâncias
    if (discrepancies.length > 0) {
      const { error: discError } = await supabase
        .from('payment_discrepancies')
        .insert(discrepancies);

      if (discError) {
        console.error('Error saving discrepancies:', discError);
      }
    }

    // 6. Atualizar log
    const executionTime = Date.now() - startTime;
    await supabase.rpc('log_reconciliation_attempt', {
      p_status: 'completed',
      p_paypal_checked: paypalTransactions.length,
      p_db_checked: dbOrders?.length || 0,
      p_discrepancies_found: discrepancies.length,
      p_discrepancies_resolved: resolvedCount,
      p_execution_time_ms: executionTime
    });

    // 7. Enviar alerta se houver discrepâncias não resolvidas
    const unresolvedCount = discrepancies.length - resolvedCount;
    if (unresolvedCount > 0) {
      // TODO: Integrar com Slack/Email
      console.error(`${unresolvedCount} unresolved payment discrepancies found!`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          paypal_transactions: paypalTransactions.length,
          db_orders: dbOrders?.length || 0,
          discrepancies_found: discrepancies.length,
          auto_resolved: resolvedCount,
          unresolved: unresolvedCount,
          execution_time_ms: executionTime
        },
        discrepancies: discrepancies.map(d => ({
          type: d.discrepancy_type,
          paypal_id: d.paypal_transaction_id,
          db_order_id: d.db_order_id,
          auto_resolved: d.auto_resolved
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Reconciliation error:', error);

    const executionTime = Date.now() - startTime;
    await supabase.rpc('log_reconciliation_attempt', {
      p_status: 'failed',
      p_paypal_checked: 0,
      p_db_checked: 0,
      p_discrepancies_found: 0,
      p_discrepancies_resolved: 0,
      p_execution_time_ms: executionTime,
      p_error_message: error.message
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

**Deploy:**
```bash
cd supabase/functions
supabase functions deploy payment-reconciliation
```

**Testar:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/payment-reconciliation \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### TAREFA 1.3: Configurar Cron Job (1h)

**Responsável:** DevOps/Backend
**Ferramenta:** pg_cron (já incluído no Supabase)

```sql
-- Ativar extensão pg_cron (se ainda não ativada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar reconciliação a cada 6 horas
SELECT cron.schedule(
  'payment-reconciliation',
  '0 */6 * * *', -- A cada 6 horas
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM system_settings WHERE key = 'supabase_url') || '/functions/v1/payment-reconciliation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT value FROM system_settings WHERE key = 'service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verificar cron jobs agendados
SELECT * FROM cron.job;
```

**Alternativa (se pg_cron não disponível):**
Usar GitHub Actions ou cron externo:

```.github/workflows/reconciliation.yml
name: Payment Reconciliation
on:
  schedule:
    - cron: '0 */6 * * *' # A cada 6 horas
  workflow_dispatch: # Permite executar manualmente

jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - name: Run Reconciliation
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/payment-reconciliation \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

---

### TAREFA 1.4: Admin Dashboard (5h)

**Responsável:** Frontend Dev
**Arquivo:** `src/pages/AdminPaymentReconciliation.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import AdminPageHeader from '../components/AdminPageHeader';
import PanelLayout from '../components/PanelLayout';

interface ReconciliationLog {
  id: string;
  started_at: string;
  status: string;
  paypal_transactions_checked: number;
  db_orders_checked: number;
  discrepancies_found: number;
  discrepancies_resolved: number;
  execution_time_ms: number;
}

interface Discrepancy {
  id: string;
  discrepancy_type: string;
  paypal_transaction_id: string;
  paypal_amount: number;
  paypal_status: string;
  db_order_id: string | null;
  db_amount: number | null;
  db_status: string | null;
  auto_resolved: boolean;
  resolved_at: string | null;
  notes: string;
  created_at: string;
}

const AdminPaymentReconciliation: React.FC = () => {
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Buscar logs
    const { data: logsData } = await supabase
      .from('payment_reconciliation_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    // Buscar discrepâncias não resolvidas
    const { data: discData } = await supabase
      .from('payment_discrepancies')
      .select('*')
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    setLogs(logsData || []);
    setDiscrepancies(discData || []);
    setLoading(false);
  };

  const runReconciliation = async () => {
    setRunning(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-reconciliation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      alert(`Reconciliação concluída!\nDiscrepâncias: ${result.summary.discrepancies_found}\nResolvidas: ${result.summary.auto_resolved}`);
      fetchData();
    } catch (error) {
      console.error('Error running reconciliation:', error);
      alert('Erro ao executar reconciliação');
    } finally {
      setRunning(false);
    }
  };

  const resolveDiscrepancy = async (discrepancyId: string) => {
    const notes = prompt('Adicione notas sobre a resolução:');
    if (!notes) return;

    const { error } = await supabase
      .from('payment_discrepancies')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id,
        notes: notes
      })
      .eq('id', discrepancyId);

    if (!error) {
      alert('Discrepância marcada como resolvida');
      fetchData();
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center h-screen">
          <Clock className="w-8 h-8 animate-spin" />
        </div>
      </PanelLayout>
    );
  }

  const latestLog = logs[0];
  const unresolvedCount = discrepancies.length;

  return (
    <PanelLayout>
      <AdminPageHeader
        title="Payment Reconciliation"
        description="Monitor and resolve payment discrepancies"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Última Execução</p>
              <p className="text-2xl font-bold">
                {latestLog ? new Date(latestLog.started_at).toLocaleString('pt-BR') : 'N/A'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discrepâncias Não Resolvidas</p>
              <p className="text-2xl font-bold text-red-600">{unresolvedCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Auto-Resolvidas (Última)</p>
              <p className="text-2xl font-bold text-green-600">
                {latestLog?.discrepancies_resolved || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transações Verificadas</p>
              <p className="text-2xl font-bold">
                {latestLog?.paypal_transactions_checked || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={runReconciliation}
          disabled={running}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? 'Executando...' : 'Executar Reconciliação Agora'}
        </button>
      </div>

      {/* Unresolved Discrepancies */}
      {unresolvedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            ⚠️ Discrepâncias Não Resolvidas ({unresolvedCount})
          </h3>
          <div className="space-y-4">
            {discrepancies.map((disc) => (
              <div key={disc.id} className="bg-white p-4 rounded border border-red-300">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded mr-2">
                      {disc.discrepancy_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(disc.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <button
                    onClick={() => resolveDiscrepancy(disc.id)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Marcar Resolvida
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">PayPal ID:</p>
                    <p className="font-mono">{disc.paypal_transaction_id}</p>
                    <p className="text-gray-600 mt-2">PayPal Amount:</p>
                    <p className="font-semibold">${disc.paypal_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">DB Order ID:</p>
                    <p className="font-mono">{disc.db_order_id || 'N/A'}</p>
                    <p className="text-gray-600 mt-2">DB Amount:</p>
                    <p className="font-semibold">${disc.db_amount || 'N/A'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Notes:</strong> {disc.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Histórico de Reconciliações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PayPal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discrepâncias</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolvidas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(log.started_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      log.status === 'completed' ? 'bg-green-100 text-green-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.paypal_transactions_checked}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{log.db_orders_checked}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    {log.discrepancies_found}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {log.discrepancies_resolved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(log.execution_time_ms / 1000).toFixed(2)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PanelLayout>
  );
};

export default AdminPaymentReconciliation;
```

**Adicionar rota:** `src/App.tsx`
```typescript
import AdminPaymentReconciliation from './pages/AdminPaymentReconciliation';

// Adicionar na seção de rotas admin
<Route path="/admin/payment-reconciliation" element={<AdminPaymentReconciliation />} />
```

---

### ✅ VALIDAÇÃO RISCO 1

**Checklist:**
- [ ] Tabelas criadas corretamente
- [ ] Edge function deployada e funcionando
- [ ] Cron job agendado e executando
- [ ] Admin dashboard acessível
- [ ] Teste: Criar pagamento manual no PayPal e verificar auto-correção
- [ ] Teste: Simular webhook failure e verificar detecção

**Tempo total:** 16h

---

## 🔴 RISCO 2: TRIAL ABUSE DETECTION (12h total)

### Problema
Usuários podem criar infinitas contas trial usando email+1@gmail.com, IPs diferentes, etc.

### Solução
Sistema de detecção baseado em múltiplos sinais (email normalizado, IP, device fingerprint)

---

### TAREFA 2.1: Criar Sistema de Fraud Detection (3h)

**Responsável:** Backend Dev
**Arquivo:** `supabase/migrations/20251113110000_trial_abuse_detection.sql`

```sql
/*
  # Trial Abuse Detection System

  1. Tables
    - fraud_signals: Store signals for fraud detection
    - blocked_trials: Block specific users from trial

  2. Functions
    - normalize_email()
    - check_trial_abuse()
    - block_user_from_trial()
*/

-- Sinais de fraude
CREATE TABLE fraud_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email_raw text,
  email_normalized text,
  email_hash text,
  phone_raw text,
  phone_normalized text,
  phone_hash text,
  ip_address inet,
  user_agent text,
  device_fingerprint text,
  created_at timestamptz DEFAULT now()
);

-- Usuários bloqueados de trial
CREATE TABLE blocked_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type text CHECK (identifier_type IN ('email', 'phone', 'ip', 'fingerprint')),
  identifier_hash text NOT NULL,
  reason text,
  blocked_at timestamptz DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  notes text
);

-- Indexes
CREATE INDEX idx_fraud_signals_email_hash ON fraud_signals(email_hash);
CREATE INDEX idx_fraud_signals_phone_hash ON fraud_signals(phone_hash);
CREATE INDEX idx_fraud_signals_ip ON fraud_signals(ip_address);
CREATE INDEX idx_fraud_signals_fingerprint ON fraud_signals(device_fingerprint);
CREATE INDEX idx_fraud_signals_created ON fraud_signals(created_at DESC);

CREATE INDEX idx_blocked_trials_identifier ON blocked_trials(identifier_hash);
CREATE INDEX idx_blocked_trials_expires ON blocked_trials(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud signals"
  ON fraud_signals FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage blocked trials"
  ON blocked_trials FOR ALL
  TO authenticated
  USING (is_admin());

-- Função para normalizar email
CREATE OR REPLACE FUNCTION normalize_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_normalized text;
BEGIN
  -- Lowercase e trim
  v_normalized := lower(trim(p_email));

  -- Remove tudo entre + e @ (gmail trick)
  v_normalized := regexp_replace(v_normalized, '\+[^@]*@', '@');

  -- Remove pontos do Gmail (user.name@gmail.com = username@gmail.com)
  IF v_normalized LIKE '%@gmail.com' THEN
    v_normalized := regexp_replace(
      regexp_replace(v_normalized, '\.', '', 'g'),
      '(.*)@',
      '\1@'
    );
  END IF;

  RETURN v_normalized;
END;
$$;

-- Função para normalizar telefone
CREATE OR REPLACE FUNCTION normalize_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove tudo exceto dígitos
  RETURN regexp_replace(p_phone, '[^0-9]', '', 'g');
END;
$$;

-- Função principal de detecção
CREATE OR REPLACE FUNCTION check_trial_abuse(
  p_email text,
  p_phone text DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_normalized text;
  v_email_hash text;
  v_phone_normalized text;
  v_phone_hash text;
  v_abuse_score int := 0;
  v_abuse_reasons text[] := ARRAY[]::text[];
  v_previous_trials int;
  v_is_blocked boolean := false;
BEGIN
  -- Normalizar e hash email
  v_email_normalized := normalize_email(p_email);
  v_email_hash := encode(digest(v_email_normalized, 'sha256'), 'hex');

  -- Normalizar e hash phone (se fornecido)
  IF p_phone IS NOT NULL THEN
    v_phone_normalized := normalize_phone(p_phone);
    v_phone_hash := encode(digest(v_phone_normalized, 'sha256'), 'hex');
  END IF;

  -- 1. Verificar bloqueios explícitos
  SELECT EXISTS (
    SELECT 1 FROM blocked_trials
    WHERE identifier_hash IN (v_email_hash, v_phone_hash, encode(digest(p_ip::text, 'sha256'), 'hex'), encode(digest(p_device_fingerprint, 'sha256'), 'hex'))
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN jsonb_build_object(
      'is_abuse', true,
      'score', 100,
      'reasons', ARRAY['Explicitly blocked from trials'],
      'should_block', true
    );
  END IF;

  -- 2. Contar trials anteriores com mesmo email normalizado
  SELECT COUNT(*) INTO v_previous_trials
  FROM fraud_signals fs
  JOIN subscriptions s ON s.user_id = fs.user_id
  WHERE fs.email_hash = v_email_hash
    AND s.plan_code = 'prime'
    AND s.status IN ('trial', 'cancelled', 'expired')
    AND fs.created_at > now() - interval '90 days';

  IF v_previous_trials > 0 THEN
    v_abuse_score := v_abuse_score + (v_previous_trials * 40);
    v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials with same email', v_previous_trials));
  END IF;

  -- 3. Verificar mesmo IP
  IF p_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO v_previous_trials
    FROM fraud_signals fs
    JOIN subscriptions s ON s.user_id = fs.user_id
    WHERE fs.ip_address = p_ip
      AND s.plan_code = 'prime'
      AND s.status IN ('trial', 'cancelled', 'expired')
      AND fs.created_at > now() - interval '90 days';

    IF v_previous_trials > 0 THEN
      v_abuse_score := v_abuse_score + (v_previous_trials * 30);
      v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials from same IP', v_previous_trials));
    END IF;
  END IF;

  -- 4. Verificar mesmo device fingerprint
  IF p_device_fingerprint IS NOT NULL THEN
    SELECT COUNT(*) INTO v_previous_trials
    FROM fraud_signals fs
    JOIN subscriptions s ON s.user_id = fs.user_id
    WHERE fs.device_fingerprint = p_device_fingerprint
      AND s.plan_code = 'prime'
      AND s.status IN ('trial', 'cancelled', 'expired')
      AND fs.created_at > now() - interval '90 days';

    IF v_previous_trials > 0 THEN
      v_abuse_score := v_abuse_score + (v_previous_trials * 35);
      v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials from same device', v_previous_trials));
    END IF;
  END IF;

  -- 5. Verificar mesmo telefone
  IF p_phone IS NOT NULL THEN
    SELECT COUNT(*) INTO v_previous_trials
    FROM fraud_signals fs
    JOIN subscriptions s ON s.user_id = fs.user_id
    WHERE fs.phone_hash = v_phone_hash
      AND s.plan_code = 'prime'
      AND s.status IN ('trial', 'cancelled', 'expired')
      AND fs.created_at > now() - interval '90 days';

    IF v_previous_trials > 0 THEN
      v_abuse_score := v_abuse_score + (v_previous_trials * 45);
      v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials with same phone', v_previous_trials));
    END IF;
  END IF;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'is_abuse', v_abuse_score >= 50, -- Threshold de 50 pontos
    'score', v_abuse_score,
    'reasons', v_abuse_reasons,
    'should_block', v_abuse_score >= 100 -- Auto-block se >= 100
  );
END;
$$;

-- Função para registrar sinal
CREATE OR REPLACE FUNCTION record_fraud_signal(
  p_user_id uuid,
  p_email text,
  p_phone text DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signal_id uuid;
BEGIN
  INSERT INTO fraud_signals (
    user_id,
    email_raw,
    email_normalized,
    email_hash,
    phone_raw,
    phone_normalized,
    phone_hash,
    ip_address,
    user_agent,
    device_fingerprint
  ) VALUES (
    p_user_id,
    p_email,
    normalize_email(p_email),
    encode(digest(normalize_email(p_email), 'sha256'), 'hex'),
    p_phone,
    CASE WHEN p_phone IS NOT NULL THEN normalize_phone(p_phone) ELSE NULL END,
    CASE WHEN p_phone IS NOT NULL THEN encode(digest(normalize_phone(p_phone), 'sha256'), 'hex') ELSE NULL END,
    p_ip,
    p_user_agent,
    p_device_fingerprint
  ) RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$;

-- Função para bloquear explicitamente
CREATE OR REPLACE FUNCTION block_from_trial(
  p_identifier_type text,
  p_identifier text,
  p_reason text,
  p_days int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_block_id uuid;
  v_hash text;
BEGIN
  -- Calcular hash do identificador
  v_hash := CASE p_identifier_type
    WHEN 'email' THEN encode(digest(normalize_email(p_identifier), 'sha256'), 'hex')
    WHEN 'phone' THEN encode(digest(normalize_phone(p_identifier), 'sha256'), 'hex')
    WHEN 'ip' THEN encode(digest(p_identifier, 'sha256'), 'hex')
    WHEN 'fingerprint' THEN encode(digest(p_identifier, 'sha256'), 'hex')
    ELSE NULL
  END;

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'Invalid identifier type: %', p_identifier_type;
  END IF;

  INSERT INTO blocked_trials (
    identifier_type,
    identifier_hash,
    reason,
    blocked_by,
    expires_at
  ) VALUES (
    p_identifier_type,
    v_hash,
    p_reason,
    auth.uid(),
    CASE WHEN p_days IS NOT NULL THEN now() + (p_days || ' days')::interval ELSE NULL END
  ) RETURNING id INTO v_block_id;

  RETURN v_block_id;
END;
$$;

-- View para admin dashboard
CREATE OR REPLACE VIEW fraud_detection_summary AS
SELECT
  fs.email_normalized,
  COUNT(DISTINCT fs.user_id) as accounts_created,
  COUNT(DISTINCT s.id) as trial_attempts,
  SUM(CASE WHEN s.status = 'trial' THEN 1 ELSE 0 END) as active_trials,
  SUM(CASE WHEN s.status = 'active' AND s.plan_code = 'prime' THEN 1 ELSE 0 END) as converted_to_paid,
  MAX(fs.created_at) as last_attempt,
  ARRAY_AGG(DISTINCT fs.ip_address::text) as ip_addresses
FROM fraud_signals fs
LEFT JOIN subscriptions s ON s.user_id = fs.user_id AND s.plan_code = 'prime'
WHERE fs.created_at > now() - interval '90 days'
GROUP BY fs.email_normalized
HAVING COUNT(DISTINCT fs.user_id) > 1 OR COUNT(DISTINCT s.id) > 1
ORDER BY accounts_created DESC, trial_attempts DESC;
```

**Validação:**
```sql
-- Testar normalização de email
SELECT normalize_email('User.Name+test@Gmail.com');
-- Deve retornar: username@gmail.com

-- Testar detecção
SELECT check_trial_abuse('test+1@gmail.com', '+55 11 98765-4321', '192.168.1.1'::inet, 'fp_123');

-- Testar registro de sinal
SELECT record_fraud_signal(
  (SELECT id FROM auth.users LIMIT 1),
  'test@example.com',
  '+55 11 12345-6789',
  '192.168.1.1'::inet,
  'Mozilla/5.0',
  'fp_abc123'
);
```

---

### TAREFA 2.2: Integrar no Frontend (4h)

**Responsável:** Frontend Dev

**2.2.1 - Criar Device Fingerprinting**

**Arquivo:** `src/lib/deviceFingerprint.ts`

```typescript
/**
 * Gera um fingerprint único do device do usuário
 * Combina múltiplos atributos para criar identificador semi-persistente
 */

export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];

  // 1. Screen info
  components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);

  // 2. Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // 3. Language
  components.push(navigator.language);

  // 4. Platform
  components.push(navigator.platform);

  // 5. User Agent
  components.push(navigator.userAgent);

  // 6. Hardware concurrency (CPU cores)
  components.push(String(navigator.hardwareConcurrency || 'unknown'));

  // 7. Device memory (if available)
  if ('deviceMemory' in navigator) {
    components.push(String((navigator as any).deviceMemory));
  }

  // 8. Touch support
  components.push(String('ontouchstart' in window));

  // 9. Canvas fingerprint (mais robusto)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('.com.rich fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('.com.rich fingerprint', 4, 17);

      const dataURL = canvas.toDataURL();
      components.push(dataURL.slice(-50)); // Últimos 50 chars
    }
  } catch (e) {
    components.push('canvas_error');
  }

  // Combinar todos os components
  const combined = components.join('|');

  // Hash com SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// Função para obter IP do usuário (via serviço externo)
export async function getUserIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    return null;
  }
}
```

**2.2.2 - Integrar no Checkout**

**Arquivo:** `src/pages/Checkout.tsx`

```typescript
import { generateDeviceFingerprint, getUserIP } from '../lib/deviceFingerprint';

// Adicionar no início da função do componente
const [fraudCheck, setFraudCheck] = useState<{loading: boolean, blocked: boolean, message: string}>({
  loading: false,
  blocked: false,
  message: ''
});

// Adicionar useEffect para checar fraud no mount
useEffect(() => {
  checkFraudSignals();
}, []);

const checkFraudSignals = async () => {
  setFraudCheck({ loading: true, blocked: false, message: '' });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Gerar fingerprint e obter IP
    const fingerprint = await generateDeviceFingerprint();
    const ip = await getUserIP();

    // Verificar abuse
    const { data: checkResult, error } = await supabase.rpc('check_trial_abuse', {
      p_email: user.email,
      p_phone: contactInfo.phone || null,
      p_ip: ip,
      p_device_fingerprint: fingerprint
    });

    if (error) throw error;

    if (checkResult.is_abuse) {
      setFraudCheck({
        loading: false,
        blocked: true,
        message: `Trial não disponível. ${checkResult.reasons.join('. ')}. Por favor, escolha um plano pago.`
      });
    } else {
      // Registrar sinal (para tracking futuro)
      await supabase.rpc('record_fraud_signal', {
        p_user_id: user.id,
        p_email: user.email,
        p_phone: contactInfo.phone || null,
        p_ip: ip,
        p_user_agent: navigator.userAgent,
        p_device_fingerprint: fingerprint
      });

      setFraudCheck({ loading: false, blocked: false, message: '' });
    }
  } catch (error) {
    console.error('Fraud check error:', error);
    // Em caso de erro, permitir (fail open)
    setFraudCheck({ loading: false, blocked: false, message: '' });
  }
};

// Adicionar validação no submit
const handleSubmit = async () => {
  // ... validações existentes ...

  // Verificar se está bloqueado
  if (fraudCheck.blocked && selectedPlanCode === 'prime') {
    setError(fraudCheck.message);
    return;
  }

  // ... continuar com pagamento ...
};

// Adicionar UI warning se fraud detectado
{fraudCheck.blocked && (
  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
    <div className="flex items-center">
      <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
      <div>
        <p className="text-red-800 font-semibold">Trial não disponível</p>
        <p className="text-red-700 text-sm mt-1">{fraudCheck.message}</p>
        <p className="text-red-700 text-sm mt-2">
          Você pode escolher um dos nossos planos pagos para começar imediatamente.
        </p>
      </div>
    </div>
  </div>
)}
```

---

### TAREFA 2.3: Admin Dashboard para Fraud (3h)

**Arquivo:** `src/pages/AdminFraudDetection.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertTriangle, Ban, CheckCircle } from 'lucide-react';
import AdminPageHeader from '../components/AdminPageHeader';
import PanelLayout from '../components/PanelLayout';

interface FraudSummary {
  email_normalized: string;
  accounts_created: number;
  trial_attempts: number;
  active_trials: number;
  converted_to_paid: number;
  last_attempt: string;
  ip_addresses: string[];
}

const AdminFraudDetection: React.FC = () => {
  const [summary, setSummary] = useState<FraudSummary[]>([]);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Buscar sumário de fraudes
    const { data: summaryData } = await supabase
      .from('fraud_detection_summary')
      .select('*')
      .limit(50);

    // Buscar bloqueios ativos
    const { data: blockedData } = await supabase
      .from('blocked_trials')
      .select('*')
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('blocked_at', { ascending: false });

    setSummary(summaryData || []);
    setBlocked(blockedData || []);
    setLoading(false);
  };

  const blockEmail = async (email: string) => {
    const reason = prompt(`Bloquear ${email} de trials?\nMotivo:`);
    if (!reason) return;

    const days = prompt('Dias de bloqueio (vazio = permanente):');

    const { error } = await supabase.rpc('block_from_trial', {
      p_identifier_type: 'email',
      p_identifier: email,
      p_reason: reason,
      p_days: days ? parseInt(days) : null
    });

    if (!error) {
      alert('Email bloqueado com sucesso');
      fetchData();
    } else {
      alert('Erro ao bloquear: ' + error.message);
    }
  };

  const unblockIdentifier = async (blockId: string) => {
    const { error } = await supabase
      .from('blocked_trials')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', blockId);

    if (!error) {
      alert('Bloqueio removido');
      fetchData();
    }
  };

  if (loading) {
    return <PanelLayout><div className="p-8">Carregando...</div></PanelLayout>;
  }

  const suspiciousCount = summary.filter(s => s.trial_attempts > 1).length;
  const blockedCount = blocked.length;

  return (
    <PanelLayout>
      <AdminPageHeader
        title="Fraud Detection"
        description="Monitor e bloqueie tentativas de abuso de trial"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atividades Suspeitas</p>
              <p className="text-2xl font-bold text-orange-600">{suspiciousCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bloqueios Ativos</p>
              <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
            </div>
            <Ban className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.length > 0
                  ? ((summary.reduce((sum, s) => sum + s.converted_to_paid, 0) / summary.reduce((sum, s) => sum + s.trial_attempts, 0)) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Suspicious Activity */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Atividades Suspeitas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trials</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Converteu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IPs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary.map((item, idx) => (
                <tr key={idx} className={item.trial_attempts > 2 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm font-mono">{item.email_normalized}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{item.accounts_created}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600">{item.trial_attempts}</td>
                  <td className="px-6 py-4 text-sm">{item.active_trials}</td>
                  <td className="px-6 py-4 text-sm">
                    {item.converted_to_paid > 0 ? (
                      <span className="text-green-600 font-semibold">{item.converted_to_paid}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="max-w-xs truncate" title={item.ip_addresses.join(', ')}>
                      {item.ip_addresses.length} IP(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {new Date(item.last_attempt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => blockEmail(item.email_normalized)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Bloquear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Blocks */}
      {blockedCount > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Bloqueios Ativos</h3>
          </div>
          <div className="divide-y">
            {blocked.map((block) => (
              <div key={block.id} className="p-6 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                      {block.identifier_type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      Bloqueado em {new Date(block.blocked_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold">{block.reason}</p>
                  {block.notes && (
                    <p className="text-sm text-gray-600 mt-1">{block.notes}</p>
                  )}
                  {block.expires_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      Expira: {new Date(block.expires_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => unblockIdentifier(block.id)}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelLayout>
  );
};

export default AdminFraudDetection;
```

**Adicionar rota:** `src/App.tsx`
```typescript
<Route path="/admin/fraud-detection" element={<AdminFraudDetection />} />
```

---

### TAREFA 2.4: Testes (2h)

**Responsável:** QA/Dev

**Casos de teste:**

```typescript
// test/fraud-detection.test.ts

describe('Fraud Detection', () => {
  test('Should detect same email with + trick', async () => {
    const result = await supabase.rpc('check_trial_abuse', {
      p_email: 'user+test1@gmail.com'
    });

    // Se já existe trial com user@gmail.com, deve detectar
    expect(result.data.is_abuse).toBe(true);
  });

  test('Should detect same IP multiple trials', async () => {
    // Criar 2 trials com mesmo IP
    // Terceiro deve ser bloqueado
  });

  test('Should normalize Gmail dots correctly', async () => {
    const email1 = 'user.name@gmail.com';
    const email2 = 'username@gmail.com';

    const normalized1 = await supabase.rpc('normalize_email', { p_email: email1 });
    const normalized2 = await supabase.rpc('normalize_email', { p_email: email2 });

    expect(normalized1).toBe(normalized2);
  });

  test('Should allow legitimate second trial after 90 days', async () => {
    // Simular trial há 91 dias
    // Novo trial com mesmo email deve ser permitido
  });
});
```

---

### ✅ VALIDAÇÃO RISCO 2

**Checklist:**
- [ ] Função `normalize_email()` funciona corretamente
- [ ] Função `check_trial_abuse()` detecta múltiplas tentativas
- [ ] Device fingerprinting gerando hash consistente
- [ ] Frontend bloqueia trials abusivos
- [ ] Admin dashboard mostra atividades suspeitas
- [ ] Bloqueios manuais funcionando
- [ ] Teste: Criar 2 trials com email+1 / email+2 (deve bloquear)
- [ ] Teste: Criar trial com mesmo IP (deve detectar)

**Tempo total:** 12h

---

## ⏰ RESUMO DE TEMPO - SPRINT 1

| Risco | Backend | Frontend | DB | Total |
|-------|---------|----------|-----|-------|
| Payment Reconciliation | 9h | 5h | 2h | 16h |
| Trial Abuse Detection | 5h | 4h | 3h | 12h |
| **TOTAL SPRINT 1** | **14h** | **9h** | **5h** | **28h** |

**Duração:** 1 semana com 2 devs (ou 1.5 semanas com 1 dev)

---

Continuo com os Riscos 3 e 4 no próximo documento...
