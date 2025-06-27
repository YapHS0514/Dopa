-- Add video_url column to contents table for Reels support
ALTER TABLE contents 
ADD COLUMN video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN contents.video_url IS 'URL for video content (Reels)'; 