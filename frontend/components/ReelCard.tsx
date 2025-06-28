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
}: ReelCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<Video>(null);
  const cleanupInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Enhanced Zustand store with cleanup capabilities
  const { 
    shouldBeMuted, 
    setCurrentlyPlaying, 
    registerVideoRef, 
    unregisterVideoRef,
    unloadPreviousVideo 
  } = useReelAudioStore();
  
  const isMuted = shouldBeMuted(contentId, isVisible);
  
  console.log(`🎥 ReelCard ${contentId}: isVisible=${isVisible}, shouldBeMuted=${isMuted}, loaded=${isVideoLoaded}`);

  // Register video ref with store for cleanup management
  useEffect(() => {
    if (videoRef.current && isVideoLoaded) {
      registerVideoRef(contentId, videoRef.current);
      return () => {
        unregisterVideoRef(contentId);
      };
    }
  }, [contentId, isVideoLoaded, registerVideoRef, unregisterVideoRef]);

  // Simple check for safe operations
  const canPerformOperation = () => {
    return videoRef.current && mountedRef.current && !cleanupInProgress.current;
  };

  // Preload video when component mounts (even if not visible yet)
  useEffect(() => {
    if (!hasError && videoRef.current && !isVideoLoaded) {
      const preloadVideo = async () => {
        try {
          console.log(`🔄 ReelCard ${contentId}: Preloading video...`);
          await videoRef.current!.loadAsync({ uri: videoUrl }, { shouldPlay: false }, false);
          console.log(`✅ ReelCard ${contentId}: Video preloaded`);
        } catch (error) {
          console.log(`⚠️ ReelCard ${contentId}: Preload failed, will try on visibility`);
        }
      };
      
      // Small delay before preloading to not interfere with current video
      setTimeout(preloadVideo, 200);
    }
  }, [contentId, videoUrl, hasError, isVideoLoaded]);

  // Enhanced visibility effect with proper cleanup
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (cleanupInProgress.current) return;

      if (isVisible && !hasError) {
        // 🎬 ON ENTER: Unload previous video and start this one
        console.log(`🎬 ReelCard ${contentId}: ON ENTER - Starting playback`);
        
        // First, unload any previous video to prevent conflicts
        await unloadPreviousVideo(contentId);
        
        // Minimal delay to ensure previous video is fully unloaded
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Always try to load and play, regardless of current loaded state
        if (!videoRef.current || !mountedRef.current) return;
        
        try {
          console.log(`📥 ReelCard ${contentId}: Loading video...`);
          
          // Set a timeout for loading to prevent infinite loading
          const loadTimeout = setTimeout(() => {
            if (mountedRef.current && !isVideoLoaded) {
              console.warn(`⏰ ReelCard ${contentId}: Loading timeout, marking as error`);
              setHasError(true);
              setIsLoading(false);
            }
          }, 10000); // 10 second timeout
          
          // Load the video with optimized settings
          await videoRef.current.loadAsync(
            { uri: videoUrl }, 
            { 
              shouldPlay: false,
              volume: 1.0,
              isMuted: isMuted,
              isLooping: true
            }, 
            false
          );
          
          clearTimeout(loadTimeout);
          
          // Verify video loaded successfully
          const status = await videoRef.current.getStatusAsync();
          if (!status.isLoaded) {
            throw new Error('Video failed to load properly');
          }
          
          // Start playback immediately
          await videoRef.current.playAsync();
          
          if (mountedRef.current) {
            setIsPlaying(true);
            setIsVideoLoaded(true);
            setCurrentlyPlaying(contentId);
          }
          
          console.log(`✅ ReelCard ${contentId}: Successfully started playback`);
        } catch (error) {
          console.error(`❌ ReelCard ${contentId}: Error starting playback:`, error);
          if (mountedRef.current) {
            setHasError(true);
            setIsLoading(false);
          }
        }
      } else {
        // 🛑 ON EXIT: Pause, mute, and unload
        console.log(`🛑 ReelCard ${contentId}: ON EXIT - Stopping and unloading`);
        
        if (videoRef.current && isVideoLoaded) {
          try {
            await videoRef.current.pauseAsync();
            await videoRef.current.setIsMutedAsync(true);
            await videoRef.current.unloadAsync();
            
            if (mountedRef.current) {
              setIsPlaying(false);
              setIsVideoLoaded(false);
              if (!isVisible) {
                setCurrentlyPlaying(null);
              }
            }
            
            console.log(`✅ ReelCard ${contentId}: Successfully stopped and unloaded`);
          } catch (error) {
            console.error(`❌ ReelCard ${contentId}: Error stopping:`, error);
          }
        }
      }
    };

    handleVisibilityChange();
  }, [isVisible, hasError, contentId, isMuted, setCurrentlyPlaying, unloadPreviousVideo, videoUrl]);

  // Handle mute state changes for visible videos
  useEffect(() => {
    if (!isVisible || !isPlaying || !isVideoLoaded) return;

    const updateMuteState = async () => {
      console.log(`🔊 ReelCard ${contentId}: Updating mute state to ${isMuted}`);
      
      if (canPerformOperation()) {
        try {
          await videoRef.current!.setIsMutedAsync(isMuted);
          console.log(`✅ ReelCard ${contentId}: Mute state updated to ${isMuted}`);
        } catch (error) {
          console.error(`❌ ReelCard ${contentId}: Error updating mute:`, error);
        }
      }
    };

    updateMuteState();
  }, [isMuted, isVisible, isPlaying, isVideoLoaded, contentId]);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`🧹 ReelCard ${contentId}: Component unmounting - cleaning up`);
      mountedRef.current = false;
      cleanupInProgress.current = true;
      
      // Cleanup video resources
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch((error) => {
          console.error(`❌ ReelCard ${contentId}: Cleanup error:`, error);
        });
      }
    };
  }, [contentId]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!mountedRef.current) return;

    if (status.isLoaded) {
      if (!isVideoLoaded) {
        setIsVideoLoaded(true);
        setIsLoading(false);
        console.log(`📹 ReelCard ${contentId}: Video loaded via status update`);
      }
      setIsPlaying(status.isPlaying);
      
      // Loop the video
      if (status.didJustFinish && !status.isLooping) {
        videoRef.current?.replayAsync();
      }
      
      // Check for corrupted video (duration is 0 or very small)
      if (status.durationMillis && status.durationMillis < 100) {
        console.warn(`⚠️ ReelCard ${contentId}: Video might be corrupted (duration: ${status.durationMillis}ms)`);
        setHasError(true);
        setIsLoading(false);
      }
    } else if (status.error) {
      console.error(`❌ ReelCard ${contentId}: Playback error:`, status.error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleVideoLoad = () => {
    if (!mountedRef.current) return;
    console.log(`📹 ReelCard ${contentId}: Video loaded successfully`);
    setIsVideoLoaded(true);
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleVideoError = (error: any) => {
    if (!mountedRef.current) return;
    console.error(`❌ ReelCard ${contentId}: Video load error:`, error);
    console.error(`❌ ReelCard ${contentId}: Video URL:`, videoUrl);
    setIsLoading(false);
    setHasError(true);
    setIsVideoLoaded(false);
    onError?.(error.message || 'Failed to load video');
  };

  const togglePlayPause = async () => {
    if (!isVideoLoaded || !canPerformOperation()) return;
    
    try {
      if (isPlaying) {
        await videoRef.current!.pauseAsync();
      } else {
        await videoRef.current!.playAsync();
      }
    } catch (error) {
      console.error(`❌ ReelCard ${contentId}: Error toggling play/pause:`, error);
    }
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="videocam-off" size={48} color="#666" />
        <Text style={styles.errorText}>Video unavailable</Text>
        <Text style={styles.errorSubtext}>{title}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            console.log(`🔄 ReelCard ${contentId}: Retrying video load...`);
            setHasError(false);
            setIsLoading(true);
            setIsVideoLoaded(false);
          }}
        >
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
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
          isMuted={true} // Start muted, will be controlled manually
          volume={1.0}
          shouldPlay={false} // Manual control only
          useNativeControls={false}
          progressUpdateIntervalMillis={500}
          positionMillis={0}
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
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Play/Pause Indicator */}
        {!isLoading && !isPlaying && isVideoLoaded && (
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
            Visible: {isVisible ? 'YES' : 'NO'} | 
            Muted: {isMuted ? 'YES' : 'NO'} | 
            Playing: {isPlaying ? 'YES' : 'NO'} |
            Loaded: {isVideoLoaded ? 'YES' : 'NO'}
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
  retryButton: {
    marginTop: 16,
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
}); 