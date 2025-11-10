# TheRichClub - Identidade Digital Exclusiva

Sistema de perfis digitais exclusivos com identidade `.com.rich`.

## ⚠️ IMPORTANTE: Leia Primeiro

**📘 [docs/ARQUITETURA_DEFINITIVA.md](./docs/ARQUITETURA_DEFINITIVA.md)**

Este documento explica **EXATAMENTE** como o sistema funciona:
- ✅ URLs reais: `therichclub.com/u/username`
- ✅ Display marketing: `username.com.rich` (visual)
- ❌ **NÃO** há DNS wildcard real
- ❌ **NÃO** há subdomínios reais no DNS
- ✅ Tudo roda em um único domínio

**Leia este documento para eliminar QUALQUER confusão sobre a arquitetura.**

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Rodar localmente
npm run dev

# 4. Build para produção
npm run build
```

---

## 📚 Documentação

### **Essencial (Leia Nesta Ordem):**
1. 📘 **[docs/ARQUITETURA_DEFINITIVA.md](./docs/ARQUITETURA_DEFINITIVA.md)** - Como funciona (LEIA PRIMEIRO!)
2. 📋 **[docs/TRABALHO_COMPLETO.md](./docs/TRABALHO_COMPLETO.md)** - O que foi implementado
3. 🚀 **[docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** - Configuração completa
4. 📚 **[docs/MASTER_INDEX.md](./docs/MASTER_INDEX.md)** - Índice de toda documentação

### **Sistema:**
- ⚙️ [docs/SISTEMA_REAL_EXPLICADO.md](./docs/SISTEMA_REAL_EXPLICADO.md) - Arquitetura técnica
- 🔒 [docs/guides/SECURITY.md](./docs/guides/SECURITY.md) - Segurança
- 🎨 [docs/comrich_descriptions_reference.md](./docs/comrich_descriptions_reference.md) - UI/UX

---

## 🏗️ Stack Tecnológica

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Payments:** PayPal API
- **Email:** Resend
- **Security:** Cloudflare Turnstile + Google Safe Browsing

---

## 🎯 Funcionalidades

### **Perfis Digitais:**
- ✅ Username exclusivo (ex: `maria.com.rich`)
- ✅ Perfil customizável (foto, bio, background)
- ✅ Links personalizados
- ✅ Loja online integrada
- ✅ Rede social (posts, likes, comentários)

### **Planos:**
- **Starter:** 1 domínio regular, grátis 14 dias
- **Prime:** 3 domínios regulares, $19/mês
- **Elite:** 10 domínios + premium, $70/mês
- **Supreme:** 50 domínios + premium + prioridade, $300/mês + $5000 setup

### **Domínios Premium:**
- VIP, USA, Brasil, Rich, etc
- Disponível apenas Elite e Supreme
- Preço: $70/mês

---

## 🌐 URLs e Rotas

### **URLs Reais (no navegador):**
```
Home:           https://therichclub.com
Pricing:        https://therichclub.com/pricing
Dashboard:      https://therichclub.com/dashboard
Perfil Público: https://therichclub.com/u/username
```

### **Display Marketing (mostrado no perfil):**
```
username.com.rich
```

**IMPORTANTE:** O display `.com.rich` é apenas visual. A URL real sempre é `therichclub.com/u/username`.

---

## 🔒 Segurança

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ 2FA obrigatório para admins
- ✅ Rate limiting em todas as APIs
- ✅ Cloudflare Turnstile anti-bot
- ✅ Google Safe Browsing para links
- ✅ Content Security Policy (CSP)
- ✅ Sanitização de HTML/CSS customizado

---

## 📦 Deploy

### **Netlify (Recomendado):**
```bash
# 1. Conectar repositório GitHub ao Netlify
# 2. Build command: npm run build
# 3. Publish directory: dist
# 4. Adicionar environment variables (.env)
# 5. Deploy!
```

### **DNS:**
```
Type: A
Name: @
Value: [IP Netlify]

Type: CNAME
Name: www
Value: seu-site.netlify.app
```

**IMPORTANTE:** Não precisa configurar DNS wildcard! Veja [ARQUITETURA_DEFINITIVA.md](./docs/ARQUITETURA_DEFINITIVA.md).

---

## 🛠️ Desenvolvimento

```bash
# Dev server
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## 📞 Suporte

Para dúvidas sobre a arquitetura, consulte:
- 📘 [docs/ARQUITETURA_DEFINITIVA.md](./docs/ARQUITETURA_DEFINITIVA.md)
- 📚 [docs/MASTER_INDEX.md](./docs/MASTER_INDEX.md)

---

## ✅ Checklist de Configuração

- [ ] Lido ARQUITETURA_DEFINITIVA.md
- [ ] Supabase project criado
- [ ] Environment variables configuradas
- [ ] PayPal billing plans criados
- [ ] PayPal webhook configurado
- [ ] Resend API key obtida
- [ ] Cloudflare Turnstile configurado
- [ ] Edge Functions deployadas
- [ ] Cron jobs ativados
- [ ] DNS configurado (apenas domínio principal)
- [ ] Deploy em produção

---

## 📄 Licença

Propriedade de Global Digital Identity LTD.

---

**Última Atualização:** 2025-11-09
