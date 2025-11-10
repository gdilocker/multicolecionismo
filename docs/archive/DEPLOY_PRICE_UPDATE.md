# Como Atualizar os Preços para $25/ano (Renovação $50/ano)

## Problema Identificado

O código no repositório já foi atualizado para $25/ano, mas o Supabase ainda está rodando a versão antiga da edge function com $15/ano.

## Solução: Re-deploy da Edge Function

Para aplicar a mudança de preço, você precisa re-deployar a edge function `domains` para o Supabase.

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login no Supabase
supabase login

# 3. Link com seu projeto
supabase link --project-ref seu-project-ref

# 4. Deploy da edge function atualizada
supabase functions deploy domains
```

### Opção 2: Via Supabase Dashboard (Manual)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Edge Functions** no menu lateral
4. Clique na função `domains`
5. Clique em **Deploy new version**
6. Cole o código atualizado de `/supabase/functions/domains/index.ts`
7. Clique em **Deploy**

### Opção 3: Usando a ferramenta de deploy do MCP

Se você tem acesso à ferramenta MCP do Supabase, pode usar:

```javascript
// Usar a ferramenta mcp__supabase__deploy_edge_function
// com o conteúdo atualizado de domains/index.ts
```

## Verificação

Após o deploy, teste a API para confirmar:

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/domains \
  -H "Authorization: Bearer sua-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "check", "fqdn": "teste.email"}'
```

A resposta deve mostrar:
```json
{
  "pricing": {
    "salePriceUSD": 25,
    "renewalSalePriceUSD": 50,
    "markupApplied": "fixed_standard_25"
  }
}
```

## Alterações Já Aplicadas no Código

✅ **Edge Function** (`/supabase/functions/domains/index.ts`):
- `STANDARD_PRICE_USD = 25.00`
- `STANDARD_RENEWAL_USD = 50.00`
- `markupApplied: "fixed_standard_25"`

✅ **Frontend** (`src/pages/Checkout.tsx`):
- Preços padrão: $25.00

✅ **Migration SQL**:
- `20251019200000_024_update_domain_pricing_25usd.sql`

## Ambiente de Desenvolvimento (bolt.new)

**Nota importante**: No ambiente bolt.new, as edge functions do Supabase são executadas no servidor remoto do Supabase, não localmente. Por isso, mesmo que o código esteja atualizado no repositório, você precisa fazer o deploy para o Supabase para ver as mudanças.

## Alternativa Temporária para Testes

Se você quiser testar localmente antes do deploy, pode:

1. Usar o Supabase CLI para rodar as functions localmente:
```bash
supabase start
supabase functions serve domains
```

2. Atualizar a variável de ambiente para apontar para o local:
```env
VITE_SUPABASE_URL=http://localhost:54321
```

## Resumo

**O código está correto**, mas a edge function precisa ser re-deployada no Supabase para que as mudanças tenham efeito no ambiente de produção/staging.
