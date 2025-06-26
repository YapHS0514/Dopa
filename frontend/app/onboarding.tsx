import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { TOPICS } from '../constants/MockData';
import { useStore } from '../lib/store';
import { useAuth } from '../hooks/useAuth';

const AGE_GROUPS = [
  { id: '8-12', label: '8-12 years' },
  { id: '13-17', label: '13-17 years' },
  { id: '18-25', label: '18-25 years' },
];

const { width } = Dimensions.get('window');
const TOPIC_ITEM_WIDTH = (width - 48) / 2;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const updateUserProfile = useStore((state) => state.updateUserProfile);
  const { completeOnboarding } = useAuth();

  const handleTopicToggle = useCallback((topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }, []);

  const handleNext = useCallback(async () => {
    if (step === 1 && selectedAgeGroup) {
      setStep(2);
    } else if (step === 2 && selectedTopics.length >= 5) {
      try {
        // Update local store
        updateUserProfile({
          age_group: selectedAgeGroup as '8-12' | '13-17' | '18-25',
          selected_topics: selectedTopics,
        });

        // Mark onboarding as completed in the backend
        await completeOnboarding();

        // Navigate to main app
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Still navigate to tabs even if there's an error
        router.replace('/(tabs)');
      }
    }
  }, [
    step,
    selectedAgeGroup,
    selectedTopics,
    updateUserProfile,
    completeOnboarding,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {step === 1 ? (
        <Animatable.View animation="fadeIn" style={styles.stepContainer}>
          <Text style={[styles.title, { color: Colors.text }]}>
            What's your age group?
          </Text>
          <Text style={[styles.subtitle, { color: Colors.text }]}>
            We'll customize content for your age group
          </Text>

          <View style={styles.optionsContainer}>
            {AGE_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.ageOption,
                  {
                    backgroundColor:
                      selectedAgeGroup === group.id
                        ? Colors.tint
                        : Colors.background,
                    borderColor: Colors.border,
                  },
                ]}
                onPress={() => setSelectedAgeGroup(group.id)}
              >
                <Text style={[styles.ageOptionText, { color: Colors.text }]}>
                  {group.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
      ) : (
        <Animatable.View animation="fadeIn" style={styles.stepContainer}>
          <Text style={[styles.title, { color: Colors.text }]}>
            Choose your interests
          </Text>
          <Text style={[styles.subtitle, { color: Colors.text }]}>
            Select at least 5 topics you'd like to learn about
          </Text>

          <ScrollView
            style={styles.topicsContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topicsGrid}>
              {TOPICS.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicItem,
                    {
                      backgroundColor: selectedTopics.includes(topic.id)
                        ? Colors.tint
                        : Colors.background,
                      borderColor: Colors.border,
                    },
                  ]}
                  onPress={() => handleTopicToggle(topic.id)}
                >
                  <Text style={styles.topicIcon}>{topic.icon}</Text>
                  <Text style={[styles.topicName, { color: Colors.text }]}>
                    {topic.name}
                  </Text>
                  <Text
                    style={[
                      styles.topicDescription,
                      { color: Colors.textSecondary },
                    ]}
                  >
                    {topic.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animatable.View>
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            backgroundColor:
              (step === 1 && selectedAgeGroup) ||
              (step === 2 && selectedTopics.length >= 5)
                ? Colors.tint
                : Colors.muted,
          },
        ]}
        disabled={
          (step === 1 && !selectedAgeGroup) ||
          (step === 2 && selectedTopics.length < 5)
        }
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>
          {step === 1 ? 'Next' : 'Get Started'}
        </Text>
        <Feather name="arrow-right" size={20} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  ageOption: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  ageOptionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  topicsContainer: {
    flex: 1,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 100,
  },
  topicItem: {
    width: TOPIC_ITEM_WIDTH,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  topicIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  nextButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
