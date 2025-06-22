import { Stack, Redirect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { user } = useAuth();

  // If user is authenticated, redirect to home
  if (user) {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.primary,
        },
        animation: 'fade',
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
      <Stack.Screen
        name="onboarding"
        options={{
          title: 'Welcome to Dopa',
        }}
      />
    </Stack>
  );
}