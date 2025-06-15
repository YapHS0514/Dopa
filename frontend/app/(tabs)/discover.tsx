import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentCard } from '../../components/ContentCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiClient } from '../../lib/api';

interface Topic {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Content {
  id: string;
  title: string;
  summary: string;
  content_type: string;
  tags: string[];
  difficulty_level: number;
  estimated_read_time: number;
  topics: Topic;
}

interface ApiResponse<T> {
  data: T;
}

export default function DiscoverScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTopics = async () => {
    try {
      const response = (await apiClient.getTopics()) as ApiResponse<Topic[]>;
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchContents = async (topicId?: string) => {
    try {
      const response = (await apiClient.getContents(
        20,
        0,
        topicId
      )) as ApiResponse<Content[]>;
      setContents(response.data);
    } catch (error: any) {
      console.error('Error fetching contents:', error);
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchTopics();
      await fetchContents();
    };
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContents(selectedTopic || undefined);
  };

  const handleTopicSelect = (topicId: string) => {
    if (selectedTopic === topicId) {
      setSelectedTopic(null);
      fetchContents();
    } else {
      setSelectedTopic(topicId);
      fetchContents(topicId);
    }
  };

  const handleInteraction = async (
    contentId: string,
    type: string,
    value: number
  ) => {
    try {
      await apiClient.recordInteraction(contentId, type, value);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const renderTopic = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={[
        styles.topicChip,
        { backgroundColor: selectedTopic === item.id ? item.color : '#f0f0f0' },
      ]}
      onPress={() => handleTopicSelect(item.id)}
    >
      <Text
        style={[
          styles.topicText,
          { color: selectedTopic === item.id ? 'white' : '#333' },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = ({ item }: { item: Content }) => (
    <ContentCard content={item} onInteraction={handleInteraction} />
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Explore topics and find new content</Text>
      </View>

      <View style={styles.topicsSection}>
        <FlatList
          data={topics}
          renderItem={renderTopic}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsContainer}
        />
      </View>

      <FlatList
        data={contents}
        renderItem={renderContent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
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
  topicsSection: {
    marginBottom: 10,
  },
  topicsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
