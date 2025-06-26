import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { ContentCard } from '../../components/ContentCard';
import ActionButtons from '../../components/ActionButtons';
import StreakButton from '../../components/StreakButton';
import { apiClient } from '../../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Type definition for facts from API
interface Fact {
  id: string;
  hook: string;
  summary: string;
  fullContent: string;
  image: string;
  topic: string;
  source: string;
  sourceUrl: string;
  readTime: number;
  tags?: string[];
}

const getFactCards = (fact: Fact) => {
  const cards = [
    {
      key: 'hook',
      title: fact.hook,
      body: '',
      isSourceCard: false,
      isHookCard: true,
      sourceUrl: undefined,
    },
    ...fact.fullContent
      .split('.')
      .filter(Boolean)
      .map((sentence: string, idx: number) => ({
        key: `content-${idx}`,
        title: '',
        body: sentence.trim() + '.',
        isSourceCard: false,
        isHookCard: undefined,
        sourceUrl: undefined,
      })),
    {
      key: 'summary',
      title: 'Summary',
      body: fact.summary,
      isSourceCard: false,
      isHookCard: undefined,
      sourceUrl: undefined,
    },
    {
      key: 'source',
      title: 'Source',
      body: fact.sourceUrl,
      isSourceCard: true,
      isHookCard: undefined,
      sourceUrl: fact.sourceUrl,
    },
  ];
  return cards;
};

const FactCarousel = ({ fact }: { fact: Fact }) => {
  const cards = getFactCards(fact);
  const [cardIndex, setCardIndex] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={cards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              height: SCREEN_HEIGHT,
              width: SCREEN_WIDTH,
            }}
          >
            <View
              style={{
                aspectRatio: 4 / 5,
                width: SCREEN_WIDTH,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ContentCard
                title={item.title}
                body={item.body}
                isSourceCard={item.isSourceCard}
                isHookCard={item.isHookCard}
                sourceUrl={item.sourceUrl}
                tags={item.isHookCard ? fact.tags : undefined} // Show tags only on hook card
                onSourcePress={
                  item.isSourceCard && item.sourceUrl
                    ? () => Linking.openURL(item.sourceUrl)
                    : undefined
                }
              />
            </View>
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCardIndex(idx);
        }}
      />
      {/* Action buttons positioned on the right side */}
      <ActionButtons fact={fact} style={styles.actionButtons} />
    </View>
  );
};

export default function IndexScreen() {
  const [factIndex, setFactIndex] = useState(0);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Fetch user data from backend to get current streak
  const currentStreak = 7; // Placeholder - replace with actual backend data

  // Fetch personalized content from backend
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching personalized content...');
        const response = (await apiClient.getContents(20, 0)) as {
          data: Fact[];
        };
        console.log('Content response:', response);
        setFacts(response.data || []);
      } catch (error: any) {
        console.error('Error fetching content:', error);
        setError('Failed to load content. Please try again.');
        Alert.alert('Error', 'Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        {/* Bolt.new logo - Hackathon requirement */}
        <TouchableOpacity
          style={styles.logoButton}
          onPress={() => Linking.openURL('https://bolt.new/')}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/images/white_circle_360x360.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>DOPA</Text>
        <StreakButton streakCount={currentStreak} />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.tint} />
          <Text style={styles.loadingText}>
            Loading personalized content...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              const fetchContent = async () => {
                try {
                  setLoading(true);
                  setError(null);
                  const response = (await apiClient.getContents(20, 0)) as {
                    data: Fact[];
                  };
                  setFacts(response.data || []);
                } catch (error: any) {
                  setError('Failed to load content. Please try again.');
                } finally {
                  setLoading(false);
                }
              };
              fetchContent();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : facts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No content available. Complete onboarding to get personalized
            content!
          </Text>
        </View>
      ) : (
        <FlatList
          data={facts}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FactCarousel fact={item} />}
          style={{ flex: 1 }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.y / SCREEN_HEIGHT
            );
            setFactIndex(idx);
            // TODO: Track fact viewing analytics to backend
            // Example: await api.trackFactView(facts[idx].id)
          }}
          getItemLayout={(_, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 50,
    paddingBottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
    alignSelf: 'center',
    marginTop: 10,
  },
  logoButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 8 : 58,
    zIndex: 100,
  },
  logo: {
    width: 60,
    height: 60,
  },
  actionButtons: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
});
