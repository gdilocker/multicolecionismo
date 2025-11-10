# 🚀 Deployment Checklist - Premium Landing

## Pré-Deploy

### ✅ Código

- [x] Build sem erros (`npm run build`)
- [x] Testes manuais executados
- [x] Git commit criado
- [x] Documentação completa

### ✅ Banco de Dados

- [ ] Tabela `premium_domains` existe
- [ ] Tabela `domain_catalog` existe
- [ ] Pelo menos 1 domínio premium configurado para testes
- [ ] Políticas RLS configuradas

```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('premium_domains', 'domain_catalog');

-- Verificar dados de teste
SELECT * FROM premium_domains LIMIT 5;
SELECT * FROM domain_catalog WHERE is_premium = true LIMIT 5;
```

### ✅ Environment Variables

- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada

```bash
# Verificar no .env local
cat .env | grep VITE_SUPABASE

# Verificar no Netlify/Vercel
# Dashboard → Settings → Environment Variables
```

## Deploy Principal

### 1. Deploy do Frontend

**Netlify:**
```bash
# Build local
npm run build

# Deploy via CLI (opcional)
netlify deploy --prod

# Ou via Git push (automático)
git push origin main
```

**Vercel:**
```bash
# Deploy via CLI
vercel --prod

# Ou via Git push (automático)
git push origin main
```

### 2. Verificar Deploy

- [ ] Site carregando: `https://com.rich`
- [ ] Assets carregando (CSS, JS)
- [ ] Console sem erros críticos

```bash
# Teste rápido
curl -I https://com.rich

# Deve retornar HTTP 200
```

## Configuração Cloudflare

### 3. DNS Wildcard

1. Login no Cloudflare
2. Selecionar domínio `com.rich`
3. DNS → Records → Add Record

**Configuração:**
```
Type:   CNAME
Name:   *
Target: com.rich
Proxy:  ON (🟠 laranja)
TTL:    Auto
```

- [ ] DNS wildcard configurado
- [ ] Proxy status = ON (laranja)

**Verificação:**
```bash
# Testar resolução
nslookup vip.com.rich
# Deve retornar IP do Cloudflare

dig vip.com.rich
# Deve mostrar CNAME → com.rich
```

### 4. Redirect Rule

1. Rules → Redirect Rules → Create Rule

**Nome:** `Subdomain to Path Redirect`

**When incoming requests match:**
```
Field: Hostname
Operator: matches regex
Value: ^([a-z0-9-]+)\.com\.rich$
```

**Then:**
```
Type: Dynamic
URL: concat("https://com.rich/", regex_replace(http.host, "^([a-z0-9-]+)\\.com\\.rich$", "${1}"))
Status code: 301
Preserve query string: ON
```

- [ ] Redirect rule criada
- [ ] Status: Active
- [ ] Priority: 1 (ou adequada)

**Verificação:**
```bash
curl -I https://vip.com.rich

# Deve retornar:
# HTTP/2 301
# location: https://com.rich/vip
```

## Testes em Produção

### 5. Teste Premium Disponível

**URL:** `https://com.rich/vip` (substituir "vip" por domínio premium real)

- [ ] Página carrega
- [ ] Fundo escuro exibido
- [ ] Selo "Domínio Premium" visível
- [ ] Texto dourado no slug
- [ ] Botão "Falar com Especialista" funciona
- [ ] Botão "Ver Plano Elite" funciona
- [ ] Responsivo (testar mobile)

### 6. Teste Subdomínio

**URL:** `https://vip.com.rich`

- [ ] Redireciona (301) para `https://com.rich/vip`
- [ ] URL final no browser: `com.rich/vip`
- [ ] Página Premium Landing exibe

### 7. Teste Standard Disponível

**URL:** `https://com.rich/teste123` (domínio não-premium)

- [ ] Página padrão exibe (fundo claro)
- [ ] Preço US$ 50 visível
- [ ] Botão "Ver Planos" funciona

### 8. Teste Domínio Registrado

**URL:** `https://com.rich/[dominio-ja-registrado]`

- [ ] NÃO exibe Premium Landing
- [ ] Exibe perfil público OU página "já registrado"
- [ ] Sugestões aparecem

### 9. Teste Busca na Home

1. Acesse: `https://com.rich`
2. Digite domínio premium na busca
3. Clique "Buscar"

- [ ] Redireciona para `/<slug>`
- [ ] Premium Landing exibe

### 10. Teste Analytics

1. Abra DevTools → Console
2. Acesse Premium Landing
3. Clique "Falar com Especialista"

- [ ] Evento `premium_view` disparado
- [ ] Evento `premium_contact_click` disparado
- [ ] Parâmetros `domain` e `slug` corretos

## SEO

### 11. Verificar Meta Tags

**Inspecionar `<head>`:**

```html
<title>vip.com.rich - Domínio Premium | com.rich</title>
<link rel="canonical" href="https://com.rich/vip">
```

- [ ] Title dinâmico presente
- [ ] Canonical link correto
- [ ] Meta description presente (opcional)

### 12. Testar Google Search Console

1. Adicionar propriedade: `https://com.rich`
2. Verificar propriedade
3. Submeter sitemap (se existir)

- [ ] Propriedade verificada
- [ ] Páginas sendo indexadas

## Performance

### 13. PageSpeed Insights

**URL:** `https://pagespeed.web.dev/`

Testar: `https://com.rich/vip`

- [ ] Mobile score > 80
- [ ] Desktop score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### 14. Verificar Carregamento

```bash
# Tempo de resposta
curl -o /dev/null -s -w '%{time_total}\n' https://com.rich/vip

# Deve ser < 1s
```

## Monitoramento

### 15. Configurar Alerts

**Uptime Monitoring:**
- [ ] UptimeRobot ou similar configurado
- [ ] Alertas por email
- [ ] Verificar a cada 5 minutos

**Error Tracking:**
- [ ] Sentry (opcional)
- [ ] LogRocket (opcional)

### 16. Analytics Dashboard

**Google Analytics:**
- [ ] Property configurada
- [ ] Eventos customizados visíveis
- [ ] Conversões rastreadas

**Queries úteis:**
```
Evento: premium_view
Filtro: últimos 7 dias
Agrupar por: domain
```

## Dados de Teste

### 17. Adicionar Domínios Premium

```sql
-- Adicionar alguns premium para testes
INSERT INTO premium_domains (fqdn, is_active) VALUES
  ('vip.com.rich', true),
  ('ceo.com.rich', true),
  ('elite.com.rich', true),
  ('pro.com.rich', true),
  ('premium.com.rich', true);

-- Adicionar ao catálogo
INSERT INTO domain_catalog (fqdn, is_available, is_premium) VALUES
  ('vip.com.rich', true, true),
  ('ceo.com.rich', true, true),
  ('elite.com.rich', true, true),
  ('pro.com.rich', true, true),
  ('premium.com.rich', true, true)
ON CONFLICT (fqdn) DO UPDATE
SET is_available = EXCLUDED.is_available,
    is_premium = EXCLUDED.is_premium;
```

- [ ] Pelo menos 5 premium disponíveis
- [ ] Testados manualmente

## Rollback Plan

### Se algo der errado:

**Opção 1: Reverter Deploy**
```bash
# Netlify
netlify rollback

# Vercel
vercel rollback [deployment-url]
```

**Opção 2: Desativar Redirect Rule**
```
Cloudflare → Rules → Redirect Rules
Clicar "Pause" na regra
```

**Opção 3: Remover DNS Wildcard**
```
Cloudflare → DNS → Records
Deletar registro "*"
```

## Pós-Deploy

### 18. Comunicação

- [ ] Notificar equipe do deploy
- [ ] Atualizar changelog
- [ ] Postar em #deploys (Slack/Discord)

### 19. Documentação

- [ ] README atualizado
- [ ] Wiki/Confluence atualizado
- [ ] Treinamento da equipe de suporte

### 20. Backup

- [ ] Backup do banco antes das mudanças
- [ ] Snapshot do código (Git tag)

```bash
# Criar tag de release
git tag -a v1.0.0-premium-landing -m "Premium Landing Release"
git push origin v1.0.0-premium-landing
```

## Checklist Final

### ✅ Tudo Pronto Para Produção

- [ ] Build sem erros
- [ ] Testes passando
- [ ] Deploy realizado
- [ ] DNS configurado
- [ ] Redirect rule ativa
- [ ] Testes em produção OK
- [ ] Analytics funcionando
- [ ] SEO configurado
- [ ] Performance aceitável
- [ ] Monitoramento ativo
- [ ] Dados de teste adicionados
- [ ] Rollback plan documentado
- [ ] Equipe notificada
- [ ] Documentação atualizada

## Suporte

Problemas no deploy?

1. **Verificar logs:**
   - Netlify: Build logs
   - Supabase: Functions logs
   - Browser: Console

2. **Cloudflare:**
   - Analytics → Cache
   - Purge everything
   - Aguardar 2-3 minutos

3. **DNS:**
   - Verificar propagação: https://dnschecker.org
   - Aguardar até 24h (raro)

4. **Contato:**
   - Email: support@com.rich
   - Documentação: `PREMIUM_LANDING_IMPLEMENTATION.md`

---

## Quick Commands

```bash
# Build
npm run build

# Test local
npm run dev

# Deploy Netlify
netlify deploy --prod

# Test redirect
curl -I https://vip.com.rich

# Test API
curl -X POST [SUPABASE_URL]/functions/v1/domains \
  -H "Authorization: Bearer [KEY]" \
  -d '{"action":"check","fqdn":"vip.com.rich"}'
```

---

## Status Atual

Data: [PREENCHER]
Versão: v1.0.0-premium-landing

- [x] Código pronto
- [ ] Deploy realizado
- [ ] Cloudflare configurado
- [ ] Testes validados
- [ ] Produção estável

**Próximo passo:** Deploy no ambiente de produção
