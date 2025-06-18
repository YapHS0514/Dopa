import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';

export default function TabBarBackground() {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          isDark ? '#1A1A1A' : '#FFFFFF',
          isDark ? '#1A1A1A' : '#FFFFFF',
        ]}
        style={styles.background}
      >
        <View style={[styles.border, { backgroundColor: isDark ? '#333333' : '#E5E5E5' }]} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
  },
  background: {
    flex: 1,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});