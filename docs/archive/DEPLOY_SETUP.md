# Configuração de Deploy - Registro.email

## Problema Atual
O site não está abrindo porque faltam as variáveis de ambiente do Supabase configuradas na plataforma de hospedagem.

## Solução: Configurar Variáveis de Ambiente

### Se estiver usando Netlify:

1. Acesse o dashboard do Netlify: https://app.netlify.com
2. Selecione seu site
3. Vá em **Site settings** > **Environment variables** (ou **Build & deploy** > **Environment**)
4. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL = https://wnfuesmdcdsgplkvgdva.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZnVlc21kY2RzZ3Bsa3ZnZHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTA4MjEsImV4cCI6MjA3NTk2NjgyMX0._ttLUPs9LbJOKXUNrg4np6vEY-EyD4fTzZW7dMPdMyw
```

5. Salve e faça um **novo deploy** (Deploys > Trigger deploy > Deploy site)

### Se estiver usando Vercel:

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione as mesmas variáveis acima
5. Faça um redeploy

### Se estiver usando outra plataforma:

Procure por "Environment Variables" ou "Build Environment" nas configurações do projeto e adicione as variáveis acima.

## Após configurar:

1. ✅ Faça commit e push das alterações locais
2. ✅ Aguarde o rebuild automático OU
3. ✅ Force um novo deploy manualmente no painel
4. ✅ O site deve abrir normalmente!

## Verificação

Após o deploy, o site deve carregar sem erros. Se ainda houver problemas:
- Verifique se as variáveis foram salvas corretamente
- Verifique os logs de build para outros erros
- Limpe o cache e force um rebuild
