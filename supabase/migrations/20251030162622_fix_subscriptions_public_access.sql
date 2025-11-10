/*
  # Permitir acesso público às assinaturas para exibição de badges

  1. Mudanças de Segurança
    - Adicionar policy para permitir que visitantes não-logados (anon) possam VER assinaturas
    - Isso é necessário para exibir o selo Elite Member no perfil público
    - Mantém todas as outras operações (INSERT, UPDATE, DELETE) apenas para autenticados ou donos
*/

-- Adicionar policy para leitura pública de assinaturas
CREATE POLICY "Anyone can view subscriptions for badges"
  ON subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (true);
