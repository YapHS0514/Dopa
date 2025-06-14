import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.7;
const SWIPE_THRESHOLD = 120;

interface Content {
  id: string;
  title: string;
  summary: string;
  content_type: string;
  tags: string[];
  difficulty_level: number;
  estimated_read_time: number;
  topics: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

const SAMPLE_FACTS = [
  {
    id: '1',
    title: 'Did You Know?',
    summary: 'Octopuses have 3 hearts. That\'s two more than your ex. 🐙💔',
    topics: { name: 'Science', color: '#00d4ff', icon: '🧪' },
    tags: ['ocean', 'biology'],
    difficulty_level: 1,
  },
  {
    id: '2',
    title: 'Mind = Blown 🤯',
    summary: 'Honey never spoils. Archaeologists have found 3000-year-old honey that\'s still perfectly edible. Ancient snack goals! 🍯',
    topics: { name: 'History', color: '#ffbe0b', icon: '🏛️' },
    tags: ['food', 'ancient'],
    difficulty_level: 1,
  },
  {
    id: '3',
    title: 'Space is Wild',
    summary: 'One day on Venus is longer than its year. Imagine having a Monday that lasts longer than your entire calendar! 🪐',
    topics: { name: 'Space', color: '#ff006e', icon: '🚀' },
    tags: ['planets', 'time'],
    difficulty_level: 2,
  },
];

export default function HomeScreen() {
  const { loading: authLoading } = useAuth();
  const [contents, setContents] = useState<Content[]>(SAMPLE_FACTS as any);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const fetchRecommendations = async () => {
    try {
      const response = await apiClient.getRecommendations(20);
      if (response.data.length > 0) {
        setContents(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      // Keep using sample data if API fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchRecommendations();
    }
  }, [authLoading]);

  const resetCard = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const swipeCard = (direction: 'left' | 'right' | 'up') => {
    const toValueX = direction === 'left' ? -width * 1.5 : direction === 'right' ? width * 1.5 : 0;
    const toValueY = direction === 'up' ? -height * 1.5 : 0;

    Animated.parallel([
      Animated.timing(translateX, { toValue: toValueX, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: toValueY, duration: 300, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: direction === 'left' ? -30 : direction === 'right' ? 30 : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      handleSwipe(direction);
    });
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    const currentContent = contents[currentIndex];
    
    try {
      if (direction === 'right') {
        await apiClient.recordInteraction(currentContent.id, 'like', 10);
      } else if (direction === 'up') {
        await apiClient.recordInteraction(currentContent.id, 'save', 5);
        await apiClient.saveContent(currentContent.id);
        Alert.alert('Saved! 💾', 'Added to your collection');
      } else {
        await apiClient.recordInteraction(currentContent.id, 'view', 1);
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
    }

    // Move to next card
    setCurrentIndex((prev) => (prev + 1) % contents.length);
    
    // Reset animations
    translateX.setValue(0);
    translateY.setValue(0);
    rotate.setValue(0);
    scale.setValue(1);
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === 5) { // END state
      const { translationX, translationY } = event.nativeEvent;
      
      if (Math.abs(translationX) > SWIPE_THRESHOLD) {
        swipeCard(translationX > 0 ? 'right' : 'left');
      } else if (translationY < -SWIPE_THRESHOLD) {
        swipeCard('up');
      } else {
        resetCard();
      }
    }
  };

  const currentContent = contents[currentIndex];

  if (authLoading || loading || !currentContent) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a2e']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your brain food... 🧠</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-30, 0, 30],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  return (
    <LinearGradient colors={['#0a0a0a', '#1a1a2e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dopa</Text>
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>🔥 7</Text>
          </View>
        </View>

        {/* Card Stack */}
        <View style={styles.cardContainer}>
          {/* Background Cards */}
          {contents.slice(currentIndex + 1, currentIndex + 3).map((_, index) => (
            <View
              key={`bg-${index}`}
              style={[
                styles.card,
                styles.backgroundCard,
                { 
                  transform: [
                    { scale: 0.95 - index * 0.05 },
                    { translateY: index * 10 }
                  ],
                  opacity: 0.5 - index * 0.2
                }
              ]}
            />
          ))}

          {/* Main Card */}
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate: rotateInterpolate },
                    { scale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[currentContent.topics.color + '20', '#1a1a2e']}
                style={styles.cardGradient}
              >
                {/* Topic Badge */}
                <View style={[styles.topicBadge, { backgroundColor: currentContent.topics.color }]}>
                  <Text style={styles.topicEmoji}>{currentContent.topics.icon}</Text>
                  <Text style={styles.topicName}>{currentContent.topics.name}</Text>
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                  <Text style={styles.cardTitle}>{currentContent.title}</Text>
                  <Text style={styles.cardText}>{currentContent.summary}</Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsContainer}>
                  {currentContent.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Swipe Indicators */}
                <Animated.View
                  style={[
                    styles.swipeIndicator,
                    styles.likeIndicator,
                    {
                      opacity: translateX.interpolate({
                        inputRange: [0, SWIPE_THRESHOLD],
                        outputRange: [0, 1],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  <Text style={styles.indicatorText}>LIKE</Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.swipeIndicator,
                    styles.skipIndicator,
                    {
                      opacity: translateX.interpolate({
                        inputRange: [-SWIPE_THRESHOLD, 0],
                        outputRange: [1, 0],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  <Text style={styles.indicatorText}>SKIP</Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.swipeIndicator,
                    styles.saveIndicator,
                    {
                      opacity: translateY.interpolate({
                        inputRange: [-SWIPE_THRESHOLD, 0],
                        outputRange: [1, 0],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  <Text style={styles.indicatorText}>SAVE</Text>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => swipeCard('left')}
          >
            <Ionicons name="close" size={28} color="#ff4757" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={() => swipeCard('up')}
          >
            <Ionicons name="bookmark" size={24} color="#00d4ff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => swipeCard('right')}
          >
            <Ionicons name="heart" size={28} color="#2ed573" />
          </TouchableOpacity>
        </View>

        {/* Swipe Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            ← Skip • ↑ Save • → Like
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00d4ff',
  },
  streakContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: width - 40,
    height: CARD_HEIGHT,
    borderRadius: 25,
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  backgroundCard: {
    backgroundColor: '#1a1a2e',
  },
  cardGradient: {
    flex: 1,
    padding: 25,
    justifyContent: 'space-between',
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topicEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  topicName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 3,
  },
  likeIndicator: {
    right: 20,
    borderColor: '#2ed573',
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
  },
  skipIndicator: {
    left: 20,
    borderColor: '#ff4757',
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  saveIndicator: {
    top: 100,
    left: '50%',
    transform: [{ translateX: -50 }],
    borderColor: '#00d4ff',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
  },
  indicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderWidth: 2,
    borderColor: '#ff4757',
  },
  saveButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  likeButton: {
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
    borderWidth: 2,
    borderColor: '#2ed573',
  },
  instructions: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
});