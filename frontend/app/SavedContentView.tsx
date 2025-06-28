import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Colors } from '../constants/Colors';
import { ContentCard } from '../components/ContentCard';
import ActionButtons from '../components/ActionButtons';
import { Fact } from '../hooks/useInfiniteContent';
import { ReelCard } from '../components/ReelCard';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SavedContentViewProps {
  fact: Fact;
  onBack: () => void;
}

const getContentType = (fact: Fact): 'text' | 'reel' => {
  return fact.video_url ? 'reel' : 'text';
};

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
                tags={item.isHookCard ? fact.tags : undefined}
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
      <ActionButtons
        fact={{ ...fact, contentType: 'text' as const }}
        style={styles.actionButtons}
      />
    </View>
  );
};

// Component for Reel content
const ReelContent = ({ fact }: { fact: Fact }) => {
  const reelFact = {
    ...fact,
    contentType: 'reel' as const,
  };

  return (
    <View style={{ flex: 1 }}>
      <ReelCard
        videoUrl={fact.video_url!}
        title={fact.hook}
        tags={fact.tags}
        isVisible={true} // Always visible in this view
        contentId={fact.id}
        onLoadStart={() => console.log(`Loading saved reel: ${fact.id}`)}
        onLoad={() => console.log(`Saved reel loaded: ${fact.id}`)}
        onError={(error: string) =>
          console.error(`Saved reel error for ${fact.id}:`, error)
        }
      />
      {/* Action buttons for reels */}
      <ActionButtons fact={reelFact} style={styles.reelActionButtons} />
    </View>
  );
};

export default function SavedContentView({
  fact,
  onBack,
}: SavedContentViewProps) {
  const contentType = getContentType(fact);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Saved Content</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {contentType === 'reel' ? (
        <ReelContent fact={fact} />
      ) : (
        <FactCarousel fact={fact} />
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
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 50,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  actionButtons: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    zIndex: 10,
  },
  reelActionButtons: {
    position: 'absolute',
    right: 15,
    bottom: 200,
    zIndex: 10,
  },
});
