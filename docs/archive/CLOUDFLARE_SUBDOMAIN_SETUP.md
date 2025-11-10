# Cloudflare Subdomain Redirect Configuration

Este documento explica como configurar redirecionamentos 301 de subdomínios para URLs canônicas no Cloudflare.

## Objetivo

Redirecionar qualquer acesso via subdomínio (ex: `vip.com.rich`) para a URL canônica (ex: `https://com.rich/vip`).

## Configuração no Cloudflare

### Passo 1: Adicionar DNS Wildcard

1. Acesse o painel do Cloudflare
2. Vá em **DNS** > **Records**
3. Adicione um registro **CNAME**:
   - **Type**: CNAME
   - **Name**: `*` (asterisco - wildcard)
   - **Target**: `com.rich` (ou o domínio principal)
   - **Proxy status**: ✅ Proxied (laranja)
   - **TTL**: Auto

Isso permite que todos os subdomínios (*.com.rich) sejam resolvidos.

### Passo 2: Criar Redirect Rule

1. Vá em **Rules** > **Redirect Rules**
2. Clique em **Create rule**
3. Configure a regra:

**Rule name**: `Subdomain to Path Redirect`

**When incoming requests match...**

```
Field: Hostname
Operator: matches regex
Value: ^([a-z0-9-]+)\.com\.rich$
```

**Then...**

- **Type**: Dynamic
- **URL**:
  ```
  concat("https://com.rich/", regex_replace(http.host, "^([a-z0-9-]+)\\.com\\.rich$", "${1}"))
  ```
- **Status code**: 301 (Permanent Redirect)
- **Preserve query string**: ✅ Enabled

### Passo 3: Salvar e Testar

1. Clique em **Deploy**
2. Aguarde alguns segundos para propagação
3. Teste acessando: `https://vip.com.rich`
4. Deve redirecionar para: `https://com.rich/vip`

## Exemplo de Fluxo Completo

### Domínio Premium (vip.com.rich)

1. **Usuário acessa**: `https://vip.com.rich`
2. **Cloudflare redireciona (301)**: `https://com.rich/vip`
3. **React Router captura**: `/:slug` → `DomainSlugPage`
4. **API consulta**: `/functions/v1/domains` com `fqdn=vip.com.rich`
5. **Resposta**:
   ```json
   {
     "status": "AVAILABLE",
     "isPremium": true,
     "isAvailable": true,
     "planRequired": "ELITE"
   }
   ```
6. **Renderiza**: `PremiumLanding` component

### Domínio Já Registrado (maria.com.rich)

1. **Usuário acessa**: `https://maria.com.rich`
2. **Cloudflare redireciona (301)**: `https://com.rich/maria`
3. **React Router captura**: `/:slug` → `DomainSlugPage`
4. **API consulta**: `/functions/v1/domains` com `fqdn=maria.com.rich`
5. **Resposta**:
   ```json
   {
     "status": "UNAVAILABLE",
     "isAvailable": false
   }
   ```
6. **Renderiza**: `PublicProfile` component (se existir) ou página "já registrado"

### Domínio Standard (ola.com.rich)

1. **Usuário acessa**: `https://ola.com.rich`
2. **Cloudflare redireciona (301)**: `https://com.rich/ola`
3. **React Router captura**: `/:slug` → `DomainSlugPage`
4. **API consulta**: `/functions/v1/domains` com `fqdn=ola.com.rich`
5. **Resposta**:
   ```json
   {
     "status": "AVAILABLE",
     "isPremium": false,
     "isAvailable": true,
     "planRequired": "STANDARD_OR_ELITE",
     "price": { "monthly": 50, "currency": "USD" }
   }
   ```
6. **Renderiza**: Página "disponível" padrão

## Verificação e Testes

### Teste Manual

```bash
# Verificar redirecionamento
curl -I https://vip.com.rich

# Deve retornar:
# HTTP/2 301
# location: https://com.rich/vip
```

### Teste no Navegador

1. Digite `vip.com.rich` na barra de endereços
2. Deve redirecionar para `com.rich/vip`
3. URL no navegador deve mostrar `com.rich/vip`
4. Página deve exibir Premium Landing

## SEO Considerations

- ✅ Redirect 301 (permanente) preserva SEO
- ✅ URL canônica sempre é `https://com.rich/<slug>`
- ✅ Meta tag canonical configurada no DomainSlugPage
- ✅ Subdomínios apenas redirecionam, nunca servem conteúdo

## Troubleshooting

### Redirecionamento não funciona

1. Verifique se o DNS wildcard está configurado
2. Confirme que a regra de redirect está ativa
3. Limpe o cache do Cloudflare
4. Teste em modo anônimo/incognito

### Loop de redirecionamento

1. Verifique se há múltiplas regras conflitantes
2. Certifique-se de que a regex está correta
3. Confirme que o redirect é apenas para subdomínios, não para o domínio raiz

### Subdomínio não resolve

1. Verifique se o wildcard CNAME está com Proxy ativado (laranja)
2. Aguarde alguns minutos para propagação DNS
3. Use ferramentas como `dig` ou `nslookup` para verificar

## Notas Importantes

- A regra aplica-se a **todos os subdomínios** de `com.rich`
- Subdomínios reservados (www, api, admin) devem ter regras específicas com prioridade maior
- O Cloudflare processa as regras em ordem de prioridade
- Mantenha a regex simples para evitar impacto na performance
