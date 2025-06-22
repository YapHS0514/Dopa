import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

interface RightNavBarProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function RightNavBar({ isVisible, onClose }: RightNavBarProps) {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: SCREEN_WIDTH,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx > 0) {
        translateX.setValue(gesture.dx);
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        onClose();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleNavigation = (route: string) => {
    onClose();
    router.push(route as any); // Type assertion needed due to expo-router typing limitations
  };

  return (
    <>
      {/* Dimmed Background */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
        ]}
        onTouchEnd={onClose}
      />

      {/* Navigation Bar */}
      <Animated.View
        style={[
          GlobalStyles.rightNavBar,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('/(tabs)/saved')}
        >
          <Feather name="bookmark" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('/(tabs)/progress')}
        >
          <Feather name="trending-up" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('/(tabs)/streak')}
        >
          <Feather name="activity" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('/settings')}
        >
          <Feather name="settings" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  navButton: {
    paddingVertical: 10,
    marginBottom: 10,
  },
}); 