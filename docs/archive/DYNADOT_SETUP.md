# Configuração da API Dynadot

## Passos para Configurar

O sistema **REQUER** credenciais da API Dynadot para funcionar corretamente. Sem essas credenciais, a verificação de disponibilidade de domínios **NÃO funcionará**.

### 1. Obter API Key da Dynadot

1. Acesse https://www.dynadot.com/account/domain/setting/api.html
2. Clique em "Add API Settings" ou use uma API Key existente
3. Copie sua API Key (uma string longa como: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
4. **IMPORTANTE**: Usamos a **API3** (formato JSON), não a RESTful API

### 2. Configurar no Supabase

A API Key deve ser configurada como **secret** no Supabase:

```bash
# Via Supabase CLI
supabase secrets set DYNADOT_API_KEY="sua_api_key_aqui"
```

Ou via Dashboard do Supabase:
1. Acesse seu projeto no Supabase Dashboard
2. Vá em **Settings** > **Edge Functions** > **Secrets**
3. Adicione o secret:
   - Nome: `DYNADOT_API_KEY`
   - Valor: sua API key da Dynadot

**NOTA**: Não é necessário configurar `DYNADOT_API_SECRET` ou `DYNADOT_API_URL` para a API3.

### 3. Verificar Funcionamento

Após configurar, teste a verificação de disponibilidade. Você pode testar diretamente no seu site (https://registro.email) buscando por qualquer domínio.

**Exemplo de resposta da API quando está funcionando:**

Domínio disponível:
```json
{
  "available": true,
  "price": "29.99",
  "isPremium": false
}
```

Domínio indisponível (já registrado):
```json
{
  "available": false
}
```

Domínio premium:
```json
{
  "available": true,
  "price": "499.99",
  "isPremium": true
}
```

## O que Mudou

### Antes (Sistema Mock)
- ❌ Usava lista hardcoded de domínios indisponíveis
- ❌ Não verificava disponibilidade real
- ❌ Não detectava domínios premium
- ❌ Preços fixos em $29.99

### Agora (Sistema Real)
- ✅ **Sempre** consulta API Dynadot
- ✅ Verifica disponibilidade real em tempo real
- ✅ Detecta domínios premium com badge visual
- ✅ Mostra preços reais da Dynadot
- ✅ Retorna erros claros se API não estiver configurada
- ✅ Logs detalhados para debugging

## Tratamento de Erros

O sistema agora trata diversos cenários:

1. **Credenciais não configuradas**
   ```json
   {
     "available": false,
     "error": "Domain availability service is not configured. Please contact support."
   }
   ```

2. **Erro HTTP da API**
   ```json
   {
     "available": false,
     "error": "Domain availability check failed (HTTP 401). Please try again later."
   }
   ```

3. **Domínio indisponível**
   ```json
   {
     "available": false
   }
   ```

4. **Domínio disponível (normal)**
   ```json
   {
     "available": true,
     "price": "29.99",
     "isPremium": false
   }
   ```

5. **Domínio disponível (premium)**
   ```json
   {
     "available": true,
     "price": "499.99",
     "isPremium": true
   }
   ```

## Interface do Usuário

O frontend agora mostra:
- ✅ Badge "PREMIUM" com ícone de coroa para domínios premium
- ✅ Card de erro visual quando há falha na verificação
- ✅ Botão "Tentar Novamente" em caso de erro
- ✅ Mensagens claras sobre o status do domínio
