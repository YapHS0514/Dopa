import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  Text,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { TopicTags } from './TopicTags';
import * as Animatable from 'react-native-animatable';
import { CarouselSlide } from '../hooks/useInfiniteContent';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CarouselCardProps = {
  slides: CarouselSlide[];
  title: string;
  sourceUrl: string;
  tags?: string[];
  onEngagementTracked?: (
    contentId: string,
    engagementType: string,
    value: number
  ) => void;
  contentId: string;
  contentEngagementTracked?: React.MutableRefObject<Set<string>>;
};

export function CarouselCard({
  slides,
  title,
  sourceUrl,
  tags,
  onEngagementTracked,
  contentId,
  contentEngagementTracked,
}: CarouselCardProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const hasTrackedInterested = useRef(false);
  const hasTrackedEngaged = useRef(false);

  // Create cards array: image slides + source card
  // Note: slide_index 0 is the title image, so we display all slides as images
  const carouselCards = [
    // All image slides (including slide 0 which is the title image)
    ...slides.map((slide) => ({
      type: 'slide',
      imageUrl: slide.image_url,
      isSourceCard: false,
      slideIndex: slide.slide_index,
    })),
    // Source card at the end
    {
      type: 'source',
      imageUrl: '',
      isSourceCard: true,
      slideIndex: slides.length, // After all slides
    },
  ];

  const handleImageLoadStart = (imageUrl: string) => {
    setImageLoadingStates((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const handleImageLoadEnd = (imageUrl: string) => {
    setImageLoadingStates((prev) => ({ ...prev, [imageUrl]: false }));
  };

  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    if (item.isSourceCard) {
      // Source card
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: SCREEN_HEIGHT,
            width: SCREEN_WIDTH,
          }}
        >
          <Animatable.View animation="fadeInUp" style={styles.sourceContainer}>
            <Text style={styles.sourceTitle}>Source</Text>
            <TouchableOpacity
              onPress={() => sourceUrl && Linking.openURL(sourceUrl)}
              style={styles.sourceButton}
            >
              <Text style={styles.sourceButtonText}>View Source</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      );
    } else {
      // Image slide (including slide 0 which is the title image)
      const isLoading = imageLoadingStates[item.imageUrl] || false;
      const isFirstSlide = index === 0; // First slide (title image) gets topic tags

      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: SCREEN_HEIGHT,
            width: SCREEN_WIDTH,
          }}
        >
          <Animatable.View
            animation="fadeInUp"
            style={styles.fullImageContainer}
          >
            {/* Show topic tags only on first slide (title image) */}
            {isFirstSlide && tags && tags.length > 0 && (
              <TopicTags tags={tags} style={styles.topicTags} />
            )}

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.tint} />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.fullScreenImage}
              resizeMode="cover"
              onLoadStart={() => handleImageLoadStart(item.imageUrl)}
              onLoadEnd={() => handleImageLoadEnd(item.imageUrl)}
              onError={() => {
                handleImageLoadEnd(item.imageUrl);
                console.error(`Failed to load image: ${item.imageUrl}`);
              }}
            />
          </Animatable.View>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={carouselCards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={renderCarouselItem}
        onMomentumScrollEnd={(e) => {
          const slideIndex = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentSlideIndex(slideIndex);

          // Track engagement based on swipe behavior
          if (slideIndex > 0 && !hasTrackedInterested.current) {
            // User swiped at least once - "INTERESTED"
            console.log(
              `🖼️ CarouselContent ${contentId}: Swiped to slide ${slideIndex} - tracking as interested`
            );
            hasTrackedInterested.current = true;
            contentEngagementTracked?.current.add(contentId);
            onEngagementTracked?.(contentId, 'interested', 1);
          }

          // Check if user reached the source card (last card) - "ENGAGED"
          const isSourceCard = carouselCards[slideIndex]?.isSourceCard;
          if (isSourceCard && !hasTrackedEngaged.current) {
            console.log(
              `🖼️ CarouselContent ${contentId}: Reached source card - tracking as engaged`
            );
            hasTrackedEngaged.current = true;
            contentEngagementTracked?.current.add(contentId);
            onEngagementTracked?.(contentId, 'engaged', 2);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    position: 'relative',
  },
  titleText: {
    color: '#374151',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
    marginTop: 50,
  },
  topicTags: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  imageContainer: {
    flex: 1,
    width: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  fullImageContainer: {
    aspectRatio: 9 / 16,
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  sourceContainer: {
    aspectRatio: 9 / 16,
    width: SCREEN_WIDTH * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 24,
  },
  sourceTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
  },
  sourceButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'darkgrey',
    borderRadius: 10,
    alignItems: 'center',
  },
  sourceButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
});
