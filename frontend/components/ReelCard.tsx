import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Colors } from '../constants/Colors';
import { TopicTags } from './TopicTags';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useReelAudioStore } from '../lib/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ReelCardProps = {
  videoUrl: string;
  title: string;
  tags?: string[];
  isVisible: boolean;
  contentId: string;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onEngagementTracked?: (
    contentId: string,
    engagementType: string,
    value: number
  ) => void;
  disableEngagementTracking?: boolean; // For saved content view
};

export function ReelCard({
  videoUrl,
  title,
  tags,
  isVisible,
  contentId,
  onLoadStart,
  onLoad,
  onError,
  onEngagementTracked,
  disableEngagementTracking = false,
}: ReelCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetrying, setAutoRetrying] = useState(false);
  const videoRef = useRef<Video>(null);
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackStatusRef = useRef<AVPlaybackStatus | null>(null);

  // Enhanced engagement tracking
  const watchStartTime = useRef<number | null>(null);
  const hasTrackedEngagement = useRef(false);
  const totalWatchTime = useRef(0);

  // Enhanced Zustand store with cleanup capabilities
  const {
    shouldBeMuted,
    setCurrentlyPlaying,
    registerVideoRef,
    unregisterVideoRef,
    getCurrentlyPlaying,
    allReelsMuted,
  } = useReelAudioStore();

  const isMuted = shouldBeMuted(contentId, isVisible);
  const isCurrentlyPlaying = getCurrentlyPlaying() === contentId;

  console.log(
    `🎥 ReelCard ${contentId}: isVisible=${isVisible}, shouldBeMuted=${isMuted}, loaded=${isVideoLoaded}, playing=${isPlaying}`
  );

  // Register video ref with store for cleanup management
  useEffect(() => {
    if (videoRef.current && isVideoLoaded) {
      registerVideoRef(contentId, videoRef.current);
      return () => {
        unregisterVideoRef(contentId);
      };
    }
  }, [contentId, isVideoLoaded, registerVideoRef, unregisterVideoRef]);

  // Clear any loading timeout
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // Track engagement when user leaves this reel
  const trackEngagementOnLeave = useCallback(() => {
    if (
      disableEngagementTracking ||
      hasTrackedEngagement.current ||
      !watchStartTime.current
    )
      return;

    const watchDuration = (Date.now() - watchStartTime.current) / 1000; // Convert to seconds
    totalWatchTime.current += watchDuration;

    let engagementType: string;
    let engagementValue: number;

    if (totalWatchTime.current < 6) {
      engagementType = 'skip';
      engagementValue = -2;
    } else if (totalWatchTime.current < 12) {
      engagementType = 'partial';
      engagementValue = 0;
    } else {
      engagementType = 'engaged';
      engagementValue = 2;
    }

    console.log(
      `📊 ReelCard ${contentId}: Watch time ${totalWatchTime.current.toFixed(
        1
      )}s -> ${engagementType} (${engagementValue})`
    );

    hasTrackedEngagement.current = true;
    onEngagementTracked?.(contentId, engagementType, engagementValue);

    // Reset for potential re-entry
    watchStartTime.current = null;
  }, [contentId, onEngagementTracked, disableEngagementTracking]);

  // Safe video operation wrapper
  const safeVideoOperation = useCallback(
    async (operation: () => Promise<void>, operationName: string) => {
      if (!videoRef.current || !mountedRef.current) {
        console.log(
          `⚠️ ReelCard ${contentId}: Skipping ${operationName} - video ref or component not available`
        );
        return false;
      }

      try {
        await operation();
        return true;
      } catch (error) {
        console.error(
          `❌ ReelCard ${contentId}: Error in ${operationName}:`,
          error
        );
        return false;
      }
    },
    [contentId]
  );

  // Auto-retry logic with exponential backoff
  const autoRetry = useCallback(async () => {
    if (retryCount >= 3 || autoRetrying) {
      console.log(
        `❌ ReelCard ${contentId}: Max retries reached or already retrying`
      );
      return;
    }

    setAutoRetrying(true);
    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5 seconds

    console.log(
      `🔄 ReelCard ${contentId}: Auto-retry ${
        retryCount + 1
      }/3 in ${backoffDelay}ms`
    );

    setTimeout(() => {
      if (mountedRef.current) {
        setRetryCount((prev) => prev + 1);
        setHasError(false);
        setIsLoading(true);
        setIsVideoLoaded(false);
        setAutoRetrying(false);
      }
    }, backoffDelay);
  }, [contentId, retryCount, autoRetrying]);

  // Optimized video loading function
  const loadVideo = useCallback(
    async (shouldPlay: boolean = false) => {
      if (!videoRef.current || !mountedRef.current) return false;

      clearLoadingTimeout();

      // Set loading timeout (8 seconds for better UX)
      loadingTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !isVideoLoaded) {
          console.warn(`⏰ ReelCard ${contentId}: Loading timeout`);
          setHasError(true);
          setIsLoading(false);
          autoRetry();
        }
      }, 8000);

      return await safeVideoOperation(async () => {
        console.log(
          `📥 ReelCard ${contentId}: Loading video (shouldPlay: ${shouldPlay})`
        );

        if (!videoRef.current) {
          throw new Error('Video ref is null during loading');
        }

        await videoRef.current.loadAsync(
          { uri: videoUrl },
          {
            shouldPlay: false, // Always start paused for better control
            volume: 1.0,
            isMuted: true, // Always start muted, we'll update this after loading
            isLooping: true,
            progressUpdateIntervalMillis: 500,
          },
          false
        );

        // Verify video loaded successfully with proper null check
        if (!videoRef.current) {
          throw new Error('Video ref became null after loading');
        }

        const status = await videoRef.current.getStatusAsync();
        if (!status.isLoaded) {
          throw new Error('Video failed to load properly');
        }

        clearLoadingTimeout();

        if (mountedRef.current) {
          setIsVideoLoaded(true);
          setIsLoading(false);
          setHasError(false);
          setRetryCount(0); // Reset retry count on successful load

          // Update mute state after successful loading to prevent audio glitches
          if (videoRef.current) {
            try {
              await videoRef.current.setIsMutedAsync(isMuted);
              console.log(
                `🔊 ReelCard ${contentId}: Mute state set to ${isMuted} after loading`
              );
            } catch (error) {
              console.error(
                `❌ ReelCard ${contentId}: Error setting mute state after loading:`,
                error
              );
            }
          }

          // Start playback if requested
          if (shouldPlay && videoRef.current) {
            await videoRef.current.playAsync();
            setIsPlaying(true);
            setCurrentlyPlaying(contentId);
          }
        }

        console.log(`✅ ReelCard ${contentId}: Video loaded successfully`);
      }, 'loadVideo');
    },
    [
      contentId,
      videoUrl,
      isVideoLoaded,
      safeVideoOperation,
      clearLoadingTimeout,
      autoRetry,
      setCurrentlyPlaying,
      isMuted,
    ]
  );

  // Optimized visibility handling - SEPARATED from mute changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (isVisible && !hasError) {
        console.log(`🎬 ReelCard ${contentId}: Becoming visible`);

        // Start watch time tracking (only if engagement tracking is enabled)
        if (!disableEngagementTracking && !hasTrackedEngagement.current) {
          watchStartTime.current = Date.now();
          console.log(`⏱️ ReelCard ${contentId}: Started watch timer`);
        }

        if (!isVideoLoaded) {
          // Load and start playing
          await loadVideo(true);
        } else {
          // Video already loaded, just start playing
          const success = await safeVideoOperation(async () => {
            if (!videoRef.current) {
              throw new Error('Video ref is null during playback start');
            }
            await videoRef.current.playAsync();
            setIsPlaying(true);
            setCurrentlyPlaying(contentId);
          }, 'startPlayback');

          if (success) {
            console.log(`▶️ ReelCard ${contentId}: Resumed playback`);
          }
        }
      } else if (!isVisible && isVideoLoaded) {
        console.log(`🛑 ReelCard ${contentId}: Becoming invisible`);

        // Track engagement before pausing
        trackEngagementOnLeave();

        // Just pause, don't unload (better for performance and user experience)
        await safeVideoOperation(async () => {
          if (!videoRef.current) {
            throw new Error('Video ref is null during pause');
          }
          await videoRef.current.pauseAsync();
          setIsPlaying(false);

          // Only clear currently playing if this was the current video
          if (isCurrentlyPlaying) {
            setCurrentlyPlaying(null);
          }
        }, 'pausePlayback');
      }
    };

    handleVisibilityChange();
  }, [
    isVisible,
    hasError,
    isVideoLoaded,
    contentId,
    loadVideo,
    safeVideoOperation,
    setCurrentlyPlaying,
    isCurrentlyPlaying,
    trackEngagementOnLeave,
  ]);

  // Handle mute state changes WITHOUT affecting video loading
  useEffect(() => {
    if (!isVisible || !isVideoLoaded || !videoRef.current) return;

    const updateMuteState = async () => {
      console.log(
        `🔊 ReelCard ${contentId}: Updating mute state to ${isMuted}`
      );

      await safeVideoOperation(async () => {
        if (!videoRef.current) {
          console.warn(
            `⚠️ ReelCard ${contentId}: Video ref is null during mute update`
          );
          return;
        }
        await videoRef.current.setIsMutedAsync(isMuted);
        console.log(
          `✅ ReelCard ${contentId}: Mute state updated to ${isMuted}`
        );
      }, 'updateMuteState');
    };

    // Immediate update without delay to prevent audio glitches
    updateMuteState();
  }, [isMuted, isVisible, isVideoLoaded, contentId, safeVideoOperation]);

  // Preload when component mounts (for better scroll performance)
  useEffect(() => {
    if (!hasError && !isVideoLoaded) {
      // Preload with a delay to not interfere with current video
      const preloadDelay = isVisible ? 0 : 500; // Load immediately if visible, delay if not

      const preloadTimer = setTimeout(() => {
        if (mountedRef.current && !isVideoLoaded && !hasError) {
          console.log(`🔄 ReelCard ${contentId}: Preloading video...`);
          loadVideo(false); // Preload without playing
        }
      }, preloadDelay);

      return () => clearTimeout(preloadTimer);
    }
  }, [contentId, hasError, isVideoLoaded, isVisible, loadVideo]);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`🧹 ReelCard ${contentId}: Component unmounting`);

      // Track engagement before unmounting if needed
      trackEngagementOnLeave();

      mountedRef.current = false;
      clearLoadingTimeout();

      // Cleanup video resources
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch((error) => {
          console.error(`❌ ReelCard ${contentId}: Cleanup error:`, error);
        });
      }
    };
  }, [contentId, clearLoadingTimeout, trackEngagementOnLeave]);

  // Enhanced playback status handler
  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!mountedRef.current) return;

      playbackStatusRef.current = status;

      if (status.isLoaded) {
        // Update playing state based on actual playback status
        if (status.isPlaying !== isPlaying) {
          setIsPlaying(status.isPlaying);
        }

        // Handle video completion and looping
        if (status.didJustFinish && !status.isLooping) {
          // Track as engaged if user watched to completion (only if engagement tracking is enabled)
          if (
            !disableEngagementTracking &&
            !hasTrackedEngagement.current &&
            watchStartTime.current
          ) {
            console.log(
              `🎯 ReelCard ${contentId}: Video completed - tracking as engaged`
            );
            hasTrackedEngagement.current = true;
            onEngagementTracked?.(contentId, 'engaged', 2);
          }

          safeVideoOperation(async () => {
            if (!videoRef.current) {
              throw new Error('Video ref is null during replay');
            }
            await videoRef.current.replayAsync();
          }, 'replayVideo');
        }

        // Detect corrupted/invalid videos
        if (status.durationMillis && status.durationMillis < 100) {
          console.warn(
            `⚠️ ReelCard ${contentId}: Video might be corrupted (duration: ${status.durationMillis}ms)`
          );
          setHasError(true);
          setIsLoading(false);
          autoRetry();
        }
      } else if (status.error) {
        console.error(
          `❌ ReelCard ${contentId}: Playback error:`,
          status.error
        );
        setHasError(true);
        setIsLoading(false);
        autoRetry();
      }
    },
    [contentId, isPlaying, safeVideoOperation, autoRetry]
  );

  const handleVideoLoad = useCallback(() => {
    if (!mountedRef.current) return;
    console.log(`📹 ReelCard ${contentId}: Video loaded successfully`);
    clearLoadingTimeout();
    setIsVideoLoaded(true);
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
    onLoad?.();
  }, [contentId, clearLoadingTimeout, onLoad]);

  const handleVideoError = useCallback(
    (error: any) => {
      if (!mountedRef.current) return;
      console.error(`❌ ReelCard ${contentId}: Video load error:`, error);
      console.error(`❌ ReelCard ${contentId}: Video URL:`, videoUrl);
      clearLoadingTimeout();
      setIsLoading(false);
      setHasError(true);
      setIsVideoLoaded(false);
      onError?.(error.message || 'Failed to load video');
      autoRetry();
    },
    [contentId, videoUrl, clearLoadingTimeout, onError, autoRetry]
  );

  const togglePlayPause = useCallback(async () => {
    if (!isVideoLoaded) return;

    await safeVideoOperation(async () => {
      if (!videoRef.current) {
        throw new Error('Video ref is null during toggle play/pause');
      }
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
        setCurrentlyPlaying(contentId);
      }
    }, 'togglePlayPause');
  }, [
    isVideoLoaded,
    isPlaying,
    contentId,
    safeVideoOperation,
    setCurrentlyPlaying,
  ]);

  const handleManualRetry = useCallback(() => {
    console.log(`🔄 ReelCard ${contentId}: Manual retry requested`);
    setRetryCount(0);
    setAutoRetrying(false);
    setHasError(false);
    setIsLoading(true);
    setIsVideoLoaded(false);
  }, [contentId]);

  const handleDismissError = useCallback(() => {
    console.log(`❌ ReelCard ${contentId}: Error dismissed by user`);
    // This could trigger a callback to parent to skip this video
    onError?.('Video dismissed by user');
  }, [contentId, onError]);

  useEffect(() => {
    if (videoRef.current && isVisible) {
      videoRef.current.setIsMutedAsync(allReelsMuted);
    }
  }, [allReelsMuted, isVisible]);

  if (hasError && !autoRetrying) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="videocam-off" size={48} color="#666" />
        <Text style={styles.errorText}>Video unavailable</Text>
        <Text style={styles.errorSubtext}>{title}</Text>

        {retryCount < 3 ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleManualRetry}
          >
            <Text style={styles.retryText}>Tap to retry ({retryCount}/3)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleManualRetry}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismissError}
            >
              <Text style={styles.dismissText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <Animatable.View animation="fadeInUp" style={styles.container}>
      {/* Topic Tags */}
      {tags && tags.length > 0 && (
        <TopicTags tags={tags} style={styles.topicTags} />
      )}

      {/* Video Player */}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={togglePlayPause}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted={true} // Start muted, controlled via setIsMutedAsync
          volume={1.0}
          shouldPlay={false} // Manual control only
          useNativeControls={false}
          progressUpdateIntervalMillis={500}
          onLoad={handleVideoLoad}
          onError={handleVideoError}
          onLoadStart={() => {
            if (mountedRef.current) {
              setIsLoading(true);
              console.log(`🔄 ReelCard ${contentId}: Video load started`);
              onLoadStart?.();
            }
          }}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Loading Indicator */}
        {(isLoading || autoRetrying) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            {autoRetrying && (
              <Text style={styles.loadingText}>
                Retrying... ({retryCount}/3)
              </Text>
            )}
          </View>
        )}

        {/* Play/Pause Indicator */}
        {!isLoading && !isPlaying && isVideoLoaded && !autoRetrying && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={64} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Video Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Debug: Show current audio state */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Visible: {isVisible ? 'YES' : 'NO'} | Muted:{' '}
            {isMuted ? 'YES' : 'NO'} | Playing: {isPlaying ? 'YES' : 'NO'} |
            Loaded: {isVideoLoaded ? 'YES' : 'NO'} | Retries: {retryCount}
          </Text>
        </View>
      )}
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  dismissButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,0,0,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
  },
  dismissText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 80,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topicTags: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 15,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SF-Pro-Display',
  },
});
