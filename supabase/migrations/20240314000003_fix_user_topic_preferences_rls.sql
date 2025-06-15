-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_topic_preferences;

-- Enable RLS
ALTER TABLE user_topic_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON user_topic_preferences
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 