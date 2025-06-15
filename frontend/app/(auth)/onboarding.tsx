import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../lib/api';
const { width } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Topic {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
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

  const selectedTopicsList = Array.from(selectedTopics).map(id => 
    TOPICS.find(topic => topic.id === id)
  ).filter(Boolean);

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What makes you curious? 🤔</Text>
          <Text style={styles.subtitle}>
            Pick your poison (but like, the good kind that makes you smarter)
          </Text>
        </View>

        {/* Selected Topics Chips */}
        {selectedTopicsList.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedLabel}>Your vibe:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedChips}
            >
              {selectedTopicsList.map((topic) => (
                <TouchableOpacity
                  key={topic!.id}
                  style={[styles.selectedChip, { backgroundColor: topic!.color }]}
                  onPress={() => toggleTopic(topic!.id)}
                >
                  <Text style={styles.selectedChipText}>
                    {topic!.emoji} {topic!.name}
                  </Text>
                  <Text style={styles.removeX}>×</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Topics Grid */}
        <View style={styles.topicsGrid}>
          {TOPICS.map((topic) => {
            const isSelected = selectedTopics.has(topic.id);
            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicCard,
                  isSelected && { borderColor: topic.color, borderWidth: 3 },
                ]}
                onPress={() => toggleTopic(topic.id)}
              >
                <LinearGradient
                  colors={isSelected ? [topic.color + '40', topic.color + '20'] : ['#1a1a2e', '#16213e']}
                  style={styles.topicGradient}
                >
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  <Text style={styles.topicName}>{topic.name}</Text>
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: topic.color }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.continueButton, selectedTopics.size === 0 && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading || selectedTopics.size === 0}
          >
            <LinearGradient
              colors={selectedTopics.size > 0 ? ['#00d4ff', '#090979'] : ['#333', '#222']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Setting up your feed...' : `Let's go! (${selectedTopics.size} selected)`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.skipText}>Skip for now (but you'll miss out 😢)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  selectedSection: {
    marginBottom: 30,
  },
  selectedLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 12,
  },
  selectedChips: {
    paddingRight: 20,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedChipText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  removeX: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  topicCard: {
    width: (width - 50) / 2,
    height: 120,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topicGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topicEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonSection: {
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    padding: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
});
