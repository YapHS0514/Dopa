import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface StreakButtonProps {
  streakCount?: number; // TODO: Get this from backend user data
  style?: any;
}

export default function StreakButton({ streakCount = 0, style }: StreakButtonProps) {
  // TODO: Fetch current user streak from backend API
  // Example: useEffect(() => { fetchUserStreak(); }, [])
  
  const handlePress = () => {
    router.push('/streak');
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons name="flame" size={24} color="#ff6b35" />
        <Text style={styles.streakNumber}>{streakCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: 32, // Shifted down to align with DOPA logo
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
  },
}); 