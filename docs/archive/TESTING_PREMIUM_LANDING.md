# Guia de Testes - Premium Landing

## Cenários de Teste

### ✅ Cenário 1: Domínio Premium Disponível (vip.com.rich)

**Pré-requisito**: Domínio "vip" deve estar marcado como premium e disponível no banco

**Teste 1.1 - Busca na Home**
1. Acesse `https://com.rich`
2. Digite "vip" na barra de busca
3. Clique em "Buscar"

**Resultado Esperado:**
- Redireciona para `https://com.rich/vip`
- Exibe Premium Landing com:
  - Fundo escuro (gradiente azul escuro)
  - Selo "Domínio Premium" com coroa dourada
  - Texto "vip" em dourado + ".com.rich" em branco
  - Botão "Falar com Especialista" (dourado)
  - Botão "Ver Plano Elite" (transparente)
  - 4 cards: Exclusividade, Memorabilidade, Autoridade, Raridade
  - Seção "Acesso Exclusivo ao Plano Elite"
  - Preço: US$ 70/mês

**Teste 1.2 - Acesso Direto ao Path**
1. Digite diretamente na URL: `https://com.rich/vip`

**Resultado Esperado:**
- Mesma página Premium Landing

**Teste 1.3 - CTA "Falar com Especialista"**
1. Na página Premium Landing, clique "Falar com Especialista"

**Resultado Esperado:**
- Navega para `/contact?domain=vip.com.rich&type=premium`
- Formulário de contato deve estar pré-preenchido:
  - Campo "Assunto": menciona "vip.com.rich"
  - Tipo de contato identificado como "premium"

**Teste 1.4 - CTA "Ver Plano Elite"**
1. Clique em "Ver Plano Elite"

**Resultado Esperado:**
- Navega para `/valores#elite`
- Página de pricing com foco no plano Elite

---

### ✅ Cenário 2: Domínio Premium Já Registrado

**Pré-requisito**: Algum domínio premium deve estar registrado (is_available=false)

**Teste 2.1 - Busca por Premium Registrado**
1. Busque por um domínio premium já registrado

**Resultado Esperado:**
- NÃO exibe Premium Landing
- Exibe PublicProfile (se existir perfil configurado)
- OU exibe página "❌ Já registrado" com sugestões

**Validação Importante:**
- Não deve mostrar landing de venda
- Não deve ter CTAs de "Falar com Especialista"
- Deve indicar claramente que está indisponível

---

### ✅ Cenário 3: Domínio Standard Disponível

**Teste 3.1 - Busca por Standard**
1. Digite "teste123" (ou qualquer nome não-premium)
2. Clique "Buscar"

**Resultado Esperado:**
- Exibe página padrão (fundo claro)
- Check verde ✅
- Texto "Domínio Disponível"
- Preço: US$ 50/mês
- Botão "Ver Planos e Registrar"
- Botão "Buscar Outro Domínio"

**Validação:**
- NÃO deve exibir Premium Landing
- NÃO deve ter selo dourado
- NÃO deve ter fundo escuro

---

### ✅ Cenário 4: Acesso via Subdomínio (Cloudflare)

**Pré-requisito**: Cloudflare redirect rule configurada

**Teste 4.1 - Redirect de Subdomínio**
1. Digite na barra: `vip.com.rich`

**Resultado Esperado:**
- Browser redireciona (301) para `https://com.rich/vip`
- URL final no browser: `com.rich/vip`
- Exibe Premium Landing

**Teste no Terminal:**
```bash
curl -I https://vip.com.rich

# Deve retornar:
# HTTP/2 301
# location: https://com.rich/vip
```

---

### ✅ Cenário 5: Validação de Slug

**Teste 5.1 - Slug Inválido**
1. Acesse: `https://com.rich/invalid@@slug`

**Resultado Esperado:**
- Exibe página de erro
- Mensagem: "Formato de domínio inválido"
- Botão "Voltar para Home"

**Teste 5.2 - Slug com Caracteres Especiais**
1. Busque: "test#@123"

**Resultado Esperado:**
- Normaliza para "test123"
- Continua fluxo normal

**Teste 5.3 - Slug Vazio**
1. Acesse: `https://com.rich/`

**Resultado Esperado:**
- Exibe página Home (não tenta processar como slug)

---

### ✅ Cenário 6: Analytics

**Teste 6.1 - Evento premium_view**
1. Acesse Premium Landing de qualquer domínio premium
2. Abra DevTools → Console

**Resultado Esperado:**
- Console mostra chamada gtag
- Evento: `premium_view`
- Parâmetros: `domain`, `slug`

**Teste 6.2 - Evento premium_contact_click**
1. Na Premium Landing, clique "Falar com Especialista"
2. Verifique Console

**Resultado Esperado:**
- Console mostra chamada gtag
- Evento: `premium_contact_click`
- Parâmetros: `domain`, `slug`

---

### ✅ Cenário 7: SEO

**Teste 7.1 - Meta Tags**
1. Acesse Premium Landing de "vip"
2. Inspecionar `<head>` do HTML

**Resultado Esperado:**
```html
<title>vip.com.rich - Domínio Premium | com.rich</title>
<link rel="canonical" href="https://com.rich/vip">
```

**Teste 7.2 - URL Canônica**
1. Acesse via subdomínio: `vip.com.rich`
2. Após redirect, verificar URL no browser

**Resultado Esperado:**
- URL: `com.rich/vip` (sem o subdomínio)

---

### ✅ Cenário 8: Loading e Erros

**Teste 8.1 - Loading State**
1. Acesse qualquer slug
2. Observe durante o carregamento

**Resultado Esperado:**
- Spinner animado
- Texto "Verificando domínio..."

**Teste 8.2 - Erro de API**
1. Desconecte internet
2. Tente acessar um slug

**Resultado Esperado:**
- Ícone de alerta
- Mensagem de erro clara
- Botão "Voltar para Home"

**Teste 8.3 - Timeout**
1. Simular timeout (API lenta)

**Resultado Esperado:**
- Após 15s, exibe erro
- Mensagem: "Tempo limite excedido"

---

## Checklist de Validação

### Funcionalidade
- [ ] Premium AVAILABLE → Premium Landing ✅
- [ ] Premium UNAVAILABLE → NÃO Premium Landing ✅
- [ ] Standard AVAILABLE → Página padrão ✅
- [ ] Busca redireciona corretamente ✅
- [ ] Subdomínio redireciona (301) ✅
- [ ] URL canônica sempre correta ✅

### Design
- [ ] Premium Landing: fundo escuro ✅
- [ ] Selo dourado visível ✅
- [ ] Ícone de coroa presente ✅
- [ ] Gradientes funcionando ✅
- [ ] Responsivo (mobile/desktop) ✅
- [ ] Hover states nos botões ✅

### UX
- [ ] Loading state durante verificação ✅
- [ ] Erro com mensagem clara ✅
- [ ] CTAs bem visíveis ✅
- [ ] Navegação intuitiva ✅
- [ ] Sem quebras visuais ✅

### Dados
- [ ] API consulta correta ✅
- [ ] Decisão baseada em status/isPremium/isAvailable ✅
- [ ] Sem fallback incorreto ✅
- [ ] Cache-Control: no-store ✅

### Analytics
- [ ] Evento premium_view dispara ✅
- [ ] Evento premium_contact_click dispara ✅
- [ ] Parâmetros corretos ✅

### SEO
- [ ] Title dinâmico ✅
- [ ] Canonical link correto ✅
- [ ] Meta description (opcional) ✅

---

## Comandos Úteis

### Testar API Manualmente
```bash
# Premium Disponível
curl -X POST https://[SUPABASE_URL]/functions/v1/domains \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"action":"check","fqdn":"vip.com.rich"}'

# Deve retornar:
# {
#   "status": "AVAILABLE",
#   "isPremium": true,
#   "isAvailable": true,
#   ...
# }
```

### Verificar Redirect Cloudflare
```bash
curl -I https://vip.com.rich

# Deve mostrar:
# HTTP/2 301
# location: https://com.rich/vip
```

### Inspecionar Analytics no Browser
```javascript
// DevTools Console
(window).gtag('event', 'test', { test: 'manual' });
```

---

## Bugs Conhecidos / Limitações

1. **Perfil vs Domínio**: Se um slug for tanto perfil quanto domínio, prioridade é para domínio
2. **Cache**: Browser pode cachear redirects 301 (limpar cache se testar múltiplas vezes)
3. **Analytics**: Requer gtag configurado no index.html

---

## Próximos Testes Recomendados

1. **Performance**: Medir tempo de carregamento da Premium Landing
2. **A/B Test**: Testar variações de CTAs
3. **Conversion**: Rastrear quantos cliques em "Falar com Especialista"
4. **Mobile**: Testar em dispositivos reais
5. **Acessibilidade**: Validar com screen readers

---

## Suporte

Problemas nos testes?
- Verifique logs do browser (Console)
- Verifique logs da API (Supabase Functions)
- Confirme configuração do Cloudflare
- Email: support@com.rich
