# Guia de Correção do Deploy - Site em Branco

## ✅ Correções Aplicadas

As seguintes correções foram implementadas para resolver o problema do site em branco:

### 1. Variáveis de Ambiente no `netlify.toml`

As variáveis do Supabase foram adicionadas diretamente no arquivo `netlify.toml`:

```toml
[context.production.environment]
  NODE_VERSION = "18"
  VITE_SUPABASE_URL = "https://libzvdbgixckggmivspg.supabase.co"
  VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  VITE_DEV_MODE = "false"
```

Isso garante que as variáveis sejam automaticamente configuradas durante o build no Netlify.

### 2. Correção de Imports de Imagens

Corrigidos os imports de imagens que estavam apontando para arquivos inexistentes:

- `logo-comrich.png` → `Logo.png` (PanelSidebar, Footer)
- `background-gala.png` → `Imagem Fundo Site.png` (ResellerDashboard)

### 3. Error Handling Melhorado

Adicionado tratamento de erros em:

- `src/main.tsx` - Captura erros de renderização
- `src/lib/supabase.ts` - Mensagens de erro detalhadas no console

---

## 🚀 Como Fazer o Deploy

### Opção 1: Push Automático (Recomendado)

Se o seu repositório está conectado ao Netlify:

1. Commit das mudanças:
   ```bash
   git add .
   git commit -m "fix: configurar variáveis de ambiente e corrigir imports"
   git push origin main
   ```

2. O Netlify detectará automaticamente e iniciará o build

3. Aguarde 2-3 minutos

4. Acesse: https://com.rich

### Opção 2: Deploy Manual via Netlify CLI

```bash
# Instalar Netlify CLI (se necessário)
npm install -g netlify-cli

# Fazer login
netlify login

# Deploy para produção
netlify deploy --prod
```

### Opção 3: Deploy Manual via Dashboard

1. Acesse: https://app.netlify.com
2. Clique no site **com.rich**
3. Vá em: **Deploys**
4. Arraste a pasta `dist` para fazer upload
5. OU clique em **Trigger deploy** → **Deploy site**

---

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

### 1. Site Carrega Corretamente
- Acesse: https://com.rich
- O site deve carregar a página inicial

### 2. Sem Erros no Console
- Pressione F12 (DevTools)
- Aba Console não deve mostrar erros críticos
- ✅ Se ver as mensagens de setup do Supabase, é porque as variáveis estão corretas

### 3. Funcionalidades Básicas
- ✅ Menu de navegação funciona
- ✅ Imagens carregam (logo, background)
- ✅ Links funcionam
- ✅ Login/Registro acessíveis

---

## 🔍 Troubleshooting

### Site Ainda em Branco?

1. **Limpe o Cache do Navegador:**
   - Chrome: Ctrl + Shift + Delete
   - Firefox: Ctrl + Shift + Delete
   - Safari: Cmd + Option + E

2. **Verifique o Console do Navegador (F12):**
   - Procure por erros em vermelho
   - Anote a mensagem exata do erro

3. **Verifique o Build Log no Netlify:**
   - Dashboard → Deploys → Clique no último deploy
   - Role até "Deploy log"
   - Procure por erros (linhas em vermelho)

4. **Verifique as Variáveis:**
   - Dashboard → Site Settings → Environment Variables
   - As variáveis devem aparecer listadas (se configuradas manualmente)
   - OU serão lidas automaticamente do `netlify.toml`

### Erros Comuns

#### "Missing Supabase environment variables"
**Causa:** Variáveis não foram aplicadas no build
**Solução:**
- Fazer novo deploy (as variáveis estão no netlify.toml agora)
- OU configurar manualmente no Netlify Dashboard

#### "Failed to fetch"
**Causa:** Problema de conexão com Supabase
**Solução:**
- Verificar se o Supabase está online: https://status.supabase.com
- Verificar se a URL está correta

#### Página 404
**Causa:** Redirects não configurados
**Solução:**
- Verificar se o `netlify.toml` foi deployado
- Verificar se a pasta `dist` foi gerada corretamente

---

## 📋 Checklist Final

Antes de considerar o deploy completo:

- [ ] Build local funciona: `npm run build`
- [ ] Dist contém arquivos: `ls -la dist/`
- [ ] Variáveis no netlify.toml estão corretas
- [ ] Commit feito e pushed para o repositório
- [ ] Deploy iniciou no Netlify
- [ ] Build log não mostra erros
- [ ] Site acessível em https://com.rich
- [ ] Console do navegador sem erros críticos
- [ ] Login/Registro funcionando
- [ ] Imagens carregando corretamente

---

## 🆘 Suporte

Se após seguir todos os passos o site continuar em branco:

1. Tire screenshots do:
   - Console do navegador (F12)
   - Build log no Netlify
   - Environment Variables no Netlify

2. Verifique os arquivos:
   - `netlify.toml` - Variáveis configuradas?
   - `dist/index.html` - Arquivo existe?
   - `dist/assets/` - Contém arquivos JS e CSS?

3. Teste localmente:
   ```bash
   npm run build
   npx serve dist
   ```
   Se funcionar localmente, o problema é no Netlify.

---

## 📝 Notas Importantes

- As variáveis no `netlify.toml` são **públicas** e aparecerão no código compilado
- A `ANON_KEY` é segura para exposição (protegida por RLS no Supabase)
- NUNCA exponha a `SERVICE_ROLE_KEY` no frontend
- O build pode demorar 2-3 minutos
- Cache do Netlify pode causar delays - limpe se necessário
