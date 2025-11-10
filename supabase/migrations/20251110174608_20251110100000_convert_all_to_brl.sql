/*
  # Conversão Completa de USD para BRL

  1. Changes
    - Multiplica todos os valores em centavos por 5 (USD → BRL)
    - Atualiza subscription_plans
    - Atualiza orders
    - Atualiza invoices
    - Atualiza pending_orders
    - Atualiza affiliate_links

  2. Conversão
    - Taxa: 1 USD = 5 BRL
    - Todos os valores já estão em centavos, apenas multiplicar por 5
*/

-- ==========================================
-- SUBSCRIPTION_PLANS: Converter preços
-- ==========================================
UPDATE subscription_plans
SET 
  price_monthly_cents = price_monthly_cents * 5,
  price_yearly_cents = price_yearly_cents * 5
WHERE price_monthly_cents > 0 OR price_yearly_cents > 0;

-- ==========================================
-- ORDERS: Converter valores
-- ==========================================
UPDATE orders
SET total_cents = total_cents * 5
WHERE total_cents > 0;

-- ==========================================
-- INVOICES: Converter valores
-- ==========================================
UPDATE invoices
SET amount_cents = amount_cents * 5
WHERE amount_cents > 0;

-- ==========================================
-- PENDING_ORDERS: Converter valores
-- ==========================================
UPDATE pending_orders
SET amount = amount * 5
WHERE amount > 0;

-- ==========================================
-- AFFILIATE_LINKS: Converter comissões
-- ==========================================
UPDATE affiliate_links
SET total_commission_cents = total_commission_cents * 5
WHERE total_commission_cents > 0;
