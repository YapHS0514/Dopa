import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

interface UserStats {
  total_interactions: number;
  likes_count: number;
  saves_count: number;
  views_count: number;
}

interface UserPreference {
  id: string;
  points: number;
  preference_score: number;
  topics: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

const SAMPLE_STATS = {
  total_interactions: 156,
  likes_count: 89,
  saves_count: 23,
  views_count: 44,
};

const SAMPLE_PREFERENCES = [
  {
    id: '1',
    points: 85,
    preference_score: 0.85,
    topics: { name: 'Science', color: '#00d4ff', icon: '🧪' },
  },
  {
    id: '2',
    points: 72,
    preference_score: 0.72,
    topics: { name: 'Space', color: '#ff006e', icon: '🚀' },
  },
];

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(SAMPLE_STATS);
  const [preferences, setPreferences] = useState<UserPreference[]>(SAMPLE_PREFERENCES as any);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const fetchUserData = async () => {
    try {
      const [statsResponse, preferencesResponse] = await Promise.all([
        apiClient.getUserStats(),
        apiClient.getUserPreferences(),
      ]);

      setStats(statsResponse.data);
      setPreferences(preferencesResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Keep using sample data if API fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUserData();
    }
  }, [authLoading]);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Peace out! ✌️',
      'Sure you want to leave? Your brain will miss the gains!',
      [
        { text: 'Stay Smart', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Oops! 😅', 'Failed to sign out. Try again!');
            }
          },
        },
      ]
    );
  };

  const getLevel = (points: number) => {
    if (points < 100) return { level: 1, title: 'Brain Sprout 🌱' };
    if (points < 500) return { level: 2, title: 'Fact Collector 📚' };
    if (points < 1000) return { level: 3, title: 'Knowledge Ninja 🥷' };
    if (points < 2000) return { level: 4, title: 'Wisdom Warrior ⚔️' };
    return { level: 5, title: 'Galaxy Brain 🧠✨' };
  };

  const totalPoints = stats ? stats.total_interactions * 10 : 0;
  const userLevel = getLevel(totalPoints);

  if (authLoading || loading) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a2e']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your profile... 👤</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#1a1a2e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#00d4ff', '#090979']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </LinearGradient>
            <Text style={styles.name}>
              {user?.user_metadata?.full_name || 'Knowledge Seeker'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            
            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {userLevel.level}</Text>
              <Text style={styles.levelTitle}>{userLevel.title}</Text>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>This Week's Recap 📊</Text>
            <Text style={styles.statsSubtitle}>
              You learned {stats?.total_interactions || 0} facts this week. 
              You're in the top 5% of curious minds! 🧠
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient colors={['#00d4ff20', '#00d4ff10']} style={styles.statGradient}>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={styles.statValue}>{totalPoints}</Text>
                  <Text style={styles.statLabel}>XP Points</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.statCard}>
                <LinearGradient colors={['#ff006e20', '#ff006e10']} style={styles.statGradient}>
                  <Text style={styles.statEmoji}>❤️</Text>
                  <Text style={styles.statValue}>{stats?.likes_count || 0}</Text>
                  <Text style={styles.statLabel}>Liked</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.statCard}>
                <LinearGradient colors={['#2ed57320', '#2ed57310']} style={styles.statGradient}>
                  <Text style={styles.statEmoji}>💾</Text>
                  <Text style={styles.statValue}>{stats?.saves_count || 0}</Text>
                  <Text style={styles.statLabel}>Saved</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.statCard}>
                <LinearGradient colors={['#ffbe0b20', '#ffbe0b10']} style={styles.statGradient}>
                  <Text style={styles.statEmoji}>👀</Text>
                  <Text style={styles.statValue}>{stats?.views_count || 0}</Text>
                  <Text style={styles.statLabel}>Viewed</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Interests Section */}
          {preferences.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.sectionTitle}>Your Brain Food 🍎</Text>
              {preferences.map((preference) => (
                <View key={preference.id} style={styles.interestItem}>
                  <View style={[styles.interestIcon, { backgroundColor: preference.topics.color }]}>
                    <Text style={styles.interestEmoji}>{preference.topics.icon}</Text>
                  </View>
                  <View style={styles.interestInfo}>
                    <Text style={styles.interestName}>{preference.topics.name}</Text>
                    <Text style={styles.interestPoints}>{preference.points} points</Text>
                  </View>
                  <View style={styles.interestProgress}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { 
                            width: `${preference.preference_score * 100}%`,
                            backgroundColor: preference.topics.color
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings ⚙️</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon" size={24} color="#00d4ff" />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#333', true: '#00d4ff' }}
                thumbColor={darkMode ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={24} color="#00d4ff" />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#333', true: '#00d4ff' }}
                thumbColor={notifications ? '#fff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle" size={24} color="#00d4ff" />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle" size={24} color="#00d4ff" />
                <Text style={styles.settingText}>About Dopa</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.signOutItem]}
              onPress={handleSignOut}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out" size={24} color="#ff4757" />
                <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: 'white',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  levelText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  levelTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
  },
  statsSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  interestsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  interestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  interestEmoji: {
    fontSize: 20,
  },
  interestInfo: {
    flex: 1,
  },
  interestName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  interestPoints: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  interestProgress: {
    width: 60,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  settingsSection: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 16,
  },
  signOutItem: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  signOutText: {
    color: '#ff4757',
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deleteText: {
    color: '#EF4444',
  },
});
