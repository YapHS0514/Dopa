import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { GlobalStyles } from '../../constants/GlobalStyles';
import { MOCK_FACTS, type Fact } from '../../constants/MockData';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import RightNavBar from '../../components/RightNavBar';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SAVE_THRESHOLD = SCREEN_WIDTH * 0.4;
const NAV_THRESHOLD = SCREEN_WIDTH * 0.15; // Lower threshold for nav bar

export default function LearnScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStats, setShowStats] = useState(true);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [showNavBar, setShowNavBar] = useState(false);
  const router = useRouter();
  
  const position = useRef(new Animated.ValueXY()).current;
  const saveProgress = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(1)).current;
  const saveNotificationOpacity = useRef(new Animated.Value(0)).current;

  // Hide stats bar after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(statsOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowStats(false));
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      // Handle vertical swipe
      if (Math.abs(gesture.dy) > Math.abs(gesture.dx)) {
        position.setValue({ x: 0, y: gesture.dy });
      } 
      // Handle horizontal swipe (save gesture or nav bar)
      else {
        if (gesture.dx > 0) {
          // Right swipe - save gesture
          position.setValue({ x: gesture.dx, y: 0 });
          saveProgress.setValue(Math.min(gesture.dx / SAVE_THRESHOLD, 1));
        } else if (gesture.dx < 0) {
          // Left swipe - nav bar
          if (Math.abs(gesture.dx) > NAV_THRESHOLD) {
            setShowNavBar(true);
          }
        }
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dy) > Math.abs(gesture.dx)) {
        // Vertical swipe handling
        if (gesture.dy < -50) { // Swipe up - Next
          Animated.timing(position, {
            toValue: { x: 0, y: -SCREEN_HEIGHT },
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex(prev => (prev + 1) % MOCK_FACTS.length);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowStats(false);
          });
        } else if (gesture.dy > 50) { // Swipe down - Previous
          Animated.timing(position, {
            toValue: { x: 0, y: SCREEN_HEIGHT },
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex(prev => (prev - 1 + MOCK_FACTS.length) % MOCK_FACTS.length);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowStats(false);
          });
        } else {
          // Reset position if swipe not far enough
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      } else {
        // Horizontal swipe handling (save gesture)
        if (gesture.dx >= SAVE_THRESHOLD) {
          // Save the fact
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowSaveNotification(true);
          Animated.sequence([
            Animated.timing(saveNotificationOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(2700),
            Animated.timing(saveNotificationOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => setShowSaveNotification(false));
        }
        
        // Reset position and save progress
        Animated.parallel([
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 5,
          }),
          Animated.timing(saveProgress, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    },
  });

  const handleScreenTap = () => {
    setShowStats(!showStats);
    Animated.timing(statsOpacity, {
      toValue: showStats ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const currentFact = MOCK_FACTS[currentIndex];

  const handleStreakPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/streak');
  };

  return (
    <SafeAreaView style={GlobalStyles.screenContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Stats Bar */}
      {showStats && (
        <Animated.View style={[GlobalStyles.statsBar, { opacity: statsOpacity }]}>
          <TouchableOpacity style={GlobalStyles.streakContainer} onPress={handleStreakPress}>
            <Text style={GlobalStyles.text}>🔥 3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={GlobalStyles.coinsContainer}>
            <Text style={GlobalStyles.text}>🪙 120</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Save Progress Bar */}
      <Animated.View 
        style={[{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: Colors.saveBarBackground,
          zIndex: 1000,
        }]}>
        <Animated.View 
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.saveBarFill,
            height: saveProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </Animated.View>

      {/* Content Card */}
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleScreenTap}
        style={{ flex: 1 }}
      >
        <Animated.View 
          style={[
            GlobalStyles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={{ padding: 20 }}>
            <View style={{ 
              backgroundColor: `${Colors.topics[currentFact.topic]}20`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              alignSelf: 'flex-start',
              marginBottom: 16,
            }}>
              <Text style={[
                GlobalStyles.text,
                { color: Colors.topics[currentFact.topic] }
              ]}>
                {currentFact.icon} {currentFact.topic}
              </Text>
            </View>
            
            <Text style={[GlobalStyles.text, { fontSize: 24 }]}>
              {currentFact.fact}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Save Notification */}
      {showSaveNotification && (
        <Animated.View style={[
          GlobalStyles.saveNotification,
          { opacity: saveNotificationOpacity }
        ]}>
          <Text style={[GlobalStyles.text, { fontSize: 16 }]}>
            Saved! 🎉
          </Text>
        </Animated.View>
      )}

      {/* Right Navigation Bar */}
      <RightNavBar 
        isVisible={showNavBar}
        onClose={() => setShowNavBar(false)}
      />
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