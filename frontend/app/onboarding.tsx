import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useStore } from '../lib/store';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

interface Topic {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  image_url?: string;
}

const AGE_GROUPS = [
  { id: '8-12', label: '8-12 years' },
  { id: '13-17', label: '13-17 years' },
  { id: '18-25', label: '18-25 years' },
];

const AGE_ACTIVE_COLOR = '#FF5C00';

const { width } = Dimensions.get('window');
const TOPIC_ITEM_WIDTH = width - 40;
const INTEREST_BOX_HEIGHT = 80;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const updateUserProfile = useStore((state) => state.updateUserProfile);

  // Fetch topics when component mounts
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoadingTopics(true);
        const response = (await apiClient.getTopics()) as { data: Topic[] };
        console.log('Fetched topics:', response);
        const topicsData = response.data || [];
        setTopics(topicsData);
      } catch (error) {
        console.error('Error fetching topics:', error);
        Alert.alert('Error', 'Failed to load topics. Please try again.');
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchTopics();
  }, []);

  const handleTopicToggle = useCallback(
    (topicId: string) => {
      const isSelected = selectedTopics.includes(topicId);

      setSelectedTopics((prev) =>
        prev.includes(topicId)
          ? prev.filter((id) => id !== topicId)
          : [...prev, topicId]
      );
    },
    [selectedTopics]
  );

  const handleNext = useCallback(async () => {
    if (step === 1 && selectedAgeGroup) {
      setStep(2);
    } else if (step === 2 && selectedTopics.length >= 5) {
      try {
        setSavingPreferences(true);

        // Update local store
        updateUserProfile({
          age_group: selectedAgeGroup as '8-12' | '13-17' | '18-25',
          selected_topics: selectedTopics,
        });

        // Save topic preferences to backend with 50 points each
        const preferences = selectedTopics.map((topicId) => ({
          topic_id: topicId,
          points: 50,
        }));

        console.log('Saving topic preferences:', preferences);
        await apiClient.updateUserPreferences(preferences);

        // Navigate to main app
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error completing onboarding:', error);
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
        // Don't navigate on error - let user try again
      } finally {
        setSavingPreferences(false);
      }
    }
  }, [step, selectedAgeGroup, selectedTopics, updateUserProfile]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {step === 1 ? (
        <Animatable.View animation="fadeIn" style={styles.stepContainer}>
          <View style={styles.centeredContent}>
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
                          ? AGE_ACTIVE_COLOR
                          : Colors.background,
                      borderColor: Colors.border,
                    },
                  ]}
                  onPress={() =>
                    setSelectedAgeGroup(
                      selectedAgeGroup === group.id ? null : group.id
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ageOptionText, { color: Colors.text }]}>
                    {group.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

          {loadingTopics ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.tint} />
              <Text style={[styles.loadingText, { color: Colors.text }]}>
                Loading topics...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.topicsContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.topicsGrid}>
                {topics.map((topic: Topic, idx) => {
                  const isSelected = selectedTopics.includes(topic.id);

                  return (
                    <View key={topic.id} style={styles.topicItemWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.topicItem,
                          {
                            backgroundColor: isSelected
                              ? Colors.tint
                              : Colors.background,
                            borderColor: isSelected ? '#FF5C00' : Colors.border,
                            borderWidth: isSelected ? 2 : 1,
                          },
                        ]}
                        onPress={() => handleTopicToggle(topic.id)}
                        activeOpacity={0.8}
                      >
                        {topic.image_url && (
                          <Image
                            source={{ uri: topic.image_url }}
                            style={styles.topicBackgroundImage}
                            resizeMode="cover"
                          />
                        )}
                        {topic.image_url && (
                          <View
                            style={[
                              styles.topicOverlay,
                              {
                                backgroundColor: isSelected
                                  ? 'rgba(0, 0, 0, 0.4)'
                                  : 'rgba(0, 0, 0, 0.35)',
                              },
                            ]}
                          />
                        )}
                        <Text
                          style={[
                            styles.topicName,
                            {
                              color: isSelected ? '#FF5C00' : '#FFFFFF',
                              textShadowColor: 'rgba(0, 0, 0, 0.75)',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                            },
                          ]}
                        >
                          {topic.name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </Animatable.View>
      )}

      {/* Next button for age group selection */}
      {step === 1 && selectedAgeGroup && (
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: AGE_ACTIVE_COLOR,
            },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Feather name="arrow-right" size={20} color={Colors.text} />
        </TouchableOpacity>
      )}

      {/* Only render the button if 5 or more topics are selected */}
      {step === 2 && selectedTopics.length >= 5 && (
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: AGE_ACTIVE_COLOR,
            },
          ]}
          disabled={savingPreferences}
          onPress={handleNext}
        >
          {savingPreferences ? (
            <>
              <ActivityIndicator size="small" color={Colors.text} />
              <Text style={styles.nextButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Text style={styles.nextButtonText}>Get Started</Text>
              <Feather name="arrow-right" size={20} color={Colors.text} />
            </>
          )}
        </TouchableOpacity>
      )}
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
    textAlign: 'center',
    marginTop: 30,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 32,
    textAlign: 'center',
    marginTop: 10,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginTop: 16,
  },
  ageOption: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  ageOptionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  topicsContainer: {
    flex: 1,
  },
  topicsGrid: {
    flexDirection: 'column',
    paddingBottom: 100,
  },
  topicItemWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  topicItem: {
    width: '100%',
    minHeight: INTEREST_BOX_HEIGHT,
    height: INTEREST_BOX_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    padding: 0,
  },
  topicIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 0, // remove or reduce this
  },
  topicName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 0,
  },
  topicDescription: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  nextButton: {
    position: 'absolute',
    bottom: 50,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    zIndex: -1,
  },
  topicOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    zIndex: -1,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
