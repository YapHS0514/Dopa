import React, { useState } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
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
  const [showSplash, setShowSplash] = useState(true);
  const [loaded] = useFonts({
    'SF-Pro-Display': require('../assets/fonts/SFPRODISPLAYREGULAR.otf'),
  });

  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark' || colorScheme === 'dark';
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (loaded) {
      // Hide splash after fonts are loaded
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
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
            />
            <Stack.Screen
              name="onboarding"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
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
              }}
            />
          </Stack>
        </AuthProvider>
      </View>
    </GestureHandlerRootView>
  );
}

