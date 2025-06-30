import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enhanced Fact interface with video and carousel support
export interface CarouselSlide {
  id: string;
  image_url: string;
  slide_index: number;
}

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
  contentType?: 'text' | 'reel' | 'carousel';
  // Add carousel support
  slides?: CarouselSlide[];
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
  refreshContent: () => Promise<void>;
}

const CACHE_KEY = 'cached_content';
const CACHE_EXPIRY_KEY = 'cache_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const batchSize = 5; // Optimized batch size
  const minRequestInterval = 500; // Reduced interval for better UX

  // Cache management
  const loadFromCache = useCallback(async (): Promise<Fact[] | null> => {
    try {
      const [cachedContent, cacheExpiry] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(CACHE_EXPIRY_KEY),
      ]);

      if (cachedContent && cacheExpiry) {
        const expiryTime = parseInt(cacheExpiry, 10);
        if (Date.now() < expiryTime) {
          console.log('📦 Loading content from cache');
          return JSON.parse(cachedContent);
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }, []);

  const saveToCache = useCallback(async (contentToCache: Fact[]) => {
    try {
      const expiryTime = Date.now() + CACHE_DURATION;
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(contentToCache)),
        AsyncStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString()),
      ]);
      console.log('💾 Content saved to cache');
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEY),
        AsyncStorage.removeItem(CACHE_EXPIRY_KEY),
      ]);
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }, []);

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
    }, 15000); // 15 second timeout

    try {
      // Try cache first for initial load
      if (currentOffset.current === 0 && content.length === 0) {
        const cachedContent = await loadFromCache();
        if (cachedContent && cachedContent.length > 0) {
          setContent(cachedContent);
          cachedContent.forEach(item => seenContentIds.current.add(item.id));
          currentOffset.current = cachedContent.length;
          isInitialized.current = true;
          setIsLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
      }

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

      // Enhance content with contentType (preserve existing contentType from backend)
      const enhancedContent = newContent.map((item: Fact) => ({
        ...item,
        contentType: item.contentType || (item.video_url ? 'reel' as const : 'text' as const),
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
        
        // Cache the first batch for faster subsequent loads
        if (prev.length === 0 && updated.length > 0) {
          saveToCache(updated.slice(0, 10)); // Cache first 10 items
        }
        
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
      if (enhancedContent.length === 0) {
        console.log('⚠️ No new content after deduplication, assuming no more content');
        setHasMore(false);
      } else if (enhancedContent.length < Math.floor(batchSize / 2)) {
        console.log(`⚠️ Received significantly less than batch size (${enhancedContent.length}/${batchSize}), might be running out of content`);
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
  }, [isLoading, hasMore, content.length, loadFromCache, saveToCache]);

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
    clearCache();
  }, [clearCache]);

  const refreshContent = useCallback(async () => {
    console.log('Refreshing content');
    await clearCache();
    resetContent();
    await loadMoreContent();
  }, [clearCache, resetContent, loadMoreContent]);

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
    refreshContent,
  };
};