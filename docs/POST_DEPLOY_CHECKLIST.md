# ✅ CHECKLIST DE VERIFICAÇÃO PÓS-DEPLOY

**Data:** 2025-11-09
**Status:** Lista Completa de Testes Manuais

---

## 📋 QUANDO USAR ESTE CHECKLIST

Use este checklist após:
- ✅ Deploy em produção (primeira vez)
- ✅ Deploy após mudanças significativas
- ✅ Atualizações de Edge Functions
- ✅ Mudanças no banco de dados (migrations)
- ✅ Mudanças nas configurações (env vars)

---

## 🎯 AMBIENTE DE TESTE

**URL Base:** `______________________` (preencher)
**Data do Deploy:** `______________________`
**Deploy ID:** `______________________`
**Responsável:** `______________________`

---

## 1. INFRAESTRUTURA BÁSICA

### **1.1 DNS e Certificado SSL**
- [ ] Site abre em `https://therichclub.com`
- [ ] Redireciona `http://` para `https://`
- [ ] `www.therichclub.com` funciona (ou redireciona)
- [ ] Certificado SSL válido (cadeado verde no navegador)
- [ ] Sem warnings de "mixed content"

**Como Testar:**
```bash
# Terminal
curl -I https://therichclub.com
# Deve retornar 200 OK

# Verificar SSL
openssl s_client -connect therichclub.com:443 -servername therichclub.com
# Deve mostrar certificado válido
```

---

### **1.2 Build e Assets**
- [ ] Página carrega sem erro 404
- [ ] CSS carrega corretamente (estilo aplicado)
- [ ] JavaScript carrega (não vê HTML não estilizado)
- [ ] Imagens de fundo carregam
- [ ] Logo aparece
- [ ] Fontes customizadas carregam

**Como Testar:**
1. Abrir DevTools (F12)
2. Network tab
3. Recarregar página (Ctrl+Shift+R)
4. Verificar que todos os assets retornam 200

---

### **1.3 Environment Variables**
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada
- [ ] Valores estão corretos (não são de dev/local)
- [ ] Sem valores dummy ou placeholder

**Como Testar:**
```javascript
// No console do navegador
console.log(import.meta.env.VITE_SUPABASE_URL);
// Deve mostrar URL de produção do Supabase
```

---

## 2. HOME PAGE E BUSCA

### **2.1 Home Page Básica**
- [ ] Home page (`/`) carrega
- [ ] Header visível
- [ ] Footer visível
- [ ] Logo clicável (volta para home)
- [ ] Links de navegação funcionam
- [ ] Botão "Login" aparece

**Tempo esperado:** < 2 segundos

---

### **2.2 Busca de Domínios - Disponível**
- [ ] Input de busca aparece
- [ ] Placeholder correto: "[username] .com.rich"
- [ ] Consegue digitar no input
- [ ] Botão "Buscar" aparece

**Teste 1 - Domínio Regular Disponível:**
1. [ ] Digitar: `teste[TIMESTAMP]` (ex: teste20251109143000)
2. [ ] Clicar "Buscar"
3. [ ] Loading aparece
4. [ ] Resultado: "✅ Domínio disponível para registro!"
5. [ ] Mostra preço (ou "incluído na mensalidade")
6. [ ] Botão "Ver Planos" aparece

**Teste 2 - Domínio Premium Disponível:**
1. [ ] Digitar: `vip` (se não registrado ainda)
2. [ ] Clicar "Buscar"
3. [ ] Resultado: "💎 Domínio Premium - disponível apenas para plano Elite"
4. [ ] Mostra preço ($70/mês)
5. [ ] Botão "Ver Planos" aparece

---

### **2.3 Busca de Domínios - Indisponível**
**Teste 3 - Domínio Já Registrado:**
1. [ ] Digitar: domínio que você já registrou anteriormente
2. [ ] Clicar "Buscar"
3. [ ] Resultado: "❌ Este domínio já está registrado"
4. [ ] Sem botão "Ver Planos"

---

### **2.4 Busca de Domínios - Erros**
**Teste 4 - Marca Protegida:**
1. [ ] Digitar: `apple` ou `google`
2. [ ] Clicar "Buscar"
3. [ ] Resultado: "🚫 Marca protegida - não disponível"

**Teste 5 - Palavra Reservada:**
1. [ ] Digitar: `admin` ou `dashboard`
2. [ ] Clicar "Buscar"
3. [ ] Resultado: "🚫 Palavra reservada - não disponível"

**Teste 6 - Username Inválido:**
1. [ ] Digitar: `a` (muito curto)
2. [ ] Deve mostrar erro de validação
3. [ ] Digitar: `username@teste` (caracteres inválidos)
4. [ ] Deve mostrar erro de validação

---

## 3. AUTENTICAÇÃO

### **3.1 Registro de Novo Usuário**
- [ ] Link "Registrar" ou "Sign Up" visível
- [ ] Clicar abre página/modal de registro
- [ ] Formulário aparece com campos:
  - [ ] Nome completo
  - [ ] Email
  - [ ] Senha
  - [ ] Confirmar senha

**Teste de Registro:**
1. [ ] Preencher todos os campos
2. [ ] Email: `teste+[TIMESTAMP]@exemplo.com`
3. [ ] Senha: `TesteSenha123!`
4. [ ] Clicar "Registrar"
5. [ ] Loading aparece
6. [ ] Redireciona para dashboard ou onboarding
7. [ ] Mensagem de sucesso aparece

**Validações:**
- [ ] Senha fraca mostra erro
- [ ] Email inválido mostra erro
- [ ] Campos vazios mostram erro
- [ ] Senhas não conferem mostra erro

---

### **3.2 Login**
- [ ] Link "Login" ou "Entrar" visível
- [ ] Clicar abre página/modal de login
- [ ] Formulário com email e senha

**Teste de Login:**
1. [ ] Email: usar conta criada anteriormente
2. [ ] Senha: senha correta
3. [ ] Clicar "Entrar"
4. [ ] Loading aparece
5. [ ] Redireciona para dashboard
6. [ ] Nome do usuário aparece no header

**Validações:**
- [ ] Senha errada mostra erro
- [ ] Email não cadastrado mostra erro
- [ ] Campos vazios mostram erro

---

### **3.3 Logout**
- [ ] Botão/Link "Sair" ou "Logout" visível no header
- [ ] Clicar em "Sair"
- [ ] Redireciona para home
- [ ] Header volta a mostrar "Login" (sem nome do usuário)
- [ ] Tentar acessar `/dashboard` redireciona para login

---

### **3.4 Reset de Senha**
- [ ] Link "Esqueci minha senha" na página de login
- [ ] Clicar abre formulário de reset
- [ ] Input de email aparece
- [ ] Digitar email válido
- [ ] Clicar "Enviar"
- [ ] Mensagem de confirmação aparece
- [ ] Email chega na caixa de entrada (verificar spam)
- [ ] Link no email funciona
- [ ] Consegue definir nova senha

---

## 4. DASHBOARD DO USUÁRIO

### **4.1 Acesso ao Dashboard**
- [ ] URL `/dashboard` acessível (logado)
- [ ] Se não logado, redireciona para `/login`
- [ ] Após login, volta para dashboard

---

### **4.2 Dashboard Inicial (Trial)**
**Com usuário recém-criado (sem pagamento):**
- [ ] Banner "Trial - 14 dias" aparece
- [ ] Mostra tempo restante
- [ ] Mostra plano atual: "Starter"
- [ ] Mostra domínios: 0/1
- [ ] Botão "Upgrade de Plano" visível
- [ ] Botão "Adicionar Domínio" visível

---

### **4.3 Criação de Primeiro Domínio**
1. [ ] Clicar "Adicionar Domínio"
2. [ ] Modal/página de escolha de domínio abre
3. [ ] Input para digitar username
4. [ ] Digitar username único
5. [ ] Clicar "Verificar"
6. [ ] Confirmação que está disponível
7. [ ] Botão "Criar Domínio" ou "Ativar"
8. [ ] Clicar
9. [ ] Loading
10. [ ] Domínio criado com sucesso
11. [ ] Dashboard atualiza mostrando 1/1 domínios

---

### **4.4 Navegação no Dashboard**
- [ ] Sidebar/Menu lateral aparece
- [ ] Links funcionam:
  - [ ] Dashboard (overview)
  - [ ] Meus Domínios
  - [ ] Perfil/Profile Manager
  - [ ] Configurações
  - [ ] Billing/Assinatura

---

## 5. PERFIL MANAGER (Edição)

### **5.1 Acesso ao Profile Manager**
- [ ] URL `/profile-manager` acessível (logado)
- [ ] Ou link "Editar Perfil" no dashboard
- [ ] Página carrega mostrando perfil atual

---

### **5.2 Informações Básicas**
- [ ] Campo "Nome de Exibição" editável
- [ ] Campo "Bio" editável (textarea)
- [ ] Contador de caracteres funciona
- [ ] Limite de caracteres respeitado

**Teste de Edição:**
1. [ ] Alterar nome para "João Test"
2. [ ] Alterar bio para "Teste de bio"
3. [ ] Clicar "Salvar"
4. [ ] Mensagem de sucesso
5. [ ] Recarregar página
6. [ ] Mudanças persistidas

---

### **5.3 Upload de Foto de Perfil**
- [ ] Botão "Upload" ou área de drag-drop
- [ ] Clicar abre seletor de arquivos

**Teste de Upload:**
1. [ ] Selecionar imagem JPEG válida (< 5MB)
2. [ ] Preview aparece
3. [ ] Clicar "Confirmar" ou "Salvar"
4. [ ] Loading durante upload
5. [ ] Sucesso
6. [ ] Foto aparece no perfil

**Validações:**
- [ ] Arquivo > 5MB mostra erro
- [ ] Arquivo não-imagem mostra erro
- [ ] Dimensões muito pequenas mostram aviso

---

### **5.4 Background/Capa**
- [ ] Opção de upload de imagem de fundo
- [ ] Ou seletor de cor de fundo
- [ ] Preview em tempo real

**Teste:**
1. [ ] Fazer upload de imagem de fundo
2. [ ] Ou escolher cor sólida
3. [ ] Salvar
4. [ ] Verificar no perfil público

---

### **5.5 Links Personalizados**
- [ ] Seção "Links" visível
- [ ] Botão "Adicionar Link"
- [ ] Formulário aparece com:
  - [ ] Título do link
  - [ ] URL
  - [ ] Ícone (opcional)

**Teste de Adicionar Link:**
1. [ ] Clicar "Adicionar Link"
2. [ ] Título: "Meu Instagram"
3. [ ] URL: `https://instagram.com/teste`
4. [ ] Escolher ícone Instagram
5. [ ] Salvar
6. [ ] Link aparece na lista
7. [ ] Drag-and-drop para reordenar funciona

**Validações:**
- [ ] URL sem `http(s)://` adiciona automaticamente
- [ ] URL inválida mostra erro
- [ ] Links maliciosos são bloqueados (teste com URL de teste de phishing)

---

### **5.6 Loja (Se Habilitado)**
**Para planos que incluem loja:**
- [ ] Toggle "Ativar Loja" aparece
- [ ] Ativar loja
- [ ] Botão "Adicionar Produto" aparece

**Teste de Produto:**
1. [ ] Clicar "Adicionar Produto"
2. [ ] Nome: "Produto Teste"
3. [ ] Descrição: "Descrição teste"
4. [ ] Preço: "50.00"
5. [ ] Upload de imagem do produto
6. [ ] Salvar
7. [ ] Produto aparece na lista
8. [ ] Produto visível no perfil público

---

### **5.7 Customização de Tema**
- [ ] Seletor de tema/template
- [ ] Preview em tempo real
- [ ] Cores customizáveis
- [ ] Fontes customizáveis (se disponível)

**Teste:**
1. [ ] Escolher cor primária diferente
2. [ ] Escolher cor de botões
3. [ ] Preview atualiza
4. [ ] Salvar
5. [ ] Verificar no perfil público

---

## 6. PERFIL PÚBLICO

### **6.1 Acesso ao Perfil**
- [ ] URL `/u/[username]` acessível
- [ ] Usuário não precisa estar logado (público)

**Teste:**
1. [ ] Abrir `/u/[seu-username]` em aba anônima
2. [ ] Perfil carrega
3. [ ] Tempo de load < 3 segundos

---

### **6.2 Header do Perfil**
- [ ] Mostra `username.com.rich` no topo
- [ ] Foto de perfil aparece
- [ ] Nome de exibição aparece
- [ ] Bio aparece (se preenchida)

---

### **6.3 Links**
- [ ] Todos os links adicionados aparecem
- [ ] Na ordem correta (conforme ordenação)
- [ ] Ícones corretos
- [ ] Clicar no link abre em nova aba
- [ ] URLs corretas

**Teste de Link:**
1. [ ] Clicar em cada link
2. [ ] Verificar que abre URL correta
3. [ ] Verificar que `target="_blank"` funciona

---

### **6.4 Loja (Se Ativada)**
- [ ] Seção "Loja" ou "Produtos" aparece
- [ ] Produtos listados com imagem
- [ ] Preços formatados corretamente
- [ ] Botão "Comprar" ou "Saber Mais" funciona

---

### **6.5 Social (Se Ativado)**
- [ ] Seção "Posts" ou "Feed" aparece
- [ ] Posts mais recentes aparecem primeiro
- [ ] Botão "Curtir" funciona (se logado)
- [ ] Contador de curtidas atualiza
- [ ] Botão "Comentar" funciona (se logado)

---

### **6.6 SEO e Compartilhamento**
- [ ] Título da página correto
- [ ] Meta description presente
- [ ] Open Graph tags (para compartilhar no WhatsApp/Facebook)

**Teste:**
1. [ ] Inspecionar `<head>` da página
2. [ ] Verificar `<title>`, `<meta name="description">`
3. [ ] Compartilhar link no WhatsApp
4. [ ] Verificar preview do link

---

### **6.7 Responsividade Mobile**
- [ ] Abrir perfil no celular (ou DevTools mobile mode)
- [ ] Layout se adapta
- [ ] Fonte legível
- [ ] Botões clicáveis (não muito pequenos)
- [ ] Imagens não quebram layout

---

## 7. PRICING E CHECKOUT

### **7.1 Página de Preços**
- [ ] URL `/pricing` acessível
- [ ] 4 planos visíveis: Starter, Prime, Elite, Supreme
- [ ] Preços corretos
- [ ] Features listadas
- [ ] Botão "Escolher Plano" em cada card

---

### **7.2 Seleção de Plano**
**Teste com Plano Prime:**
1. [ ] Clicar "Escolher Plano" no card Prime
2. [ ] Se não logado, pede login primeiro
3. [ ] Após login, vai para checkout
4. [ ] Resumo do pedido aparece:
   - [ ] Plano: Prime
   - [ ] Valor: $19/mês
   - [ ] Total: $19

---

### **7.3 Checkout PayPal**
1. [ ] Botão "Pagar com PayPal" aparece
2. [ ] Clicar no botão
3. [ ] Abre popup/redirect PayPal
4. [ ] Login no PayPal (sandbox se teste)
5. [ ] Confirmar pagamento
6. [ ] Redireciona de volta para site

---

### **7.4 Confirmação de Pagamento**
- [ ] Redireciona para `/success`
- [ ] Mensagem de sucesso aparece
- [ ] "Seu pagamento foi confirmado!"
- [ ] "Assinatura ativada: Prime"
- [ ] Botão "Ir para Dashboard"

---

### **7.5 Verificação no Dashboard**
1. [ ] Voltar para dashboard
2. [ ] Banner trial sumiu
3. [ ] Mostra "Plano: Prime"
4. [ ] Mostra "Domínios: 1/3"
5. [ ] Pode adicionar mais 2 domínios

---

### **7.6 Webhook do PayPal**
**Verificação Backend:**
```sql
-- No Supabase SQL Editor
SELECT * FROM webhook_events
ORDER BY created_at DESC LIMIT 5;

-- Deve ter evento BILLING.SUBSCRIPTION.ACTIVATED

SELECT * FROM subscriptions
WHERE customer_id = (
  SELECT id FROM customers WHERE email = 'seu-email@teste.com'
);
-- Deve ter subscription com status 'active'
```

---

## 8. BILLING E ASSINATURA

### **8.1 Página de Billing**
- [ ] URL `/billing` acessível (logado)
- [ ] Mostra plano atual
- [ ] Mostra próxima data de cobrança
- [ ] Mostra método de pagamento (PayPal)
- [ ] Histórico de faturas

---

### **8.2 Upgrade de Plano**
**Teste Prime → Elite:**
1. [ ] Clicar "Fazer Upgrade"
2. [ ] Escolher plano Elite
3. [ ] Mostra diferença de preço ($51 a mais)
4. [ ] Mostra proration (proporcional aos dias)
5. [ ] Confirmar upgrade
6. [ ] Redireciona PayPal
7. [ ] Paga diferença
8. [ ] Volta pro site
9. [ ] Dashboard mostra "Plano: Elite"
10. [ ] Limite de domínios: 10

---

### **8.3 Downgrade de Plano**
**Teste Elite → Prime:**
1. [ ] Clicar "Alterar Plano"
2. [ ] Escolher plano Prime (menor)
3. [ ] Mostra aviso: "Downgrade no final do período"
4. [ ] Confirmar
5. [ ] Downgrade agendado
6. [ ] Plano permanece Elite até fim do período
7. [ ] Após data de renovação, muda para Prime

---

### **8.4 Cancelamento**
1. [ ] Botão "Cancelar Assinatura"
2. [ ] Modal de confirmação
3. [ ] "Tem certeza? Perderá acesso no fim do período"
4. [ ] Confirmar cancelamento
5. [ ] Assinatura marcada como "Cancelada"
6. [ ] Acesso permanece até fim do período pago
7. [ ] Após fim do período, volta para Starter (trial)

---

## 9. ADMIN DASHBOARD

**Apenas para usuários com role 'admin':**

### **9.1 Acesso**
- [ ] URL `/admin` acessível (apenas admin)
- [ ] Se não admin, redireciona ou mostra 403

---

### **9.2 Estatísticas Gerais**
- [ ] Total de usuários
- [ ] Total de domínios registrados
- [ ] Receita do mês
- [ ] Novos usuários hoje

---

### **9.3 Gestão de Usuários**
- [ ] Lista todos os usuários
- [ ] Busca funciona
- [ ] Filtro por plano funciona
- [ ] Pode ver detalhes de cada usuário
- [ ] Pode editar role (user/reseller/admin)
- [ ] Pode suspender usuário

---

### **9.4 Gestão de Domínios**
- [ ] Lista todos os domínios
- [ ] Busca funciona
- [ ] Pode ver dono do domínio
- [ ] Pode marcar como premium
- [ ] Pode suspender domínio

---

### **9.5 Marcas Protegidas**
- [ ] Lista de marcas protegidas
- [ ] Pode adicionar nova marca
- [ ] Pode remover marca
- [ ] Validação funciona (não permite registrar)

---

### **9.6 Logs e Auditoria**
- [ ] Pode ver logs de ações
- [ ] Filtrar por tipo de ação
- [ ] Filtrar por usuário
- [ ] Exportar logs

---

## 10. SEGURANÇA

### **10.1 HTTPS e Headers**
```bash
# Verificar security headers
curl -I https://therichclub.com

# Deve ter:
# Strict-Transport-Security
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy
```

- [ ] Headers de segurança presentes

---

### **10.2 Autenticação**
- [ ] Não consegue acessar dashboard sem login
- [ ] Token JWT expira (testar após 1 hora)
- [ ] Refresh token funciona automaticamente
- [ ] Logout invalida token

---

### **10.3 RLS (Row Level Security)**
**Teste de Isolamento:**
1. [ ] Login com User A
2. [ ] Criar domínio
3. [ ] Logout
4. [ ] Login com User B
5. [ ] Tentar acessar `/u/usera` (deve funcionar - público)
6. [ ] Tentar editar perfil de User A via DevTools/API (deve falhar)
7. [ ] Dashboard de User B não mostra dados de User A

---

### **10.4 Rate Limiting**
**Teste de Proteção:**
1. [ ] Fazer 50 buscas de domínio consecutivas
2. [ ] A partir de certo ponto, deve mostrar erro de rate limit
3. [ ] Aguardar 1 minuto
4. [ ] Tentar novamente (deve funcionar)

---

### **10.5 Validação de Links**
**Teste Google Safe Browsing:**
1. [ ] Tentar adicionar link malicioso conhecido
2. [ ] Sistema deve rejeitar ou marcar como unsafe
3. [ ] Link não aparece no perfil público

---

### **10.6 SQL Injection**
**Teste de Segurança:**
1. [ ] Na busca de domínio, digitar: `'; DROP TABLE domains; --`
2. [ ] Deve retornar erro de validação ou simplesmente "não encontrado"
3. [ ] Tabela `domains` deve continuar existindo (verificar no Supabase)

---

### **10.7 XSS (Cross-Site Scripting)**
**Teste de Segurança:**
1. [ ] Na bio do perfil, digitar: `<script>alert('XSS')</script>`
2. [ ] Salvar
3. [ ] Acessar perfil público
4. [ ] Script NÃO deve executar (deve aparecer como texto ou ser removido)

---

## 11. PERFORMANCE

### **11.1 Lighthouse Score**
**No Chrome DevTools:**
1. [ ] Abrir DevTools → Lighthouse
2. [ ] Rodar audit para mobile
3. [ ] Scores esperados:
   - [ ] Performance: > 70
   - [ ] Accessibility: > 90
   - [ ] Best Practices: > 90
   - [ ] SEO: > 90

---

### **11.2 Page Load Time**
- [ ] Home: < 3s
- [ ] Dashboard: < 4s
- [ ] Perfil Público: < 3s
- [ ] Profile Manager: < 4s

---

### **11.3 Bundle Size**
```bash
# Após build
ls -lh dist/assets/*.js

# Verificar se nenhum chunk > 500KB
```

- [ ] Nenhum JavaScript > 500KB

---

## 12. EDGE CASES

### **12.1 Navegador Sem JavaScript**
- [ ] Desabilitar JavaScript no navegador
- [ ] Tentar acessar site
- [ ] Deve mostrar mensagem "JavaScript necessário"

---

### **12.2 Navegador Antigo**
- [ ] Testar em IE11 ou Safari 12
- [ ] Deve funcionar ou mostrar mensagem de browser não suportado

---

### **12.3 Conexão Lenta**
- [ ] DevTools → Network → Slow 3G
- [ ] Recarregar página
- [ ] Loading states aparecem
- [ ] Página não quebra
- [ ] Timeout não ocorre antes de 30s

---

### **12.4 Dispositivos Móveis**
**Testar em dispositivo real (não só emulador):**
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Layout responsivo
- [ ] Touch funciona (não precisa hover)
- [ ] Teclado virtual não quebra layout

---

## 13. EMAILS

### **13.1 Email de Boas-Vindas**
- [ ] Ao registrar, recebe email de boas-vindas
- [ ] Email tem logo
- [ ] Links no email funcionam
- [ ] Email não vai para spam

---

### **13.2 Email de Reset de Senha**
- [ ] Email chega em até 5 minutos
- [ ] Link no email funciona
- [ ] Link expira após 24h

---

### **13.3 Email de Confirmação de Pagamento**
- [ ] Após pagamento, recebe email
- [ ] Email tem detalhes do plano
- [ ] Email tem número da fatura

---

## 14. INTEGRAÇÕES EXTERNAS

### **14.1 PayPal**
- [ ] Sandbox PayPal funciona (dev)
- [ ] Live PayPal funciona (produção)
- [ ] Webhooks recebidos
- [ ] Logs de webhook no Supabase

---

### **14.2 Cloudflare Turnstile**
- [ ] Captcha aparece quando necessário
- [ ] Captcha valida corretamente
- [ ] Não bloqueia usuários legítimos

---

### **14.3 Google Safe Browsing**
- [ ] Links validados automaticamente
- [ ] Links perigosos bloqueados
- [ ] Falsos positivos podem ser desbloqueados manualmente

---

## 15. MONITORING

### **15.1 Error Tracking**
- [ ] Erros são logados no Supabase
- [ ] Pode ver erros no dashboard
- [ ] Alertas configurados (se houver)

---

### **15.2 Uptime**
- [ ] Site está online
- [ ] Status: https://status.supabase.com
- [ ] Edge Functions responsivas (< 1s)

---

## ✅ RESUMO FINAL

**Total de Checks:** ~250+

**Status Geral:**
- [ ] ✅ TODOS OS TESTES PASSARAM
- [ ] ⚠️ ALGUNS TESTES FALHARAM (listar abaixo)
- [ ] ❌ MUITOS TESTES FALHARAM (não fazer deploy!)

**Testes Falhados:**
```
1. [Descrever teste que falhou]
2. [Descrever teste que falhou]
...
```

**Ações Necessárias:**
```
1. [Corrigir X]
2. [Verificar Y]
...
```

---

## 📝 NOTAS ADICIONAIS

```
[Espaço para notas do responsável pelo teste]
```

---

**Data de Conclusão:** `______________________`
**Assinatura:** `______________________`

---

## 🔄 PRÓXIMOS PASSOS

Após completar este checklist:
1. ✅ Se TODOS passaram → Site pronto para uso!
2. ⚠️ Se ALGUNS falharam → Corrigir e re-testar
3. ❌ Se MUITOS falharam → Rever deploy e configurações

**Frequência Recomendada:**
- Deploy inicial: 100% do checklist
- Deploys menores: Seções relevantes
- Deploy semanal: Checklist reduzido (itens críticos)

---

**Última Atualização:** 2025-11-09
