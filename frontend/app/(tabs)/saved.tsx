import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentCard } from '../../components/ContentCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
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
    }[];
  };
}

interface SavedContentResponse {
  data: SavedContent[];
}

export default function SavedScreen() {
  const [savedContents, setSavedContents] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedContents = async () => {
    try {
      const response = await apiClient.getSavedContent() as SavedContentResponse;
      setSavedContents(response.data);
    } catch (error: any) {
      console.error('Error fetching saved contents:', error);
      Alert.alert('Error', 'Failed to load saved content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavedContents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedContents();
  };

  const handleInteraction = async (contentId: string, type: string, value: number) => {
    try {
      await apiClient.recordInteraction(contentId, type, value);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const handleUnsave = async (savedContentId: string) => {
    try {
      await apiClient.removeSavedContent(savedContentId);
      setSavedContents(prev => prev.filter(item => item.id !== savedContentId));
    } catch (error) {
      console.error('Error removing saved content:', error);
      Alert.alert('Error', 'Failed to remove saved content');
    }
  };

  const renderSavedContent = ({ item }: { item: SavedContent }) => (
    <ContentCard
      content={item.contents}
      onInteraction={handleInteraction}
      isSaved={true}
      savedContentId={item.id}
      onUnsave={handleUnsave}
    />
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>Your bookmarked content</Text>
      </View>

      {savedContents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No saved content yet</Text>
          <Text style={styles.emptySubtitle}>
            Save interesting content to read later
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedContents}
          renderItem={renderSavedContent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});