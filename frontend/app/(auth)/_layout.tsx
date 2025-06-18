import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark' || colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[isDark ? 'dark' : 'light'].background,
        },
        headerTintColor: Colors[isDark ? 'dark' : 'light'].text,
        headerTitleStyle: {
          fontFamily: 'SpaceMono',
        },
        headerShadowVisible: false,
      }}>
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
      <Stack.Screen
        name="onboarding"
        options={{
          title: 'Customize Your Experience',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}