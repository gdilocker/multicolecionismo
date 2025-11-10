# Premium Landing - Implementação Completa

## Visão Geral

Sistema completo para exibir páginas de landing premium para domínios `.com.rich` que são premium e ainda não foram adquiridos.

## Componentes Criados

### 1. `PremiumLanding.tsx`
Página de luxo para domínios premium à venda.

**Características:**
- Design premium com gradientes dourados
- Selo "Domínio Premium" com ícone de coroa
- CTAs para "Falar com Especialista" e "Ver Plano Elite"
- Seções sobre exclusividade, memorabilidade, autoridade e raridade
- Analytics integrado (eventos `premium_view` e `premium_contact_click`)
- Pré-preenchimento do formulário de contato com domínio e tipo

### 2. `DomainSlugPage.tsx`
Roteador inteligente para URLs `/[slug]`.

**Lógica de Decisão:**
```typescript
if (status === 'AVAILABLE' && isPremium && isAvailable) {
  // Render PremiumLanding
} else if (status === 'UNAVAILABLE') {
  // Render PublicProfile ou "já registrado"
} else if (status === 'AVAILABLE' && !isPremium) {
  // Render página "disponível padrão"
}
```

**Features:**
- Normalização de slug (`[a-z0-9-]+`)
- Validação rigorosa
- Loading state
- Error handling
- SEO (title, canonical)
- Cache-Control: no-store

### 3. Integração com `DomainSearch.tsx`

Atualizado para detectar domínios premium na busca e redirecionar automaticamente:

```typescript
if (result.status === 'AVAILABLE' && result.isPremium && result.isAvailable) {
  navigate(`/${slug}`);
  return;
}
```

### 4. Roteamento no `App.tsx`

Adicionada rota dinâmica catch-all:

```typescript
<Route path="/:slug" element={<DomainSlugPage />} />
```

## Fluxo de Dados

### API: `/functions/v1/domains` (POST)

**Request:**
```json
{
  "action": "check",
  "fqdn": "vip.com.rich"
}
```

**Response (Premium Disponível):**
```json
{
  "status": "AVAILABLE",
  "fqdn": "vip.com.rich",
  "isAvailable": true,
  "isPremium": true,
  "planRequired": "ELITE",
  "price": null,
  "message": "💎 Domínio Premium — disponível apenas para o plano Elite (US$ 70/mês)."
}
```

**Response (Já Registrado):**
```json
{
  "status": "UNAVAILABLE",
  "fqdn": "maria.com.rich",
  "isAvailable": false,
  "isPremium": false,
  "planRequired": null,
  "price": null,
  "message": "❌ Este domínio já foi registrado por outro usuário.",
  "suggestions": ["maria1.com.rich", "mariaapp.com.rich"]
}
```

**Response (Standard Disponível):**
```json
{
  "status": "AVAILABLE",
  "fqdn": "ola.com.rich",
  "isAvailable": true,
  "isPremium": false,
  "planRequired": "STANDARD_OR_ELITE",
  "price": {
    "monthly": 50,
    "currency": "USD"
  },
  "message": "✅ Domínio disponível..."
}
```

## Fluxos de Usuário

### Fluxo 1: Busca por Domínio Premium
```
1. Usuário digita "vip" na home
2. DomainSearch normaliza para "vip.com.rich"
3. API retorna: AVAILABLE + isPremium=true + isAvailable=true
4. Navega para /vip
5. DomainSlugPage consulta API
6. Renderiza PremiumLanding
7. Usuário clica "Falar com Especialista"
8. Navega para /contact?domain=vip.com.rich&type=premium
```

### Fluxo 2: Acesso via Subdomínio
```
1. Usuário acessa https://vip.com.rich
2. Cloudflare faz 301 para https://com.rich/vip
3. React Router captura /:slug
4. DomainSlugPage consulta API
5. Renderiza PremiumLanding (se AVAILABLE)
```

### Fluxo 3: Domínio Já Registrado
```
1. Usuário busca "maria"
2. API retorna: UNAVAILABLE
3. DomainSlugPage tenta carregar PublicProfile
4. Se não existir perfil, mostra "já registrado" + sugestões
```

### Fluxo 4: Domínio Standard
```
1. Usuário busca "ola"
2. API retorna: AVAILABLE + isPremium=false
3. DomainSlugPage renderiza página padrão
4. Mostra preço (US$ 50/mês)
5. CTAs para "Ver Planos" e "Buscar Outro"
```

## Cloudflare Setup

Ver arquivo: `CLOUDFLARE_SUBDOMAIN_SETUP.md`

**Resumo:**
1. DNS Wildcard: `*` CNAME → `com.rich` (Proxied)
2. Redirect Rule: `^([a-z0-9-]+)\.com\.rich$` → `https://com.rich/${1}` (301)

## Analytics

### Eventos Rastreados

**premium_view**
- Quando: PremiumLanding é exibido
- Parâmetros: `domain`, `slug`

**premium_contact_click**
- Quando: Usuário clica "Falar com Especialista"
- Parâmetros: `domain`, `slug`

### Implementação

```typescript
if (typeof window !== 'undefined' && (window as any).gtag) {
  (window as any).gtag('event', 'premium_view', {
    domain: 'vip.com.rich',
    slug: 'vip'
  });
}
```

## SEO

### Meta Tags
```html
<title>vip.com.rich - Domínio Premium | com.rich</title>
<link rel="canonical" href="https://com.rich/vip">
```

### URL Canônica
- ✅ Sempre: `https://com.rich/<slug>`
- ❌ Nunca: `https://<slug>.com.rich`

## Teste Rápido

### Teste 1: Premium Disponível
```bash
curl -X POST https://[SUPABASE_URL]/functions/v1/domains \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"action":"check","fqdn":"vip.com.rich"}'

# Deve retornar isPremium=true, isAvailable=true
```

Acesse: `https://com.rich/vip`
Espera: Premium Landing com fundo escuro e selo dourado

### Teste 2: Já Registrado
```bash
# Registre um domínio primeiro
# Depois acesse: https://com.rich/[nome-registrado]
```

Espera: Página do perfil público OU "já registrado"

### Teste 3: Standard Disponível
```bash
curl -X POST [...] -d '{"action":"check","fqdn":"teste123.com.rich"}'
```

Acesse: `https://com.rich/teste123`
Espera: Página branca com check verde e preço US$ 50

## Critérios de Aceite ✅

- [x] Premium à venda mostra Premium Landing
- [x] Premium já registrado NÃO mostra Premium Landing
- [x] Standard disponível mostra página padrão
- [x] Busca por premium navega para `/<slug>`
- [x] Subdomínio redireciona (301) para path
- [x] URL canônica sempre `com.rich/<slug>`
- [x] Analytics eventos registrados
- [x] SEO meta tags presentes
- [x] Error handling robusto
- [x] Loading states visuais

## Arquivos Modificados

1. ✅ `src/pages/PremiumLanding.tsx` (novo)
2. ✅ `src/pages/DomainSlugPage.tsx` (novo)
3. ✅ `src/components/DomainSearch.tsx` (atualizado)
4. ✅ `src/App.tsx` (rota adicionada)
5. ✅ `CLOUDFLARE_SUBDOMAIN_SETUP.md` (novo)
6. ✅ `PREMIUM_LANDING_IMPLEMENTATION.md` (este arquivo)

## Próximos Passos (Opcional)

1. **A/B Testing**: Testar variações de CTAs
2. **Personalização**: Mostrar features específicas por indústria
3. **Chatbot**: Atendimento em tempo real
4. **Countdown**: "Apenas X pessoas visualizaram este domínio hoje"
5. **Social Proof**: "12 domínios premium foram vendidos esta semana"

## Suporte

Para dúvidas sobre a implementação:
- Email: support@com.rich
- Documentação da API: `/supabase/functions/domains/index.ts`
