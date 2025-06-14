import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export default function TabBarBackground() {
  return (
    <LinearGradient
      colors={['rgba(26, 26, 46, 0.95)', 'rgba(10, 10, 10, 0.95)']}
      style={StyleSheet.absoluteFill}
    />
  );
}