-- Add carousel_slides table for carousel content support
CREATE TABLE carousel_slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    slide_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE carousel_slides IS 'Stores individual slides for carousel content type';
COMMENT ON COLUMN carousel_slides.content_id IS 'Foreign key to contents table';
COMMENT ON COLUMN carousel_slides.image_url IS 'URL of the slide image';
COMMENT ON COLUMN carousel_slides.slide_index IS 'Order of the slide (0-based)';

-- Create index for better performance
CREATE INDEX idx_carousel_slides_content_id ON carousel_slides(content_id);
CREATE INDEX idx_carousel_slides_content_id_slide_index ON carousel_slides(content_id, slide_index);

-- Enable RLS (Row Level Security)
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read carousel slides
CREATE POLICY "Enable read access for authenticated users" ON carousel_slides
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow admin users to manage carousel slides
CREATE POLICY "Enable full access for admin users" ON carousel_slides
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 