# 🏗️ ARQUITETURA DEFINITIVA - TheRichClub

**Data:** 2025-11-09
**Status:** DOCUMENTO OFICIAL E DEFINITIVO

---

## ⚠️ LEIA ISTO PRIMEIRO!

Este documento explica **EXATAMENTE** como o sistema funciona.
**NÃO existe ambiguidade. NÃO existe confusão.**

---

## 🎯 O QUE É O SISTEMA?

TheRichClub é uma plataforma de **perfis digitais exclusivos** com identidade `.com.rich`.

### **NÃO É:**
- ❌ Registrador de domínios reais
- ❌ Integração com DNS (Cloudflare, Namecheap, Dynadot)
- ❌ Venda de domínios .com externos
- ❌ Sistema de wildcard DNS (*.com.rich)
- ❌ Subdomínios reais no DNS

### **É:**
- ✅ Sistema de perfis com usernames únicos
- ✅ Rotas React Router: `/u/:username`
- ✅ Display marketing: `username.com.rich` (só visual)
- ✅ URL real: `therichclub.com/u/username`
- ✅ Licenciamento de identidade digital exclusiva
- ✅ Tudo roda em um único domínio: `therichclub.com`

---

## 🌐 ARQUITETURA TÉCNICA REAL

### **1. Domínios e DNS**

**Domínio Registrado:**
```
✅ therichclub.com (domínio real registrado)
```

**DNS Configurado:**
```
Type: A
Name: @
Value: [IP Netlify/Vercel]

Type: CNAME
Name: www
Value: seu-site.netlify.app
```

**Nada mais!** Sem wildcard, sem subdomínios reais.

### **2. Rotas da Aplicação**

```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Home />} />           // Home com busca
  <Route path="/u/:username" element={<PublicProfile />} />  // Perfil público
  <Route path="/profile/:username" element={<PublicProfile />} />  // Alias
  <Route path="/dashboard" element={<Dashboard />} />  // Área do usuário
  // ... outras rotas
</Routes>
```

### **3. Banco de Dados (Supabase)**

```sql
-- Tabela principal: domains
CREATE TABLE domains (
  id UUID PRIMARY KEY,
  fqdn TEXT UNIQUE NOT NULL,           -- "username.com.rich"
  customer_id UUID REFERENCES customers(id),
  domain_type TEXT DEFAULT 'regular',  -- 'regular' | 'premium'
  status TEXT DEFAULT 'active',        -- 'active' | 'suspended' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela premium: premium_domains
CREATE TABLE premium_domains (
  id UUID PRIMARY KEY,
  fqdn TEXT UNIQUE NOT NULL,           -- "vip.com.rich", "usa.com.rich"
  price_usd DECIMAL(10,2) DEFAULT 70.00,
  required_plan TEXT DEFAULT 'Elite',  -- Só Elite ou Supreme
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **4. User Profiles**

```sql
-- Tabela de perfis
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  domain_id UUID REFERENCES domains(id),  -- Link para o "subdomínio"
  display_name TEXT,
  bio TEXT,
  profile_image TEXT,
  background_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 FLUXO COMPLETO DO USUÁRIO

### **Passo 1: Busca na Home**

**Interface:**
```
┌─────────────────────────────────┐
│ [username      ] .com.rich      │
│       [🔍 Buscar]               │
└─────────────────────────────────┘
```

**Usuário digita:** `maria`

**Sistema faz:**
1. Chama Edge Function: `POST /functions/v1/domains`
2. Body: `{ action: 'check', fqdn: 'maria.com.rich' }`
3. Edge Function verifica no banco:

```typescript
// Verifica se já existe
const { data: existing } = await supabase
  .from('domains')
  .select('*')
  .eq('fqdn', 'maria.com.rich')
  .maybeSingle();

if (existing && existing.customer_id) {
  return { status: 'UNAVAILABLE', message: 'Este domínio já está registrado' };
}

// Verifica se é premium
const { data: premium } = await supabase
  .from('premium_domains')
  .select('*')
  .eq('fqdn', 'maria.com.rich')
  .maybeSingle();

if (premium) {
  return {
    status: 'AVAILABLE',
    isPremium: true,
    price: { monthly: premium.price_usd },
    message: '💎 Domínio Premium - disponível apenas para plano Elite (US$ 70/mês)'
  };
}

// Disponível
return {
  status: 'AVAILABLE',
  isPremium: false,
  price: { monthly: 50 },
  message: '✅ Domínio disponível para registro!'
};
```

### **Passo 2: Resultados Possíveis**

#### **A) AVAILABLE (Regular)**
```
┌─────────────────────────────────────┐
│ ✅ maria.com.rich                   │
│                                     │
│ Domínio disponível para registro!  │
│                                     │
│ Para registrar este domínio,       │
│ escolha um dos nossos planos de    │
│ licenciamento.                     │
│                                     │
│        [📋 Ver Planos]             │
└─────────────────────────────────────┘
```

#### **B) UNAVAILABLE (Já Registrado)**
```
┌─────────────────────────────────────┐
│ ❌ maria.com.rich                   │
│                                     │
│ Este domínio já está registrado    │
│ por outro usuário.                 │
└─────────────────────────────────────┘
```

#### **C) AVAILABLE (Premium)**
```
┌─────────────────────────────────────┐
│ 👑 vip.com.rich                     │
│                                     │
│ Domínio Premium - disponível       │
│ apenas para plano Elite            │
│ (US$ 70/mês).                      │
│                                     │
│        [📋 Ver Planos]             │
└─────────────────────────────────────┘
```

### **Passo 3: Escolha de Plano**

Usuário clica em "Ver Planos" → vai para `/pricing`

**Planos Disponíveis:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Starter   │    Prime    │    Elite    │   Supreme   │
│             │             │             │             │
│ 1 domínio   │ 3 domínios  │ 10 domínios │ 50 domínios │
│ regular     │ regulares   │ + premium   │ + premium   │
│             │             │             │ + prioridade│
│ GRÁTIS      │ $19/mês     │ $70/mês     │ $300/mês    │
│ 14 dias     │             │             │ +$5000 setup│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### **Passo 4: Registro/Pagamento**

Usuário escolhe plano → vai para `/checkout`:

1. ✅ Cria conta (se não tiver)
2. ✅ Preenche dados de pagamento (PayPal)
3. ✅ Confirma assinatura
4. ✅ PayPal webhook confirma pagamento
5. ✅ Sistema cria:
   - Customer no banco
   - Subscription ativa
   - Domain reservado: `maria.com.rich`
   - User profile vinculado

### **Passo 5: Perfil Criado**

**Sistema salva no banco:**
```sql
-- domains
INSERT INTO domains (fqdn, customer_id, domain_type, status)
VALUES ('maria.com.rich', 'uuid-customer', 'regular', 'active');

-- user_profiles
INSERT INTO user_profiles (user_id, domain_id, display_name)
VALUES ('uuid-user', 'uuid-domain', 'Maria Silva');
```

**Usuário acessa:**
- Dashboard: `therichclub.com/dashboard`
- Edita perfil: adiciona foto, bio, links, loja, posts

**Perfil público fica disponível em:**
```
URL REAL: https://therichclub.com/u/maria
Display Marketing: maria.com.rich
```

### **Passo 6: Compartilhamento**

**Interface mostra:**
```
Seu perfil:
🔗 maria.com.rich

[📋 Copiar Link]
```

**Ao copiar, sistema copia:**
```
https://therichclub.com/u/maria
```

**Header do perfil público mostra:**
```html
<h1>maria.com.rich</h1>
<p class="text-sm text-gray-400">Identidade Digital Exclusiva</p>
```

**URL do navegador:**
```
https://therichclub.com/u/maria
```

---

## 🎨 COMPONENTES DA UI

### **Home.tsx (Busca)**
```typescript
// Linha 80-238
const handleSearch = async (e: React.FormEvent) => {
  // 1. Monta FQDN
  const domainToCheck = domain.endsWith('.com.rich')
    ? domain
    : `${domain}.com.rich`;

  // 2. Chama Edge Function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domains`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'check', fqdn: domainToCheck })
    }
  );

  const result = await response.json();

  // 3. Processa resultado
  if (result.status === 'AVAILABLE') {
    setAvailable(true);
    setIsPremium(result.isPremium || false);
    setDomainPrice(result.price?.monthly || null);
  } else if (result.status === 'UNAVAILABLE') {
    setAvailable(false);
  } else {
    setDomainError(result.message || 'Erro ao verificar');
  }
};
```

### **PublicProfile.tsx**
```typescript
// Busca perfil por username na URL
const { username } = useParams();

// Busca no banco
const { data: profile } = await supabase
  .from('user_profiles')
  .select(`
    *,
    domains!inner(fqdn, domain_type)
  `)
  .eq('domains.fqdn', `${username}.com.rich`)
  .single();

// Mostra "username.com.rich" no header
<h1 className="text-4xl font-bold">{username}.com.rich</h1>
```

### **Edge Function: domains/index.ts**
```typescript
// supabase/functions/domains/index.ts
Deno.serve(async (req: Request) => {
  const { action, fqdn } = await req.json();

  if (action === 'check') {
    // 1. Verifica se existe
    const { data: existing } = await supabase
      .from('domains')
      .select('customer_id')
      .eq('fqdn', fqdn)
      .maybeSingle();

    if (existing?.customer_id) {
      return new Response(JSON.stringify({
        status: 'UNAVAILABLE',
        message: 'Este domínio já está registrado'
      }));
    }

    // 2. Verifica se é premium
    const { data: premium } = await supabase
      .from('premium_domains')
      .select('*')
      .eq('fqdn', fqdn)
      .maybeSingle();

    if (premium) {
      return new Response(JSON.stringify({
        status: 'AVAILABLE',
        isPremium: true,
        price: { monthly: premium.price_usd },
        message: `💎 Domínio Premium - disponível apenas para plano Elite (US$ ${premium.price_usd}/mês)`
      }));
    }

    // 3. Disponível regular
    return new Response(JSON.stringify({
      status: 'AVAILABLE',
      isPremium: false,
      price: { monthly: 50 },
      message: 'Domínio disponível para registro!'
    }));
  }
});
```

---

## 📋 TABELAS DO BANCO (Principais)

### **domains**
```sql
Column         | Type         | Description
---------------|--------------|--------------------------------
id             | UUID         | Primary key
fqdn           | TEXT UNIQUE  | "username.com.rich"
customer_id    | UUID         | Dono (NULL = disponível)
domain_type    | TEXT         | 'regular' ou 'premium'
status         | TEXT         | 'active', 'suspended', etc
created_at     | TIMESTAMPTZ  | Data de criação
```

### **premium_domains**
```sql
Column         | Type         | Description
---------------|--------------|--------------------------------
id             | UUID         | Primary key
fqdn           | TEXT UNIQUE  | "vip.com.rich", "usa.com.rich"
price_usd      | DECIMAL      | Preço mensal (ex: 70.00)
required_plan  | TEXT         | 'Elite' ou 'Supreme'
is_available   | BOOLEAN      | true = disponível para venda
created_at     | TIMESTAMPTZ  | Data de criação
```

**Exemplos de Premium:**
- `vip.com.rich` - $70/mês
- `usa.com.rich` - $70/mês
- `brasil.com.rich` - $70/mês
- `rich.com.rich` - $70/mês
- `president.com.rich` - PROTEGIDO (não vende)
- `club.com.rich` - PROTEGIDO (não vende)

### **user_profiles**
```sql
Column           | Type         | Description
-----------------|--------------|--------------------------------
id               | UUID         | Primary key
user_id          | UUID         | Link para auth.users
domain_id        | UUID         | Link para domains
display_name     | TEXT         | Nome exibido
bio              | TEXT         | Biografia
profile_image    | TEXT         | URL da foto
background_image | TEXT         | URL do background
created_at       | TIMESTAMPTZ  | Data de criação
```

### **subscription_plans**
```sql
Column         | Type         | Description
---------------|--------------|--------------------------------
id             | UUID         | Primary key
plan_name      | TEXT         | 'Starter', 'Prime', 'Elite', 'Supreme'
price_usd      | DECIMAL      | Preço mensal em USD
domain_limit   | INTEGER      | Limite de domínios
features       | JSONB        | Features do plano
is_active      | BOOLEAN      | Plano ativo?
```

---

## 🚫 O QUE NUNCA FAZER

### **❌ NÃO TENTE:**
1. Configurar DNS wildcard (*.com.rich)
2. Integrar com registradores de domínio (Dynadot, Namecheap)
3. Fazer subdomínios reais funcionarem
4. Usar servidores separados por usuário
5. Configurar SSL para subdomínios
6. Criar domínio .com.rich real

### **✅ SEMPRE LEMBRE:**
1. É um sistema de perfis, não de domínios
2. URLs reais são: `therichclub.com/u/username`
3. Display `.com.rich` é só marketing/visual
4. Tudo roda em um único domínio
5. Backend é Supabase (PostgreSQL + Edge Functions)
6. Frontend é React + Vite

---

## 🎯 VALIDAÇÕES IMPORTANTES

### **Reserva de Username**

```typescript
// Sempre verificar palavras reservadas
const RESERVED_KEYWORDS = [
  'admin', 'api', 'www', 'mail', 'ftp',
  'dashboard', 'login', 'register', 'pricing',
  'support', 'help', 'contact', 'about',
  'terms', 'privacy', 'billing', 'checkout'
];

function isReserved(username: string): boolean {
  return RESERVED_KEYWORDS.includes(username.toLowerCase());
}
```

### **Marcas Protegidas**

```sql
-- Tabela: protected_brands
SELECT * FROM protected_brands;

-- Exemplos:
'apple', 'google', 'microsoft', 'amazon', 'meta',
'nike', 'coca-cola', 'pepsi', 'disney', 'netflix'

-- Sistema bloqueia automaticamente
```

### **Validação de Username**

```typescript
function isValidUsername(username: string): boolean {
  // Regex: apenas letras, números e hífen
  // 3-30 caracteres
  const regex = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/;
  return regex.test(username);
}
```

---

## 🔐 SEGURANÇA (RLS)

### **Política Geral:**
```sql
-- Perfis públicos: qualquer um pode VER
CREATE POLICY "Anyone can view active profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM domains
    WHERE domains.id = user_profiles.domain_id
    AND domains.status = 'active'
  )
);

-- Apenas dono pode EDITAR
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 📱 EXEMPLOS PRÁTICOS

### **Exemplo 1: Usuário Comum**
1. Acessa `com.rich`
2. Busca: `joao`
3. Sistema retorna: "✅ Disponível"
4. Escolhe plano Prime ($19/mês)
5. Paga via PayPal
6. Perfil criado: `therichclub.com/u/joao`
7. Edita perfil, adiciona links
8. Compartilha: "Acesse joao.com.rich" (mas link real é therichclub.com/u/joao)

### **Exemplo 2: Premium Domain**
1. Acessa `com.rich`
2. Busca: `vip`
3. Sistema retorna: "💎 Premium - Elite only ($70/mês)"
4. Escolhe plano Elite ($70/mês)
5. Paga via PayPal
6. Perfil criado: `therichclub.com/u/vip`
7. Domínio premium exclusivo

### **Exemplo 3: Marca Protegida**
1. Acessa `com.rich`
2. Busca: `apple`
3. Sistema retorna: "🚫 Marca protegida - não disponível"
4. Não pode registrar

---

## 🚀 DEPLOY

### **Ambiente de Produção:**
```bash
# 1. DNS (apenas domínio principal)
Domain: therichclub.com
Type: A → IP Netlify
Type: CNAME → www → site.netlify.app

# 2. Netlify
- Build: npm run build
- Publish: dist/
- Env vars: todas do .env

# 3. Supabase
- Edge Functions deployadas
- RLS policies ativas
- Cron jobs configurados
```

### **URLs Finais:**
```
Home:           https://therichclub.com
Pricing:        https://therichclub.com/pricing
Dashboard:      https://therichclub.com/dashboard
Perfil Público: https://therichclub.com/u/username
```

**Display Marketing nos perfis:**
```
username.com.rich
```

---

## ✅ CHECKLIST FINAL

- [ ] Entendi que NÃO há DNS wildcard
- [ ] Entendi que NÃO há subdomínios reais
- [ ] Entendi que URLs reais são `/u/:username`
- [ ] Entendi que `.com.rich` é só display visual
- [ ] Entendi a diferença entre domínios regulares e premium
- [ ] Entendi o fluxo de busca → escolha de plano → registro
- [ ] Entendi as tabelas do banco de dados
- [ ] Entendi as políticas RLS
- [ ] Entendi as validações (reservadas, protegidas)

---

## 📞 CONTATO

Se ainda houver dúvidas sobre a arquitetura, releia este documento.

**Este é o documento DEFINITIVO e OFICIAL da arquitetura do sistema.**

---

**Última Atualização:** 2025-11-09
**Versão:** 1.0 FINAL
