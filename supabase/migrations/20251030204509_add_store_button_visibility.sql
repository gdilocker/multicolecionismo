/*
  # Add Store Button Visibility Control

  1. Changes
    - Add `show_store_button_on_profile` column to `user_profiles` table
      - Controls whether the store button appears on the user's public profile page
      - Defaults to true (enabled by default for users who have store products)

  2. Security
    - Only the profile owner can update this setting
    - RLS policies already in place handle authorization

  3. Purpose
    This gives users control over store visibility on their profile:
    - When true: "Loja" button appears on public profile (/{subdomain})
    - When false: Store button is hidden from public profile
    - Store is still accessible via direct URL (/{subdomain}/loja)
*/

-- Add store button visibility setting for public profile
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS show_store_button_on_profile boolean DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.show_store_button_on_profile IS
  'When true, displays the store button on the user''s public profile page. Store remains accessible via direct URL even when false.';
