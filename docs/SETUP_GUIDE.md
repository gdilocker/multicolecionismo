# 🚀 Guia Completo de Setup - TheRichClub

**Sistema de Licenciamento de Subdomínios .com.rich**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração PayPal](#configuração-paypal)
4. [Configuração Email (Resend)](#configuração-email)
5. [Configuração Cloudflare Turnstile](#configuração-cloudflare-turnstile)
6. [Configuração Google Safe Browsing](#configuração-google-safe-browsing)
7. [Configuração Supabase](#configuração-supabase)
8. [Deploy Frontend](#deploy-frontend)
9. [Configuração DNS](#configuração-dns)
10. [Cron Jobs](#cron-jobs)
11. [Testes Finais](#testes-finais)

---

## 🎯 VISÃO GERAL

O TheRichClub é um sistema de **licenciamento de subdomínios .com.rich**.

**NÃO é:**
- ❌ Venda de domínios .com externos
- ❌ Integração com registradores (Dynadot, Namecheap, etc)
- ❌ Registro real de domínios

**É:**
- ✅ Licenciamento de subdomínios .com.rich
- ✅ Sistema 100% interno
- ✅ Titular: Global Digital Identity LTD
- ✅ Clientes: Licenciados exclusivos

**Exemplos:**
- `usa.com.rich`
- `brasil.com.rich`
- `apple.com.rich` (protegido)
- `nome-usuario.com.rich`

---

## ✅ PRÉ-REQUISITOS

### Contas Necessárias:
1. ✅ Supabase (já existe)
2. ⏳ PayPal Business Account
3. ⏳ Resend (email service)
4. ⏳ Cloudflare (Turnstile)
5. ⏳ Google Cloud (Safe Browsing)
6. ⏳ Netlify ou Vercel (hosting)

### Acesso ao Domínio:
- Domínio principal registrado (ex: `therichclub.com`)
- Acesso ao DNS do domínio

---

## 💳 CONFIGURAÇÃO PAYPAL

### Passo 1: Criar Conta Business
1. Acesse: https://www.paypal.com/bizsignup
2. Escolha: **Business Account**
3. Complete o cadastro

### Passo 2: Criar App REST API
1. Acesse: https://developer.paypal.com/dashboard/applications
2. Clique: **Create App**
3. Nome: `TheRichClub Production`
4. Type: **Merchant**
5. Copie:
   - **Client ID**
   - **Secret**

### Passo 3: Criar Billing Plans

**IMPORTANTE:** Você precisa criar 4 planos de assinatura no PayPal.

Acesse: https://www.paypal.com/billing/plans

#### Plan 1: Starter (Trial)
```
Name: TheRichClub - Starter Plan
Description: 14-day free trial with 1 subdomain
Price: $0.00 USD/month
Billing Cycle: Monthly
Setup Fee: $0.00
```

#### Plan 2: Prime
```
Name: TheRichClub - Prime Plan
Description: Professional plan with 3 subdomains
Price: $19.00 USD/month
Billing Cycle: Monthly
Setup Fee: $0.00
```

#### Plan 3: Elite
```
Name: TheRichClub - Elite Plan
Description: Elite plan with 10 subdomains
Price: $70.00 USD/month
Billing Cycle: Monthly
Setup Fee: $0.00
```

#### Plan 4: Supreme
```
Name: TheRichClub - Supreme Plan
Description: Unlimited subdomains + reseller benefits
Price: $300.00 USD/month
Billing Cycle: Monthly
Setup Fee: $5000.00 (one-time)
```

**Copie os Plan IDs** de cada plano criado (formato: `P-XXXXXXXXXXXXX`)

### Passo 4: Configurar Webhook

1. Acesse: https://developer.paypal.com/dashboard/webhooks
2. Clique: **Add Webhook**
3. URL: `https://libzvdbgixckggmivspg.supabase.co/functions/v1/paypal-webhook`
4. Selecione eventos:
   - ✅ Payment sale completed
   - ✅ Payment sale refunded
   - ✅ Payment sale denied
   - ✅ Billing subscription created
   - ✅ Billing subscription cancelled
   - ✅ Billing subscription suspended
   - ✅ Billing subscription payment failed
5. Salve e copie o **Webhook ID**

### Passo 5: Adicionar ao .env

```env
VITE_PAYPAL_CLIENT_ID=sua_client_id_aqui
VITE_PAYPAL_SECRET=seu_secret_aqui
VITE_PAYPAL_WEBHOOK_ID=seu_webhook_id_aqui
```

### Passo 6: Atualizar Banco de Dados

Execute no Supabase SQL Editor:

```sql
UPDATE subscription_plans SET paypal_plan_id = 'P-STARTER-PLAN-ID' WHERE plan_name = 'Starter';
UPDATE subscription_plans SET paypal_plan_id = 'P-PRIME-PLAN-ID' WHERE plan_name = 'Prime';
UPDATE subscription_plans SET paypal_plan_id = 'P-ELITE-PLAN-ID' WHERE plan_name = 'Elite';
UPDATE subscription_plans SET paypal_plan_id = 'P-SUPREME-PLAN-ID' WHERE plan_name = 'Supreme';
```

---

## 📧 CONFIGURAÇÃO EMAIL (RESEND)

### Passo 1: Criar Conta
1. Acesse: https://resend.com/signup
2. Crie conta (GitHub/Google)
3. **Free Tier:** 3,000 emails/mês

### Passo 2: Obter API Key
1. Dashboard → API Keys
2. Clique: **Create API Key**
3. Name: `TheRichClub Production`
4. Permission: **Sending access**
5. Copie a API Key

### Passo 3: Verificar Domínio
1. Dashboard → Domains
2. Clique: **Add Domain**
3. Digite: `therichclub.com`
4. Adicione os registros DNS fornecidos:
   - SPF Record
   - DKIM Records (3x)
   - DMARC Record
5. Aguarde verificação (~15 min)

### Passo 4: Adicionar ao .env

```env
VITE_RESEND_API_KEY=re_sua_api_key_aqui
```

---

## 🛡️ CONFIGURAÇÃO CLOUDFLARE TURNSTILE

### Passo 1: Criar Conta Cloudflare
1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie conta gratuita

### Passo 2: Criar Turnstile Site
1. Acesse: https://dash.cloudflare.com/?to=/:account/turnstile
2. Clique: **Add Site**
3. Site name: `TheRichClub`
4. Domain: `therichclub.com`
5. Widget Mode: **Managed**
6. Copie:
   - **Site Key**
   - **Secret Key**

### Passo 3: Adicionar ao .env

```env
VITE_TURNSTILE_SITE_KEY=sua_site_key_aqui
VITE_TURNSTILE_SECRET_KEY=seu_secret_key_aqui
```

---

## 🔒 CONFIGURAÇÃO GOOGLE SAFE BROWSING

### Passo 1: Criar Projeto Google Cloud
1. Acesse: https://console.cloud.google.com
2. Crie novo projeto: `TheRichClub`

### Passo 2: Ativar Safe Browsing API
1. API Library → Busque: **Safe Browsing API**
2. Clique: **Enable**

### Passo 3: Criar API Key
1. Credentials → Create Credentials → API Key
2. Copie a API Key
3. (Opcional) Restrict Key:
   - Application restrictions: HTTP referrers
   - Add: `therichclub.com/*`
   - API restrictions: Safe Browsing API

### Passo 4: Adicionar ao .env

```env
VITE_GOOGLE_SAFE_BROWSING_API_KEY=sua_api_key_aqui
```

---

## ⚙️ CONFIGURAÇÃO SUPABASE

### Passo 1: Adicionar Secrets (Edge Functions)

1. Supabase Dashboard → Project Settings → Edge Functions
2. Clique: **Add Secret**
3. Adicione cada secret:

```
PAYPAL_CLIENT_ID=valor
PAYPAL_SECRET=valor
RESEND_API_KEY=valor
TURNSTILE_SECRET_KEY=valor
GOOGLE_SAFE_BROWSING_API_KEY=valor
```

### Passo 2: Verificar Storage Buckets

1. Storage → Buckets
2. Verificar se existem:
   - ✅ `profile-images` (public)
   - ✅ `public-assets` (public)
   - ✅ `social-media` (public)

Se não existirem, as migrations já criaram automaticamente.

### Passo 3: Configurar Auth

1. Authentication → Settings
2. **Site URL:** `https://therichclub.com`
3. **Redirect URLs:** Adicione:
   - `https://therichclub.com/**`
   - `https://*.com.rich/**` (wildcard)
4. **Email Templates:** (Opcional) Customize em português

### Passo 4: Configurar CORS

1. API Settings → CORS
2. Adicione allowed origins:
   - `https://therichclub.com`
   - `https://*.com.rich`

---

## 🚀 DEPLOY FRONTEND

### Opção A: Netlify (Recomendado)

#### Passo 1: Criar Conta
1. Acesse: https://app.netlify.com/signup
2. Conecte GitHub

#### Passo 2: Deploy
1. New site from Git
2. Escolha repositório
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

#### Passo 3: Adicionar Environment Variables
1. Site settings → Environment variables
2. Adicione TODAS as variáveis do `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PAYPAL_CLIENT_ID`
   - `VITE_RESEND_API_KEY`
   - `VITE_TURNSTILE_SITE_KEY`
   - `VITE_GOOGLE_SAFE_BROWSING_API_KEY`
   - `VITE_USE_PAYMENT_MOCK=false` (IMPORTANTE!)

#### Passo 4: Configurar Redirects
Netlify já detecta SPAs automaticamente, mas confirme:

Site settings → Build & deploy → Post processing
- ✅ Asset optimization: ENABLED
- ✅ Pretty URLs: ENABLED

---

### Opção B: Vercel

#### Passo 1: Criar Conta
1. Acesse: https://vercel.com/signup
2. Conecte GitHub

#### Passo 2: Deploy
1. Import project
2. Framework: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`

#### Passo 3: Environment Variables
Adicione todas as variáveis do `.env`

---

## 🌐 CONFIGURAÇÃO DNS

**IMPORTANTE:** Subdomínios .com.rich são **simulados no frontend** via React Router.

### Como Funciona?

**NÃO existe:**
- ❌ DNS wildcard real (*.com.rich)
- ❌ Domínio .com.rich registrado
- ❌ Subdomínios reais no DNS

**Existe:**
- ✅ Rotas React: `/u/:username` → `/profile/:username`
- ✅ **Display fake** nos perfis: `username.com.rich`
- ✅ Tudo roda em `therichclub.com`

### Configuração DNS Real (Apenas Domínio Principal):

#### Netlify:
```
Type: A
Name: @
Value: 75.2.60.5 (IP Netlify)

Type: CNAME
Name: www
Value: seu-site.netlify.app
```

#### Adicionar Domínio no Netlify:
1. Site settings → Domain management
2. Add domain: `therichclub.com`
3. Aguarde SSL provisioning (~15 min)

**Pronto!** Todos os subdomínios são rotas internas.

### Exemplos de URLs Reais:

```
❌ NÃO EXISTE: https://usa.com.rich
✅ URL REAL: https://therichclub.com/u/usa

❌ NÃO EXISTE: https://brasil.com.rich
✅ URL REAL: https://therichclub.com/u/brasil
```

**O perfil MOSTRA "usa.com.rich" mas roda em therichclub.com/u/usa**

### Se usar Vercel:

Similar, mas IPs diferentes. Vercel fornece após adicionar domínio.

---

## ⏰ CRON JOBS

### Passo 1: Instalar pg_cron Extension

No Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Passo 2: Criar Cron Jobs

```sql
-- 1. Trial Expiration (Diariamente às 01:00 UTC)
SELECT cron.schedule(
  'trial-expiration-check',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://libzvdbgixckggmivspg.supabase.co/functions/v1/trial-expiration-handler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 2. Domain Lifecycle (Diariamente às 00:00 UTC)
SELECT cron.schedule(
  'domain-lifecycle-check',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://libzvdbgixckggmivspg.supabase.co/functions/v1/domain-lifecycle-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 3. Link Security Check (A cada 6 horas)
SELECT cron.schedule(
  'link-security-check',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://libzvdbgixckggmivspg.supabase.co/functions/v1/periodic-link-security-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 4. Payment Reconciliation (Diariamente às 02:00 UTC)
SELECT cron.schedule(
  'payment-reconciliation',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://libzvdbgixckggmivspg.supabase.co/functions/v1/payment-reconciliation',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 5. Premium Domain Lifecycle (Diariamente às 03:00 UTC)
SELECT cron.schedule(
  'premium-domain-lifecycle',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://libzvdbgixckggmivspg.supabase.co/functions/v1/premium-domain-lifecycle',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Passo 3: Verificar Cron Jobs Ativos

```sql
SELECT * FROM cron.job;
```

### Passo 4: Testar Manualmente (Opcional)

```sql
-- Forçar execução imediata de um job
SELECT cron.unschedule('trial-expiration-check');
-- Recriar o job para executar agora
```

---

## ✅ TESTES FINAIS

### 1. Teste de Registro
- [ ] Criar conta nova
- [ ] Receber email de confirmação
- [ ] Trial de 14 dias ativo
- [ ] Dashboard acessível

### 2. Teste de Subdomínio
- [ ] Criar primeiro subdomínio
- [ ] Acessar: `seu-subdomain.com.rich`
- [ ] Perfil público visível
- [ ] Editar perfil funciona

### 3. Teste de Pagamento
- [ ] Desativar mock: `VITE_USE_PAYMENT_MOCK=false`
- [ ] Tentar upgrade para Prime
- [ ] PayPal checkout abre
- [ ] Pagamento completa
- [ ] Webhook recebido
- [ ] Subscription ativa no banco

### 4. Teste de Email
- [ ] Trial expiring em 3 dias → Email enviado
- [ ] Pagamento falhou → Email enviado
- [ ] Nova mensagem suporte → Email enviado

### 5. Teste de Segurança
- [ ] Criar link com URL malicioso
- [ ] Sistema detecta e bloqueia
- [ ] Admin notificado

### 6. Teste de Cron Jobs
- [ ] Verificar logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
- [ ] Confirmar execuções bem-sucedidas

---

## 🎯 CHECKLIST FINAL

### Configurações Externas
- [ ] PayPal Business Account criada
- [ ] PayPal 4 Billing Plans criados
- [ ] PayPal Webhook configurado
- [ ] Resend conta criada
- [ ] Resend domínio verificado
- [ ] Cloudflare Turnstile configurado
- [ ] Google Safe Browsing ativado

### Supabase
- [ ] Edge Function Secrets adicionados
- [ ] Storage Buckets verificados
- [ ] Auth configurado
- [ ] CORS configurado
- [ ] Cron Jobs criados

### Deploy
- [ ] Frontend deployado (Netlify/Vercel)
- [ ] Environment variables adicionadas
- [ ] DNS configurado (wildcard *.com.rich)
- [ ] SSL ativo

### Banco de Dados
- [ ] PayPal Plan IDs atualizados
- [ ] Email templates populados
- [ ] Support articles populados
- [ ] Premium domains populados

### Testes
- [ ] Registro funciona
- [ ] Subdomínios acessíveis
- [ ] Pagamentos reais funcionam
- [ ] Emails sendo enviados
- [ ] Cron jobs executando

---

## 🆘 SUPORTE

Se algo não funcionar:

1. **Verificar logs Supabase:**
   - Dashboard → Logs → Edge Functions
   - Database → Query Performance

2. **Verificar logs Netlify:**
   - Site → Deploys → Function logs

3. **Testar Edge Functions:**
```bash
curl -X POST https://libzvdbgixckggmivspg.supabase.co/functions/v1/test-function \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

4. **Verificar DNS:**
```bash
dig usa.com.rich
nslookup usa.com.rich
```

---

**Documento criado:** 2025-11-09
**Versão:** 1.0
**Sistema:** TheRichClub - Licenciamento .com.rich
