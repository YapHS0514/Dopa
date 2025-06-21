/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

/**
 * Global color constants for the DOPA app dark theme
 */

export const Colors = {
  // Core colors
  primary: '#000000',      // Main background
  secondary: '#1A1A1A',    // Secondary background
  cardBackground: '#222222', // Card/input background
  accent: '#0a7ea4',      // Accent color
  
  // Text colors
  textPrimary: '#FFFFFF',  // Main text color
  textSecondary: '#A0A0A0', // Secondary text color
  textInput: '#FFFFFF',    // Input text color
  placeholderText: '#666666', // Placeholder text color
  
  // UI Elements
  buttonBackground: '#0a7ea4',
  buttonText: '#FFFFFF',
  inputBorder: '#333333',
  inputBackground: '#1A1A1A',
  
  // Navigation
  tabBarBackground: '#1A1A1A',
  tabBarIcon: '#FFFFFF',
  tabBarIconInactive: '#666666',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Legacy support (do not remove)
  text: '#FFFFFF',
  shadow: '#000000',
  saveBarBackground: '#1A1A1A',
  saveBarFill: '#FFFFFF',
  notificationBackground: '#1A1A1A',
  streakBackground: 'rgba(255, 107, 107, 0.1)',
  coinsBackground: 'rgba(244, 114, 182, 0.1)',
  
  // Topic Colors
  topics: {
    Science: '#FF6B6B',
    Space: '#4ECDC4',
    Nature: '#A78BFA',
    Tech: '#10B981',
    Math: '#F59E0B',
    Psychology: '#F472B6',
  },
} as const;