/*
  # Remove Video Poster Feature

  1. Changes
    - Remove `background_video_poster` column from `user_profiles` table
    - This feature was causing confusion as it only applies to video backgrounds
    - Users primarily use images and gradients, making this field unnecessary

  2. Notes
    - Safe to remove as this is an optional feature that was rarely used
    - No data loss risk as posters were just supplementary to videos
*/

-- Remove the background_video_poster column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS background_video_poster;
