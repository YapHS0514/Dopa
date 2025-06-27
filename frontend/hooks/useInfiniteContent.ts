import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';

// Enhanced Fact interface with video support
export interface Fact {
  id: string;
  hook: string;
  summary: string;
  fullContent: string;
  image: string;
  topic: string;
  source: string;
  sourceUrl: string;
  readTime: number;
  tags?: string[];
  // Add video support - using media_url for both images and videos
  video_url?: string;
  contentType?: 'text' | 'reel';
}

interface UseInfiniteContentReturn {
  content: Fact[];
  loadMoreContent: () => Promise<void>;
  resetContent: () => void;
  trackInteraction: (contentId: string, interactionType: string, interactionValue?: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  isInitialized: boolean;
  seenContentCount: number;
}

export const useInfiniteContent = (): UseInfiniteContentReturn => {
  const [content, setContent] = useState<Fact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Use refs for values that don't need to trigger re-renders
  const seenContentIds = useRef<Set<string>>(new Set());
  const currentOffset = useRef(0);
  const isInitialized = useRef(false);
  const lastRequestTime = useRef(0);
  
  // Configuration
  const batchSize = 3; // Reduced batch size for faster loading
  const minRequestInterval = 1000; // Increased to 1 second to prevent rate limiting

  const loadMoreContent = useCallback(async () => {
    // Prevent concurrent requests and spam
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    console.log('🔍 LoadMoreContent called:', { 
      isLoading, 
      hasMore, 
      timeSinceLastRequest, 
      minRequestInterval,
      currentOffset: currentOffset.current,
      contentLength: content.length 
    });
    
    if (isLoading || !hasMore || (timeSinceLastRequest < minRequestInterval)) {
      console.log('❌ Skipping request:', { isLoading, hasMore, timeSinceLastRequest });
      return;
    }

    console.log(`🚀 Loading more content: offset=${currentOffset.current}, batchSize=${batchSize}`);
    setIsLoading(true);
    setError(null);
    lastRequestTime.current = now;

    // Add timeout to prevent loading state from getting stuck
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ Loading timeout! Resetting loading state...');
      setIsLoading(false);
    }, 10000); // 10 second timeout

    try {
      const response = await apiClient.getContents(batchSize, currentOffset.current) as {
        data: Fact[];
        count: number;
      };

      console.log(`📦 Received ${response.data?.length || 0} items from API`);

      if (!response.data || response.data.length === 0) {
        console.log('❌ No more content available');
        setHasMore(false);
        return;
      }

      // Filter out content we've already seen in this session
      const newContent = response.data.filter(
        (item: Fact) => !seenContentIds.current.has(item.id)
      );

      // Enhance content with contentType
      const enhancedContent = newContent.map((item: Fact) => ({
        ...item,
        contentType: item.video_url ? 'reel' as const : 'text' as const,
      }));

      console.log(`${enhancedContent.length} new items after deduplication`);
      console.log(`Content types: ${enhancedContent.map(item => `${item.id}: ${item.contentType}`).join(', ')}`);

      if (enhancedContent.length === 0) {
        // All items were duplicates, try next batch
        currentOffset.current += batchSize;
        console.log('All items were duplicates, trying next batch');
        // Recursively load more (but prevent infinite loops)
        if (currentOffset.current < 100) { // Safety limit
          await loadMoreContent();
        } else {
          setHasMore(false);
        }
        return;
      }

      // Update content and tracking
      setContent(prev => {
        const updated = [...prev, ...enhancedContent];
        console.log(`Content updated: ${prev.length} -> ${updated.length} items`);
        return updated;
      });

      // Track seen content
      enhancedContent.forEach(item => seenContentIds.current.add(item.id));
      currentOffset.current += batchSize;

      // Mark as initialized after first successful load
      if (!isInitialized.current) {
        isInitialized.current = true;
        console.log('Content system initialized');
      }

      // Check if we should stop loading more - be more conservative
      // Only set hasMore to false if we got 0 items or significantly less than batch size
      if (enhancedContent.length === 0) {
        console.log('⚠️ No new content after deduplication, assuming no more content');
        setHasMore(false);
      } else if (enhancedContent.length < Math.floor(batchSize / 2)) {
        console.log(`⚠️ Received significantly less than batch size (${enhancedContent.length}/${batchSize}), might be running out of content`);
        // Don't set hasMore to false yet, let the next request determine this
      } else {
        console.log(`✅ Received ${enhancedContent.length} new items, continuing to load more when needed`);
      }

    } catch (err: any) {
      console.error('Error loading content:', err);
      setError(err.message || 'Failed to load content');
      
      // On error, still mark as initialized if we have some content
      if (content.length > 0 && !isInitialized.current) {
        isInitialized.current = true;
      }
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, [isLoading, hasMore, content.length]);

  const resetContent = useCallback(() => {
    console.log('Resetting content system');
    setContent([]);
    seenContentIds.current.clear();
    currentOffset.current = 0;
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    isInitialized.current = false;
    lastRequestTime.current = 0;
  }, []);

  const trackInteraction = useCallback(async (
    contentId: string, 
    interactionType: string, 
    interactionValue: number = 1
  ) => {
    try {
      await apiClient.recordInteraction(contentId, interactionType, interactionValue);
      console.log(`Tracked interaction: ${interactionType} for content ${contentId}`);
    } catch (error) {
      console.error('Error tracking interaction:', error);
      // Don't throw error to avoid disrupting user experience
    }
  }, []);

  // Auto-load initial content when hook is first used
  useEffect(() => {
    if (!isInitialized.current && content.length === 0 && !isLoading) {
      console.log('Auto-loading initial content');
      loadMoreContent();
    }
  }, [loadMoreContent, content.length, isLoading]);

  return {
    content,
    loadMoreContent,
    resetContent,
    trackInteraction,
    isLoading,
    error,
    hasMore,
    isInitialized: isInitialized.current,
    seenContentCount: seenContentIds.current.size,
  };
}; 