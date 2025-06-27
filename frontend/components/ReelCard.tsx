import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
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
  contentId: string; // Add contentId for audio state management
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
  const videoRef = useRef<Video>(null);

  // Use clean Zustand store for TikTok-like behavior
  const { shouldBeMuted, setCurrentlyPlaying } = useReelAudioStore();
  const isMuted = shouldBeMuted(contentId, isVisible);
  
  console.log(`🎥 ReelCard ${contentId}: isVisible = ${isVisible}, shouldBeMuted = ${isMuted}`);

  // Configure audio mode for proper mobile playback
  useEffect(() => {
    const configureAudio = async () => {
      try {
        // Request audio permissions first
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn(`⚠️ Audio permission not granted for ${contentId}`);
          return;
        }

        // Configure audio mode for video playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true, // Critical for iOS
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false, // Don't duck other audio
          playThroughEarpieceAndroid: false, // Use speakers
        });
        console.log(`🔊 Audio mode configured for ${contentId}`);
      } catch (error) {
        console.error(`❌ Failed to configure audio mode:`, error);
      }
    };

    configureAudio();
  }, [contentId]);

  // TikTok-like onEnter/onExit visibility logic
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!videoRef.current) return;

      if (isVisible && !hasError) {
        // 🎬 ON ENTER: Play and handle audio
        console.log(`🔊 ReelCard ${contentId}: ON ENTER - Starting playback`);
        
        try {
          // Ensure video is loaded first
          const status = await videoRef.current.getStatusAsync();
          if (!status.isLoaded) {
            console.log(`⏳ ReelCard ${contentId}: Video not loaded yet, waiting...`);
            return;
          }

          // Set audio properties
          console.log(`🔊 Setting volume to 1.0 and muted to ${isMuted} for ${contentId}`);
          await videoRef.current.setVolumeAsync(1.0);
          await videoRef.current.setIsMutedAsync(isMuted);
          
          // Small delay to ensure audio settings take effect
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Start playback
          await videoRef.current.playAsync();
          setIsPlaying(true);
          setCurrentlyPlaying(contentId);
          
          // Verify final status
          const finalStatus = await videoRef.current.getStatusAsync();
          if (finalStatus.isLoaded) {
            console.log(`✅ ReelCard ${contentId}: Playing - Volume: ${finalStatus.volume}, Muted: ${finalStatus.isMuted}, Playing: ${finalStatus.isPlaying}`);
          }
        } catch (error) {
          console.error(`❌ ReelCard ${contentId}: Error starting playback:`, error);
        }
      } else {
        // 🛑 ON EXIT: Pause and mute
        console.log(`🔇 ReelCard ${contentId}: ON EXIT - Stopping playback`);
        
        try {
          await videoRef.current.pauseAsync();
          await videoRef.current.setIsMutedAsync(true); // Always mute on exit
          setIsPlaying(false);
          
          if (!isVisible) {
            setCurrentlyPlaying(null);
          }
          
          console.log(`⏸️ ReelCard ${contentId}: Paused and muted`);
        } catch (error) {
          console.error(`❌ ReelCard ${contentId}: Error pausing:`, error);
        }
      }
    };

    handleVisibilityChange();
  }, [isVisible, hasError, contentId, isMuted, setCurrentlyPlaying]);

  // Handle mute state changes for visible videos
  useEffect(() => {
    const updateMuteState = async () => {
      if (videoRef.current && isVisible && isPlaying) {
        console.log(`🔊 ReelCard ${contentId}: Updating mute state to ${isMuted}`);
        try {
          // Ensure video is still loaded
          const status = await videoRef.current.getStatusAsync();
          if (!status.isLoaded) {
            console.log(`⏳ ReelCard ${contentId}: Video not loaded for mute update`);
            return;
          }

          await videoRef.current.setIsMutedAsync(isMuted);
          
          // Small delay to let the change take effect
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Verify the change
          const newStatus = await videoRef.current.getStatusAsync();
          if (newStatus.isLoaded) {
            console.log(`🔊 ReelCard ${contentId}: Mute updated - Volume: ${newStatus.volume}, Muted: ${newStatus.isMuted}`);
          }
        } catch (error) {
          console.error(`❌ ReelCard ${contentId}: Error updating mute:`, error);
        }
      }
    };

    updateMuteState();
  }, [isMuted, isVisible, isPlaying, contentId]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      
      // Loop the video
      if (status.didJustFinish && !status.isLooping) {
        videoRef.current?.replayAsync();
      }
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleVideoError = (error: any) => {
    console.error('Video load error:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.(error.message || 'Failed to load video');
  };

  // Mute state is now managed entirely through the Zustand store
  // and controlled by the ActionButtons component

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="videocam-off" size={48} color="#666" />
        <Text style={styles.errorText}>Failed to load video</Text>
        <Text style={styles.errorSubtext}>{title}</Text>
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
          isMuted={false} // Let manual control handle muting
          volume={1.0} // Always max volume, use mute for audio control
          shouldPlay={false} // We control playback manually
          useNativeControls={false}
          onLoad={handleVideoLoad}
          onError={handleVideoError}
          onLoadStart={() => {
            setIsLoading(true);
            onLoadStart?.();
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
        {!isLoading && !isPlaying && (
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
            Playing: {isPlaying ? 'YES' : 'NO'}
          </Text>
        </View>
      )}

      {/* Note: Mute controls are now handled by ActionButtons component */}
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
  controls: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  muteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mutedButton: {
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  unmutedButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
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