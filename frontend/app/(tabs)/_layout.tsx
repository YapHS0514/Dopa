import { Tabs, Redirect } from 'expo-router';
import { Platform, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { usePathname } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function TabLayout() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isIndexTab = pathname === '/(tabs)/' || pathname === '/(tabs)/index';

  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isIndexTab) {
    return null; // Don't show tab bar on index tab
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 30 : 20,
            left: 20,
            right: 20,
            height: 65,
            backgroundColor: Colors.tabBarBackground,
            borderTopWidth: 0,
            elevation: 0,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: Colors.textSecondary,
          },
          tabBarActiveTintColor: Colors.tabBarIcon,
          tabBarInactiveTintColor: Colors.tabBarIconInactive,
          headerShown: false,
          tabBarLabelStyle: {
            fontFamily: 'Inter',
            fontSize: 12,
            marginBottom: 5,
          },
          tabBarIconStyle: {
            marginTop: 5,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: Colors.tabBarBackground }} />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Learn',
            tabBarIcon: ({ color, size }) => (
              <Feather name="compass" size={size} color={color} />
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
      </Tabs>
    </View>
  );
}