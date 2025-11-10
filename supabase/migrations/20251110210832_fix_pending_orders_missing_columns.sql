/*
  # Corrigir colunas faltando em pending_orders

  ## Problema
  A tabela pending_orders está faltando colunas necessárias para o registro de domínios admin:
  - payment_method
  - plan_code
  - total_cents

  ## Solução
  Adicionar as colunas necessárias com valores padrão apropriados
*/

-- Add payment_method column
ALTER TABLE pending_orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'paypal';

-- Add plan_code column
ALTER TABLE pending_orders 
ADD COLUMN IF NOT EXISTS plan_code text;

-- Add total_cents column
ALTER TABLE pending_orders 
ADD COLUMN IF NOT EXISTS total_cents integer DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_orders_payment_method ON pending_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_pending_orders_plan_code ON pending_orders(plan_code);