# Configuração do Titan Email (White-Label)

Este documento explica como configurar a integração com o **Titan Email** para revenda white-label de serviços de email.

## 📋 Visão Geral

O Titan Email é uma plataforma profissional de email que oferece:
- **Programa de Parceiros/Revendedores** com API completa
- **Interface White-Label** via iframe (cliente não vê a marca Titan)
- **Preços competitivos** para revendedores (~$0.59 - $2/usuário/mês)
- **Painel de controle embarcado** no seu sistema
- **Suporte 24/7** com SLA < 60s para parceiros

---

## 🚀 Passo 1: Tornar-se Parceiro Titan

### 1. Cadastro como Parceiro

1. Acesse: https://titan.email/partners/
2. Preencha o formulário de parceiro
3. Aguarde aprovação (geralmente < 24 horas)

### 2. Obter Credenciais API

Após aprovação, você receberá:
- **API Key**: Token de autenticação
- **Partner ID**: Seu identificador único de parceiro
- **API Base URL**: `https://bll.titan.email`

---

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

Adicione suas credenciais ao arquivo `.env`:

```bash
# Titan Email API Configuration
TITAN_API_KEY=sua_api_key_aqui
TITAN_API_BASE_URL=https://bll.titan.email
TITAN_PARTNER_ID=seu_partner_id_aqui
TITAN_CONTROL_PANEL_URL=https://control.titan.email
```

---

## 🗄️ Passo 3: Aplicar Migração do Banco de Dados

A migração já foi criada. Para aplicá-la:

### Opção 1: Usando Supabase Dashboard
1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Copie o conteúdo de: `supabase/migrations/20251016000000_013_titan_email_support.sql`
4. Execute a query

### Opção 2: Usando CLI do Supabase (se disponível)
```bash
supabase migration up
```

### O que a migração faz:
- ✅ Cria tabela `mailboxes` (caixas de email)
- ✅ Cria tabela `email_aliases` (aliases/redirecionamentos)
- ✅ Adiciona campos `titan_domain_id` e `email_provisioning_status` na tabela `domains`
- ✅ Configura RLS (Row Level Security) para todas as tabelas
- ✅ Cria índices para performance

---

## 🔌 Passo 4: Deploy das Edge Functions

### Edge Function: `titan-provision`

Esta função provisiona automaticamente email após o pagamento via PayPal.

**Deploy:**
1. A função já foi criada em: `supabase/functions/titan-provision/index.ts`
2. Deploy automático pelo Supabase (se configurado)
3. Ou manualmente via dashboard do Supabase

---

## 💰 Passo 5: Modelo de Negócio

### Como Funciona:

```
Cliente compra no seu site → Paga R$ 50/mês via PayPal
        ↓
Seu sistema provisiona → Chama API Titan automaticamente
        ↓
Você paga ao Titan → R$ 5/mês (preço de parceiro)
        ↓
Sua margem de lucro → R$ 45/mês (900%!)
```

### Fluxo Técnico:

1. **Cliente compra domínio + email** no seu site
2. **PayPal processa pagamento** → Webhook é acionado
3. **Sistema registra domínio** no Dynadot
4. **Sistema provisiona email** via Titan API
5. **Cliente acessa painel** (iframe white-label do Titan)
6. **Cliente gerencia mailboxes** sem saber que é Titan

---

## 🎨 Passo 6: Interface White-Label

### Painel de Controle Embutido

O cliente acessa: **Seu Site → Mailboxes → Abrir Painel**

O iframe carrega:
```
https://control.titan.email/embed?domain=cliente.email&partner_id=SEU_PARTNER_ID
```

### Personalização:
- ✅ Domínio do cliente aparece no topo
- ✅ Seu Partner ID garante white-label
- ✅ Cliente não vê marca Titan
- ✅ Todas as funcionalidades disponíveis

---

## 📊 Passo 7: Preços Sugeridos

| Plano | Você Cobra | Titan Cobra | Lucro/Mês |
|-------|-----------|-------------|-----------|
| **Basic** | R$ 25 | R$ 3 | R$ 22 (733%) |
| **Pro** | R$ 50 | R$ 8 | R$ 42 (525%) |
| **Business** | R$ 100 | R$ 15 | R$ 85 (567%) |
| **Enterprise** | R$ 250 | R$ 40 | R$ 210 (525%) |

---

## 🔍 Passo 8: Testes

### Teste Local (Mock Mode):

Se as variáveis `TITAN_API_KEY` e `TITAN_PARTNER_ID` não estiverem configuradas, o sistema entra em modo MOCK:
- ✅ Simula criação de domínios
- ✅ Simula criação de mailboxes
- ✅ Perfeito para desenvolvimento

### Teste Produção:

1. Configure credenciais reais
2. Faça uma compra de teste via PayPal Sandbox
3. Verifique logs da Edge Function `titan-provision`
4. Confirme que mailbox foi criada no Titan

---

## 📚 Recursos Úteis

- **Documentação API**: https://titanapidocs.docs.apiary.io/
- **Portal de Parceiros**: https://titan.email/partners/
- **Suporte**: partnership@titanmail.com
- **Status da API**: https://status.titan.email/

---

## ⚠️ Importante

### Segurança:
- ✅ NUNCA exponha `TITAN_API_KEY` no frontend
- ✅ Todas as chamadas à API devem ser via Edge Functions
- ✅ Use RLS no banco de dados (já configurado)

### Faturamento:
- Titan cobra mensalmente pelo total de mailboxes ativas
- Você recebe pagamentos recorrentes via PayPal
- Mantenha controle do número de mailboxes provisionadas

### Suporte ao Cliente:
- Titan oferece suporte técnico 24/7
- Você pode escalar tickets críticos em < 60s
- White-label: cliente entra em contato com VOCÊ primeiro

---

## 🎯 Próximos Passos

1. ✅ Cadastrar-se como parceiro Titan
2. ✅ Configurar credenciais no `.env`
3. ✅ Aplicar migração do banco
4. ✅ Testar fluxo completo
5. ✅ Definir seus preços
6. ✅ Lançar para clientes!

---

**Dúvidas?** Entre em contato com o suporte do Titan: partnership@titanmail.com
