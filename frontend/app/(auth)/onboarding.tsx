import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

const SAMPLE_TOPICS: Topic[] = [
  {
    id: '1',
    name: 'Technology',
    description: 'Latest tech trends',
    color: '#3B82F6',
    icon: 'phone-portrait-outline',
  },
  {
    id: '2',
    name: 'Science',
    description: 'Scientific discoveries',
    color: '#10B981',
    icon: 'flask-outline',
  },
  {
    id: '3',
    name: 'History',
    description: 'Historical events',
    color: '#F59E0B',
    icon: 'library-outline',
  },
  {
    id: '4',
    name: 'Sports',
    description: 'Sports and fitness',
    color: '#EF4444',
    icon: 'trophy-outline',
  },
  {
    id: '5',
    name: 'Health',
    description: 'Wellness and health',
    color: '#EC4899',
    icon: 'heart-outline',
  },
  {
    id: '6',
    name: 'Business',
    description: 'Business insights',
    color: '#6366F1',
    icon: 'briefcase-outline',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await apiClient.get<Topic[]>('/api/topics');
      setTopics(response);
    } catch (error) {
      console.error('Error fetching topics:', error);
      Alert.alert('Error', 'Failed to load topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleComplete = async () => {
    if (selectedTopics.length === 0) {
      Alert.alert('Error', 'Please select at least one topic');
      return;
    }

    try {
      const preferences = selectedTopics.map((topicId) => ({
        topic_id: topicId,
        points: 50,
      }));

      console.log('Sending preferences:', preferences);
      await apiClient.post('/api/user/preferences', preferences);

      // Update onboarding status
      await apiClient.post('/api/user/onboarding-complete');

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Topics</Text>
        <Text style={styles.subtitle}>
          Select the topics you're interested in
        </Text>
      </View>

      <View style={styles.topicsGrid}>
        {topics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[
              styles.topicCard,
              { backgroundColor: topic.color },
              selectedTopics.includes(topic.id) && styles.selectedTopic,
            ]}
            onPress={() => toggleTopic(topic.id)}
          >
            <Ionicons
              name={topic.icon as any}
              size={24}
              color="white"
              style={styles.topicIcon}
            />
            <Text style={styles.topicName}>{topic.name}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
            {selectedTopics.includes(topic.id) && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={24} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          selectedTopics.length === 0 && styles.disabledButton,
        ]}
        onPress={handleComplete}
        disabled={selectedTopics.length === 0}
      >
        <Text style={styles.confirmButtonText}>
          {selectedTopics.length > 0
            ? `Confirm (${selectedTopics.length} selected)`
            : 'Select at least one topic'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedTopic: {
    borderWidth: 2,
    borderColor: 'white',
  },
  topicIcon: {
    marginBottom: 10,
  },
  topicName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  topicDescription: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
