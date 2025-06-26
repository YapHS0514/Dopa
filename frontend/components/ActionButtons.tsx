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

interface ActionButtonsProps {
  fact?: any; // TODO: Replace with proper Fact type from backend
  style?: any;
}

export default function ActionButtons({ fact, style }: ActionButtonsProps) {
  const [liked, setLiked] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const likeAnim = useRef(new Animated.Value(1)).current;
  const listenAnim = useRef(new Animated.Value(1)).current;
  const shareAnim = useRef(new Animated.Value(1)).current;
  const saveAnim = useRef(new Animated.Value(1)).current;

  // Check if content is already saved when component mounts or fact changes
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!fact?.id) return;

      try {
        const response = (await apiClient.getSavedContent()) as { data: any[] };
        const isContentSaved = response.data.some(
          (saved: any) => saved.contents?.id === fact.id
        );
        setSaved(isContentSaved);
      } catch (error) {
        console.log('Error checking saved status:', error);
      }
    };

    checkIfSaved();
  }, [fact?.id]);

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
    setLiked((l) => !l);
    // TODO: Send like status to backend API
    // Example: await api.likeFact(fact.id, !liked)
  };

  const handleSave = async () => {
    animatePress(saveAnim);

    if (!fact?.id) {
      Alert.alert('Error', 'Content ID not available');
      return;
    }

    try {
      if (!saved) {
        // Save the content
        console.log('Saving content:', fact.id);
        const response = (await apiClient.saveContent(fact.id)) as {
          message: string;
          saved_count: number;
          max_saves: number;
        };

        setSaved(true);
        Alert.alert(
          'Saved!',
          `${response.message}\nSaved: ${response.saved_count}/${response.max_saves}`
        );
      } else {
        // For unsaving, we would need the saved_content_id, which requires a different approach
        Alert.alert(
          'Info',
          'To remove saved content, please go to your saved content page.'
        );
      }
    } catch (error: any) {
      console.error('Error saving content:', error);

      if (error.message.includes('maximum number of saves')) {
        Alert.alert('Save Limit Reached', error.message);
      } else if (error.message.includes('already saved')) {
        Alert.alert(
          'Already Saved',
          'This content is already in your saved list.'
        );
        setSaved(true); // Update UI to reflect that it's saved
      } else {
        Alert.alert('Error', error.message || 'Failed to save content');
      }
    }
  };

  const handleListen = async () => {
    animatePress(listenAnim);
    if (!listening) {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to use speaker denied.');
        return;
      }
      try {
        // TODO: Replace with backend-provided audio URL for text-to-speech
        // Example: const audioUrl = await api.getTextToSpeech(fact.fullContent)
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../assets/sound.mp3') // Placeholder audio
        );
        setSound(newSound);
        await newSound.playAsync();
        setListening(true);
      } catch (e) {
        Alert.alert('Audio error', 'Unable to play sound.');
      }
    } else {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setListening(false);
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

      <TouchableOpacity onPress={handleListen} activeOpacity={0.7}>
        <Animated.View
          style={[styles.button, { transform: [{ scale: listenAnim }] }]}
        >
          <Ionicons
            name={'volume-high'}
            size={32}
            color={listening ? 'gold' : Colors.text}
          />
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
            name={'bookmark'}
            size={32}
            color={saved ? 'gold' : Colors.text}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    marginBottom: 25,
  },
  buttonLast: {
    // No margin for the last button
  },
});
