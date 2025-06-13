import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

const SAMPLE_TOPICS: Topic[] = [
  { id: '1', name: 'Technology', description: 'Latest tech trends', color: '#3B82F6', icon: 'phone-portrait-outline' },
  { id: '2', name: 'Science', description: 'Scientific discoveries', color: '#10B981', icon: 'flask-outline' },
  { id: '3', name: 'History', description: 'Historical events', color: '#F59E0B', icon: 'library-outline' },
  { id: '4', name: 'Sports', description: 'Sports and fitness', color: '#EF4444', icon: 'trophy-outline' },
  { id: '5', name: 'Health', description: 'Wellness and health', color: '#EC4899', icon: 'heart-outline' },
  { id: '6', name: 'Business', description: 'Business insights', color: '#6366F1', icon: 'briefcase-outline' },
];

export default function OnboardingScreen() {
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleTopic = (topicId: string) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId);
    } else {
      newSelected.add(topicId);
    }
    setSelectedTopics(newSelected);
  };

  const handleComplete = async () => {
    if (selectedTopics.size === 0) {
      Alert.alert('Please select at least one topic to continue');
      return;
    }

    setLoading(true);
    try {
      const preferences = Array.from(selectedTopics).map(topicId => ({
        topic_id: topicId,
        points: 50, // Initial preference points
      }));

      await apiClient.updateUserPreferences(preferences);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Interests</Text>
          <Text style={styles.subtitle}>
            Select topics you'd like to learn about to personalize your experience
          </Text>
        </View>

        <View style={styles.topicsContainer}>
          {SAMPLE_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicCard,
                selectedTopics.has(topic.id) && styles.topicCardSelected,
              ]}
              onPress={() => toggleTopic(topic.id)}
            >
              <View style={[styles.topicIcon, { backgroundColor: topic.color }]}>
                <Ionicons name={topic.icon as any} size={24} color="white" />
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>{topic.name}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </View>
              {selectedTopics.has(topic.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading || selectedTopics.size === 0}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Setting up...' : `Continue (${selectedTopics.size} selected)`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  topicsContainer: {
    marginBottom: 40,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topicCardSelected: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
});