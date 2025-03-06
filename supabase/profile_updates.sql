-- Add bio and date_of_birth columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Comment on columns
COMMENT ON COLUMN profiles.bio IS 'User biography or about me text';
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth'; 