/*
  # Hide Protected Brand Domains from Public Gallery

  1. Purpose
    - Create a special "protected_brand" category for high-profile brands
    - Move Tesla, Ferrari, and other famous brands to this hidden category
    - These domains will ONLY be visible to admins
    - Public users will NOT see these in the marketplace/gallery

  2. Changes
    - Add new category "protected_brand" (hidden from public)
    - Update Tesla and Ferrari to use this category
    - Add more protected brands (Apple, Google, Amazon, Microsoft, etc.)

  3. Security
    - Only admins can see domains with category = 'protected_brand'
    - These domains require special approval and Supreme plan
*/

-- Update existing Tesla and Ferrari to protected_brand category
UPDATE premium_domains
SET
  category = 'protected_brand',
  is_protected_brand = true,
  plan_required = 'supreme',
  requires_approval = true,
  show_price = false
WHERE fqdn IN ('tesla.com.rich', 'ferrari.com.rich');

-- Add more protected brands (major global corporations)
INSERT INTO premium_domains (fqdn, category, price_usd, status, description, is_featured, show_price, plan_required, requires_approval, is_protected_brand) VALUES
-- Technology Giants
('apple.com.rich', 'protected_brand', NULL, 'available', 'Apple Inc. - Technology and innovation leader', true, false, 'supreme', true, true),
('google.com.rich', 'protected_brand', NULL, 'available', 'Google/Alphabet - Search and cloud technology giant', true, false, 'supreme', true, true),
('microsoft.com.rich', 'protected_brand', NULL, 'available', 'Microsoft Corporation - Software and cloud services leader', true, false, 'supreme', true, true),
('amazon.com.rich', 'protected_brand', NULL, 'available', 'Amazon - E-commerce and cloud computing giant', true, false, 'supreme', true, true),
('meta.com.rich', 'protected_brand', NULL, 'available', 'Meta Platforms - Social media and metaverse leader', true, false, 'supreme', true, true),
('facebook.com.rich', 'protected_brand', NULL, 'available', 'Facebook - World''s largest social network', true, false, 'supreme', true, true),
('netflix.com.rich', 'protected_brand', NULL, 'available', 'Netflix - Global streaming entertainment leader', true, false, 'supreme', true, true),
('spotify.com.rich', 'protected_brand', NULL, 'available', 'Spotify - Music streaming platform', true, false, 'supreme', true, true),
('uber.com.rich', 'protected_brand', NULL, 'available', 'Uber - Ride-sharing and delivery platform', true, false, 'supreme', true, true),
('airbnb.com.rich', 'protected_brand', NULL, 'available', 'Airbnb - Home sharing marketplace', true, false, 'supreme', true, true),

-- Luxury Automotive
('lamborghini.com.rich', 'protected_brand', NULL, 'available', 'Lamborghini - Italian luxury sports cars', true, false, 'supreme', true, true),
('porsche.com.rich', 'protected_brand', NULL, 'available', 'Porsche - Premium German automotive brand', true, false, 'supreme', true, true),
('bmw.com.rich', 'protected_brand', NULL, 'available', 'BMW - Bavarian Motor Works luxury vehicles', true, false, 'supreme', true, true),
('mercedes.com.rich', 'protected_brand', NULL, 'available', 'Mercedes-Benz - Luxury automotive excellence', true, false, 'supreme', true, true),
('bentley.com.rich', 'protected_brand', NULL, 'available', 'Bentley - British luxury motor cars', true, false, 'supreme', true, true),
('rollsroyce.com.rich', 'protected_brand', NULL, 'available', 'Rolls-Royce - Ultimate luxury automobiles', true, false, 'supreme', true, true),
('maserati.com.rich', 'protected_brand', NULL, 'available', 'Maserati - Italian luxury and performance', true, false, 'supreme', true, true),
('bugatti.com.rich', 'protected_brand', NULL, 'available', 'Bugatti - Ultra-luxury hypercars', true, false, 'supreme', true, true),

-- Luxury Fashion & Lifestyle
('gucci.com.rich', 'protected_brand', NULL, 'available', 'Gucci - Iconic Italian luxury fashion', true, false, 'supreme', true, true),
('chanel.com.rich', 'protected_brand', NULL, 'available', 'Chanel - French haute couture and perfume', true, false, 'supreme', true, true),
('louisvuitton.com.rich', 'protected_brand', NULL, 'available', 'Louis Vuitton - Premier luxury fashion house', true, false, 'supreme', true, true),
('hermes.com.rich', 'protected_brand', NULL, 'available', 'Hermès - French luxury goods manufacturer', true, false, 'supreme', true, true),
('prada.com.rich', 'protected_brand', NULL, 'available', 'Prada - Italian luxury fashion brand', true, false, 'supreme', true, true),
('dior.com.rich', 'protected_brand', NULL, 'available', 'Dior - French luxury fashion house', true, false, 'supreme', true, true),
('versace.com.rich', 'protected_brand', NULL, 'available', 'Versace - Italian luxury fashion design', true, false, 'supreme', true, true),
('armani.com.rich', 'protected_brand', NULL, 'available', 'Giorgio Armani - Italian luxury fashion', true, false, 'supreme', true, true),
('burberry.com.rich', 'protected_brand', NULL, 'available', 'Burberry - British luxury fashion brand', true, false, 'supreme', true, true),
('cartier.com.rich', 'protected_brand', NULL, 'available', 'Cartier - Premier jewelry and watchmaker', true, false, 'supreme', true, true),
('rolex.com.rich', 'protected_brand', NULL, 'available', 'Rolex - Swiss luxury watch manufacturer', true, false, 'supreme', true, true),
('tiffany.com.rich', 'protected_brand', NULL, 'available', 'Tiffany & Co. - American luxury jewelry', true, false, 'supreme', true, true),

-- Financial Institutions
('goldmansachs.com.rich', 'protected_brand', NULL, 'available', 'Goldman Sachs - Global investment banking', true, false, 'supreme', true, true),
('jpmorgan.com.rich', 'protected_brand', NULL, 'available', 'JPMorgan Chase - Leading financial institution', true, false, 'supreme', true, true),
('morganstanley.com.rich', 'protected_brand', NULL, 'available', 'Morgan Stanley - Investment banking and wealth management', true, false, 'supreme', true, true),
('blackrock.com.rich', 'protected_brand', NULL, 'available', 'BlackRock - World''s largest asset manager', true, false, 'supreme', true, true),
('visa.com.rich', 'protected_brand', NULL, 'available', 'Visa - Global payments technology', true, false, 'supreme', true, true),
('mastercard.com.rich', 'protected_brand', NULL, 'available', 'Mastercard - Worldwide payment solutions', true, false, 'supreme', true, true),
('paypal.com.rich', 'protected_brand', NULL, 'available', 'PayPal - Digital payments platform', true, false, 'supreme', true, true),
('americanexpress.com.rich', 'protected_brand', NULL, 'available', 'American Express - Financial services corporation', true, false, 'supreme', true, true),

-- Hospitality & Travel
('marriott.com.rich', 'protected_brand', NULL, 'available', 'Marriott - Global hotel chain', true, false, 'supreme', true, true),
('hilton.com.rich', 'protected_brand', NULL, 'available', 'Hilton - Worldwide hospitality company', true, false, 'supreme', true, true),
('hyatt.com.rich', 'protected_brand', NULL, 'available', 'Hyatt - Luxury hotel brand', true, false, 'supreme', true, true),
('fourseasons.com.rich', 'protected_brand', NULL, 'available', 'Four Seasons - Ultra-luxury hotels and resorts', true, false, 'supreme', true, true),
('ritzcarlton.com.rich', 'protected_brand', NULL, 'available', 'Ritz-Carlton - Luxury hotel company', true, false, 'supreme', true, true),

-- Food & Beverage
('cocacola.com.rich', 'protected_brand', NULL, 'available', 'Coca-Cola - World''s largest beverage company', true, false, 'supreme', true, true),
('pepsi.com.rich', 'protected_brand', NULL, 'available', 'PepsiCo - Global food and beverage leader', true, false, 'supreme', true, true),
('starbucks.com.rich', 'protected_brand', NULL, 'available', 'Starbucks - Premier coffeehouse chain', true, false, 'supreme', true, true),
('mcdonalds.com.rich', 'protected_brand', NULL, 'available', 'McDonald''s - World''s largest restaurant chain', true, false, 'supreme', true, true),

-- Sports & Athletic
('nike.com.rich', 'protected_brand', NULL, 'available', 'Nike - Global athletic footwear and apparel', true, false, 'supreme', true, true),
('adidas.com.rich', 'protected_brand', NULL, 'available', 'Adidas - International sportswear corporation', true, false, 'supreme', true, true),
('puma.com.rich', 'protected_brand', NULL, 'available', 'Puma - Athletic and casual footwear', true, false, 'supreme', true, true),

-- Retail
('walmart.com.rich', 'protected_brand', NULL, 'available', 'Walmart - World''s largest retailer', true, false, 'supreme', true, true),
('target.com.rich', 'protected_brand', NULL, 'available', 'Target - Major American retail corporation', true, false, 'supreme', true, true),
('ikea.com.rich', 'protected_brand', NULL, 'available', 'IKEA - Swedish furniture and home goods', true, false, 'supreme', true, true)

ON CONFLICT (fqdn) DO UPDATE SET
  category = EXCLUDED.category,
  is_protected_brand = EXCLUDED.is_protected_brand,
  plan_required = EXCLUDED.plan_required,
  requires_approval = EXCLUDED.requires_approval,
  show_price = EXCLUDED.show_price;

-- Add these brands to protected_brands table as well
INSERT INTO protected_brands (domain_name, brand_display_name, description, access_password, is_active)
VALUES
  ('apple', 'Apple', 'Apple Inc. - Technology and innovation leader', 'Leif1975..', true),
  ('google', 'Google', 'Google/Alphabet - Search and cloud technology giant', 'Leif1975..', true),
  ('microsoft', 'Microsoft', 'Microsoft Corporation - Software and cloud services', 'Leif1975..', true),
  ('amazon', 'Amazon', 'Amazon - E-commerce and cloud computing giant', 'Leif1975..', true),
  ('meta', 'Meta', 'Meta Platforms - Social media and metaverse', 'Leif1975..', true),
  ('facebook', 'Facebook', 'Facebook - World''s largest social network', 'Leif1975..', true),
  ('lamborghini', 'Lamborghini', 'Lamborghini - Italian luxury sports cars', 'Leif1975..', true),
  ('porsche', 'Porsche', 'Porsche - Premium German automotive brand', 'Leif1975..', true),
  ('bmw', 'BMW', 'BMW - Bavarian Motor Works', 'Leif1975..', true),
  ('mercedes', 'Mercedes-Benz', 'Mercedes-Benz - Luxury automotive excellence', 'Leif1975..', true),
  ('gucci', 'Gucci', 'Gucci - Iconic Italian luxury fashion', 'Leif1975..', true),
  ('chanel', 'Chanel', 'Chanel - French haute couture', 'Leif1975..', true),
  ('louisvuitton', 'Louis Vuitton', 'Louis Vuitton - Premier luxury fashion', 'Leif1975..', true),
  ('rolex', 'Rolex', 'Rolex - Swiss luxury watches', 'Leif1975..', true),
  ('nike', 'Nike', 'Nike - Global athletic brand', 'Leif1975..', true),
  ('cocacola', 'Coca-Cola', 'Coca-Cola - Beverage leader', 'Leif1975..', true),
  ('starbucks', 'Starbucks', 'Starbucks - Premier coffeehouse', 'Leif1975..', true)
ON CONFLICT (domain_name) DO NOTHING;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_premium_domains_category_protected ON premium_domains(category) WHERE category = 'protected_brand';
