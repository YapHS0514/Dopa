import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { useAuth } from '../../hooks/useAuth';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const MOCK_USER = {
  name: 'John Doe',
  email: 'john@example.com',
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
      style={[styles.settingItem, { backgroundColor: Colors.cardBackground }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Handle setting item press
      }}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <Text style={[styles.settingTitle, { color: Colors.textPrimary }]}>
          {item.title}
        </Text>
      </View>
      {item.value && (
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: Colors.textSecondary }]}>
            {item.value}
          </Text>
          <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.primary }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBackground}>
              <Feather name="user" size={48} color={Colors.textPrimary} />
            </View>
          </View>
          <Text style={[styles.name, { color: Colors.textPrimary }]}>
            {MOCK_USER.name}
          </Text>
          <Text style={[styles.email, { color: Colors.textSecondary }]}>
            {MOCK_USER.email}
          </Text>
          <Text style={[styles.joinDate, { color: Colors.textSecondary }]}>
            Joined {MOCK_USER.joinDate}
          </Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>
            Settings
          </Text>
          <View style={styles.settingsList}>
            {SETTINGS_OPTIONS.map(renderSettingItem)}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: Colors.cardBackground }]}
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
  avatarBackground: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    fontFamily: 'Inter',
    opacity: 0.8,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    color: '#FF6B6B',
    marginLeft: 8,
  },
});
