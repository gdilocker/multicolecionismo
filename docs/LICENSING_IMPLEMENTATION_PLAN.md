# 🚀 Plano de Implementação Completo - Modelo de Licenciamento

**Projeto:** .com.rich
**Data:** 26 de outubro de 2025
**Status:** ✅ Fase 1 Concluída | 🔄 Aguardando Aprovação para Fase 2

---

## ✅ **FASE 1: BANCO DE DADOS - CONCLUÍDA**

### **Arquivos Criados:**
- `supabase/migrations/20251026000000_055_domain_licensing_model.sql`
- `docs/LICENSING_MODEL_SUMMARY.md`

### **Mudanças Implementadas:**

**Tabela `domains` - Novos Campos:**
```sql
- license_status (active, suspended, revoked, expired, pending)
- license_type (exclusive_personal, exclusive_business, trial, promotional)
- license_start_date
- license_end_date
- is_revocable
- revocation_reason
- revoked_at
- revoked_by
- license_notes
```

**Nova Tabela:**
- `domain_license_history` - Histórico completo de mudanças

**Funções Admin:**
- `revoke_domain_license()` - Revogação permanente
- `suspend_domain_license()` - Suspensão temporária
- `reactivate_domain_license()` - Reativação

**Views:**
- `active_domain_licenses` - Licenças ativas
- `revoked_domain_licenses` - Licenças revogadas/suspensas

---

## 📋 **FASE 2: DOCUMENTOS LEGAIS E POLÍTICAS**

### **Arquivos a Modificar:**

#### **1. src/pages/Terms.tsx** (451 linhas)
**Seções Críticas a Atualizar:**

```tsx
// SEÇÃO 5: REGISTRO E GESTÃO DE DOMÍNIOS
ANTES:
"5.1 Titularidade"
"Durante o período contratado, o domínio pertence ao usuário titular da conta..."

DEPOIS:
"5.1 Modelo de Licenciamento"
"O usuário recebe uma LICENÇA EXCLUSIVA DE USO do domínio .com.rich. A titularidade
permanece com Global Digital Identity LTD. O licenciado tem direitos exclusivos de uso,
configuração e personalização durante a vigência da licença."

"5.2 Direitos do Licenciado"
- Uso exclusivo do domínio
- Configuração de DNS, perfis e conteúdo
- Renovação automática mediante pagamento
- Transferência de licença mediante aprovação

"5.3 Limitações e Revogação"
- Licença pode ser revogada por violação de termos
- Não pagamento resulta em suspensão/cancelamento
- Titularidade permanece com Global Digital Identity LTD
- Uso ilícito resulta em revogação imediata
```

#### **2. src/pages/Privacy.tsx**
**Adicionar Seção:**
```
"DADOS DE LICENCIAMENTO"
- Informações sobre status de licenças
- Histórico de renovações e pagamentos
- Registros de revogação (quando aplicável)
```

#### **3. src/pages/RefundPolicy.tsx**
**Atualizar:**
```
ANTES: "Reembolso de domínios comprados"
DEPOIS: "Reembolso de licenças contratadas"

- Licenças de domínio não são reembolsáveis após ativação
- Assinaturas mensais podem ser canceladas a qualquer momento
- Não há reembolso proporcional
```

---

## 🎨 **FASE 3: TEXTOS COMERCIAIS**

### **Páginas Prioritárias:**

#### **1. src/pages/Home.tsx**
**Mudanças de Terminologia:**

```tsx
// Hero Section
ANTES: "Registre seu domínio premium .com.rich"
DEPOIS: "Adquira sua licença exclusiva .com.rich"

ANTES: "Domínios exclusivos para..."
DEPOIS: "Licenças exclusivas para..."

// Features
ANTES: "Seja proprietário de um domínio premium"
DEPOIS: "Tenha uso exclusivo de um domínio premium"

ANTES: "Compre agora"
DEPOIS: "Adquira Licença"
```

**Adicionar Seção de Esclarecimento:**
```tsx
<section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
  <h3>🔐 Modelo de Licenciamento Exclusivo</h3>
  <p>
    Ao adquirir um domínio .com.rich, você recebe uma <strong>licença exclusiva de uso</strong>.
    Isso garante seus direitos totais de personalização e controle, com renovação simples
    e proteção contratual.
  </p>
  <a href="/faq#licenciamento">Saiba mais sobre licenciamento →</a>
</section>
```

#### **2. src/pages/Pricing.tsx**
**Mudanças:**

```tsx
ANTES:
<h1>Compre seu domínio .com.rich</h1>
<button>Comprar Agora</button>

DEPOIS:
<h1>Adquira sua licença exclusiva .com.rich</h1>
<button>Adquirir Licença</button>

// Adicionar badge explicativo
<div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
  <Shield className="w-4 h-4" />
  <span className="text-xs">Licença Exclusiva de Uso</span>
</div>
```

**Adicionar seção de FAQ inline:**
```tsx
<details className="bg-white rounded-lg p-4">
  <summary className="font-semibold cursor-pointer">
    O que é licença exclusiva?
  </summary>
  <p className="mt-2 text-sm text-gray-600">
    Você tem direitos totais de uso, mas a titularidade permanece com
    Global Digital Identity LTD. Sua licença é protegida enquanto você mantiver
    os pagamentos em dia e seguir nossos termos.
  </p>
</details>
```

#### **3. src/pages/Marketplace.tsx**
**Mudanças:**

```tsx
ANTES:
"Comprar domínio premium"
"Adicionar ao carrinho"
"Domínios à venda"

DEPOIS:
"Adquirir licença premium"
"Iniciar contratação"
"Licenças disponíveis"
```

---

## 👤 **FASE 4: DASHBOARDS**

### **1. src/pages/UserDashboard.tsx / src/pages/Dashboard.tsx**

**Mudanças de Labels:**

```tsx
ANTES:
<h2>Meus Domínios</h2>
<span>Domínios Ativos: {count}</span>
<button>Gerenciar Domínio</button>

DEPOIS:
<h2>Minhas Licenças</h2>
<span>Licenças Ativas: {count}</span>
<button>Gerenciar Licença</button>
```

**Adicionar Badge de Status:**
```tsx
{domain.license_status === 'active' && (
  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
    ✓ Licença Ativa
  </span>
)}
{domain.license_status === 'suspended' && (
  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
    ⚠ Licença Suspensa
  </span>
)}
{domain.license_status === 'revoked' && (
  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
    ✗ Licença Revogada
  </span>
)}
```

**Card de Domínio:**
```tsx
<div className="bg-white rounded-lg p-4 border">
  <div className="flex justify-between items-start">
    <div>
      <h3>{domain.fqdn}</h3>
      <p className="text-sm text-gray-500">
        Licença desde: {formatDate(domain.license_start_date)}
      </p>
      <p className="text-xs text-gray-400">
        Tipo: {domain.license_type === 'exclusive_personal' ? 'Pessoal' : 'Empresarial'}
      </p>
    </div>
    <LicenseStatusBadge status={domain.license_status} />
  </div>
</div>
```

### **2. src/pages/AdminDashboard.tsx**

**Nova Seção: Gerenciamento de Licenças**

```tsx
<section>
  <h2>Gerenciamento de Licenças</h2>

  <div className="grid grid-cols-4 gap-4">
    <StatCard
      title="Licenças Ativas"
      value={stats.active_licenses}
      icon={CheckCircle}
      color="green"
    />
    <StatCard
      title="Licenças Suspensas"
      value={stats.suspended_licenses}
      icon={AlertCircle}
      color="yellow"
    />
    <StatCard
      title="Licenças Revogadas"
      value={stats.revoked_licenses}
      icon={XCircle}
      color="red"
    />
    <StatCard
      title="Licenças Expiradas"
      value={stats.expired_licenses}
      icon={Clock}
      color="gray"
    />
  </div>

  <DomainLicenseTable />
</section>
```

**Tabela de Licenças com Ações Admin:**
```tsx
<table>
  <thead>
    <tr>
      <th>Domínio</th>
      <th>Cliente</th>
      <th>Status</th>
      <th>Tipo</th>
      <th>Início</th>
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    {licenses.map(license => (
      <tr key={license.id}>
        <td>{license.fqdn}</td>
        <td>{license.customer_email}</td>
        <td><StatusBadge status={license.license_status} /></td>
        <td>{license.license_type}</td>
        <td>{formatDate(license.license_start_date)}</td>
        <td>
          <DropdownMenu>
            <button onClick={() => suspendLicense(license.id)}>
              Suspender
            </button>
            <button onClick={() => revokeLicense(license.id)}>
              Revogar
            </button>
            <button onClick={() => reactivateLicense(license.id)}>
              Reativar
            </button>
            <button onClick={() => viewHistory(license.id)}>
              Ver Histórico
            </button>
          </DropdownMenu>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 📱 **FASE 5: FAQ**

### **src/pages/FAQ.tsx**

**Adicionar Seção Completa sobre Licenciamento:**

```tsx
{
  category: 'Licenciamento',
  icon: Shield,
  questions: [
    {
      q: 'O que é o modelo de licenciamento exclusivo?',
      a: 'Ao adquirir um domínio .com.rich, você recebe uma licença exclusiva de uso. Isso significa que você tem direitos totais de personalização, configuração e uso do domínio, mas a titularidade permanece com Global Digital Identity LTD. É similar a alugar um imóvel premium: você tem uso exclusivo e total controle, mas não é o proprietário legal do registro.'
    },
    {
      q: 'Ainda tenho controle total sobre meu domínio?',
      a: 'Sim! Como licenciado exclusivo, você tem 100% de controle sobre DNS, perfis, conteúdo e personalizações. A diferença está apenas na estrutura jurídica: você é o usuário exclusivo, não o proprietário registrado.'
    },
    {
      q: 'Posso perder minha licença?',
      a: 'Sua licença é garantida enquanto você: (1) mantiver os pagamentos em dia, (2) seguir nossos Termos de Uso, (3) não usar o domínio para atividades ilícitas. Licenças só são revogadas em casos de violação grave ou ordem judicial.'
    },
    {
      q: 'Posso transferir minha licença para outra pessoa?',
      a: 'Sim, transferências de licença são permitidas mediante aprovação. Entre em contato com support@com.rich para iniciar o processo.'
    },
    {
      q: 'O que acontece se eu cancelar minha assinatura?',
      a: 'Sua licença expira ao final do período pago. Após o período de carência (30 dias), o domínio volta ao pool da Global Digital Identity LTD e pode ser licenciado para outro usuário.'
    },
    {
      q: 'Por que vocês usam modelo de licenciamento?',
      a: 'O modelo de licenciamento nos permite manter controle central sobre a rede .com.rich, garantir qualidade do ecossistema, prevenir abuso e oferecer melhor suporte. Além disso, facilita resolução de disputas e proteção de marca.'
    },
    {
      q: 'Isso afeta meus domínios atuais?',
      a: 'Não! Todos os domínios ativos continuam funcionando normalmente. A mudança é apenas na estrutura jurídica do contrato, não afeta seus direitos de uso.'
    }
  ]
}
```

---

## 🔧 **FASE 6: TIPOS TYPESCRIPT**

### **src/types/index.ts**

**Adicionar/Atualizar Interfaces:**

```typescript
export interface Domain {
  id: string;
  customer_id: string;
  fqdn: string;
  registrar_status: string;
  expires_at: string;
  created_at: string;

  // Licensing fields
  license_status: 'active' | 'suspended' | 'revoked' | 'expired' | 'pending';
  license_type: 'exclusive_personal' | 'exclusive_business' | 'trial' | 'promotional';
  license_start_date: string;
  license_end_date?: string | null;
  is_revocable: boolean;
  revocation_reason?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  license_notes?: string | null;
}

export interface DomainLicenseHistory {
  id: string;
  domain_id: string;
  previous_status?: string;
  new_status: string;
  previous_type?: string;
  new_type?: string;
  changed_by?: string;
  change_reason?: string;
  changed_at: string;
  metadata?: Record<string, any>;
}

export interface LicenseActionPayload {
  domain_id: string;
  reason: string;
  admin_user_id: string;
}
```

---

## 📊 **FASE 7: COMPONENTES REUTILIZÁVEIS**

### **Novos Componentes a Criar:**

#### **1. src/components/LicenseStatusBadge.tsx**
```typescript
interface Props {
  status: Domain['license_status'];
  showText?: boolean;
}

export function LicenseStatusBadge({ status, showText = true }: Props) {
  const config = {
    active: { icon: CheckCircle, color: 'green', text: 'Licença Ativa' },
    suspended: { icon: AlertCircle, color: 'yellow', text: 'Suspensa' },
    revoked: { icon: XCircle, color: 'red', text: 'Revogada' },
    expired: { icon: Clock, color: 'gray', text: 'Expirada' },
    pending: { icon: Clock, color: 'blue', text: 'Pendente' }
  };

  const { icon: Icon, color, text } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${color}-100 text-${color}-800 rounded-full text-xs`}>
      <Icon className="w-3 h-3" />
      {showText && text}
    </span>
  );
}
```

#### **2. src/components/LicenseInfoCard.tsx**
```typescript
export function LicenseInfoCard() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-blue-900 mb-2">
            Modelo de Licenciamento Exclusivo
          </h3>
          <p className="text-sm text-blue-800">
            Você recebe uma licença exclusiva de uso com direitos totais de
            personalização e controle. A titularidade permanece com .com.rich
            Global Digital Identity LTD, garantindo qualidade e segurança do ecossistema.
          </p>
          <a href="/faq#licenciamento" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Saiba mais sobre licenciamento →
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 **PRIORIZAÇÃO DE IMPLEMENTAÇÃO**

### **FASE CRÍTICA (Implementar AGORA):**
1. ✅ Migration de BD (concluída)
2. 🔄 Home.tsx (alto impacto visual)
3. 🔄 Pricing.tsx (página de conversão)
4. 🔄 FAQ.tsx (esclarecimento essencial)

### **FASE IMPORTANTE (Próximos dias):**
5. Dashboard do usuário
6. Admin Panel
7. Marketplace

### **FASE SECUNDÁRIA (Pode aguardar):**
8. Termos completos
9. Política de Privacidade completa
10. Demais políticas

---

## 📝 **MENSAGEM PARA OS USUÁRIOS ATUAIS**

**E-mail / Banner no Dashboard:**

```
📢 Atualização Importante: Modelo de Licenciamento

Prezado(a) cliente,

A partir de hoje, todos os domínios .com.rich operam sob modelo de
licenciamento exclusivo de uso.

✅ O QUE MUDA PARA VOCÊ: Nada!
Seu domínio continua 100% funcional com todos os recursos.

✅ O QUE É DIFERENTE: Estrutura Jurídica
Você é agora "licenciado exclusivo" (não "proprietário"), mas mantém
todos os direitos de uso, configuração e personalização.

✅ POR QUE ESSA MUDANÇA:
- Maior controle de qualidade da rede .com.rich
- Melhor proteção contra abuso e fraude
- Facilita resolução de disputas
- Conformidade jurídica internacional

Dúvidas? Acesse nossa FAQ ou contacte support@com.rich

Atenciosamente,
Equipe Global Digital Identity LTD
```

---

## ✅ **APROVAÇÃO NECESSÁRIA**

Antes de prosseguir com a implementação completa, precisamos de sua aprovação para:

1. **Textos legais**: Revisar e aprovar as mudanças nos Termos
2. **Mensagem aos usuários**: Aprovar comunicado sobre mudança
3. **Priorização**: Confirmar ordem de implementação das fases

**Você gostaria que eu:**
- [ ] Implemente TODAS as mudanças agora
- [ ] Implemente apenas as fases críticas (Home, Pricing, FAQ)
- [ ] Forneça os textos completos para revisão jurídica primeiro
- [ ] Outra abordagem?

---

**Status Atual:** ⏸️ Aguardando direcionamento
**Próximo Passo:** Sua aprovação e priorização
