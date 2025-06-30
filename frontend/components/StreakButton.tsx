import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStreakData } from '../hooks/useStreakData';

interface StreakButtonProps {
  streakCount?: number; // Optional override, but we'll use real data by default
  style?: any;
}

export default function StreakButton({
  streakCount,
  style,
}: StreakButtonProps) {
  // Get real streak data from our streak system
  const {
    currentStreak,
    fetchStreakData,
    hasUnseenStreakNotification,
    clearStreakNotification,
  } = useStreakData();

  // Use provided streakCount if available, otherwise use real data
  const displayStreak = streakCount !== undefined ? streakCount : currentStreak;

  // Fetch streak data on mount if not provided via props
  useEffect(() => {
    if (streakCount === undefined) {
      fetchStreakData();
    }
  }, [streakCount, fetchStreakData]);

  const handlePress = () => {
    console.log('🔔 StreakButton pressed - navigating to streak screen');
    console.log(
      `   • hasUnseenStreakNotification: ${hasUnseenStreakNotification}`
    );

    // Don't clear the notification here - let the streak screen handle it after showing the modal
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
        <Text style={styles.streakNumber}>{displayStreak}</Text>

        {/* Notification indicator for new streak achievements */}
        {hasUnseenStreakNotification && (
          <View style={styles.notificationDot}>
            <Ionicons name="alert-circle" size={16} color="#ff4444" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: 42, // Shifted down to align with DOPA logo
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
  notificationDot: {
    marginLeft: 4,
  },
});
