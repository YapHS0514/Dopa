/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000',
    textSecondary: '#666',
    background: '#fff',
    cardBackground: '#fff',
    tagBackground: '#f0f0f0',
    tint: '#2f95dc',
    icon: '#000',
    tabIconDefault: '#ccc',
    tabIconSelected: '#2f95dc',
    border: '#e0e0e0',
    buttonDisabled: '#ccc',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  dark: {
    text: '#fff',
    textSecondary: '#a0a0a0',
    background: '#000',
    cardBackground: '#1a1a1a',
    tagBackground: '#333',
    tint: '#fff',
    icon: '#fff',
    tabIconDefault: '#666',
    tabIconSelected: '#fff',
    border: '#333',
    buttonDisabled: '#333',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  },
} as const;