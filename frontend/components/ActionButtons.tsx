import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors } from '../constants/Colors';

interface ActionButtonsProps {
  style?: any;
  onShare?: () => void;
}

export default function ActionButtons({ style, onShare }: ActionButtonsProps) {
  const [liked, setLiked] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
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
    setLiked((l) => !l);
  };

  const handleSave = () => {
    animatePress(saveAnim);
    setSaved((s) => !s);
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
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../assets/sound.mp3')
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
    onShare?.();
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
        <Animated.View
          style={{ transform: [{ scale: likeAnim }], marginBottom: 25 }}
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
          style={{ transform: [{ scale: listenAnim }], marginBottom: 25 }}
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
          style={{ transform: [{ scale: shareAnim }], marginBottom: 25 }}
        >
          <Ionicons name={'share-social'} size={32} color={Colors.text} />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
        <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
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
}); 