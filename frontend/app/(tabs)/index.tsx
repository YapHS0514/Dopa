import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const TOPIC_COLORS = {
  'Science': '#FF6B6B',
  'Space': '#4ECDC4',
  'Nature': '#A78BFA',
  'Tech': '#10B981',
  'Math': '#F59E0B',
  'Psychology': '#F472B6',
};

const MOCK_FACTS = [
  {
    id: '1',
    fact: 'Your brain uses 20% of the total oxygen in your body.',
    topic: 'Science',
    icon: '🧬'
  },
  {
    id: '2',
    fact: 'One day on Venus is longer than one year on Venus.',
    topic: 'Space',
    icon: '🚀'
  },
  {
    id: '3',
    fact: 'The ocean contains 97% of Earth\'s water.',
    topic: 'Nature',
    icon: '🌊'
  },
  {
    id: '4',
    fact: 'The human brain can process images in as little as 13 milliseconds!',
    topic: 'Psychology',
    icon: '🧠'
  },
];

export default function LearnScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const router = useRouter();
  
  const position = useRef(new Animated.ValueXY()).current;
  const swipeThreshold = SCREEN_HEIGHT * 0.2;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -swipeThreshold) {
        // Swipe up - Skip
        Animated.timing(position, {
          toValue: { x: 0, y: -SCREEN_HEIGHT },
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          position.setValue({ x: 0, y: 0 });
          setCurrentIndex(prev => (prev + 1) % MOCK_FACTS.length);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        });
      } else if (gesture.dx > swipeThreshold) {
        // Swipe right - Like
        Animated.timing(position, {
          toValue: { x: SCREEN_WIDTH, y: 0 },
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          position.setValue({ x: 0, y: 0 });
          setCurrentIndex(prev => (prev + 1) % MOCK_FACTS.length);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        });
      } else {
        // Reset position
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          friction: 5,
        }).start();
      }
    },
  });

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotation },
    ],
  };

  const currentFact = MOCK_FACTS[currentIndex];
  const topicColor = TOPIC_COLORS[currentFact.topic as keyof typeof TOPIC_COLORS];

  const handleStreakPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/streak');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDark ? 'dark' : 'light'].background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.streakContainer} onPress={handleStreakPress}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={[styles.streakText, { color: Colors[isDark ? 'dark' : 'light'].text }]}>3</Text>
        </TouchableOpacity>
        <View style={styles.coinsContainer}>
          <Text style={styles.coinsIcon}>🪙</Text>
          <Text style={[styles.coinsText, { color: Colors[isDark ? 'dark' : 'light'].text }]}>120</Text>
        </View>
      </View>

      <Animated.View 
        style={[styles.cardContainer, cardStyle]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={[`${topicColor}20`, 'transparent']}
          style={styles.cardGradient}
        >
          <BlurView
            intensity={100}
            tint={isDark ? 'dark' : 'light'}
            style={styles.card}
          >
            <View style={[styles.topicContainer, { backgroundColor: `${topicColor}20` }]}>
              <Text style={styles.topicIcon}>{currentFact.icon}</Text>
              <Text style={[styles.topic, { color: topicColor }]}>
                {currentFact.topic}
              </Text>
            </View>
            
            <Text style={[styles.fact, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
              {currentFact.fact}
            </Text>

            <View style={styles.hintContainer}>
              <Feather 
                name="chevrons-up" 
                size={24} 
                color={Colors[isDark ? 'dark' : 'light'].textSecondary} 
              />
              <Text style={[styles.hintText, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
                Swipe up to skip
              </Text>
            </View>
          </BlurView>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  streakIcon: {
    fontSize: 24,
    marginRight: 4,
  },
  streakText: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
  },
  coinsIcon: {
    fontSize: 24,
    marginRight: 4,
  },
  coinsText: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
  },
  cardContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    left: 20,
    right: 20,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 1, // Creates border effect
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  topicIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  topic: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
  },
  fact: {
    fontSize: 24,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 20,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    marginTop: 4,
  },
});