-- Add coins column to profiles table
ALTER TABLE profiles 
ADD COLUMN coins INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN profiles.coins IS 'User coin balance for marketplace purchases and rewards';

-- Update existing users to have 0 coins (they already have default 0, but this makes it explicit)
UPDATE profiles SET coins = 0 WHERE coins IS NULL; 