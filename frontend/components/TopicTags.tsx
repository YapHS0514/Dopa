import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TOPICS } from '../constants/MockData';

interface TopicTagsProps {
  tags: string[];
  style?: any;
}

// Enhanced topic mapping with colors and modern styling
const getTopicInfo = (tagName: string) => {
  const topic = TOPICS.find(t => t.name.toLowerCase() === tagName.toLowerCase());
  if (topic) {
    return {
      icon: topic.icon,
      name: topic.name,
      color: getTopicColor(topic.id)
    };
  }
  
  // Fallback for tags not in TOPICS
  return {
    icon: '🏷️',
    name: tagName,
    color: '#6B7280'
  };
};

// Color mapping for different topics
const getTopicColor = (topicId: string): string => {
  const colorMap: Record<string, string> = {
    'science': '#3B82F6',    // Blue
    'history': '#8B5CF6',    // Purple  
    'ai': '#10B981',         // Green
    'space': '#F59E0B',      // Orange
    'nature': '#22C55E',     // Green
    'psychology': '#EF4444', // Red
  };
  return colorMap[topicId] || '#6B7280';
};

// Get darker version of color for better text visibility
const getDarkerColor = (color: string): string => {
  const darkerColorMap: Record<string, string> = {
    '#3B82F6': '#1D4ED8',    // Darker Blue
    '#8B5CF6': '#7C3AED',    // Darker Purple  
    '#10B981': '#059669',    // Darker Green
    '#F59E0B': '#D97706',    // Darker Orange
    '#22C55E': '#16A34A',    // Darker Green
    '#EF4444': '#DC2626',    // Darker Red
    '#6B7280': '#4B5563',    // Darker Gray
  };
  return darkerColorMap[color] || '#374151';
};

export const TopicTags: React.FC<TopicTagsProps> = ({ tags, style }) => {
  // Only show up to 3 tags
  const displayTags = tags.slice(0, 3);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Premium fade-in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  if (displayTags.length === 0) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {displayTags.map((tag, index) => {
        const topicInfo = getTopicInfo(tag);
        return (
          <View 
            key={index} 
            style={[
              styles.tagPill,
              { backgroundColor: `${topicInfo.color}25`, borderColor: `${topicInfo.color}60` }
            ]}
          >
            <Text style={[styles.tagText, { color: getDarkerColor(topicInfo.color) }]}>
              {topicInfo.icon} {topicInfo.name}
            </Text>
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'flex-start',
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'SF-Pro-Display',
  },
}); 