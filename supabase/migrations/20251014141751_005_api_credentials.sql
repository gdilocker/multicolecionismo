/*
  # API Credentials Storage

  1. New Tables
    - `api_credentials`
      - `id` (uuid, primary key, references auth.users)
      - `dynadot_api_key` (text, encrypted)
      - `dynadot_api_secret` (text, encrypted)
      - `cloudflare_api_token` (text, encrypted)
      - `cloudflare_zone_id` (text)
      - `paypal_client_id` (text, encrypted)
      - `paypal_secret` (text, encrypted)
      - `mailcow_api_key` (text, encrypted)
      - `mailcow_api_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_credentials` table
    - Only authenticated users can read/update their own credentials
    - Admin users can read all credentials

  3. Notes
    - Sensitive fields should be encrypted at application level before storage
    - Optional fields allow partial configuration
    - Single row per user (upsert pattern)
*/

CREATE TABLE IF NOT EXISTS api_credentials (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dynadot_api_key text,
  dynadot_api_secret text,
  cloudflare_api_token text,
  cloudflare_zone_id text,
  paypal_client_id text,
  paypal_secret text,
  mailcow_api_key text,
  mailcow_api_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own API credentials"
  ON api_credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own API credentials"
  ON api_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own API credentials"
  ON api_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all API credentials"
  ON api_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = auth.uid()
      AND customers.role = 'admin'
    )
  );