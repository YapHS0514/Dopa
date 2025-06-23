import React, { useState } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme, View } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import * as Sentry from '@sentry/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '../lib/store';
import { Colors } from '../constants/Colors';
// import { SplashScreen as AppSplashScreen } from '../components/SplashScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: 'https://ab723f22dee9df73642aa271a4276415@o4509485988446208.ingest.de.sentry.io/4509502982848593',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'SF-Pro-Display': require('../assets/fonts/SFPRODISPLAYREGULAR.otf'),
  });

  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark' || colorScheme === 'dark';
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!loaded) {
      // Keep the splash screen visible while we fetch resources
      SplashScreen.preventAutoHideAsync();
    } else {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (!loaded) {
    return null;
  }

  // if (showSplash) {
  //   return (
  //     <View style={{ flex: 1, backgroundColor: '#000000' }}>
  //       <StatusBar style="light" />
  //       <AppSplashScreen onAnimationComplete={handleSplashComplete} />
  //     </View>
  //   );
  // }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: '#000000',
                },
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ThemeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </View>
  );
}
