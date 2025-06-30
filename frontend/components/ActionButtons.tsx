import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Audio } from 'expo-av';
import { apiClient } from '../lib/api';
import { useSavedContent } from '../contexts/SavedContentContext';
import { useReelAudioStore, useTTSAudioStore } from '../lib/store';
import { playCombinedTTS } from '../lib/ttsUtils';

interface ActionButtonsProps {
  fact?: any; // TODO: Replace with proper Fact type from backend
  style?: any;
  onInteractionTracked?: (
    contentId: string,
    interactionType: string,
    value: number
  ) => void;
  onListen?: () => void;
}

export default function ActionButtons({
  fact,
  style,
  onInteractionTracked,
  onListen,
}: ActionButtonsProps) {
  const [liked, setLiked] = useState(false);
  const [listening, setListening] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [ttsAudioUri, setTTSAudioUri] = useState<string | null>(null);
  const [ttsPlaybackObj, setTTSPlaybackObj] = useState<Audio.Sound | null>(
    null
  );
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use the saved content context for efficient checking
  const {
    isContentSaved,
    addSavedContent,
    removeSavedContent,
    getSavedItemId,
  } = useSavedContent();

  // Use clean Reel audio store
  const {
    isManuallyMuted,
    toggleMute: toggleReelMute,
    getCurrentlyPlaying,
    allReelsMuted,
    toggleAllReelsMute,
  } = useReelAudioStore();

  // Use TTS audio store
  const {
    currentlyPlayingId: ttsCurrentlyPlaying,
    isLoading: ttsLoading,
    setCurrentlyPlaying: setTTSCurrentlyPlaying,
    setAudioRef: setTTSAudioRef,
    setLoading: setTTSLoading,
    stopCurrentAudio: stopTTSCurrent,
  } = useTTSAudioStore();

  // Get saved status immediately from context - no API calls needed!
  const saved = fact?.id ? isContentSaved(fact.id) : false;

  // Determine content type and audio state
  const isReel = fact?.contentType === 'reel' || fact?.video_url;
  const isCurrentReel = getCurrentlyPlaying() === fact?.id;
  const reelIsManuallyMuted = useReelAudioStore(
    React.useCallback((store) => store.isManuallyMuted(fact?.id), [fact?.id])
  );

  // TTS state
  const isCurrentTTS = ttsCurrentlyPlaying === fact?.id;
  const isListening = isAudioPlaying || listening || isCurrentTTS;

  // Unified Listen button logic for both Reels and Slides
  let listenPlaying = false;
  if (isReel) {
    listenPlaying = isCurrentReel && !allReelsMuted;
  } else {
    listenPlaying = isListening;
  }
  const listenIcon = listenPlaying ? 'volume-high' : 'volume-medium';
  const listenColor = isPlaying ? '#FFD700' : '#fff';

  // Debug logging
  console.log(
    `🎬 ActionButtons - ID: ${fact?.id}, Type: ${fact?.contentType}, Is Reel: ${isReel}, Is Current: ${isCurrentReel}, Manually Muted: ${reelIsManuallyMuted}, TTS Playing: ${isCurrentTTS}, ListenPlaying: ${listenPlaying}`
  );

  const likeAnim = useRef(new Animated.Value(1)).current;
  const listenAnim = useRef(new Animated.Value(1)).current;
  const shareAnim = useRef(new Animated.Value(1)).current;
  const saveAnim = useRef(new Animated.Value(1)).current;

  // Animation for button press
  const animatePress = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = () => {
    animatePress(likeAnim);
    const newLikedState = !liked;
    setLiked(newLikedState);

    // Track like interaction
    if (fact?.id && newLikedState) {
      console.log(`❤️ ActionButtons: Like tracked for ${fact.id}`);
      onInteractionTracked?.(fact.id, 'like', 10); // +10 points for like
    }

    // TODO: Send like status to backend API for persistence
    // Example: await api.likeFact(fact.id, newLikedState)
  };

  const [isSavingContent, setIsSavingContent] = useState(false);

  const handleSave = async () => {
    animatePress(saveAnim);

    if (!fact?.id) {
      Alert.alert('Error', 'Content ID not available');
      return;
    }

    if (isSavingContent) {
      console.log('Save operation already in progress, skipping...');
      return;
    }

    setIsSavingContent(true);

    try {
      if (!saved) {
        // Save the content
        console.log('Saving content:', fact.id);
        const response = (await apiClient.saveContent(fact.id)) as {
          data?: { id: string }; // The saved record with its ID
          message: string;
          saved_count: number;
          max_saves: number;
        };

        // Extract saved_id from response data or use a placeholder as fallback
        const savedId = response.data?.id || `temp_${Date.now()}`;

        // Update context immediately for instant UI feedback
        addSavedContent(fact.id, savedId);
        console.log(
          `Saved! ${response.message} (${response.saved_count}/${response.max_saves})`
        );

        // Log the extracted saved ID for debugging
        console.log(`Extracted saved ID: ${savedId}`);

        // Track save interaction
        console.log(`💾 ActionButtons: Save tracked for ${fact.id}`);
        onInteractionTracked?.(fact.id, 'save', 5); // +5 points for save
      } else {
        // Unsave the content - now we can do this efficiently!
        console.log('Unsaving content:', fact.id);

        // Get the saved item ID from our cached context (no API call needed!)
        const savedItemId = getSavedItemId(fact.id);

        if (savedItemId) {
          // Remove from backend
          await apiClient.removeSavedContent(savedItemId);

          // Update context immediately for instant UI feedback
          removeSavedContent(fact.id);
          console.log('Content removed from saved list');
        } else {
          console.warn('No saved item ID found for content:', fact.id);
          // Still try to remove from local state in case of inconsistency
          removeSavedContent(fact.id);
        }
      }
    } catch (error: any) {
      console.error('Error toggling save state:', error);

      if (error.message?.includes('maximum number of saves')) {
        Alert.alert('Save Limit Reached', error.message);
        // Revert the optimistic update if it failed
        if (!saved) {
          removeSavedContent(fact.id);
        }
      } else if (error.message?.includes('already saved')) {
        console.log('Content already saved, keeping UI updated');
        // Don't revert - keep the saved state
      } else if (error.status === 429) {
        console.log('Rate limited - too many requests');
        // Don't show alert for rate limiting, just log
        // Keep the optimistic update - it will sync eventually
      } else {
        console.error('Failed to save/unsave content:', error.message || error);
        // Revert the optimistic update for other errors
        if (saved) {
          // Was trying to unsave, revert by adding back
          const savedId = getSavedItemId(fact.id);
          if (savedId) {
            addSavedContent(fact.id, savedId);
          } else {
            console.warn(
              'Cannot revert unsave operation - no saved ID available. Content may appear unsaved until next refresh.'
            );
            // Don't add back to saved state without a proper ID to avoid future UUID errors
            // The saved content context will be refreshed on next app load to sync with backend
          }
        } else {
          // Was trying to save, revert by removing
          removeSavedContent(fact.id);
        }
        Alert.alert('Error', error.message || 'Failed to update save status');
      }
    } finally {
      // Add a delay to prevent rapid successive calls
      setTimeout(() => setIsSavingContent(false), 1500);
    }
  };

  const handleListen = async () => {
    if (isPlaying) return;
    animatePress(listenAnim);
    setIsPlaying(true);
    if (onListen) {
      try {
        await onListen();
      } finally {
        setIsPlaying(false);
      }
      return;
    }
    if (isReel) {
      toggleAllReelsMute();
      setIsPlaying(false);
    } else {
      try {
        await playCombinedTTS(fact.summary);
      } catch (err) {
        console.error('TTS error:', err);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  const handleShare = () => {
    animatePress(shareAnim);
    // TODO: Implement share functionality with backend
    // Example: Generate shareable link from backend and use Share API
    // const shareUrl = await api.generateShareLink(fact.id)
    // Share.share({ message: `Check out this fact: ${shareUrl}` })
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  useEffect(() => {
    return () => {
      if (ttsPlaybackObj) {
        ttsPlaybackObj.unloadAsync();
      }
    };
  }, [ttsPlaybackObj]);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
        <Animated.View
          style={[styles.button, { transform: [{ scale: likeAnim }] }]}
        >
          <Ionicons
            name={'heart'}
            size={32}
            color={liked ? '#ef4444' : Colors.text}
          />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleListen}
        activeOpacity={0.7}
        disabled={isPlaying}
      >
        <Animated.View
          style={[styles.button, { transform: [{ scale: listenAnim }] }]}
        >
          {ttsLoading ? (
            <Ionicons name="hourglass-outline" size={32} color={listenColor} />
          ) : (
            <Ionicons name={listenIcon} size={32} color={listenColor} />
          )}
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
        <Animated.View
          style={[styles.button, { transform: [{ scale: shareAnim }] }]}
        >
          <Ionicons name={'share-social'} size={32} color={Colors.text} />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
        <Animated.View
          style={[styles.buttonLast, { transform: [{ scale: saveAnim }] }]}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={32}
            color={saved ? '#FFD700' : Colors.text}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    // Unified absolute positioning for both Reels and Slides
    position: 'absolute',
    right: 15,
    bottom: 100,
    zIndex: 10,
  },
  button: {
    marginBottom: 25,
  },
  buttonLast: {
    // No margin for the last button
  },
});
