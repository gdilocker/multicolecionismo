# Guia do Marketplace de Domínios

## Resumo dos Dados Reais

### Usuário Melissa (memanhaes4@gmail.com)
A Melissa possui **2 domínios registrados**:

1. **cooperativa.email**
   - Registrado em: 16/10/2025 às 02:33
   - Valor pago: R$ 2,00
   - Status: Ativo
   - Expira em: 16/10/2026

2. **petrobras.email**
   - Registrado em: 16/10/2025 às 16:41
   - Valor pago: R$ 2,00
   - Status: Ativo
   - Expira em: 16/10/2026

---

## Como Funciona o Marketplace

### 1. Tabela `domain_suggestions`

Esta tabela armazena sugestões de domínios pré-selecionados para venda no marketplace.

**Campos principais:**
- `domain_name`: Nome do domínio SEM a extensão .email (ex: "melissa", "joao")
- `category`: Categoria do domínio (names, business, professional, tech, creative, general)
- `price_override`: Preço personalizado (se null, usa o preço padrão de R$ 29.99)
- `status`: Status do domínio
  - `available`: Disponível para compra
  - `sold`: Já foi vendido
  - `reserved`: Reservado temporariamente
- `is_premium`: Se true, destaca o domínio como premium
- `popularity_score`: Pontuação de 0-100 para ordenação (maior = mais popular)

### 2. Domínios Adicionados ao Marketplace

Atualmente existem **20 domínios de exemplo** no marketplace:

**Nomes (Premium - R$ 49.99):**
- melissa.email
- joao.email
- maria.email

**Negócios:**
- contato.email (Premium - R$ 39.99)
- vendas.email (Premium - R$ 39.99)
- suporte.email (R$ 34.99)
- info.email (R$ 29.99)

**Profissional:**
- ceo.email (Premium - R$ 59.99)
- advogado.email (Premium - R$ 44.99)
- contabilidade.email (R$ 29.99)

**Tecnologia:**
- tech.email (Premium - R$ 54.99)
- dev.email (Premium - R$ 44.99)
- api.email (R$ 39.99)
- cloud.email (R$ 34.99)

**Criativo:**
- design.email (Premium - R$ 39.99)
- arte.email (R$ 34.99)
- fotografia.email (R$ 29.99)
- musica.email (R$ 29.99)

**Geral:**
- casa.email (R$ 24.99)
- familia.email (R$ 24.99)

---

## Como Adicionar Novos Domínios ao Marketplace

### Método 1: Via SQL (Recomendado para Admin)

Como administrador, você pode adicionar domínios diretamente via SQL:

```sql
INSERT INTO domain_suggestions
  (domain_name, category, price_override, status, is_premium, popularity_score)
VALUES
  ('carlos', 'names', 49.99, 'available', true, 88),
  ('marketing', 'business', 39.99, 'available', true, 85),
  ('programador', 'tech', 44.99, 'available', true, 78);
```

### Método 2: Via Interface Admin (Futuro)

Será necessário criar uma página de administração onde você poderá:
1. Adicionar novos domínios manualmente
2. Importar listas de domínios via CSV
3. Editar preços e categorias
4. Marcar como vendido/disponível

**Local sugerido:** `/admin/marketplace` ou `/admin/suggestions`

### Método 3: Via API (Programático)

Você pode criar uma Edge Function para adicionar domínios:

```typescript
// supabase/functions/admin-add-suggestion/index.ts
const { data, error } = await supabase
  .from('domain_suggestions')
  .insert({
    domain_name: 'exemplo',
    category: 'business',
    price_override: 39.99,
    is_premium: true,
    popularity_score: 75,
    status: 'available'
  });
```

---

## Estrutura de Categorias

Use estas categorias ao adicionar domínios:

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| `names` | Nomes próprios | maria, joao, carlos |
| `business` | Negócios gerais | vendas, contato, info |
| `professional` | Profissões | advogado, medico, engenheiro |
| `tech` | Tecnologia | dev, api, cloud, app |
| `creative` | Criativo | design, arte, musica |
| `general` | Geral | casa, familia, vida |

---

## Fluxo de Compra

1. **Usuário acessa** `/marketplace`
2. **Filtra e busca** domínios disponíveis
3. **Clica em "Comprar"** em um domínio
4. **É redirecionado** para `/register` com o domínio pré-preenchido
5. **Completa o checkout** e o sistema:
   - Marca o domínio como `sold` na tabela `domain_suggestions`
   - Registra o domínio no registrador (Dynadot)
   - Adiciona à tabela `domains`
   - Cria o pedido na tabela `orders`

---

## Onde Está Implementado

### Frontend
- **Página principal:** `src/pages/Marketplace.tsx`
- **Componentes usados:**
  - Filtros por categoria
  - Busca por texto
  - Filtro de premium
  - Grid de domínios com preços e status

### Backend
- **Tabela do banco:** `domain_suggestions`
- **Migração:** `supabase/migrations/20251018000000_017_domain_suggestions.sql`
- **Políticas RLS:**
  - Qualquer pessoa pode VER domínios disponíveis
  - Apenas ADMINS podem criar/editar/deletar sugestões

### Rota de Acesso
```
https://registro.email/marketplace
```

---

## Próximos Passos Sugeridos

### 1. Criar Página Admin de Gerenciamento
Criar `/admin/marketplace` com:
- Lista de todos os domínios
- Botão "Adicionar Novo Domínio"
- Edição inline de preços
- Importação em massa via CSV
- Estatísticas de vendas

### 2. Sincronização Automática
Quando um domínio é vendido:
```typescript
// Marcar como vendido automaticamente
await supabase
  .from('domain_suggestions')
  .update({ status: 'sold' })
  .eq('domain_name', domainName);
```

### 3. Dashboard de Sugestões
- Total de sugestões
- Domínios vendidos vs disponíveis
- Receita gerada por categoria
- Domínios mais populares

---

## Exemplo de Uso

### Adicionar 10 domínios de uma vez:

```sql
INSERT INTO domain_suggestions (domain_name, category, price_override, is_premium, popularity_score) VALUES
  ('pedro', 'names', 49.99, true, 90),
  ('ana', 'names', 49.99, true, 87),
  ('juridico', 'professional', 44.99, true, 82),
  ('financeiro', 'business', 39.99, true, 79),
  ('ti', 'tech', 44.99, true, 76),
  ('web', 'tech', 39.99, false, 72),
  ('blog', 'creative', 29.99, false, 68),
  ('loja', 'business', 34.99, false, 65),
  ('servicos', 'business', 29.99, false, 62),
  ('portfolio', 'creative', 29.99, false, 58);
```

---

## Dúvidas Frequentes

### Como marcar um domínio como vendido?
```sql
UPDATE domain_suggestions
SET status = 'sold'
WHERE domain_name = 'melissa';
```

### Como alterar o preço de um domínio?
```sql
UPDATE domain_suggestions
SET price_override = 99.99, is_premium = true
WHERE domain_name = 'premium';
```

### Como remover um domínio do marketplace?
```sql
DELETE FROM domain_suggestions
WHERE domain_name = 'exemplo';
```

---

## Resumo Final

✅ **Dados reais adicionados:** Melissa possui 2 domínios registrados
✅ **Marketplace populado:** 20 domínios de exemplo adicionados
✅ **Tabela criada:** `domain_suggestions` com RLS ativado
✅ **Interface pronta:** Página `/marketplace` funcional
✅ **Filtros implementados:** Categoria, busca, premium

**Para adicionar domínios:** Use SQL direto no Supabase ou crie uma interface admin.
