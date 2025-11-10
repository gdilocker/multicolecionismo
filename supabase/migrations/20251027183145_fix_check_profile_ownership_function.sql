/*
  # Fix check_profile_ownership Function
  
  1. Changes
    - Update function to use fully qualified table and function names
    - public.user_profiles instead of user_profiles
    - auth.uid() is accessible via search_path inclusion
  
  2. Security
    - Keep SECURITY DEFINER and STABLE
    - Use proper search_path with pg_catalog and auth schemas
*/

CREATE OR REPLACE FUNCTION public.check_profile_ownership(profile_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = profile_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, auth;
