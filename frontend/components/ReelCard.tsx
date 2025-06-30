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

  // Component mounting detection
  useEffect(() => {
    mountedRef.current = true;
  }, []); // Empty dependency array ensures this runs on every mount

  // Enhanced Zustand store with cleanup capabilities
  const {
    shouldBeMuted,
    setCurrentlyPlaying,
    registerVideoRef,
    unregisterVideoRef,
    getCurrentlyPlaying,
  } = useReelAudioStore();

  const isMuted = shouldBeMuted(contentId, isVisible);
  const isCurrentlyPlaying = getCurrentlyPlaying() === contentId;

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

    hasTrackedEngagement.current = true;
    onEngagementTracked?.(contentId, engagementType, engagementValue);

    // Reset for potential re-entry
    watchStartTime.current = null;
  }, [contentId, onEngagementTracked, disableEngagementTracking]);

  // Safe video operation wrapper
  const safeVideoOperation = useCallback(
    async (operation: () => Promise<void>, operationName: string) => {
      if (!videoRef.current || !mountedRef.current) {
        return false;
      }

      try {
        await operation();
        return true;
      } catch (error) {
        return false;
      }
    },
    [contentId]
  );

  // Auto-retry logic with exponential backoff
  const autoRetry = useCallback(async () => {
    if (retryCount >= 3 || autoRetrying) {
      return;
    }

    setAutoRetrying(true);
    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5 seconds

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
          setHasError(true);
          setIsLoading(false);
          autoRetry();
        }
      }, 8000);

      return await safeVideoOperation(async () => {
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
            } catch (error) {
            }
          }

          // Start playback if requested
          if (shouldPlay && videoRef.current) {
            await videoRef.current.playAsync();
            setIsPlaying(true);
            setCurrentlyPlaying(contentId);
          }
        }
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
        if (!disableEngagementTracking && !hasTrackedEngagement.current) {
          watchStartTime.current = Date.now();
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
          }
        }
      } else if (!isVisible && isVideoLoaded) {
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
      await safeVideoOperation(async () => {
        if (!videoRef.current) {
          return;
        }
        await videoRef.current.setIsMutedAsync(isMuted);
      }, 'updateMuteState');
    };

    // Immediate update without delay to prevent audio glitches
    updateMuteState();
  }, [isMuted, isVisible, isVideoLoaded, contentId, safeVideoOperation]);

  // Simple video loading when component needs it
  useEffect(() => {
    if (mountedRef.current && !isVideoLoaded && !isLoading && !hasError) {
      setIsLoading(true);
      loadVideo(false);
    }
  }, [contentId, isVideoLoaded, isLoading, hasError, loadVideo]); // Trigger when visibility or state changes

  // Preload when component mounts (for better scroll performance)
  useEffect(() => {
    if (!hasError && !isVideoLoaded) {
      // Preload with a delay to not interfere with current video
      const preloadDelay = isVisible ? 0 : 500; // Load immediately if visible, delay if not

      const preloadTimer = setTimeout(() => {
        if (mountedRef.current && !isVideoLoaded && !hasError) {
          loadVideo(false); // Preload without playing
        }
      }, preloadDelay);

      return () => clearTimeout(preloadTimer);
    }
  }, [contentId, hasError, isVideoLoaded, isVisible, loadVideo]);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      // Track engagement before unmounting if needed
      trackEngagementOnLeave();

      mountedRef.current = false;
      clearLoadingTimeout();

      // Cleanup video resources
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch((error) => {
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
          setHasError(true);
          setIsLoading(false);
          autoRetry();
        }
      } else if (status.error) {
        setHasError(true);
        setIsLoading(false);
        autoRetry();
      }
    },
    [contentId, isPlaying, safeVideoOperation, autoRetry]
  );

  const handleVideoLoad = useCallback(() => {
    if (!mountedRef.current) return;
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
      setIsLoading(false);
      setHasError(true);
      setIsVideoLoaded(false);
      onError?.(error.message || 'Failed to load video');
      autoRetry();
    },
    [contentId, onError, autoRetry]
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
    setRetryCount(0);
    setAutoRetrying(false);
    setHasError(false);
    setIsLoading(true);
    setIsVideoLoaded(false);
  }, []);

  const handleDismissError = useCallback(() => {
    onError?.('Video dismissed by user');
  }, [onError]);

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
});
