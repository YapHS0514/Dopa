/*
  # Performance Optimization Indexes

  1. Indexes Added
    - User interactions by user_id and created_at for analytics
    - Content by content_type for filtering
    - User topic preferences by user_id for personalization
    - Saved content by user_id for quick retrieval
    - Profiles by user_id for auth lookups

  2. Query Optimization
    - Composite indexes for common query patterns
    - Partial indexes for specific content types
    - Covering indexes to reduce table lookups

  3. Performance Benefits
    - Faster content loading
    - Improved user analytics queries
    - Better recommendation performance
*/

-- Index for user interactions analytics (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_created 
ON user_interactions(user_id, created_at DESC);

-- Index for content filtering by type
CREATE INDEX IF NOT EXISTS idx_contents_type_created 
ON contents(content_type, created_at DESC);

-- Composite index for personalized content queries
CREATE INDEX IF NOT EXISTS idx_content_topics_topic_content 
ON content_topics(topic_id, content_id);

-- Index for user preferences lookup
CREATE INDEX IF NOT EXISTS idx_user_topic_preferences_user_points 
ON user_topic_preferences(user_id, points DESC);

-- Index for saved content by user
CREATE INDEX IF NOT EXISTS idx_saved_contents_user_created 
ON saved_contents(user_id, created_at DESC);

-- Index for profiles by user_id (auth lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

-- Partial index for active content only
CREATE INDEX IF NOT EXISTS idx_contents_active 
ON contents(created_at DESC) 
WHERE content_type IN ('text', 'reel', 'carousel');

-- Index for interaction type analytics
CREATE INDEX IF NOT EXISTS idx_user_interactions_type_created 
ON user_interactions(interaction_type, created_at DESC);

-- Covering index for content with topics (reduces joins)
CREATE INDEX IF NOT EXISTS idx_contents_with_metadata 
ON contents(id, title, content_type, created_at) 
INCLUDE (summary, media_url, source_url);

-- Index for streak calculations
CREATE INDEX IF NOT EXISTS idx_profiles_streak_data 
ON profiles(user_id, streak_days, last_streak_date);

-- Update table statistics for better query planning
ANALYZE user_interactions;
ANALYZE contents;
ANALYZE user_topic_preferences;
ANALYZE saved_contents;
ANALYZE profiles;