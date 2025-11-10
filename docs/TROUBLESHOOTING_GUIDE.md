# 🔧 GUIA DE TROUBLESHOOTING - TheRichClub

**Data:** 2025-11-09
**Status:** Resolução de Problemas Comuns

---

## 📋 ÍNDICE

1. [Problemas na Home (Busca de Domínios)](#1-problemas-na-home-busca-de-domínios)
2. [Problemas de Autenticação/Login](#2-problemas-de-autenticaçãologin)
3. [Problemas no Dashboard](#3-problemas-no-dashboard)
4. [Problemas com Perfil Público](#4-problemas-com-perfil-público)
5. [Problemas com Edge Functions](#5-problemas-com-edge-functions)
6. [Problemas com RLS (Row Level Security)](#6-problemas-com-rls-row-level-security)
7. [Problemas de Pagamento (PayPal)](#7-problemas-de-pagamento-paypal)
8. [Problemas com Storage/Upload](#8-problemas-com-storageupload)
9. [Problemas de Performance](#9-problemas-de-performance)
10. [Problemas no Deploy](#10-problemas-no-deploy)

---

## 1. PROBLEMAS NA HOME (Busca de Domínios)

### **Problema: "Busca retorna erro 500"**

**Sintomas:**
- Usuário digita domínio e recebe erro genérico
- Console mostra: `HTTP 500: Internal Server Error`

**Diagnóstico:**
```bash
# 1. Verificar Edge Function está deployada
supabase functions list

# 2. Ver logs da function
supabase functions logs domains --tail
```

**Causas Comuns:**
- Edge Function `domains` não está deployada
- Env vars não configuradas na Edge Function
- RLS bloqueando acesso ao banco

**Solução:**
```bash
# 1. Redeploy da function
cd supabase/functions/domains
supabase functions deploy domains

# 2. Verificar env vars no Supabase Dashboard:
# Settings → Edge Functions → domains
# Deve ter: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

---

### **Problema: "Domínio sempre retorna UNAVAILABLE"**

**Sintomas:**
- Qualquer domínio pesquisado retorna "já registrado"
- Mesmo domínios obviamente livres

**Diagnóstico:**
```sql
-- No Supabase SQL Editor
SELECT fqdn, customer_id, status
FROM domains
WHERE fqdn = 'teste.com.rich';

-- Verificar se existe registro fantasma
```

**Causas Comuns:**
- Bug na lógica de verificação
- Domínio realmente existe mas com customer_id NULL
- Cache no frontend

**Solução:**
```sql
-- Se existir registro sem dono (customer_id NULL):
DELETE FROM domains
WHERE customer_id IS NULL
AND fqdn = 'teste.com.rich';

-- Ou atualizar status:
UPDATE domains
SET status = 'available', customer_id = NULL
WHERE fqdn = 'teste.com.rich';
```

---

### **Problema: "Timeout na busca"**

**Sintomas:**
- Busca demora mais de 15 segundos
- Console: `AbortError: The operation was aborted`

**Diagnóstico:**
```typescript
// Verificar timeout no Home.tsx (linha 98)
const timeoutId = setTimeout(() => controller.abort(), 15000);
```

**Causas Comuns:**
- Edge Function lenta
- Database sem índices
- Rede lenta

**Solução:**
```sql
-- 1. Adicionar índice se não existir
CREATE INDEX IF NOT EXISTS idx_domains_fqdn
ON domains(fqdn);

CREATE INDEX IF NOT EXISTS idx_premium_domains_fqdn
ON premium_domains(fqdn);

-- 2. Analisar query performance
EXPLAIN ANALYZE
SELECT * FROM domains WHERE fqdn = 'teste.com.rich';
```

---

## 2. PROBLEMAS DE AUTENTICAÇÃO/LOGIN

### **Problema: "Não consigo fazer login"**

**Sintomas:**
- Email/senha corretos mas login falha
- Erro: "Invalid login credentials"

**Diagnóstico:**
```sql
-- Verificar se usuário existe
SELECT id, email, email_confirmed_at, banned_until
FROM auth.users
WHERE email = 'usuario@exemplo.com';
```

**Causas Comuns:**
- Email não confirmado (confirmação desabilitada, mas pode ter bug)
- Usuário banido
- Senha incorreta

**Solução:**
```sql
-- 1. Confirmar email manualmente se necessário
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'usuario@exemplo.com'
AND email_confirmed_at IS NULL;

-- 2. Desbanir usuário
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'usuario@exemplo.com';

-- 3. Reset de senha via Supabase Dashboard:
-- Authentication → Users → ... → Reset Password
```

---

### **Problema: "Redirect infinito após login"**

**Sintomas:**
- Após login, página fica em loop
- URL muda entre `/login` e `/dashboard` infinitamente

**Diagnóstico:**
```typescript
// Verificar AuthContext.tsx
console.log('Auth State:', user, loading);
```

**Causas Comuns:**
- Estado `loading` nunca vira `false`
- Protected route mal configurado
- Cookie/localStorage corrompido

**Solução:**
```typescript
// 1. Limpar localStorage
localStorage.clear();
sessionStorage.clear();

// 2. Verificar ProtectedRoute.tsx:
if (loading) return <div>Loading...</div>; // Deve ter isso!
if (!user) return <Navigate to="/login" />; // Deve redirecionar
```

---

### **Problema: "Sessão expira muito rápido"**

**Sintomas:**
- Usuário é deslogado após poucos minutos
- Precisa fazer login toda hora

**Diagnóstico:**
```bash
# Verificar configuração de sessão
# Supabase Dashboard → Authentication → Settings
```

**Causas Comuns:**
- JWT expiry muito curto
- Refresh token não funcionando

**Solução:**
```typescript
// Supabase Dashboard → Authentication → Settings
// JWT Expiry: 3600 (1 hora) → Mudar para 86400 (24 horas)

// No código, garantir refresh:
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed!');
  }
});
```

---

## 3. PROBLEMAS NO DASHBOARD

### **Problema: "Dashboard não carrega domínios"**

**Sintomas:**
- Dashboard vazio, não mostra domínios do usuário
- Loading infinito

**Diagnóstico:**
```sql
-- Verificar se usuário tem domínios
SELECT d.*, c.user_id
FROM domains d
JOIN customers c ON d.customer_id = c.id
WHERE c.user_id = 'UUID-DO-USER';
```

**Causas Comuns:**
- RLS bloqueando
- customer_id não vinculado
- Query incorreta

**Solução:**
```sql
-- 1. Verificar RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'domains';

-- 2. Testar query manualmente
SET request.jwt.claims.sub = 'UUID-DO-USER';
SELECT * FROM domains
WHERE customer_id IN (
  SELECT id FROM customers WHERE user_id = 'UUID-DO-USER'
);
```

---

### **Problema: "Não consigo criar novo domínio"**

**Sintomas:**
- Botão "Adicionar Domínio" não funciona
- Erro: "Domain limit reached"

**Diagnóstico:**
```sql
-- Verificar plano e limite
SELECT
  sp.plan_name,
  sp.domain_limit,
  COUNT(d.id) as current_domains
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_code = sp.plan_name
LEFT JOIN domains d ON d.customer_id = s.customer_id
WHERE s.customer_id = 'UUID-CUSTOMER'
GROUP BY sp.plan_name, sp.domain_limit;
```

**Solução:**
```sql
-- Se limite incorreto, ajustar manualmente:
UPDATE subscription_plans
SET domain_limit = 3
WHERE plan_name = 'Prime';

-- Ou fazer upgrade de plano do usuário:
UPDATE subscriptions
SET plan_code = 'elite'
WHERE customer_id = 'UUID-CUSTOMER';
```

---

## 4. PROBLEMAS COM PERFIL PÚBLICO

### **Problema: "Perfil retorna 404"**

**Sintomas:**
- URL `/u/maria` retorna página não encontrada
- Erro: "Profile not found"

**Diagnóstico:**
```sql
-- Verificar se perfil existe
SELECT
  up.*,
  d.fqdn,
  d.status
FROM user_profiles up
JOIN domains d ON up.domain_id = d.id
WHERE d.fqdn = 'maria.com.rich';
```

**Causas Comuns:**
- domain_id não vinculado ao profile
- Domain status não é 'active'
- RLS bloqueando leitura pública

**Solução:**
```sql
-- 1. Verificar status do domínio
UPDATE domains
SET status = 'active'
WHERE fqdn = 'maria.com.rich';

-- 2. Vincular profile ao domain se não estiver
UPDATE user_profiles
SET domain_id = (SELECT id FROM domains WHERE fqdn = 'maria.com.rich')
WHERE user_id = 'UUID-DO-USER';

-- 3. Verificar RLS permite leitura pública
-- Deve existir policy:
CREATE POLICY "Anyone can view active profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM domains
    WHERE domains.id = user_profiles.domain_id
    AND domains.status = 'active'
  )
);
```

---

### **Problema: "Imagens do perfil não aparecem"**

**Sintomas:**
- Foto de perfil quebrada
- Background não carrega

**Diagnóstico:**
```sql
-- Verificar URLs das imagens
SELECT profile_image, background_image
FROM user_profiles
WHERE id = 'UUID-PROFILE';
```

**Causas Comuns:**
- URL inválida ou expirada
- Storage bucket sem política pública
- CORS bloqueando

**Solução:**
```sql
-- 1. Verificar Storage policies
-- Supabase Dashboard → Storage → profile-images
-- Deve ter policy: "Public read access"

-- 2. Recriar policy se necessário:
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- 3. Verificar CORS:
-- Supabase Dashboard → Storage → profile-images → Configuration
-- Allowed origins: *
```

---

### **Problema: "Links personalizados não funcionam"**

**Sintomas:**
- Clica no link mas nada acontece
- Link vai para lugar errado

**Diagnóstico:**
```sql
-- Verificar links do perfil
SELECT url, title, is_visible, security_status
FROM links
WHERE profile_id = 'UUID-PROFILE';
```

**Causas Comuns:**
- URL sem `http://` ou `https://`
- Link marcado como unsafe
- Link oculto (`is_visible = false`)

**Solução:**
```sql
-- 1. Corrigir URLs sem protocolo
UPDATE links
SET url = 'https://' || url
WHERE profile_id = 'UUID-PROFILE'
AND url NOT LIKE 'http%';

-- 2. Desmarcar unsafe se for falso positivo
UPDATE links
SET security_status = 'safe'
WHERE id = 'UUID-LINK';

-- 3. Tornar visível
UPDATE links
SET is_visible = true
WHERE id = 'UUID-LINK';
```

---

## 5. PROBLEMAS COM EDGE FUNCTIONS

### **Problema: "Edge Function retorna 500"**

**Sintomas:**
- Qualquer chamada à function retorna erro
- Logs mostram erro de runtime

**Diagnóstico:**
```bash
# Ver logs em tempo real
supabase functions logs FUNCTION-NAME --tail

# Exemplo:
supabase functions logs domains --tail
```

**Causas Comuns:**
- Erro de sintaxe TypeScript
- Import não encontrado
- Env var não configurada

**Solução:**
```bash
# 1. Verificar sintaxe localmente
cd supabase/functions/FUNCTION-NAME
deno check index.ts

# 2. Testar localmente
supabase functions serve FUNCTION-NAME

# 3. Redeploy com força
supabase functions deploy FUNCTION-NAME --no-verify-jwt
```

---

### **Problema: "Edge Function timeout"**

**Sintomas:**
- Function demora mais de 60 segundos
- Erro: "Function execution timed out"

**Diagnóstico:**
```typescript
// Adicionar logs de tempo no código
console.time('operation');
// ... código aqui
console.timeEnd('operation');
```

**Causas Comuns:**
- Query SQL muito lenta
- Loop infinito
- Await sem timeout

**Solução:**
```typescript
// 1. Adicionar timeout em queries
const { data, error } = await Promise.race([
  supabase.from('table').select(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
]);

// 2. Otimizar queries com índices
CREATE INDEX idx_table_column ON table(column);

// 3. Usar cache quando possível
```

---

### **Problema: "CORS error ao chamar Edge Function"**

**Sintomas:**
- Erro no console: `CORS policy: No 'Access-Control-Allow-Origin'`
- Request bloqueado pelo browser

**Diagnóstico:**
```typescript
// Verificar headers da response
fetch('https://...').then(r => {
  console.log(r.headers.get('Access-Control-Allow-Origin'));
});
```

**Causas Comuns:**
- CORS headers não configurados
- OPTIONS request não tratado

**Solução:**
```typescript
// Garantir CORS headers em TODA Edge Function:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  // Tratar OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // ... resto do código

  // Sempre incluir corsHeaders na resposta
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
```

---

## 6. PROBLEMAS COM RLS (Row Level Security)

### **Problema: "Query retorna vazio mesmo existindo dados"**

**Sintomas:**
- Dados existem no banco mas query retorna `[]`
- Admin consegue ver, usuário comum não

**Diagnóstico:**
```sql
-- Testar como admin (sem RLS)
SET ROLE postgres;
SELECT * FROM user_profiles;

-- Testar como usuário autenticado
SET ROLE authenticated;
SET request.jwt.claims.sub = 'UUID-DO-USER';
SELECT * FROM user_profiles;
```

**Causas Comuns:**
- RLS policy muito restritiva
- Policy usando função recursiva
- auth.uid() não retorna valor esperado

**Solução:**
```sql
-- 1. Verificar policies ativas
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- 2. Desabilitar RLS temporariamente para testar (NUNCA EM PRODUÇÃO!)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ... testar
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Simplificar policy
DROP POLICY IF EXISTS "Complex policy" ON user_profiles;
CREATE POLICY "Simple read policy"
ON user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

---

### **Problema: "Recursion depth exceeded"**

**Sintomas:**
- Erro: `maximum recursion depth exceeded`
- Query funciona às vezes, outras vezes não

**Diagnóstico:**
```sql
-- Verificar se policies usam joins circulares
SELECT
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE qual LIKE '%EXISTS%';
```

**Causas Comuns:**
- Policy em `customers` referencia `subscriptions`
- Subscription referencia `customers` de volta
- Loop infinito de verificação

**Solução:**
```sql
-- Ver: migration 20251027181557_optimize_rls_orders_customers.sql
-- Usar função helper que quebra recursão:

CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT role FROM customers WHERE user_id = uid LIMIT 1;
$$;

-- Usar em policies:
CREATE POLICY "Admins see all"
ON customers FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'admin'
  OR user_id = auth.uid()
);
```

---

## 7. PROBLEMAS DE PAGAMENTO (PayPal)

### **Problema: "Pagamento aprovado mas assinatura não criada"**

**Sintomas:**
- Usuário pagou mas não tem acesso
- PayPal mostra pagamento bem-sucedido
- Banco não tem registro de subscription

**Diagnóstico:**
```sql
-- Verificar webhook events
SELECT *
FROM webhook_events
WHERE event_type LIKE 'BILLING.SUBSCRIPTION%'
ORDER BY created_at DESC
LIMIT 10;
```

**Causas Comuns:**
- Webhook não configurado
- Webhook com URL errada
- Edge Function com erro

**Solução:**
```bash
# 1. Verificar webhook no PayPal:
# PayPal Dashboard → Apps & Credentials → Webhooks
# URL deve ser: https://[PROJECT].supabase.co/functions/v1/paypal-webhook

# 2. Reprocessar webhook manualmente:
curl -X POST https://[PROJECT].supabase.co/functions/v1/paypal-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON-KEY]" \
  -d @webhook-payload.json

# 3. Criar subscription manualmente se necessário:
INSERT INTO subscriptions (customer_id, plan_code, status, paypal_subscription_id)
VALUES ('UUID-CUSTOMER', 'prime', 'active', 'I-XXXXX');
```

---

### **Problema: "Checkout redireciona mas retorna vazio"**

**Sintomas:**
- Usuário clica "Pagar com PayPal"
- Abre PayPal, paga, volta pro site
- Página success não mostra nada

**Diagnóstico:**
```typescript
// Verificar URL params na página success
console.log(window.location.search);
// Deve ter: ?token=EC-XXX&subscription_id=I-XXX
```

**Causas Comuns:**
- PayPal não enviou parâmetros corretos
- Edge Function não retornou approval_url

**Solução:**
```typescript
// Verificar paypal-create-subscription/index.ts
// Deve incluir return_url e cancel_url:

const subscriptionData = {
  plan_id: PAYPAL_PLAN_ID,
  application_context: {
    return_url: `${FRONTEND_URL}/success`,
    cancel_url: `${FRONTEND_URL}/failure`,
    // ...
  }
};
```

---

## 8. PROBLEMAS COM STORAGE/UPLOAD

### **Problema: "Upload de imagem falha"**

**Sintomas:**
- Erro: "File too large"
- Ou: "Invalid file type"

**Diagnóstico:**
```typescript
// Verificar tamanho do arquivo
console.log('File size:', file.size / 1024 / 1024, 'MB');
console.log('File type:', file.type);
```

**Causas Comuns:**
- Arquivo maior que limite (5MB)
- Tipo de arquivo não permitido
- Storage bucket cheio

**Solução:**
```typescript
// 1. Validar antes de upload
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
if (file.size > MAX_SIZE) {
  throw new Error('Arquivo muito grande. Máximo: 5MB');
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Tipo não permitido. Use: JPEG, PNG ou WebP');
}

// 2. Comprimir imagem antes de upload (ver imageOptimizer.ts)
const compressed = await compressImage(file);
```

---

### **Problema: "Imagem uploaded mas não aparece"**

**Sintomas:**
- Upload diz "sucesso"
- Mas imagem não carrega no perfil

**Diagnóstico:**
```sql
-- Verificar URL salva no banco
SELECT profile_image FROM user_profiles WHERE id = 'UUID';

-- Tentar acessar URL diretamente no navegador
```

**Causas Comuns:**
- URL salva errada (falta bucket ou path)
- Storage policy não permite leitura pública
- URL expirada (signed URL com tempo expirado)

**Solução:**
```typescript
// 1. Salvar URL pública correta:
const { data } = await supabase.storage
  .from('profile-images')
  .upload(path, file);

const publicURL = supabase.storage
  .from('profile-images')
  .getPublicUrl(data.path).data.publicUrl;

// Salvar publicURL no banco, não data.path!

// 2. Garantir policy pública:
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');
```

---

## 9. PROBLEMAS DE PERFORMANCE

### **Problema: "Site muito lento para carregar"**

**Sintomas:**
- Páginas demoram 5+ segundos
- Lighthouse score baixo (<50)

**Diagnóstico:**
```bash
# 1. Analisar bundle size
npm run build
# Verificar tamanho dos chunks em dist/assets/

# 2. Network tab do DevTools
# Ver quais requests demoram mais
```

**Causas Comuns:**
- Bundle JS muito grande
- Muitas queries ao banco
- Imagens não otimizadas

**Solução:**
```typescript
// 1. Lazy load de rotas
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// 2. Memoizar queries
const { data } = useQuery(['profile', username], () => fetchProfile(username), {
  staleTime: 5 * 60 * 1000, // Cache 5 minutos
});

// 3. Otimizar imagens
<img
  src={profileImage}
  loading="lazy"
  decoding="async"
/>

// 4. Code splitting
// Vite automaticamente, mas verificar chunks grandes
```

---

### **Problema: "Dashboard trava ao carregar muitos dados"**

**Sintomas:**
- Admin dashboard com 1000+ usuários trava
- Scroll super lento

**Diagnóstico:**
```typescript
// Usar React DevTools Profiler
// Identificar componente que re-renderiza muito
```

**Causas Comuns:**
- Renderizando todos os itens de uma vez
- Falta de virtualização
- Re-renders desnecessários

**Solução:**
```typescript
// 1. Paginação
const [page, setPage] = useState(1);
const ITEMS_PER_PAGE = 50;

const { data } = await supabase
  .from('users')
  .select('*')
  .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

// 2. Virtualização (react-window ou react-virtual)
// 3. useMemo para evitar re-cálculos
const filteredData = useMemo(
  () => data.filter(item => item.status === 'active'),
  [data]
);
```

---

## 10. PROBLEMAS NO DEPLOY

### **Problema: "Build falha no Netlify"**

**Sintomas:**
- Deploy falha com erro de build
- Log: "Module not found" ou "Type error"

**Diagnóstico:**
```bash
# Testar build localmente
npm run build

# Ver erros detalhados
```

**Causas Comuns:**
- Dependência não instalada
- Environment variable faltando
- TypeScript error

**Solução:**
```bash
# 1. Instalar dependências
npm install

# 2. Verificar env vars no Netlify:
# Site settings → Environment variables
# Devem ter TODAS as vars do .env

# 3. Limpar cache e rebuild
# Netlify dashboard → Deploys → Trigger deploy → Clear cache and deploy
```

---

### **Problema: "Deploy ok mas site não funciona"**

**Sintomas:**
- Build passa
- Site abre mas funcionalidades não funcionam
- Console cheio de erros 404

**Diagnóstico:**
```javascript
// Abrir DevTools → Console
// Ver erros de API
```

**Causas Comuns:**
- Environment variables erradas
- CORS bloqueando
- Redirect rules do Netlify erradas

**Solução:**
```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Verificar env vars:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# Devem estar corretos!
```

---

## 🆘 PROBLEMAS NÃO LISTADOS?

### **Checklist Geral de Debugging:**

1. ✅ Verificar logs do navegador (Console + Network)
2. ✅ Verificar logs do Supabase (Edge Functions + Database)
3. ✅ Testar queries SQL manualmente no SQL Editor
4. ✅ Verificar RLS policies
5. ✅ Verificar environment variables
6. ✅ Limpar cache (localStorage + cookies)
7. ✅ Testar em navegador anônimo
8. ✅ Verificar status do Supabase (status.supabase.com)

### **Como Reportar Bug:**

Se encontrou um problema não listado, documente:

```markdown
## Descrição do Problema
[O que aconteceu]

## Passos para Reproduzir
1. ...
2. ...
3. ...

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que realmente acontece]

## Logs/Errors
```
[Cole logs relevantes]
```

## Ambiente
- Browser: Chrome 120
- OS: Windows 11
- Supabase Project: [nome]
```

---

## 📞 RECURSOS ÚTEIS

- **Supabase Logs:** Dashboard → Logs
- **Edge Function Logs:** `supabase functions logs FUNCTION-NAME --tail`
- **Database Query:** Dashboard → SQL Editor
- **RLS Debugger:** Dashboard → Database → Policies
- **Storage Inspector:** Dashboard → Storage → [bucket]

---

**Última Atualização:** 2025-11-09
