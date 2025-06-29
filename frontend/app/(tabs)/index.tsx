import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { ContentCard } from '../../components/ContentCard';
import ActionButtons from '../../components/ActionButtons';
import StreakButton from '../../components/StreakButton';
import { useInfiniteContent, Fact } from '../../hooks/useInfiniteContent';
import { apiClient } from '../../lib/api';
import { ReelCard } from '../../components/ReelCard';
import { useReelAudioStore } from '../../lib/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getContentType = (fact: Fact): 'text' | 'reel' => {
  return fact.video_url ? 'reel' : 'text';
};

const getFactCards = (fact: Fact) => {
  const cards = [
    {
      key: 'hook',
      title: fact.hook,
      body: '',
      isSourceCard: false,
      isHookCard: true,
      sourceUrl: undefined,
    },
    ...fact.summary
      .split('.')
      .filter(Boolean)
      .map((sentence: string, idx: number) => ({
        key: `content-${idx}`,
        title: '',
        body: sentence.trim() + '.',
        isSourceCard: false,
        isHookCard: undefined,
        sourceUrl: undefined,
      })),
    {
      key: 'source',
      title: 'Source',
      body: fact.sourceUrl,
      isSourceCard: true,
      isHookCard: undefined,
      sourceUrl: fact.sourceUrl,
    },
  ];
  return cards;
};

const FactCarousel = ({
  fact,
  onEngagementTracked,
  contentEngagementTracked,
}: {
  fact: Fact;
  onEngagementTracked?: (
    contentId: string,
    engagementType: string,
    value: number
  ) => void;
  contentEngagementTracked?: React.MutableRefObject<Set<string>>;
}) => {
  const cards = getFactCards(fact);
  const [cardIndex, setCardIndex] = useState(0);
  const hasTrackedInterested = useRef(false);
  const hasTrackedEngaged = useRef(false);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={cards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              height: SCREEN_HEIGHT,
              width: SCREEN_WIDTH,
            }}
          >
            <View
              style={{
                aspectRatio: 4 / 5,
                width: SCREEN_WIDTH,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ContentCard
                title={item.title}
                body={item.body}
                isSourceCard={item.isSourceCard}
                isHookCard={item.isHookCard}
                sourceUrl={item.sourceUrl}
                tags={item.isHookCard ? fact.tags : undefined} // Show tags only on hook card
                onSourcePress={
                  item.isSourceCard && item.sourceUrl
                    ? () => Linking.openURL(item.sourceUrl)
                    : undefined
                }
              />
            </View>
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCardIndex(idx);

          // Track engagement based on swipe behavior
          if (idx > 0 && !hasTrackedInterested.current) {
            // User swiped at least once - "INTERESTED"
            console.log(
              `📖 TextContent ${fact.id}: Swiped to card ${idx} - tracking as interested`
            );
            hasTrackedInterested.current = true;
            contentEngagementTracked?.current.add(fact.id);
            onEngagementTracked?.(fact.id, 'interested', 1);
          }

          // Check if user reached the source card (last card) - "ENGAGED"
          const isSourceCard = cards[idx]?.isSourceCard;
          if (isSourceCard && !hasTrackedEngaged.current) {
            console.log(
              `📖 TextContent ${fact.id}: Reached source card - tracking as engaged`
            );
            hasTrackedEngaged.current = true;
            contentEngagementTracked?.current.add(fact.id);
            onEngagementTracked?.(fact.id, 'engaged', 2);
          }
        }}
      />
      {/* Action buttons positioned on the right side */}
      <ActionButtons
        fact={{ ...fact, contentType: 'text' as const }}
        style={styles.actionButtons}
        onInteractionTracked={onEngagementTracked}
      />
    </View>
  );
};

// New component for Reel content
const ReelContent = ({
  fact,
  isVisible,
  screenFocused,
  onEngagementTracked,
}: {
  fact: Fact;
  isVisible: boolean;
  screenFocused: boolean;
  onEngagementTracked?: (
    contentId: string,
    engagementType: string,
    value: number
  ) => void;
}) => {
  // Ensure the fact object has the correct contentType for ActionButtons
  const reelFact = {
    ...fact,
    contentType: 'reel' as const,
  };

  return (
    <View style={{ flex: 1 }}>
      <ReelCard
        videoUrl={fact.video_url!}
        title={fact.hook}
        tags={fact.tags}
        isVisible={isVisible && screenFocused} // Only visible if both conditions are true
        contentId={fact.id}
        onLoadStart={() => console.log(`Loading reel: ${fact.id}`)}
        onLoad={() => console.log(`Reel loaded: ${fact.id}`)}
        onError={(error: string) =>
          console.error(`Reel error for ${fact.id}:`, error)
        }
        onEngagementTracked={onEngagementTracked}
      />
      {/* Action buttons for reels with correct contentType */}
      <ActionButtons
        fact={reelFact}
        style={styles.reelActionButtons}
        onInteractionTracked={onEngagementTracked}
      />
    </View>
  );
};

export default function IndexScreen() {
  const [factIndex, setFactIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const lastTrackedContentId = useRef<string | null>(null);

  // Navigation focus detection
  const isFocused = useIsFocused();
  const { pauseAllVideos } = useReelAudioStore();

  // Use the new infinite content hook
  const {
    content: facts,
    loadMoreContent,
    isLoading: loading,
    error,
    hasMore,
    isInitialized,
    trackInteraction,
  } = useInfiniteContent();

  // Pause all videos when screen loses focus
  useEffect(() => {
    if (!isFocused) {
      console.log('📱 IndexScreen: Screen lost focus, pausing all videos');
      pauseAllVideos();
    } else {
      console.log('📱 IndexScreen: Screen gained focus');
    }
  }, [isFocused, pauseAllVideos]);

  // StreakButton now handles its own data fetching

  // Track content engagement per item
  const contentEngagementTracked = useRef<Set<string>>(new Set());

  // Enhanced track interaction that also marks content as tracked
  const trackEngagement = useCallback(
    (contentId: string, engagementType: string, value: number) => {
      contentEngagementTracked.current.add(contentId);
      trackInteraction(contentId, engagementType, value);
    },
    [trackInteraction]
  );

  // Handle scroll events for infinite loading
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const currentIndex = Math.round(contentOffset.y / SCREEN_HEIGHT);

      // Minimal logging for production
      if (currentIndex !== factIndex) {
        console.log(`Scroll: moved to item ${currentIndex}/${facts.length}`);
      }

      // Handle engagement tracking when leaving content
      if (currentIndex !== factIndex && facts[factIndex]) {
        const previousContent = facts[factIndex];
        const contentType = getContentType(previousContent);

        // For text content, check if user skipped without swiping
        if (
          contentType === 'text' &&
          !contentEngagementTracked.current.has(previousContent.id)
        ) {
          console.log(
            `📖 TextContent ${previousContent.id}: Left without swiping - tracking as skip`
          );
          trackInteraction(previousContent.id, 'skip', -2);
          contentEngagementTracked.current.add(previousContent.id);
        }
      }

      // Update current index (engagement tracking is handled by individual components)
      if (currentIndex !== factIndex) {
        setFactIndex(currentIndex);
      }

      // More aggressive loading: load when at 2nd item from end OR when at 3rd item
      const shouldLoadMore =
        (currentIndex >= facts.length - 2 || // Traditional: 2 from end
          currentIndex >= Math.max(2, facts.length - 3)) && // OR: 3 from end if we have content
        hasMore &&
        !loading;

      if (shouldLoadMore) {
        console.log(`Loading more content...`);
        loadMoreContent();
      }
    },
    [facts, factIndex, loadMoreContent, hasMore, loading, trackInteraction]
  );

  // Separate handler for momentum scroll end (when user stops swiping)
  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const currentIndex = Math.round(contentOffset.y / SCREEN_HEIGHT);

      // Force load more check on momentum end
      if (currentIndex >= facts.length - 2 && hasMore && !loading) {
        console.log(`Loading more content after scroll stop`);
        loadMoreContent();
      }
    },
    [facts.length, hasMore, loading, loadMoreContent]
  );

  // Enhanced render function to handle mixed content types
  const renderItem = useCallback(
    ({ item, index }: { item: Fact; index: number }) => {
      const contentType = getContentType(item);
      const isVisible = index === factIndex;

      if (contentType === 'reel') {
        return (
          <ReelContent
            fact={item}
            isVisible={isVisible}
            screenFocused={isFocused}
            onEngagementTracked={trackEngagement}
          />
        );
      } else {
        return (
          <FactCarousel
            fact={item}
            onEngagementTracked={trackEngagement}
            contentEngagementTracked={contentEngagementTracked}
          />
        );
      }
    },
    [factIndex, isFocused, trackEngagement]
  );

  const keyExtractor = useCallback((item: Fact) => item.id, []);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        {/* Bolt.new logo - Hackathon requirement */}
        <TouchableOpacity
          style={styles.logoButton}
          onPress={() => Linking.openURL('https://bolt.new/')}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/images/white_circle_360x360.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>DOPA</Text>
        <StreakButton />
      </View>
      {loading && facts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.tint} />
          <Text style={styles.loadingText}>
            Loading personalized content...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log('Retrying content load...');
              loadMoreContent();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : facts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No content available. Complete onboarding to get personalized
            content!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={facts}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          style={{ flex: 1 }}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          removeClippedSubviews={false} // Keep videos in memory for better performance
          maxToRenderPerBatch={2} // Reduced for better video performance
          windowSize={3} // Smaller window for better memory management
          initialNumToRender={1} // Start with just one item
          updateCellsBatchingPeriod={100} // Slower updates for smoother video
          decelerationRate="fast" // Better snap-to behavior
        />
      )}

      {/* Loading indicator for infinite scroll */}
      {loading && facts.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.tint} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 50,
    paddingBottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
    alignSelf: 'center',
    marginTop: 10,
  },
  logoButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 8 : 58,
    zIndex: 100,
  },
  logo: {
    width: 60,
    height: 60,
  },
  actionButtons: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    marginHorizontal: 20,
  },
  reelActionButtons: {
    position: 'absolute',
    right: 15,
    bottom: 200,
    zIndex: 10,
  },
});
