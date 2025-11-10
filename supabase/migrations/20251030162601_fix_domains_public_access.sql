/*
  # Permitir acesso público aos domínios para exibição

  1. Mudanças de Segurança
    - Adicionar policy para permitir que visitantes não-logados (anon) possam VER domínios
    - Isso é necessário para exibir o domínio próprio no perfil público
    - Mantém todas as outras operações (INSERT, UPDATE, DELETE) apenas para autenticados
*/

-- Adicionar policy para leitura pública de domínios
CREATE POLICY "Anyone can view domains"
  ON domains
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Remover a policy antiga que só permitia para authenticated
DROP POLICY IF EXISTS "Users and admins can read domains" ON domains;
