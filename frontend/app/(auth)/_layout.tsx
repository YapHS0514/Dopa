import { Stack, Redirect } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { AuthContext } from '../../contexts/AuthContext';
import React, { useEffect, useState } from 'react';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark' || colorScheme === 'dark';

  const { user, checkOnboardingStatus, loading } =
    React.useContext(AuthContext);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // Check onboarding status if user is authenticated
  useEffect(() => {
    const fetchStatus = async () => {
      if (user) {
        try {
          const completed = await checkOnboardingStatus();
          setOnboarded(completed);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setOnboarded(false);
        }
      }
    };
    fetchStatus();
  }, [user]);

  // While checking session or onboarding status, don't render anything
  if (loading || (user && onboarded === null)) {
    return null;
  }

  // Redirect if logged in
  if (user) {
    return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontFamily: 'SF-Pro-Display',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Welcome to Dopa',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
