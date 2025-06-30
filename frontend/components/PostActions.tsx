import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VolumeX, Volume2 } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface PostActionsProps {
  isPlaying: boolean;
  isReel?: boolean;
  isCurrentReel?: boolean;
  isMuted?: boolean;
  onListen: () => void;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  liked: boolean;
  saved: boolean;
  style?: any;
  listenLoading?: boolean;
}

export default function PostActions({
  isPlaying,
  isReel = false,
  isCurrentReel = false,
  isMuted = false,
  onListen,
  onLike,
  onShare,
  onSave,
  liked,
  saved,
  style,
  listenLoading = false,
}: PostActionsProps) {
  // Animations
  const likeAnim = useRef(new Animated.Value(1)).current;
  const listenAnim = useRef(new Animated.Value(1)).current;
  const shareAnim = useRef(new Animated.Value(1)).current;
  const saveAnim = useRef(new Animated.Value(1)).current;

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

  // Listen icon color logic (gold if playing, white if not)
  const listenColor = isPlaying ? 'gold' : '#fff';

  return (
    <View style={[styles.container, style]}>
      {/* Like Button */}
      <TouchableOpacity
        onPress={() => {
          animatePress(likeAnim);
          onLike();
        }}
        activeOpacity={0.7}
      >
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

      {/* Listen Button */}
      <TouchableOpacity
        onPress={() => {
          animatePress(listenAnim);
          onListen();
        }}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[styles.button, { transform: [{ scale: listenAnim }] }]}
        >
          {isReel ? (
            isMuted ? (
              <VolumeX
                size={32}
                color={isPlaying ? listenColor : '#fff'}
                strokeWidth={2}
              />
            ) : (
              <Volume2
                size={32}
                color={isPlaying ? listenColor : '#fff'}
                strokeWidth={2}
              />
            )
          ) : listenLoading ? (
            <Ionicons name="hourglass-outline" size={32} color={listenColor} />
          ) : (
            <Ionicons
              name={isPlaying ? 'volume-high' : 'volume-medium'}
              size={32}
              color={listenColor}
            />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity
        onPress={() => {
          animatePress(shareAnim);
          onShare();
        }}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[styles.button, { transform: [{ scale: shareAnim }] }]}
        >
          <Ionicons name={'share-social'} size={32} color={Colors.text} />
        </Animated.View>
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity
        onPress={() => {
          animatePress(saveAnim);
          onSave();
        }}
        activeOpacity={0.7}
      >
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
    position: 'absolute',
    right: 15,
    bottom: 100, // Use the same as Carousel
    zIndex: 10,
  },
  button: {
    marginBottom: 25,
  },
  buttonLast: {
    // No margin for the last button
  },
});
