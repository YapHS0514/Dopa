import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';

interface Content {
  id: string;
  title: string;
  summary: string;
  content_type: string;
  tags: string[];
  difficulty_level: number;
  estimated_read_time: number;
  topics: {
    id: string;
    name: string;
    color: string;
    icon: string;
  }[];
}

interface ContentCardProps {
  content: Content;
  onInteraction: (contentId: string, type: string, value: number) => void;
  isSaved?: boolean;
  savedContentId?: string;
  onUnsave?: (savedContentId: string) => void;
}

export function ContentCard({ 
  content, 
  onInteraction, 
  isSaved = false, 
  savedContentId,
  onUnsave 
}: ContentCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const newLiked = !liked;
      setLiked(newLiked);
      await onInteraction(content.id, 'like', newLiked ? 10 : -10);
    } catch (error) {
      setLiked(!liked); // Revert on error
      console.error('Error liking content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (saved && savedContentId && onUnsave) {
        // Unsave content
        await onUnsave(savedContentId);
        setSaved(false);
      } else {
        // Save content
        await apiClient.saveContent(content.id);
        setSaved(true);
        await onInteraction(content.id, 'save', 5);
      }
    } catch (error: any) {
      console.error('Error saving content:', error);
      if (error.message.includes('409')) {
        // Already saved
        setSaved(true);
      } else {
        Alert.alert('Error', 'Failed to save content');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    await onInteraction(content.id, 'view', 1);
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return '#10B981'; // Easy - Green
      case 2: return '#F59E0B'; // Medium - Yellow
      case 3: return '#EF4444'; // Hard - Red
      default: return '#6B7280'; // Default - Gray
    }
  };

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleView} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.topicInfo}>
          {content.topics && content.topics[0] && (
            <>
              <View style={[styles.topicIcon, { backgroundColor: content.topics[0].color }]}>
                <Ionicons name={content.topics[0].icon as any} size={16} color="white" />
              </View>
              <Text style={styles.topicName}>{content.topics[0].name}</Text>
            </>
          )}
        </View>
        <View style={styles.metadata}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(content.difficulty_level) }]}>
            <Text style={styles.difficultyText}>{getDifficultyText(content.difficulty_level)}</Text>
          </View>
          <Text style={styles.readTime}>{content.estimated_read_time}s</Text>
        </View>
      </View>

      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.summary}>{content.summary}</Text>

      {content.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {content.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, liked && styles.actionButtonActive]}
          onPress={handleLike}
          disabled={loading}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? '#EF4444' : '#666'}
          />
          <Text style={[styles.actionText, liked && styles.actionTextActive]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, saved && styles.actionButtonActive]}
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? '#667eea' : '#666'}
          />
          <Text style={[styles.actionText, saved && styles.actionTextActive]}>
            {saved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  readTime: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonActive: {
    backgroundColor: '#f8f9ff',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  actionTextActive: {
    color: '#333',
    fontWeight: '600',
  },
});