/*
  # Adicionar Tabela de Eventos de Webhook para Idempotência

  1. Nova Tabela
    - `webhook_events` - Rastreia eventos de webhook processados

  2. Propósito
    - Prevenir processamento duplicado de webhooks
    - PayPal e Dynadot podem enviar eventos múltiplas vezes
    - Usar external_id + provider como chave única

  3. Segurança
    - Enable RLS
    - Apenas edge functions podem inserir/ler (service role)
*/

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('paypal', 'dynadot', 'stripe')),
  external_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider, external_id)
);

-- Index para lookups rápidos
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_external
  ON webhook_events(provider, external_id);

-- Index para cleanup de eventos antigos
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
  ON webhook_events(created_at);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode acessar
CREATE POLICY "Service role can manage webhook events"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
