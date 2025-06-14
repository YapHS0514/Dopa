-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON topics;

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read topics
CREATE POLICY "Enable read access for all users" ON topics
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow all users to read topics (for unauthenticated access)
CREATE POLICY "Enable read access for anonymous users" ON topics
    FOR SELECT
    TO anon
    USING (true); 