import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../lib/api';

const { width } = Dimensions.get('window');

interface Topic {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

const TOPICS: Topic[] = [
  { id: '1', name: 'Science', emoji: '🧪', color: '#00d4ff', description: 'Mind-blowing discoveries' },
  { id: '2', name: 'Space', emoji: '🚀', color: '#ff006e', description: 'Cosmic mysteries' },
  { id: '3', name: 'Psychology', emoji: '🧠', color: '#8338ec', description: 'How your brain works' },
  { id: '4', name: 'History', emoji: '🏛️', color: '#ffbe0b', description: 'Wild stories from the past' },
  { id: '5', name: 'Pop Culture', emoji: '🎭', color: '#fb5607', description: 'What\'s trending' },
  { id: '6', name: 'Random Facts', emoji: '🎲', color: '#3a86ff', description: 'Weird & wonderful' },
  { id: '7', name: 'Technology', emoji: '💻', color: '#06ffa5', description: 'Future is now' },
  { id: '8', name: 'Nature', emoji: '🌿', color: '#2d6a4f', description: 'Planet Earth secrets' },
  { id: '9', name: 'Food', emoji: '🍕', color: '#f77f00', description: 'Tasty knowledge' },
  { id: '10', name: 'Sports', emoji: '⚽', color: '#d62828', description: 'Athletic achievements' },
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

  const handleContinue = async () => {
    if (selectedTopics.size === 0) {
      Alert.alert('Hold up! 🛑', 'Pick at least one topic to get your brain juice flowing');
      return;
    }

    setLoading(true);
    try {
      const preferences = Array.from(selectedTopics).map(topicId => ({
        topic_id: topicId,
        points: 50,
      }));

      await apiClient.updateUserPreferences(preferences);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Oops! 😅', 'Something went wrong. Let\'s try that again!');
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
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