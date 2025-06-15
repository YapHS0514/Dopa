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
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

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
  };
}

interface RecommendationsResponse {
  data: Content[];
}

export default function HomeScreen() {
  const { user, session, loading: authLoading } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      if (!session?.access_token) {
        router.replace('/(auth)/login');
        return;
      }
      const response = await apiClient.getRecommendations(20) as RecommendationsResponse;
      setContents(response.data);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      Alert.alert('Error', 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!session?.access_token) {
        router.replace('/(auth)/login');
      } else {
        fetchRecommendations();
      }
    }
  }, [authLoading, session]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const handleInteraction = async (contentId: string, type: string, value: number) => {
    try {
      await apiClient.recordInteraction(contentId, type, value);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const renderContent = ({ item }: { item: Content }) => (
    <ContentCard
      content={item}
      onInteraction={handleInteraction}
    />
  );

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>For You</Text>
        <Text style={styles.subtitle}>Personalized learning content</Text>
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});