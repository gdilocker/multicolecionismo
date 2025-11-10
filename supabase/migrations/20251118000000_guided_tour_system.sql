/*
  # Sistema de Tour Guiado Premium

  1. Nova Tabela
    - `user_tour_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência a auth.users)
      - `tour_type` (text: 'purchase' ou 'page_mastery')
      - `current_step` (integer)
      - `completed` (boolean)
      - `skipped` (boolean)
      - `last_seen_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `metadata` (jsonb - dados extras contextuais)

  2. Segurança
    - RLS habilitado
    - Políticas para usuários verem apenas seus próprios dados
    - Admins podem ver todos os dados para análise

  3. Índices
    - Índice em user_id para performance
    - Índice em tour_type para queries de análise
*/

-- Criar tabela de progresso do tour
CREATE TABLE IF NOT EXISTS user_tour_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tour_type text NOT NULL CHECK (tour_type IN ('purchase', 'page_mastery')),
  current_step integer DEFAULT 1,
  total_steps integer DEFAULT 6,
  completed boolean DEFAULT false,
  skipped boolean DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  started_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_user_id ON user_tour_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_tour_type ON user_tour_progress(tour_type);
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_completed ON user_tour_progress(completed);

-- Habilitar RLS
ALTER TABLE user_tour_progress ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver e gerenciar apenas seus próprios tours
CREATE POLICY "Usuários podem gerenciar seu próprio tour"
  ON user_tour_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: admins podem ver todos os tours para análise
CREATE POLICY "Admins podem ver todos os tours"
  ON user_tour_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_tour_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS set_tour_progress_timestamp ON user_tour_progress;
CREATE TRIGGER set_tour_progress_timestamp
  BEFORE UPDATE ON user_tour_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_progress_timestamp();

-- Função para obter progresso do tour
CREATE OR REPLACE FUNCTION get_tour_progress(p_user_id uuid, p_tour_type text)
RETURNS TABLE (
  current_step integer,
  total_steps integer,
  completed boolean,
  skipped boolean,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    utp.current_step,
    utp.total_steps,
    utp.completed,
    utp.skipped,
    utp.metadata
  FROM user_tour_progress utp
  WHERE utp.user_id = p_user_id
    AND utp.tour_type = p_tour_type
  ORDER BY utp.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar métrica de tour
CREATE OR REPLACE FUNCTION log_tour_metric(
  p_user_id uuid,
  p_tour_type text,
  p_action text,
  p_step integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_tour_progress (
    user_id,
    tour_type,
    current_step,
    metadata
  ) VALUES (
    p_user_id,
    p_tour_type,
    COALESCE(p_step, 1),
    jsonb_build_object(
      'action', p_action,
      'timestamp', now(),
      'extra', p_metadata
    )
  )
  ON CONFLICT (user_id, tour_type)
  DO UPDATE SET
    current_step = EXCLUDED.current_step,
    metadata = user_tour_progress.metadata || EXCLUDED.metadata,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar constraint unique para evitar duplicatas
ALTER TABLE user_tour_progress
  DROP CONSTRAINT IF EXISTS user_tour_progress_unique;

ALTER TABLE user_tour_progress
  ADD CONSTRAINT user_tour_progress_unique
  UNIQUE (user_id, tour_type);
