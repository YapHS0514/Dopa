import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const MOCK_USER = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  joinDate: 'March 2024',
};

const SETTINGS_OPTIONS = [
  { id: 'theme', icon: '🎨', title: 'Theme', value: 'Dark' },
  { id: 'notifications', icon: '🔔', title: 'Notifications', value: 'On' },
  { id: 'language', icon: '🌍', title: 'Language', value: 'English' },
  { id: 'feedback', icon: '💭', title: 'Send Feedback', value: '' },
  { id: 'about', icon: 'ℹ️', title: 'About Dopa', value: 'v1.0.0' },
];

export default function ProfileScreen() {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/(auth)/login');
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderSettingItem = (item: typeof SETTINGS_OPTIONS[0]) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Handle setting item press
      }}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <Text style={[styles.settingTitle, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
          {item.title}
        </Text>
      </View>
      {item.value && (
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
            {item.value}
          </Text>
          <Feather name="chevron-right" size={20} color={Colors[isDark ? 'dark' : 'light'].textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDark ? 'dark' : 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FF6B6B', '#4ECDC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Image
                source={{ uri: MOCK_USER.avatar }}
                style={styles.avatar}
              />
            </LinearGradient>
          </View>
          <Text style={[styles.name, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
            {MOCK_USER.name}
          </Text>
          <Text style={[styles.email, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
            {MOCK_USER.email}
          </Text>
          <Text style={[styles.joinDate, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
            Joined {MOCK_USER.joinDate}
          </Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
            Settings
          </Text>
          <View style={styles.settingsList}>
            {SETTINGS_OPTIONS.map(renderSettingItem)}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground }]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={20} color="#FF6B6B" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    padding: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
  },
  name: {
    fontSize: 24,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    opacity: 0.8,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  settingsList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 16,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: '#FF6B6B',
    marginLeft: 8,
  },
});
