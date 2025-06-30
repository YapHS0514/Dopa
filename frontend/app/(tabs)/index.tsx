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
import { useReelAudioStore, useTTSAudioStore } from '../../lib/store';
import { playCombinedTTS } from '../../lib/ttsUtils';
import { CarouselCard } from '../../components/CarouselCard';
import { useDailyContentTracker } from '../../hooks/useDailyContentTracker';
import { useStreakData } from '../../hooks/useStreakData';
// StreakCelebrationModal moved to streaks.tsx

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getContentType = (fact: Fact): 'text' | 'reel' | 'carousel' => {
  // Use the contentType from backend if available, otherwise fallback to detection
  if (fact.contentType) {
    return fact.contentType;
  }
  // Fallback detection
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
    ...fact.fullContent
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
  isPlaying,
  onListen,
  onLike,
  onShare,
  onSave,
  liked,
  saved,
  listenLoading,
  onEngagementTracked,
  contentEngagementTracked,
}: {
  fact: Fact;
  isPlaying?: boolean;
  onListen?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  liked?: boolean;
  saved?: boolean;
  listenLoading?: boolean;
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
                tags={item.isHookCard ? fact.tags : undefined}
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

          // Engagement tracking logic from 1-549
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
      {/* Unified right-hand side buttons */}
      <ActionButtons
        fact={fact}
        style={styles.actionButtons}
        onListen={() => playCombinedTTS(fact.summary)}
      />
    </View>
  );
};

const ReelContent = ({
  fact,
  isVisible,
  screenFocused,
  isPlaying,
  isMuted,
  onListen,
  onLike,
  onShare,
  onSave,
  liked,
  saved,
  onEngagementTracked,
}: {
  fact: Fact;
  isVisible: boolean;
  screenFocused: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  onListen: () => void;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  liked: boolean;
  saved: boolean;
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
        isVisible={isVisible && screenFocused}
        contentId={fact.id}
        onLoadStart={() => console.log(`Loading reel: ${fact.id}`)}
        onLoad={() => console.log(`Reel loaded: ${fact.id}`)}
        onError={(error: string) =>
          console.error(`Reel error for ${fact.id}:`, error)
        }
        onEngagementTracked={onEngagementTracked}
      />
      {/* Unified right-hand side buttons */}
      <ActionButtons fact={reelFact} style={styles.actionButtons} />
    </View>
  );
};

// New component for Carousel content
const CarouselContent = ({
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
  // Ensure we have slides data
  if (!fact.slides || fact.slides.length === 0) {
    console.warn(
      `🎠 Carousel content ${fact.id} has no slides, falling back to text display`
    );
    return (
      <FactCarousel
        fact={fact}
        onEngagementTracked={onEngagementTracked}
        contentEngagementTracked={contentEngagementTracked}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CarouselCard
        slides={fact.slides}
        title={fact.hook}
        sourceUrl={fact.sourceUrl}
        tags={fact.tags}
        contentId={fact.id}
        onEngagementTracked={onEngagementTracked}
        contentEngagementTracked={contentEngagementTracked}
      />
      {/* Action buttons positioned on the right side */}
      <ActionButtons
        fact={{ ...fact, contentType: 'carousel' as const }}
        style={styles.actionButtons}
        onInteractionTracked={onEngagementTracked}
      />
    </View>
  );
};

export default function IndexScreen() {
  const [factIndex, setFactIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const lastTrackedContentId = useRef<string | null>(null);
  const celebrationTriggered = useRef<boolean>(false); // Still used to prevent multiple notifications

  // Navigation focus detection
  const isFocused = useIsFocused();
  const { pauseAllVideos } = useReelAudioStore();
  const { pauseAllAudio: pauseAllTTS, currentlyPlayingId } = useTTSAudioStore();

  // Daily content tracking and streak system
  const { progress, initializeDaily, trackContentInteraction } =
    useDailyContentTracker();

  const {
    currentStreak,
    fetchStreakData,
    setStreakNotification,
    hasUnseenStreakNotification,
  } = useStreakData();

  // Debug notification state
  useEffect(() => {
    console.log(`🔔 Streak notification state: ${hasUnseenStreakNotification}`);
  }, [hasUnseenStreakNotification]);

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
      console.log(
        '📱 IndexScreen: Screen lost focus, pausing all videos and TTS'
      );
      pauseAllVideos();
      pauseAllTTS();
    } else {
      console.log('📱 IndexScreen: Screen gained focus');
    }
  }, [isFocused, pauseAllVideos, pauseAllTTS]);

  // Initialize daily content tracking on mount
  useEffect(() => {
    initializeDaily();
    fetchStreakData().catch(console.error); // Handle potential promise rejection
    // Reset celebration trigger flag on mount
    celebrationTriggered.current = false;

    // Debug: Log celebration history on mount
    const checkCelebrationHistory = async () => {
      const { default: AsyncStorage } = await import(
        '@react-native-async-storage/async-storage'
      );
      const lastCelebration = await AsyncStorage.getItem(
        'lastStreakCelebration'
      );
      console.log(
        `🎯 DEBUG: Last celebration date on mount: ${lastCelebration || 'null'}`
      );

      // UNCOMMENT THIS LINE TO FORCE CLEAR CELEBRATION HISTORY FOR NEW ACCOUNTS:
      // if (lastCelebration) {
      //   console.log('🧹 Force clearing celebration history for new account');
      //   clearCelebrationHistory();
      // }
    };
    checkCelebrationHistory();
  }, [initializeDaily, fetchStreakData]);

  // StreakButton now handles its own data fetching

  // Engagement tracking state from 1-549
  const contentEngagementTracked = useRef<Set<string>>(new Set());

  // Enhanced track interaction that also marks content as tracked and handles daily streak progress
  const trackEngagement = useCallback(
    async (contentId: string, engagementType: string, value: number) => {
      contentEngagementTracked.current.add(contentId);

      // Track the interaction for recommendation engine
      trackInteraction(contentId, engagementType, value);

      // Track content consumption for daily streak system
      try {
        const trackingResult = await trackContentInteraction(contentId);
        console.log('🎯 Daily tracking result:', trackingResult);

        // Set notification when streak is earned or threshold reached
        if (
          (trackingResult.streakEarned || trackingResult.isNewThreshold) &&
          !celebrationTriggered.current
        ) {
          console.log(
            '🔔 Daily streak threshold reached! Setting notification...'
          );
          console.log(`   • Streak earned: ${trackingResult.streakEarned}`);
          console.log(`   • New threshold: ${trackingResult.isNewThreshold}`);

          // Mark as handled to prevent multiple notifications
          celebrationTriggered.current = true;

          // Fetch updated streak data
          const updatedStreakData = await fetchStreakData();

          // Set notification for user to see on streak button
          if (
            updatedStreakData.currentStreak > 0 ||
            trackingResult.isNewThreshold
          ) {
            const streakToShow = Math.max(1, updatedStreakData.currentStreak);
            console.log(
              `🔔 Setting streak notification for ${streakToShow} days`
            );
            setStreakNotification(true, streakToShow);
          }
        }
      } catch (error) {
        console.error('❌ Error tracking daily content:', error);
      }
    },
    [
      trackInteraction,
      trackContentInteraction,
      fetchStreakData,
      setStreakNotification,
    ]
  );

  // No longer needed - celebration modal moved to streaks.tsx

  // Handle scroll events for infinite loading
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      const currentIndex = Math.round(contentOffset.y / SCREEN_HEIGHT);

      // Minimal logging for production
      if (currentIndex !== factIndex) {
        console.log(`Scroll: moved to item ${currentIndex}/${facts.length}`);
      }

      // Engagement tracking for skipped text content (from 1-549)
      if (currentIndex !== factIndex && facts[factIndex]) {
        const previousContent = facts[factIndex];
        const contentType = getContentType(previousContent);
        // For text and carousel content, check if user skipped without swiping
        if (
          (contentType === 'text' || contentType === 'carousel') &&
          !contentEngagementTracked.current.has(previousContent.id)
        ) {
          console.log(
            `📖 ${contentType}Content ${previousContent.id}: Left without swiping - tracking as skip`
          );
          trackInteraction(previousContent.id, 'skip', -2);
          contentEngagementTracked.current.add(previousContent.id);
        }
      }

      // Track view when user switches to a new fact
      if (currentIndex !== factIndex && facts[currentIndex]) {
        const currentContentId = facts[currentIndex].id;
        if (lastTrackedContentId.current !== currentContentId) {
          setFactIndex(currentIndex);
          lastTrackedContentId.current = currentContentId;
          pauseAllTTS();
          trackInteraction(currentContentId, 'view', 1);
        }
      }

      // More aggressive loading: load when at 2nd item from end OR when at 3rd item
      const shouldLoadMore =
        (currentIndex >= facts.length - 2 ||
          currentIndex >= Math.max(2, facts.length - 3)) &&
        hasMore &&
        !loading;

      if (shouldLoadMore) {
        console.log(`Loading more content...`);
        loadMoreContent();
      }
    },
    [
      facts,
      factIndex,
      loadMoreContent,
      hasMore,
      loading,
      trackInteraction,
      pauseAllTTS,
    ]
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
      let isMuted = false;
      if (contentType === 'reel') {
        isMuted = useReelAudioStore.getState().isManuallyMuted(item.id);
      }
      if (contentType === 'reel') {
        return (
          <ReelContent
            fact={item}
            isVisible={isVisible}
            screenFocused={isFocused}
            isPlaying={isVisible && !isMuted}
            isMuted={isMuted}
            onListen={() => {}}
            onLike={() => {}}
            onShare={() => {}}
            onSave={() => {}}
            liked={false}
            saved={false}
            onEngagementTracked={trackEngagement}
          />
        );
      } else if (contentType === 'carousel') {
        return (
          <CarouselContent
            fact={item}
            onEngagementTracked={trackEngagement}
            contentEngagementTracked={contentEngagementTracked}
          />
        );
      } else {
        return (
          <FactCarousel
            fact={item}
            isPlaying={currentlyPlayingId === item.id}
            onListen={() => {}}
            onLike={() => {}}
            onShare={() => {}}
            onSave={() => {}}
            liked={false}
            saved={false}
            listenLoading={false}
            onEngagementTracked={trackEngagement}
            contentEngagementTracked={contentEngagementTracked}
          />
        );
      }
    },
    [factIndex, isFocused, currentlyPlayingId, trackEngagement]
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

        {/* Daily Progress Indicator */}
        {progress.current > 0 && progress.current < progress.threshold && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {progress.current}/{progress.threshold} today 📚
            </Text>
          </View>
        )}

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
          removeClippedSubviews={false}
          updateCellsBatchingPeriod={100}
          decelerationRate="fast"
          maxToRenderPerBatch={4} // Increased for better batch handling
          windowSize={7} // Larger window to keep more components mounted and reduce unmount/remount cycles
          initialNumToRender={3} // Start with more items
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }} // Help maintain position during re-renders
          onScrollToIndexFailed={(info) => {
            // Handle failed scroll - fallback to offset
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToOffset({
                offset: info.index * SCREEN_HEIGHT,
                animated: false,
              });
            });
          }}
          onEndReached={() => {
            // Backup infinite scroll trigger
            if (hasMore && !loading) {
              console.log('🔄 onEndReached: Loading more content');
              loadMoreContent();
            }
          }}
          onEndReachedThreshold={0.3} // Trigger earlier for better UX
        />
      )}
      {loading && facts.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.tint} />
        </View>
      )}

      {/* Streak celebration modal moved to streaks.tsx */}
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
    paddingBottom: 15,
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
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 95 : 143,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SF-Pro-Display',
    opacity: 0.8,
  },
});
