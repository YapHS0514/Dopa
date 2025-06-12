/*
  # Initial Database Schema for Microlearning App

  1. New Tables
    - `profiles` - User profiles with preferences and points
    - `topics` - Available learning topics/categories
    - `contents` - Learning content/reels
    - `user_interactions` - Track user swipes and interactions
    - `user_topic_preferences` - User preferences for topics
    - `saved_contents` - User saved content collection

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for topics and contents

  3. Features
    - Points system for recommendation algorithm
    - Topic preference tracking
    - Content interaction history
    - User authentication via Supabase Auth
*/

-- Create topics table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#8B5CF6',
  icon text DEFAULT 'book',
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  total_points integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contents table
CREATE TABLE IF NOT EXISTS contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  content_type text DEFAULT 'text', -- text, image, video
  media_url text,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  difficulty_level integer DEFAULT 1, -- 1-5 scale
  estimated_read_time integer DEFAULT 30, -- seconds
  source_url text,
  ai_generated boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_topic_preferences table
CREATE TABLE IF NOT EXISTS user_topic_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  preference_score float DEFAULT 0.5, -- 0-1 scale
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'like', 'dislike', 'save', 'view'
  interaction_value integer DEFAULT 0, -- points awarded/deducted
  created_at timestamptz DEFAULT now()
);

-- Create saved_contents table
CREATE TABLE IF NOT EXISTS saved_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for topics (public read)
CREATE POLICY "Anyone can view topics"
  ON topics FOR SELECT
  TO authenticated
  USING (true);

-- Policies for contents (public read)
CREATE POLICY "Anyone can view contents"
  ON contents FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_topic_preferences
CREATE POLICY "Users can manage own topic preferences"
  ON user_topic_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_interactions
CREATE POLICY "Users can manage own interactions"
  ON user_interactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for saved_contents
CREATE POLICY "Users can manage own saved contents"
  ON saved_contents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default topics
INSERT INTO topics (name, description, color, icon) VALUES
  ('Technology', 'Latest tech trends, gadgets, and innovations', '#3B82F6', 'smartphone'),
  ('Science', 'Scientific discoveries and breakthroughs', '#10B981', 'microscope'),
  ('History', 'Historical events and fascinating stories', '#F59E0B', 'scroll'),
  ('Sports', 'Sports news, analysis, and highlights', '#EF4444', 'trophy'),
  ('Geography', 'Places, cultures, and world knowledge', '#8B5CF6', 'globe'),
  ('Health', 'Wellness tips and health insights', '#EC4899', 'heart'),
  ('Business', 'Entrepreneurship and business insights', '#6366F1', 'briefcase'),
  ('Entertainment', 'Movies, music, and pop culture', '#F97316', 'film')
ON CONFLICT (name) DO NOTHING;

-- Insert sample content
INSERT INTO contents (title, summary, topic_id, tags, difficulty_level, estimated_read_time) VALUES
  (
    'The Rise of Quantum Computing',
    'Quantum computers use quantum mechanics principles to process information in ways that could revolutionize computing. Unlike classical bits, quantum bits (qubits) can exist in multiple states simultaneously.',
    (SELECT id FROM topics WHERE name = 'Technology'),
    ARRAY['quantum', 'computing', 'future'],
    3,
    45
  ),
  (
    'Ancient Rome''s Engineering Marvels',
    'The Romans built incredible structures that still stand today. Their engineering techniques, including the use of concrete and arches, were revolutionary for their time.',
    (SELECT id FROM topics WHERE name = 'History'),
    ARRAY['rome', 'engineering', 'architecture'],
    2,
    60
  ),
  (
    'The Science of Sleep',
    'Sleep is crucial for memory consolidation, immune function, and overall health. During sleep, your brain clears toxins and processes the day''s information.',
    (SELECT id FROM topics WHERE name = 'Health'),
    ARRAY['sleep', 'health', 'brain'],
    2,
    40
  )
ON CONFLICT DO NOTHING;

-- Function to update user points based on interactions
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update topic preferences based on interaction
  INSERT INTO user_topic_preferences (user_id, topic_id, points)
  SELECT 
    NEW.user_id,
    c.topic_id,
    NEW.interaction_value
  FROM contents c
  WHERE c.id = NEW.content_id
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET 
    points = user_topic_preferences.points + NEW.interaction_value,
    preference_score = LEAST(1.0, GREATEST(0.0, (user_topic_preferences.points + NEW.interaction_value) / 100.0)),
    updated_at = now();

  -- Update total points in profile
  UPDATE profiles
  SET 
    total_points = total_points + NEW.interaction_value,
    updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update points when interactions are created
CREATE TRIGGER update_points_on_interaction
  AFTER INSERT ON user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();