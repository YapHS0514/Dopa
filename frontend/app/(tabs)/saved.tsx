import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';

interface SavedContent {
  id: string;
  created_at: string;
  contents: {
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
    };
  };
}

const SAMPLE_SAVED = [
  {
    id: '1',
    created_at: '2024-01-15',
    contents: {
      id: '1',
      title: 'Did You Know?',
      summary: 'Octopuses have 3 hearts. That\'s two more than your ex. 🐙💔',
      topics: { name: 'Science', color: '#00d4ff', icon: '🧪' },
      tags: ['ocean', 'biology'],
      difficulty_level: 1,
    },
  },
  {
    id: '2',
    created_at: '2024-01-14',
    contents: {
      id: '2',
      title: 'Mind = Blown 🤯',
      summary: 'Honey never spoils. Archaeologists have found 3000-year-old honey that\'s still perfectly edible. Ancient snack goals! 🍯',
      topics: { name: 'History', color: '#ffbe0b', icon: '🏛️' },
      tags: ['food', 'ancient'],
      difficulty_level: 1,
    },
  },
];

export default function SavedScreen() {
  const { loading: authLoading } = useAuth();
  const [savedContents, setSavedContents] = useState<SavedContent[]>(SAMPLE_SAVED as any);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const fetchSavedContents = async () => {
    try {
      const response = await apiClient.getSavedContent();
      if (response.data.length > 0) {
        setSavedContents(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching saved contents:', error);
      // Keep using sample data if API fails
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSavedContents();
    }
  }, [authLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedContents();
  };

  const handleUnsave = async (savedContentId: string) => {
    Alert.alert(
      'Remove from saved? 🗑️',
      'This fact will be gone forever (or until you find it again)',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.removeSavedContent(savedContentId);
              setSavedContents(prev => prev.filter(item => item.id !== savedContentId));
            } catch (error) {
              console.error('Error removing saved content:', error);
              Alert.alert('Oops! 😅', 'Failed to remove. Try again!');
            }
          },
        },
      ]
    );
  };

  const toggleTag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      savedContents.flatMap(item => item.contents.tags)
    )
  );

  // Filter content by selected tags
  const filteredContent = selectedTags.size === 0 
    ? savedContents 
    : savedContents.filter(item => 
        item.contents.tags.some(tag => selectedTags.has(tag))
      );

  const renderSavedContent = ({ item }: { item: SavedContent }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <LinearGradient
        colors={[item.contents.topics.color + '20', '#1a1a2e']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.topicBadge, { backgroundColor: item.contents.topics.color }]}>
            <Text style={styles.topicEmoji}>{item.contents.topics.icon}</Text>
            <Text style={styles.topicName}>{item.contents.topics.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.unsaveButton}
            onPress={() => handleUnsave(item.id)}
          >
            <Ionicons name="bookmark" size={20} color="#00d4ff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Text style={styles.cardTitle}>{item.contents.title}</Text>
        <Text style={styles.cardText}>{item.contents.summary}</Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.contents.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.savedDate}>
            Saved {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a2e']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your saved gems... 💎</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#1a1a2e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Collection 💾</Text>
          <Text style={styles.subtitle}>
            {savedContents.length} facts saved • Knowledge is power
          </Text>
        </View>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <View style={styles.filterSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsFilter}
            >
              <TouchableOpacity
                style={[
                  styles.filterTag,
                  selectedTags.size === 0 && styles.filterTagActive
                ]}
                onPress={() => setSelectedTags(new Set())}
              >
                <Text style={[
                  styles.filterTagText,
                  selectedTags.size === 0 && styles.filterTagTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {allTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.filterTag,
                    selectedTags.has(tag) && styles.filterTagActive
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.filterTagText,
                    selectedTags.has(tag) && styles.filterTagTextActive
                  ]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content */}
        {filteredContent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤷‍♀️</Text>
            <Text style={styles.emptyTitle}>
              {selectedTags.size > 0 ? 'No facts with those tags' : 'No saved facts yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTags.size > 0 
                ? 'Try different tags or clear the filter'
                : 'Start swiping up on facts you want to remember!'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredContent}
            renderItem={renderSavedContent}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#00d4ff"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterSection: {
    marginBottom: 10,
  },
  tagsFilter: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTagActive: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  filterTagText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTagTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  topicEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  topicName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  unsaveButton: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedDate: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  shareButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
});