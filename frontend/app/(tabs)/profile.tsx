import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);

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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
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
      ]
    );
  };

  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: string }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color="#667eea" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const PreferenceItem = ({ preference }: { preference: UserPreference }) => (
    <View style={styles.preferenceItem}>
      <View style={[styles.preferenceIcon, { backgroundColor: preference.topics.color }]}>
        <Ionicons name={preference.topics.icon as any} size={20} color="white" />
      </View>
      <View style={styles.preferenceInfo}>
        <Text style={styles.preferenceName}>{preference.topics.name}</Text>
        <Text style={styles.preferencePoints}>{preference.points} points</Text>
      </View>
      <View style={styles.preferenceScore}>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreProgress,
              { width: `${preference.preference_score * 100}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.user_metadata?.full_name || 'User'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              <StatCard title="Total" value={stats.total_interactions} icon="pulse-outline" />
              <StatCard title="Likes" value={stats.likes_count} icon="heart-outline" />
              <StatCard title="Saved" value={stats.saves_count} icon="bookmark-outline" />
              <StatCard title="Views" value={stats.views_count} icon="eye-outline" />
            </View>
          </View>
        )}

        {preferences.length > 0 && (
          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>Your Interests</Text>
            {preferences.map((preference) => (
              <PreferenceItem key={preference.id} preference={preference} />
            ))}
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle-outline" size={24} color="#333" />
            <Text style={styles.actionText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={[styles.actionText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  preferencesSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  preferencePoints: {
    fontSize: 14,
    color: '#666',
  },
  preferenceScore: {
    width: 60,
  },
  scoreBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  actionsSection: {
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  signOutButton: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  signOutText: {
    color: '#EF4444',
  },
});