import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark' || colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 65,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          borderRadius: 20,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint={isDark ? 'dark' : 'light'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: Colors[isDark ? 'dark' : 'light'].border,
            }}
          />
        ),
        tabBarActiveTintColor: Colors[isDark ? 'dark' : 'light'].tint,
        tabBarInactiveTintColor: Colors[isDark ? 'dark' : 'light'].tabIconDefault,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 12,
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <Feather name="zap" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Feather name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}