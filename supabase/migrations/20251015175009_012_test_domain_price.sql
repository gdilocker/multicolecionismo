/*
  # Atualizar Preço de Domínio para Testes
  
  1. Mudanças
    - Domínio .email: $29.99 → $2.00 (para testes em produção)
  
  2. Motivo
    - Permitir testes reais de compra de domínio com valor baixo
*/

UPDATE pricing_plans
SET price_cents = 200
WHERE code = 'domain-email' AND product_type = 'domain';
