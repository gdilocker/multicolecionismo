# Configurar Variáveis de Ambiente no Netlify

## ⚠️ IMPORTANTE: Site em branco? Faltam variáveis de ambiente!

Se o site publicado está em branco com erro "Missing Supabase environment variables", siga estes passos:

## Passo a Passo

### 1. Acesse o Netlify Dashboard
- Faça login em: https://app.netlify.com
- Clique no site: **com.rich**

### 2. Configure as Variáveis de Ambiente
- Vá em: **Site Settings** → **Environment Variables**
- Clique em: **Add a variable** (ou **Edit variables**)

### 3. Adicione as Variáveis

Adicione EXATAMENTE estas variáveis:

#### VITE_SUPABASE_URL
```
VITE_SUPABASE_URL
```
**Valor:**
```
https://libzvdbgixckggmivspg.supabase.co
```

#### VITE_SUPABASE_ANON_KEY
```
VITE_SUPABASE_ANON_KEY
```
**Valor:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnp2ZGJnaXhja2dnbWl2c3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDI2OTMsImV4cCI6MjA3NjQ3ODY5M30.I4uFHXFXk23skBUm97HKxDhozDecUMrDefc3YBoy4_U
```

#### VITE_DEV_MODE (Opcional)
```
VITE_DEV_MODE
```
**Valor:**
```
false
```

### 4. Escolha o Escopo

Para cada variável, selecione:
- ✅ **Production** (obrigatório)
- ✅ **Deploy previews** (opcional, mas recomendado)
- ✅ **Branch deploys** (opcional)

### 5. Salvar e Fazer Redeploy

1. Clique em **Save**
2. Vá em: **Deploys** → **Trigger deploy** → **Deploy site**
3. Aguarde o deploy terminar (1-2 minutos)
4. Acesse: https://com.rich

## ✅ Verificação

Após o deploy, o site deve carregar normalmente. Se continuar em branco:

1. Abra o Console do navegador (F12)
2. Verifique se há erros
3. Confirme que as variáveis foram salvas corretamente no Netlify

## 🔐 Segurança

**IMPORTANTE:** As chaves acima são:
- ✅ **ANON_KEY** - Segura para uso público (já está no código frontend)
- ❌ **SERVICE_ROLE_KEY** - NUNCA exponha esta chave!

A `ANON_KEY` é segura porque:
- Respeita as políticas RLS (Row Level Security) do Supabase
- Só permite operações autorizadas
- É protegida pelo backend

## 📱 Interface do Netlify

```
┌─────────────────────────────────────────────────┐
│ Site Settings                                    │
├─────────────────────────────────────────────────┤
│ ► General                                       │
│ ► Build & deploy                                │
│ ► Domain management                             │
│ ► Environment variables    ← CLIQUE AQUI       │
│ ► Functions                                     │
│ ► Identity                                      │
│ ► Forms                                         │
└─────────────────────────────────────────────────┘
```

Depois clique em **"Add a variable"**:

```
┌─────────────────────────────────────────────────┐
│ Add environment variable                         │
├─────────────────────────────────────────────────┤
│ Key: VITE_SUPABASE_URL                          │
│                                                  │
│ Value: https://libzvdbgixckggmivspg.supabase.co│
│                                                  │
│ Scopes:                                         │
│ ☑ Production                                    │
│ ☑ Deploy previews                               │
│ ☑ Branch deploys                                │
│                                                  │
│           [Cancel]  [Add variable]              │
└─────────────────────────────────────────────────┘
```

## 🚀 Pronto!

Após configurar e fazer redeploy, seu site estará funcionando em:
- https://com.rich
- https://www.com.rich (redirecionado)
