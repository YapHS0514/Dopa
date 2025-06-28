import React, { useState, useEffect } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { Audio } from 'expo-av';

import { AuthProvider } from '../contexts/AuthContext';
import { SavedContentProvider } from '../contexts/SavedContentContext';
import { useStore } from '../lib/store';
import { Colors } from '../constants/Colors';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: 'https://ab723f22dee9df73642aa271a4276415@o4509485988446208.ingest.de.sentry.io/4509502982848593',
  sendDefaultPii: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark' || colorScheme === 'dark';

  const [loaded] = useFonts({
    'SF-Pro-Display': require('../assets/fonts/SFPRODISPLAYREGULAR.otf'),
  });

  // 🎧 Configure global audio mode for video playback stability
  useEffect(() => {
    const configureGlobalAudio = async () => {
      try {
        console.log('🎧 Configuring global audio mode for video stability...');
        
        // Request audio permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('⚠️ Audio permission not granted');
          return;
        }

        // Set optimal audio mode for video content
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        console.log('✅ Global audio mode configured successfully');
      } catch (error) {
        console.error('❌ Failed to configure global audio mode:', error);
      }
    };

    configureGlobalAudio();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <SavedContentProvider>
            <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: Colors.background,
                },
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen
                name="onboarding"
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="streak"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="+not-found"
                options={{
                  presentation: 'modal',
                  animation: 'fade',
                }}
              />
            </Stack>
            </ThemeProvider>
          </SavedContentProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </View>
  );
}
