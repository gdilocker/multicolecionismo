/*
  # Conversão de USD para BRL em todo o sistema

  1. Alterações de Schema
    - Renomeia colunas `*_usd` para `*_brl` em todas as tabelas
    - Atualiza valores de preços (multiplicando por ~5.0 para conversão USD→BRL)

  2. Tabelas Afetadas
    - subscription_plans (monthly_price_usd → monthly_price_brl)
    - premium_domains (price_usd → price_brl)
    - store_products (price → mantém, mas valores atualizados)
    - pending_orders (amount_usd → amount_brl)
    - orders (amount_usd → amount_brl)

  3. Conversão de Valores
    - Taxa de conversão: 1 USD = 5.00 BRL (aproximado)
    - Arredondamento para valores inteiros

  4. Segurança
    - Mantém todas as políticas RLS existentes
    - Sem impacto em dados de usuários
*/

-- =====================================================
-- 1. SUBSCRIPTION_PLANS: Renomear coluna e atualizar valores
-- =====================================================

-- Adicionar nova coluna em BRL
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS monthly_price_brl INTEGER;

-- Converter valores USD para BRL (multiplicar por 5)
UPDATE subscription_plans
SET monthly_price_brl = CASE
  WHEN monthly_price_usd IS NOT NULL THEN monthly_price_usd * 5
  ELSE NULL
END;

-- Remover coluna antiga USD
ALTER TABLE subscription_plans
DROP COLUMN IF EXISTS monthly_price_usd;

-- Atualizar valores específicos dos planos (em centavos de BRL)
UPDATE subscription_plans SET monthly_price_brl = 25000 WHERE slug = 'prime';     -- R$ 250/mês
UPDATE subscription_plans SET monthly_price_brl = 35000 WHERE slug = 'elite';     -- R$ 350/mês
UPDATE subscription_plans SET monthly_price_brl = NULL WHERE slug = 'supreme';    -- By Request
UPDATE subscription_plans SET monthly_price_brl = 0 WHERE slug = 'starter';       -- Grátis

-- =====================================================
-- 2. PREMIUM_DOMAINS: Renomear coluna e atualizar valores
-- =====================================================

-- Adicionar nova coluna em BRL
ALTER TABLE premium_domains
ADD COLUMN IF NOT EXISTS price_brl INTEGER;

-- Converter valores USD para BRL (multiplicar por 5)
UPDATE premium_domains
SET price_brl = CASE
  WHEN price_usd IS NOT NULL THEN price_usd * 5
  ELSE NULL
END;

-- Remover coluna antiga USD
ALTER TABLE premium_domains
DROP COLUMN IF EXISTS price_usd;

-- =====================================================
-- 3. STORE_PRODUCTS: Atualizar valores para BRL
-- =====================================================

-- Produtos da loja já usam campo 'price' genérico
-- Apenas multiplicar por 5 para converter USD→BRL
UPDATE store_products
SET price = price * 5
WHERE price IS NOT NULL;

-- =====================================================
-- 4. PENDING_ORDERS: Renomear coluna
-- =====================================================

-- Adicionar nova coluna em BRL
ALTER TABLE pending_orders
ADD COLUMN IF NOT EXISTS amount_brl DECIMAL(10,2);

-- Converter valores USD para BRL
UPDATE pending_orders
SET amount_brl = CASE
  WHEN amount_usd IS NOT NULL THEN amount_usd * 5
  ELSE NULL
END;

-- Remover coluna antiga USD
ALTER TABLE pending_orders
DROP COLUMN IF EXISTS amount_usd;

-- =====================================================
-- 5. ORDERS: Renomear coluna
-- =====================================================

-- Adicionar nova coluna em BRL
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS amount_brl DECIMAL(10,2);

-- Converter valores USD para BRL
UPDATE orders
SET amount_brl = CASE
  WHEN amount_usd IS NOT NULL THEN amount_usd * 5
  ELSE NULL
END;

-- Remover coluna antiga USD
ALTER TABLE orders
DROP COLUMN IF EXISTS amount_usd;

-- =====================================================
-- 6. Comentários e Documentação
-- =====================================================

COMMENT ON COLUMN subscription_plans.monthly_price_brl IS 'Preço mensal em centavos de BRL (ex: 25000 = R$ 250,00)';
COMMENT ON COLUMN premium_domains.price_brl IS 'Preço do domínio premium em centavos de BRL';
COMMENT ON COLUMN pending_orders.amount_brl IS 'Valor do pedido em BRL';
COMMENT ON COLUMN orders.amount_brl IS 'Valor do pedido em BRL';
