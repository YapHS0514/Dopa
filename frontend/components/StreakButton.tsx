import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface StreakButtonProps {
  style?: any;
}

export default function StreakButton({ style }: StreakButtonProps) {
  // TODO: Replace hardcoded value with actual streak from backend/database
  // TODO: Fetch streak data from: 
  //   1. Supabase user_streaks table 
  //   2. Or local storage for offline support
  //   3. Update on daily app usage completion
  // TODO: Consider adding streak state management with Context or Zustand
  // TODO: Implement streak calculation logic (consecutive days)
  // TODO: Add streak reset logic when user misses a day
  const currentStreak = 7; // Hardcoded for now

  const handlePress = () => {
    router.push('/streak');
  };

  return (
    <TouchableOpacity
      style={[styles.streakButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.streakContainer}>
        <Ionicons name="flame" size={28} color="#fff" />
        <Text style={styles.streakNumber}>{currentStreak}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  streakButton: {
    position: 'absolute',
    right: 24,
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 8 : 58,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 100,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 2,
  },
}); 