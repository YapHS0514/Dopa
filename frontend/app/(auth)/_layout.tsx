import { Stack, Redirect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import React, { useEffect, useState } from 'react';

export default function AuthLayout() {
  const { user, checkOnboardingStatus, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

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

  // If user is authenticated, redirect based on onboarding status
  if (user) {
    if (onboarded) {
      return <Redirect href="/(tabs)/" />;
    }
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontFamily: 'SF-Pro-Display',
          fontFamily: 'SF-Pro-Display',
        },
        headerShadowVisible: false,
      }}
    >
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Create Account',
        }}
      />
    </Stack>
  );
}

