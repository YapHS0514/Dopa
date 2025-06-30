import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, SafeAreaView } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import IndexScreen from './index';
import SavedScreen from './saved';
import ProgressScreen from './progress';
// import StreakScreen from './streak';
import ProfileScreen from './profile';

const Tab = createBottomTabNavigator();

export default function TabsLayout() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            height: 70,
            paddingBottom: Platform.OS === 'android' ? 80 : 10,
            backgroundColor: 'black',
            borderTopWidth: 0,
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';
            switch (route.name) {
              case 'Explore':
                iconName = focused ? 'compass' : 'compass-outline';
                break;
              case 'Saved':
                iconName = focused ? 'bookmark' : 'bookmark-outline';
                break;
              case 'Progress':
                iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                break;
              case 'Streak':
                iconName = focused ? 'flame' : 'flame-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'ellipse';
            }
            return (
              <Ionicons
                name={iconName as any}
                size={28}
                color={focused ? '#fff' : '#888'}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Explore" component={IndexScreen} />
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
