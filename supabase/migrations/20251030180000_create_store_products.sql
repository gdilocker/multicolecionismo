/*
  # Sistema de Loja de Produtos

  1. Nova Tabela
    - `store_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, título do produto)
      - `description` (text, descrição do produto)
      - `price` (numeric, preço do produto)
      - `currency` (text, moeda - default 'BRL')
      - `image_url` (text, URL da imagem do produto)
      - `purchase_link` (text, link externo para pagamento)
      - `status` (text, 'draft' ou 'published')
      - `position` (integer, ordem de exibição)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Enable RLS on `store_products` table
    - Add policies for authenticated users to manage their own products
    - Add policies for public read access to published products

  3. Índices
    - Índice em user_id para queries rápidas
    - Índice em status para filtrar produtos publicados
    - Índice em position para ordenação
*/

-- Create store_products table
CREATE TABLE IF NOT EXISTS store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  image_url text,
  purchase_link text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_products_user_id ON store_products(user_id);
CREATE INDEX IF NOT EXISTS idx_store_products_status ON store_products(status);
CREATE INDEX IF NOT EXISTS idx_store_products_position ON store_products(user_id, position);

-- Enable RLS
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own products
CREATE POLICY "Users can view own products"
  ON store_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Public can view published products
CREATE POLICY "Public can view published products"
  ON store_products
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Policy: Users can insert their own products
CREATE POLICY "Users can insert own products"
  ON store_products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own products
CREATE POLICY "Users can update own products"
  ON store_products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own products
CREATE POLICY "Users can delete own products"
  ON store_products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_store_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION update_store_products_updated_at();
