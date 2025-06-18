import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import { useStore } from '../lib/store';
import { Colors } from '../constants/Colors';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; // 20px padding on each side

type ContentCardProps = {
  content: {
    id: string;
    title: string;
    summary: string;
    content_type: string;
    tags: string[];
    difficulty_level: number;
    estimated_read_time: number;
    topics: Array<{
      id: string;
      name: string;
      color: string;
      icon: string;
    }>;
  };
  onInteraction: (contentId: string, type: string, value: number) => void;
};

export function ContentCard({ content, onInteraction }: ContentCardProps) {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';

  const handleLike = () => {
    onInteraction(content.id, 'like', 1);
  };

  const handleSave = () => {
    onInteraction(content.id, 'save', 1);
  };

  const handleShare = () => {
    onInteraction(content.id, 'share', 1);
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      style={styles.container}
    >
      <BlurView
        intensity={100}
        tint={isDark ? 'dark' : 'light'}
        style={styles.cardBlur}
      >
        <LinearGradient
          colors={[
            `${content.topics[0].color}20`,
            'transparent'
          ]}
          style={styles.cardGradient}
        >
          <View style={styles.header}>
            <View style={styles.topicContainer}>
              <Text style={styles.topicIcon}>{content.topics[0].icon}</Text>
              <Text style={[
                styles.topicText,
                { color: content.topics[0].color }
              ]}>
                {content.topics[0].name}
              </Text>
            </View>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Feather
                  name="clock"
                  size={12}
                  color={Colors[isDark ? 'dark' : 'light'].textSecondary}
                />
                <Text style={[
                  styles.metaText,
                  { color: Colors[isDark ? 'dark' : 'light'].textSecondary }
                ]}>
                  {content.estimated_read_time}m
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Feather
                  name="bar-chart-2"
                  size={12}
                  color={Colors[isDark ? 'dark' : 'light'].textSecondary}
                />
                <Text style={[
                  styles.metaText,
                  { color: Colors[isDark ? 'dark' : 'light'].textSecondary }
                ]}>
                  Level {content.difficulty_level}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[
            styles.title,
            { color: Colors[isDark ? 'dark' : 'light'].text }
          ]}>
            {content.title}
          </Text>

          <Text style={[
            styles.summary,
            { color: Colors[isDark ? 'dark' : 'light'].textSecondary }
          ]}>
            {content.summary}
          </Text>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Feather
                name="heart"
                size={24}
                color={Colors[isDark ? 'dark' : 'light'].tint}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSave}
            >
              <Feather
                name="bookmark"
                size={24}
                color={Colors[isDark ? 'dark' : 'light'].tint}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Feather
                name="share-2"
                size={24}
                color={Colors[isDark ? 'dark' : 'light'].tint}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </BlurView>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 300,
    marginBottom: 20,
  },
  cardBlur: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  topicIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  topicText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
  title: {
    fontSize: 24,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    lineHeight: 24,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});