import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { MOCK_FACTS } from '../../constants/MockData';
import { Fact } from '../../hooks/useInfiniteContent';
import { TopicTags } from '../../components/TopicTags';
import { apiClient } from '../../lib/api';
import SavedContentView from '../SavedContentView';

/**
 * TODO: BACKEND INTEGRATION CHECKLIST FOR SAVED SCREEN
 *
 * 1. DATA LAYER:
 *    - Replace MOCK_SAVED_FACTS with real Supabase queries
 *    - Implement saved_facts table: user_id, fact_id, saved_at, user_notes
 *    - Add real-time subscriptions for save/unsave events
 *    - Implement offline caching with sync when online
 *
 * 2. USER MANAGEMENT:
 *    - Fetch user's saves limit based on subscription tier
 *    - Track saves count and update in real-time
 *    - Implement premium tier unlimited saves
 *
 * 3. ANALYTICS & TRACKING:
 *    - Track saved fact views, modal interactions, shares
 *    - Measure engagement metrics (time spent, scroll depth)
 *    - Log all user interactions for personalization
 *
 * 4. CONTENT DELIVERY:
 *    - Implement image CDN with fallbacks
 *    - Add source URL validation and credibility scores
 *    - Track content quality metrics (image load rates, etc.)
 *
 * 5. FEATURES TO ADD:
 *    - User notes on saved facts
 *    - Collections/folders for organizing saves
 *    - Search within saved facts
 *    - Export saved facts functionality
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48 - GRID_SPACING) / 2;

// Backend saved content interface
interface SavedContentItem {
  id: string;
  created_at: string;
  content: {
    id: string;
    title: string;
    summary: string;
    content_type: string;
    source_url?: string;
    media_url?: string;
    slides?: Array<{
      id: string;
      image_url: string;
      slide_index: number;
    }>;
  };
}

// Transform backend data to frontend Fact format
const transformSavedContentToFact = (savedItem: SavedContentItem): Fact => {
  const { content } = savedItem;

  // Determine if this is video content
  const isVideo =
    content.media_url &&
    ['.mp4', '.mov', '.avi', '.webm', '.m4v'].some((ext) =>
      content.media_url!.toLowerCase().endsWith(ext)
    );

  // Handle different content types
  const contentType = content.content_type || 'text';

  return {
    id: content.id,
    hook: content.title,
    summary: content.summary,
    fullContent: content.summary, // Using summary as fullContent for now
    image: isVideo ? '' : content.media_url || '',
    topic: 'general', // TODO: Add topic mapping when available
    source: 'Database',
    sourceUrl: content.source_url || '',
    readTime: 2, // TODO: Calculate or get from backend
    tags: [], // TODO: Add tags when available from backend
    video_url: isVideo ? content.media_url : '',
    contentType: isVideo
      ? ('reel' as const)
      : (contentType as 'text' | 'carousel'),
    // Include slides data for carousel content from backend
    slides: contentType === 'carousel' ? content.slides || [] : undefined,
  };
};

export default function SavedScreen() {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [selectedFact, setSelectedFact] = useState<Fact | null>(null);

  // Navigation focus detection
  const isFocused = useIsFocused();

  // Backend integration state
  const [savedContent, setSavedContent] = useState<Fact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Navigation state for full-screen view
  const [showFullView, setShowFullView] = useState(false);

  // Fetch saved content from backend
  const fetchSavedContent = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('Fetching saved content from backend...');
      const response = (await apiClient.getSavedContent()) as {
        data: SavedContentItem[];
      };

      console.log('Raw saved content response:', response);

      // Transform backend data to frontend format
      const transformedContent = response.data.map(transformSavedContentToFact);

      console.log('Transformed saved content:', transformedContent);
      setSavedContent(transformedContent);
    } catch (err: any) {
      console.error('Error fetching saved content:', err);
      setError(err.message || 'Failed to load saved content');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load saved content on component mount
  useEffect(() => {
    fetchSavedContent();
  }, []);

  // Automatically close modal when navigating away from saved screen
  useEffect(() => {
    if (!isFocused && showFullView) {
      console.log(
        '📱 SavedScreen: Screen lost focus, closing modal automatically'
      );
      setShowFullView(false);
      setSelectedFact(null);
    }
  }, [isFocused, showFullView]);

  // Pull to refresh handler
  const handleRefresh = () => {
    fetchSavedContent(true);
  };

  const renderSavedItem = (item: (typeof savedContent)[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.gridItem}
      onPress={() => {
        // TODO: BACKEND INTEGRATION - SAVED FACT ANALYTICS
        // TODO: Track saved fact view analytics to backend (userId, factId, viewedAt)
        // TODO: Update fact view count in user profile
        // TODO: Track time spent reading saved facts for engagement metrics
        setSelectedFact(item);
        setShowFullView(true);
      }}
    >
      <View style={styles.gridItemContent}>
        {/* Topic Tags */}
        {item.tags && item.tags.length > 0 && (
          <TopicTags tags={item.tags} style={styles.cardTopicTags} />
        )}

        {/* Fact Content */}
        <View style={styles.factContent}>
          <Text style={styles.factTitle} numberOfLines={2}>
            {item.hook}
          </Text>
          <Text style={styles.factText} numberOfLines={3}>
            {item.summary}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>Saved Facts</Text>
        <View
          style={[
            styles.savesCounter,
            {
              backgroundColor: Colors.cardBackground,
            },
          ]}
        >
          <Text style={[styles.savesText, { color: Colors.textSecondary }]}>
            Saved content:
          </Text>
          <Text style={[styles.savesNumber, { color: Colors.text }]}>
            {isLoading ? '...' : savedContent.length}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.text} />
            <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
              Loading saved content...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchSavedContent()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : savedContent.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
              No saved content yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: Colors.textSecondary }]}
            >
              Save interesting facts from the main feed to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>{savedContent.map(renderSavedItem)}</View>
        )}
      </ScrollView>

      {/* Full-screen view for saved content */}
      {showFullView && selectedFact && (
        <View style={styles.fullScreenOverlay}>
          <SavedContentView
            fact={selectedFact}
            onBack={() => {
              console.log(
                '📱 SavedScreen: Manually closing modal via back button'
              );
              setShowFullView(false);
              setSelectedFact(null);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 16,
  },
  savesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  savesText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  savesNumber: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Extra space at bottom for better scrolling experience
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH * 1.2,
    marginBottom: GRID_SPACING,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridItemContent: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E5E7EB', // Same light gray as learn page fact cards
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cardTopicTags: {
    marginBottom: 12,
  },
  factContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  factTitle: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151', // Dark gray for good contrast on light background
  },
  factText: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    lineHeight: 20,
    color: '#374151', // Dark gray for good readability
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
    lineHeight: 20,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
