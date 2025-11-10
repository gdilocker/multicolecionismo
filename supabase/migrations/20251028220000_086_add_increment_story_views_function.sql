/*
  # Add Function to Increment Story Views
  
  1. New Functions
    - `increment_story_views` - Safely increment view count for stories
  
  2. Security
    - Function is SECURITY DEFINER to allow updates without explicit permissions
*/

-- Function to increment story views
CREATE OR REPLACE FUNCTION increment_story_views(story_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profile_stories
  SET view_count = view_count + 1
  WHERE id = story_uuid;
END;
$$;
