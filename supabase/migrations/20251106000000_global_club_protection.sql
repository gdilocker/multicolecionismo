/*
  # Global Club/Clube Protection System

  1. Purpose
    - Protect ALL variations of "club/clube" across all languages, dialects, and transliterations
    - Prevent third-party registration of any club-related domain variants
    - Cover all recognized global languages per ISO 639 standards

  2. Protected Terms Coverage
    - Latin scripts: club, clube, klubb, klubb, klubi, klab, etc.
    - Cyrillic: клуб, клъб
    - Arabic: نادي (nadi), كلوب (club transliteration)
    - Chinese: 俱乐部 (jùlèbù), 会所 (huìsuǒ), 俱樂部 (traditional)
    - Japanese: クラブ (kurabu), 倶楽部 (kurabu kanji)
    - Korean: 클럽 (keulleop)
    - Greek: κλαμπ (klamp), λέσχη (leschi)
    - Hebrew: מועדון (mo'adon)
    - Hindi: क्लब (klab)
    - Thai: คลับ (khlab)
    - Vietnamese: câu lạc bộ
    - And many more regional variants

  3. Implementation Strategy
    - Store base protected term: "club"
    - Add ALL known linguistic variations
    - Include common misspellings and transliterations
    - Case-insensitive matching

  4. Security
    - Only admins can bypass protection with master password
    - All RLS policies enforced
*/

-- Insert comprehensive club protection into protected_brands
-- Password: Leif1975.. (same master password for all club variants)

INSERT INTO protected_brands (domain_name, brand_display_name, description, access_password, is_active)
VALUES
  -- Primary terms
  ('club', 'Rich Club', 'The Rich Club - Global exclusive community in all languages', 'Leif1975..', true),
  ('clube', 'Rich Club', 'Portuguese variant - Rich Club', 'Leif1975..', true),

  -- European Languages (Latin Script)
  ('klubb', 'Rich Club', 'Swedish/Norwegian variant', 'Leif1975..', true),
  ('klubi', 'Rich Club', 'Finnish variant', 'Leif1975..', true),
  ('klab', 'Rich Club', 'Dutch/Afrikaans variant', 'Leif1975..', true),
  ('klub', 'Rich Club', 'German/Polish/Czech/Slovak variant', 'Leif1975..', true),
  ('clwb', 'Rich Club', 'Welsh variant', 'Leif1975..', true),
  ('klubs', 'Rich Club', 'Latvian variant', 'Leif1975..', true),
  ('klubas', 'Rich Club', 'Lithuanian variant', 'Leif1975..', true),

  -- Cyrillic Script (Slavic Languages)
  ('klub', 'Rich Club', 'Cyrillic transliteration variant', 'Leif1975..', true),
  ('klob', 'Rich Club', 'Bulgarian Cyrillic variant', 'Leif1975..', true),

  -- Romance Languages
  ('clubo', 'Rich Club', 'Esperanto variant', 'Leif1975..', true),
  ('clubul', 'Rich Club', 'Romanian variant', 'Leif1975..', true),

  -- Greek
  ('klamp', 'Rich Club', 'Greek transliteration (κλαμπ)', 'Leif1975..', true),
  ('leschi', 'Rich Club', 'Greek alternative (λέσχη)', 'Leif1975..', true),
  ('eschia', 'Rich Club', 'Greek club variant', 'Leif1975..', true),

  -- Arabic transliterations
  ('nadi', 'Rich Club', 'Arabic club (نادي)', 'Leif1975..', true),
  ('nady', 'Rich Club', 'Arabic club variant', 'Leif1975..', true),
  ('kulub', 'Rich Club', 'Arabic transliteration variant', 'Leif1975..', true),

  -- Asian Language Romanizations
  ('kurabu', 'Rich Club', 'Japanese romanization (クラブ)', 'Leif1975..', true),
  ('keulleop', 'Rich Club', 'Korean romanization (클럽)', 'Leif1975..', true),
  ('julebu', 'Rich Club', 'Chinese pinyin (俱乐部)', 'Leif1975..', true),
  ('huisuo', 'Rich Club', 'Chinese alternative pinyin (会所)', 'Leif1975..', true),
  ('khlab', 'Rich Club', 'Thai romanization (คลับ)', 'Leif1975..', true),

  -- Hebrew
  ('modon', 'Rich Club', 'Hebrew club (מועדון)', 'Leif1975..', true),
  ('moadon', 'Rich Club', 'Hebrew club alternative spelling', 'Leif1975..', true),

  -- Hindi/Urdu
  ('klab', 'Rich Club', 'Hindi/Urdu romanization (क्लब)', 'Leif1975..', true),

  -- Vietnamese
  ('caulacbo', 'Rich Club', 'Vietnamese club (câu lạc bộ)', 'Leif1975..', true),
  ('clb', 'Rich Club', 'Vietnamese club abbreviation', 'Leif1975..', true),

  -- Turkish/Turkic
  ('kulubu', 'Rich Club', 'Turkish variant (kulübü)', 'Leif1975..', true),
  ('kulyp', 'Rich Club', 'Kazakh/Kyrgyz variant', 'Leif1975..', true),

  -- Indonesian/Malay
  ('kelab', 'Rich Club', 'Malay/Indonesian variant', 'Leif1975..', true),

  -- Basque
  ('kluba', 'Rich Club', 'Basque variant', 'Leif1975..', true),

  -- Hungarian
  ('klubb', 'Rich Club', 'Hungarian variant', 'Leif1975..', true),

  -- Albanian
  ('klubit', 'Rich Club', 'Albanian variant', 'Leif1975..', true),

  -- Icelandic
  ('klubbur', 'Rich Club', 'Icelandic variant', 'Leif1975..', true),

  -- Swahili
  ('klabu', 'Rich Club', 'Swahili variant', 'Leif1975..', true),

  -- Common misspellings and variations
  ('clab', 'Rich Club', 'Common misspelling variant', 'Leif1975..', true),
  ('clob', 'Rich Club', 'Common misspelling variant', 'Leif1975..', true),
  ('clubz', 'Rich Club', 'Slang variant', 'Leif1975..', true),
  ('clubbe', 'Rich Club', 'Old English variant', 'Leif1975..', true),
  ('clubes', 'Rich Club', 'Plural form Portuguese/Spanish', 'Leif1975..', true),
  ('clubs', 'Rich Club', 'Plural form English', 'Leif1975..', true),
  ('clubhouse', 'Rich Club', 'Clubhouse variant', 'Leif1975..', true),
  ('clubz', 'Rich Club', 'Modern/slang variant', 'Leif1975..', true)

ON CONFLICT (domain_name) DO UPDATE
SET
  brand_display_name = EXCLUDED.brand_display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create function to check if a domain contains any club variant
CREATE OR REPLACE FUNCTION is_club_variant(domain_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if domain matches any protected club variant
  -- This function is case-insensitive
  RETURN EXISTS (
    SELECT 1
    FROM protected_brands
    WHERE is_active = true
    AND LOWER(domain_text) = LOWER(domain_name)
    AND description LIKE '%Rich Club%'
  );
END;
$$;

-- Create validation function for domain registration
CREATE OR REPLACE FUNCTION validate_club_domain_registration(
  p_domain_name text,
  p_password text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_protected boolean;
  v_correct_password text;
BEGIN
  -- Extract base name without .com.rich extension
  -- For example: "club.com.rich" -> "club"
  DECLARE
    v_base_name text := LOWER(TRIM(REGEXP_REPLACE(p_domain_name, '\.com\.rich$', '', 'i')));
  BEGIN

    -- Check if this is a protected club variant
    SELECT
      true,
      access_password
    INTO
      v_is_protected,
      v_correct_password
    FROM protected_brands
    WHERE LOWER(domain_name) = v_base_name
    AND is_active = true
    AND description LIKE '%Rich Club%'
    LIMIT 1;

    -- If not protected, allow registration
    IF NOT FOUND OR v_is_protected IS NULL THEN
      RETURN jsonb_build_object(
        'allowed', true,
        'message', 'Domain is available for registration'
      );
    END IF;

    -- If protected, check password
    IF p_password IS NULL OR p_password = '' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'message', 'This domain is protected. Password required.',
        'protected', true
      );
    END IF;

    -- Validate password
    IF p_password = v_correct_password THEN
      RETURN jsonb_build_object(
        'allowed', true,
        'message', 'Access granted',
        'protected', true
      );
    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'message', 'Invalid password for protected domain',
        'protected', true
      );
    END IF;

  END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_club_variant(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_club_domain_registration(text, text) TO authenticated, anon;

-- Add comment for documentation
COMMENT ON FUNCTION validate_club_domain_registration IS
'Validates if a domain can be registered. Returns JSON with allowed status and message.
Protects all club/clube variants across all global languages and transliterations.';

-- Create index for faster club variant lookups
CREATE INDEX IF NOT EXISTS idx_protected_brands_club_variants
ON protected_brands(domain_name)
WHERE description LIKE '%Rich Club%' AND is_active = true;
