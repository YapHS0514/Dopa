import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { Colors } from '../constants/Colors';
import { TOPICS } from '../constants/MockData';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const AGE_GROUPS = [
  { id: '8-12', label: '8-12 years' },
  { id: '13-17', label: '13-17 years' },
  { id: '18-25', label: '18-25 years' },
];

const { width } = Dimensions.get('window');
const TOPIC_ITEM_WIDTH = (width - 48) / 2;
const MAX_TOPICS = 10;
const MIN_TOPICS = 3;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const updateUserProfile = useStore((state) => state.updateUserProfile);
  const { user, completeOnboarding } = useAuth();

  // Add authentication check
  useEffect(() => {
    if (!user) {
      console.log('No authenticated user, redirecting to login...');
      router.replace('/(auth)/login');
    }
  }, [user]);

  // If no user, show loading
  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const handleTopicToggle = useCallback((topicId: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      }
      if (prev.length >= MAX_TOPICS) {
        return prev;
      }
      return [...prev, topicId];
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (step === 1 && selectedAgeGroup) {
      setStep(2);
    } else if (step === 2 && selectedTopics.length >= MIN_TOPICS) {
      try {
        setLoading(true);

        // Save user topic preferences
        if (user) {
          const { error: topicError } = await supabase
            .from('user_topic_preferences')
            .insert(
              selectedTopics.map((topicId) => ({
                user_id: user.id,
                topic_id: topicId,
                proficiency_level: 'beginner',
              }))
            );

          if (topicError) throw topicError;
        }

        // Update local store
        updateUserProfile({
          age_group: selectedAgeGroup as '8-12' | '13-17' | '18-25',
          selected_topics: selectedTopics,
        });

        // Mark onboarding as completed
        await completeOnboarding();

        router.replace('/(tabs)');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to complete onboarding');
      } finally {
        setLoading(false);
      }
    }
  }, [
    step,
    selectedAgeGroup,
    selectedTopics,
    updateUserProfile,
    user,
    completeOnboarding,
  ]);

  return (
    <View style={styles.container}>
      {step === 1 ? (
        <Animatable.View animation="fadeIn" style={styles.stepContainer}>
          <Text style={styles.title}>What's your age group?</Text>
          <Text style={styles.subtitle}>
            We'll customize content for your age group
          </Text>

          <View style={styles.optionsContainer}>
            {AGE_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.ageOption,
                  selectedAgeGroup === group.id && styles.ageOptionSelected,
                ]}
                onPress={() => setSelectedAgeGroup(group.id)}
              >
                <Text
                  style={[
                    styles.ageOptionText,
                    selectedAgeGroup === group.id &&
                      styles.ageOptionTextSelected,
                  ]}
                >
                  {group.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
      ) : (
        <Animatable.View animation="fadeIn" style={styles.stepContainer}>
          <Text style={styles.title}>Choose your interests</Text>
          <Text style={styles.subtitle}>
            Select {MIN_TOPICS}-{MAX_TOPICS} topics you'd like to learn about
          </Text>
          <Text style={styles.topicCount}>
            {selectedTopics.length} of {MAX_TOPICS} selected
          </Text>

          <ScrollView
            style={styles.topicsContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topicsGrid}>
              {TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                const isDisabled =
                  !isSelected && selectedTopics.length >= MAX_TOPICS;

                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicItem,
                      isSelected && styles.topicItemSelected,
                      isDisabled && styles.topicItemDisabled,
                    ]}
                    onPress={() => handleTopicToggle(topic.id)}
                    disabled={isDisabled}
                  >
                    <Text style={styles.topicIcon}>{topic.icon}</Text>
                    <Text
                      style={[
                        styles.topicName,
                        isSelected && styles.topicNameSelected,
                      ]}
                    >
                      {topic.name}
                    </Text>
                    <Text
                      style={[
                        styles.topicDescription,
                        isSelected && styles.topicDescriptionSelected,
                      ]}
                    >
                      {topic.description}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Feather name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Animatable.View>
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          ((step === 1 && selectedAgeGroup) ||
            (step === 2 && selectedTopics.length >= MIN_TOPICS)) &&
            styles.nextButtonEnabled,
          loading && styles.nextButtonDisabled,
        ]}
        disabled={
          loading ||
          (step === 1 && !selectedAgeGroup) ||
          (step === 2 && selectedTopics.length < MIN_TOPICS)
        }
        onPress={handleNext}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.nextButtonText}>
              {step === 1 ? 'Next' : 'Get Started'}
            </Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.primary,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  topicCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.accent,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 16,
  },
  ageOption: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
  },
  ageOptionSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  ageOptionText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  ageOptionTextSelected: {
    color: Colors.buttonText,
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
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.cardBackground,
    position: 'relative',
  },
  topicItemSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  topicItemDisabled: {
    opacity: 0.5,
  },
  topicIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  topicNameSelected: {
    color: Colors.buttonText,
  },
  topicDescription: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter',
    color: Colors.textSecondary,
  },
  topicDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.secondary,
    gap: 8,
  },
  nextButtonEnabled: {
    backgroundColor: Colors.accent,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  nextButtonText: {
    color: Colors.buttonText,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
