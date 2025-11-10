# Plano de Ação - Riscos 3 e 4 (Sprint 2)

---

## 🔴 RISCO 3: DOMAIN HIJACKING (14h total)

### TAREFA 3.1: Auth Code System (4h) - Backend

**Arquivo:** `supabase/migrations/20251113120000_domain_transfer_auth_code.sql`

```sql
-- Adicionar campos à tabela domains
ALTER TABLE domains
  ADD COLUMN IF NOT EXISTS transfer_auth_code_hash text,
  ADD COLUMN IF NOT EXISTS transfer_auth_code_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS transfer_lock_until timestamptz;

-- Atualizar domain_transfers
ALTER TABLE domain_transfers
  ADD COLUMN IF NOT EXISTS auth_code_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS requires_2fa boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS twofa_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_confirmation_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cooling_period_end timestamptz;

-- Função para gerar auth code
CREATE OR REPLACE FUNCTION generate_domain_auth_code(p_domain_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_code text;
  v_code_hash text;
  v_user_id uuid;
BEGIN
  -- Verificar ownership
  SELECT user_id INTO v_user_id
  FROM domains d
  JOIN customers c ON c.id = d.customer_id
  WHERE d.id = p_domain_id;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Gerar código (16 chars alfanuméricos)
  v_auth_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16));
  v_code_hash := encode(digest(v_auth_code, 'sha256'), 'hex');

  -- Atualizar domínio
  UPDATE domains
  SET transfer_auth_code_hash = v_code_hash,
      transfer_auth_code_generated_at = now()
  WHERE id = p_domain_id;

  RETURN v_auth_code; -- Retorna só uma vez!
END;
$$;

-- Função para verificar auth code
CREATE OR REPLACE FUNCTION verify_transfer_auth_code(
  p_domain_id uuid,
  p_auth_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash text;
  v_input_hash text;
BEGIN
  SELECT transfer_auth_code_hash INTO v_stored_hash
  FROM domains
  WHERE id = p_domain_id;

  IF v_stored_hash IS NULL THEN
    RETURN false;
  END IF;

  v_input_hash := encode(digest(upper(trim(p_auth_code)), 'sha256'), 'hex');

  RETURN v_stored_hash = v_input_hash;
END;
$$;

-- Função para iniciar transfer com validações
CREATE OR REPLACE FUNCTION initiate_secure_transfer(
  p_domain_id uuid,
  p_auth_code text,
  p_to_customer_id uuid,
  p_twofa_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer_id uuid;
  v_from_customer_id uuid;
  v_user_id uuid;
  v_domain_name text;
BEGIN
  -- 1. Verificar ownership
  SELECT d.customer_id, d.domain_name, c.user_id
  INTO v_from_customer_id, v_domain_name, v_user_id
  FROM domains d
  JOIN customers c ON c.id = d.customer_id
  WHERE d.id = p_domain_id;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to transfer this domain';
  END IF;

  -- 2. Verificar auth code
  IF NOT verify_transfer_auth_code(p_domain_id, p_auth_code) THEN
    RAISE EXCEPTION 'Invalid auth code';
  END IF;

  -- 3. Verificar 2FA (se requerido)
  IF p_twofa_code IS NOT NULL THEN
    -- Validar TOTP code
    PERFORM verify_totp(v_user_id, p_twofa_code);
  END IF;

  -- 4. Verificar se não está em cooling period
  IF EXISTS (
    SELECT 1 FROM domains
    WHERE id = p_domain_id
    AND transfer_lock_until > now()
  ) THEN
    RAISE EXCEPTION 'Domain is in transfer lock period';
  END IF;

  -- 5. Criar transfer request
  INSERT INTO domain_transfers (
    domain_id,
    from_customer_id,
    to_customer_id,
    status,
    auth_code_verified_at,
    cooling_period_end,
    initiated_by
  ) VALUES (
    p_domain_id,
    v_from_customer_id,
    p_to_customer_id,
    'pending_confirmation',
    now(),
    now() + interval '7 days', -- Cooling period de 7 dias
    auth.uid()
  ) RETURNING id INTO v_transfer_id;

  -- 6. Enviar email de confirmação
  -- TODO: Trigger email

  RETURN v_transfer_id;
END;
$$;
```

---

### TAREFA 3.2: Frontend - Auth Code UI (5h)

**Arquivo:** `src/pages/DomainSettings.tsx`

```typescript
// Nova seção: Transfer Security

const [authCode, setAuthCode] = useState<string | null>(null);
const [showAuthCode, setShowAuthCode] = useState(false);
const [generating, setGenerating] = useState(false);

const generateAuthCode = async () => {
  if (!confirm('Gerar novo Auth Code? O código anterior será invalidado.')) {
    return;
  }

  setGenerating(true);
  try {
    const { data, error } = await supabase.rpc('generate_domain_auth_code', {
      p_domain_id: domainId
    });

    if (error) throw error;

    setAuthCode(data);
    setShowAuthCode(true);
    alert('⚠️ IMPORTANTE: Guarde este código em local seguro. Ele será necessário para transferir o domínio e NÃO será mostrado novamente!');
  } catch (error) {
    console.error('Error generating auth code:', error);
    alert('Erro ao gerar Auth Code');
  } finally {
    setGenerating(false);
  }
};

// UI Component
<div className="bg-white rounded-lg shadow p-6 mb-6">
  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
    <Shield className="w-5 h-5" />
    Segurança de Transferência
  </h3>

  <p className="text-sm text-gray-600 mb-4">
    O Auth Code é necessário para transferir o domínio para outra conta.
    Mantenha-o em local seguro.
  </p>

  {!showAuthCode ? (
    <button
      onClick={generateAuthCode}
      disabled={generating}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      {generating ? 'Gerando...' : 'Gerar Auth Code'}
    </button>
  ) : (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
      <p className="text-sm font-semibold text-yellow-900 mb-2">
        ⚠️ Auth Code gerado (será exibido apenas uma vez):
      </p>
      <div className="bg-white p-3 rounded border-2 border-yellow-500 font-mono text-lg font-bold text-center mb-3">
        {authCode}
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(authCode!);
          alert('Código copiado!');
        }}
        className="text-sm bg-blue-600 text-white px-3 py-1 rounded mr-2"
      >
        Copiar
      </button>
      <button
        onClick={() => setShowAuthCode(false)}
        className="text-sm bg-gray-600 text-white px-3 py-1 rounded"
      >
        Ocultar
      </button>
    </div>
  )}

  <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
    <p className="font-semibold mb-1">📌 Como funciona:</p>
    <ul className="list-disc list-inside space-y-1 ml-2">
      <li>Gere o Auth Code e guarde em local seguro</li>
      <li>Para transferir o domínio, você precisará fornecer este código</li>
      <li>O código pode ser regenerado, invalidando o anterior</li>
      <li>Transferências têm período de cooling de 7 dias</li>
    </ul>
  </div>
</div>
```

**Atualizar Transfer Flow:** `src/pages/DomainTransfer.tsx`

```typescript
const [authCode, setAuthCode] = useState('');
const [twoFACode, setTwoFACode] = useState('');

const initiateTransfer = async () => {
  // Validações
  if (!authCode || authCode.length !== 16) {
    setError('Auth Code inválido (deve ter 16 caracteres)');
    return;
  }

  if (requires2FA && !twoFACode) {
    setError('Código 2FA obrigatório');
    return;
  }

  try {
    const { data, error } = await supabase.rpc('initiate_secure_transfer', {
      p_domain_id: domainId,
      p_auth_code: authCode,
      p_to_customer_id: toCustomerId,
      p_twofa_code: requires2FA ? twoFACode : null
    });

    if (error) throw error;

    alert('Transferência iniciada! Um email de confirmação foi enviado. Período de cooling: 7 dias.');
    navigate('/domains');
  } catch (error) {
    console.error('Transfer error:', error);
    setError(error.message);
  }
};

// UI
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-2">
      Auth Code do Domínio *
    </label>
    <input
      type="text"
      value={authCode}
      onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
      placeholder="XXXXXXXXXXXXXXXX"
      maxLength={16}
      className="w-full px-4 py-2 border rounded font-mono"
    />
    <p className="text-xs text-gray-500 mt-1">
      Código de 16 caracteres gerado nas configurações do domínio
    </p>
  </div>

  {requires2FA && (
    <div>
      <label className="block text-sm font-medium mb-2">
        Código 2FA *
      </label>
      <input
        type="text"
        value={twoFACode}
        onChange={(e) => setTwoFACode(e.target.value)}
        placeholder="000000"
        maxLength={6}
        className="w-full px-4 py-2 border rounded font-mono text-center text-2xl"
      />
    </div>
  )}

  <button
    onClick={initiateTransfer}
    className="w-full bg-blue-600 text-white py-3 rounded-lg"
  >
    Iniciar Transferência Segura
  </button>
</div>
```

---

### TAREFA 3.3: Email Confirmation (3h)

**Edge Function:** `supabase/functions/domain-transfer-notification/index.ts`

```typescript
// Enviar email quando transfer é iniciado
// Email contém link de confirmação
// Link expira em 7 dias (cooling period)

const sendTransferConfirmation = async (transfer: DomainTransfer) => {
  const confirmationLink = `${baseURL}/confirm-transfer/${transfer.email_confirmation_token}`;

  await sendEmail({
    to: fromOwnerEmail,
    subject: '⚠️ Solicitação de Transferência de Domínio',
    html: `
      <h2>Transferência de Domínio Solicitada</h2>
      <p>Uma transferência do domínio <strong>${domainName}</strong> foi solicitada.</p>

      <div style="background: #fee; padding: 15px; margin: 20px 0;">
        <strong>⚠️ ATENÇÃO:</strong>
        <ul>
          <li>De: ${fromCustomer}</li>
          <li>Para: ${toCustomer}</li>
          <li>Iniciada em: ${new Date().toLocaleString()}</li>
        </ul>
      </div>

      <p><strong>Você tem 7 dias para:</strong></p>
      <ul>
        <li>Confirmar a transferência clicando no link abaixo</li>
        <li>OU cancelar a transferência no painel</li>
      </ul>

      <a href="${confirmationLink}" style="display:inline-block; background:#4F46E5; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; margin:20px 0;">
        Confirmar Transferência
      </a>

      <p style="color:#666; font-size:14px;">
        Se você não iniciou esta transferência, cancele imediatamente e altere seu Auth Code.
      </p>
    `
  });
};
```

---

### TAREFA 3.4: Testes (2h)

```typescript
describe('Domain Transfer Security', () => {
  test('Cannot transfer without auth code', async () => {
    await expect(
      supabase.rpc('initiate_secure_transfer', {
        p_domain_id: testDomain.id,
        p_auth_code: 'WRONG CODE',
        p_to_customer_id: otherCustomer.id
      })
    ).rejects.toThrow('Invalid auth code');
  });

  test('Cannot transfer domain owned by others', async () => {
    // Tentar transferir domínio de outro usuário
    // Deve falhar com "Not authorized"
  });

  test('Cooling period prevents immediate transfer', async () => {
    // Iniciar transfer
    // Tentar outro transfer antes de 7 dias
    // Deve falhar com "transfer lock period"
  });

  test('2FA required for sensitive transfers', async () => {
    // Tentar transfer sem 2FA
    // Deve exigir código
  });
});
```

---

### ✅ VALIDAÇÃO RISCO 3

- [ ] Auth code gerado e armazenado com hash
- [ ] Transferência requer auth code válido
- [ ] 2FA enforcement funcionando
- [ ] Email de confirmação enviado
- [ ] Cooling period de 7 dias aplicado
- [ ] Transfer lock preventing múltiplos transfers
- [ ] Teste: Transferir com código errado (deve falhar)
- [ ] Teste: Transferir sem 2FA quando requerido (deve falhar)

---

## 🔴 RISCO 4: CONTENT LIMITS BYPASS (10h total)

### TAREFA 4.1: Database Triggers (4h)

**Arquivo:** `supabase/migrations/20251113130000_enforce_content_limits.sql`

```sql
-- Tabela de limites por plano
CREATE TABLE IF NOT EXISTS plan_limits (
  plan_code text PRIMARY KEY,
  max_links int NOT NULL,
  max_products int NOT NULL,
  max_images int NOT NULL,
  max_videos int NOT NULL,
  max_custom_pages int NOT NULL,
  can_use_custom_css boolean NOT NULL DEFAULT false,
  can_use_custom_domain boolean NOT NULL DEFAULT false
);

-- Popular limites
INSERT INTO plan_limits (plan_code, max_links, max_products, max_images, max_videos, max_custom_pages, can_use_custom_css, can_use_custom_domain) VALUES
  ('starter', 5, 3, 10, 0, 0, false, false),
  ('prime', 10, 10, 50, 2, 3, false, true),
  ('elite', 999999, 999999, 999999, 999999, 999999, true, true),
  ('supreme', 999999, 999999, 999999, 999999, 999999, true, true)
ON CONFLICT (plan_code) DO UPDATE SET
  max_links = EXCLUDED.max_links,
  max_products = EXCLUDED.max_products,
  max_images = EXCLUDED.max_images,
  max_videos = EXCLUDED.max_videos,
  max_custom_pages = EXCLUDED.max_custom_pages,
  can_use_custom_css = EXCLUDED.can_use_custom_css,
  can_use_custom_domain = EXCLUDED.can_use_custom_domain;

-- Função universal de verificação
CREATE OR REPLACE FUNCTION check_user_plan_limit(
  p_user_id uuid,
  p_content_type text -- 'links', 'products', 'images', 'videos', 'pages'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_plan_code text;
  v_current_count int;
  v_limit int;
BEGIN
  -- Buscar plano ativo do usuário
  SELECT sp.code INTO v_plan_code
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Se não tem plano, usar starter
  v_plan_code := COALESCE(v_plan_code, 'starter');

  -- Buscar limite
  EXECUTE format('SELECT max_%s FROM plan_limits WHERE plan_code = $1', p_content_type)
  INTO v_limit
  USING v_plan_code;

  -- Contar atual
  CASE p_content_type
    WHEN 'links' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM profile_links
      WHERE user_id = p_user_id AND deleted_at IS NULL;

    WHEN 'products' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM store_products
      WHERE user_id = p_user_id AND deleted_at IS NULL;

    WHEN 'images' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM user_uploads
      WHERE user_id = p_user_id AND file_type = 'image' AND deleted_at IS NULL;

    WHEN 'videos' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM user_uploads
      WHERE user_id = p_user_id AND file_type = 'video' AND deleted_at IS NULL;

    WHEN 'pages' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM custom_pages
      WHERE user_id = p_user_id AND deleted_at IS NULL;

    ELSE
      RAISE EXCEPTION 'Invalid content type: %', p_content_type;
  END CASE;

  RETURN v_current_count < v_limit;
END;
$$;

-- Trigger function genérica
CREATE OR REPLACE FUNCTION enforce_content_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_type text;
  v_can_create boolean;
BEGIN
  -- Determinar tipo
  v_content_type := CASE TG_TABLE_NAME
    WHEN 'profile_links' THEN 'links'
    WHEN 'store_products' THEN 'products'
    WHEN 'user_uploads' THEN
      CASE WHEN NEW.file_type = 'image' THEN 'images'
           WHEN NEW.file_type = 'video' THEN 'videos'
           ELSE 'other'
      END
    WHEN 'custom_pages' THEN 'pages'
    ELSE 'unknown'
  END;

  -- Verificar limite
  v_can_create := check_user_plan_limit(NEW.user_id, v_content_type);

  IF NOT v_can_create THEN
    RAISE EXCEPTION 'Content limit exceeded for %. Upgrade your plan to add more.', v_content_type
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Aplicar triggers
DROP TRIGGER IF EXISTS enforce_link_limit ON profile_links;
CREATE TRIGGER enforce_link_limit
  BEFORE INSERT ON profile_links
  FOR EACH ROW
  EXECUTE FUNCTION enforce_content_limit();

DROP TRIGGER IF EXISTS enforce_product_limit ON store_products;
CREATE TRIGGER enforce_product_limit
  BEFORE INSERT ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION enforce_content_limit();

-- Adicionar para outras tabelas conforme necessário
```

---

### TAREFA 4.2: Frontend - Better Error Handling (3h)

**Arquivo:** `src/lib/errors.ts`

```typescript
export class ContentLimitError extends Error {
  constructor(
    public contentType: string,
    public currentCount: number,
    public limit: number,
    public planCode: string
  ) {
    super(`Content limit exceeded for ${contentType}`);
    this.name = 'ContentLimitError';
  }
}

export function parseSupabaseError(error: any): Error {
  // Detectar content limit error
  if (error.code === 'check_violation' && error.message.includes('limit exceeded')) {
    const contentType = error.message.match(/for (\w+)/)?.[1] || 'content';
    return new ContentLimitError(contentType, 0, 0, '');
  }

  return new Error(error.message);
}
```

**Atualizar componentes:**

```typescript
// src/components/LinkEditor.tsx

try {
  const { error } = await supabase
    .from('profile_links')
    .insert(newLink);

  if (error) throw error;

  // Sucesso
  setLinks([...links, newLink]);

} catch (error) {
  const parsed = parseSupabaseError(error);

  if (parsed instanceof ContentLimitError) {
    setError(
      `Você atingiu o limite de ${parsed.contentType} do seu plano.
       Faça upgrade para adicionar mais!`
    );
    setShowUpgradeModal(true);
  } else {
    setError(parsed.message);
  }
}

// Modal de upgrade
{showUpgradeModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-2">Limite Atingido</h3>
      <p className="text-gray-700 mb-4">
        Seu plano atual não permite adicionar mais {contentType}.
        Faça upgrade para continuar!
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/pricing')}
          className="flex-1 bg-blue-600 text-white py-2 rounded"
        >
          Ver Planos
        </button>
        <button
          onClick={() => setShowUpgradeModal(false)}
          className="flex-1 bg-gray-200 py-2 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
)}
```

---

### TAREFA 4.3: Admin Override (2h)

```sql
-- Permitir admins bypassarem limites
CREATE TABLE user_limit_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content_type text NOT NULL,
  custom_limit int NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, content_type)
);

-- Atualizar função de check para considerar overrides
CREATE OR REPLACE FUNCTION check_user_plan_limit(...)
...
  -- Verificar override primeiro
  SELECT custom_limit INTO v_limit
  FROM user_limit_overrides
  WHERE user_id = p_user_id
    AND content_type = p_content_type
    AND (expires_at IS NULL OR expires_at > now());

  IF FOUND THEN
    RETURN v_current_count < v_limit;
  END IF;

  -- Continuar com lógica normal...
...
```

---

### TAREFA 4.4: Testes (1h)

```typescript
describe('Content Limits', () => {
  test('Starter plan limited to 5 links', async () => {
    // Criar 5 links - OK
    // Tentar criar 6º - deve falhar
  });

  test('Elite plan allows unlimited', async () => {
    // Criar 100 links - todos devem passar
  });

  test('Admin override allows custom limit', async () => {
    // Definir override de 50 links para usuário starter
    // Criar 50 links - deve passar
  });

  test('Frontend shows upgrade modal on limit', async () => {
    // Simular erro de limite
    // Verificar modal apareceu
  });
});
```

---

### ✅ VALIDAÇÃO RISCO 4

- [ ] Triggers instalados em todas as tabelas
- [ ] Limites enforçados no backend
- [ ] Frontend mostra modal de upgrade
- [ ] Admin pode definir overrides
- [ ] Teste: Criar links acima do limite (deve falhar)
- [ ] Teste: Elite user criar 100 items (deve passar)
- [ ] Teste: Override funcionando

---

## ⏰ RESUMO DE TEMPO - SPRINT 2

| Risco | Backend | Frontend | DB | Testing | Total |
|-------|---------|----------|-----|---------|-------|
| Domain Hijacking | 7h | 5h | 4h | 2h | 18h* |
| Content Limits | 4h | 3h | 4h | 1h | 12h* |
| **TOTAL SPRINT 2** | **11h** | **8h** | **8h** | **3h** | **30h** |

*Nota: Total ajustado para 14h e 10h conforme documento principal

---

## 📅 CRONOGRAMA COMPLETO (2 SEMANAS)

### Semana 1 (Sprint 1)
**Dias 1-2:** Payment Reconciliation (16h)
**Dias 3-4:** Trial Abuse Detection (12h)
**Dia 5:** Testing e ajustes

### Semana 2 (Sprint 2)
**Dias 1-2:** Domain Transfer Security (14h)
**Dias 3-4:** Content Limits (10h)
**Dia 5:** Testing final e deploy

**Total:** 52h de desenvolvimento (2 devs x 2 semanas = 80h disponíveis)
**Buffer:** 28h para imprevistos e refinamentos
