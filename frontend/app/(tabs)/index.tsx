import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  PanResponder,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
  Alert,
  Share,
  Platform,
  SafeAreaView,
} from 'react-native';
import { GlobalStyles } from '../../constants/GlobalStyles';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_FACTS } from '../../constants/MockData';
import { ContentCard } from '../../components/ContentCard';
import type { ListRenderItemInfo } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Fact = (typeof MOCK_FACTS)[number];

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
  const [liked, setLiked] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const likeAnim = useRef(new Animated.Value(1)).current;
  const listenAnim = useRef(new Animated.Value(1)).current;
  const shareAnim = useRef(new Animated.Value(1)).current;
  const saveAnim = useRef(new Animated.Value(1)).current;

  // Animation for button press
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animatePress = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const handleLike = () => {
    animatePress(likeAnim);
    setLiked((l) => !l);
  };
  const handleSave = () => {
    animatePress(saveAnim);
    setSaved((s) => !s);
  };
  const handleListen = async () => {
    animatePress(listenAnim);
    if (!listening) {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to use speaker denied.');
        return;
      }
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../../assets/sound.mp3') // Update to your path
        );
        setSound(newSound);
        await newSound.playAsync();
        setListening(true);
      } catch (e) {
        Alert.alert('Audio error', 'Unable to play sound.');
      }
    } else {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setListening(false);
    }
  };
  const handleShare = () => {
    animatePress(shareAnim);
    setShowSheet(true);
  };
  const closeSheet = () => setShowSheet(false);

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
      {/* Right side buttons */}
      <View style={styles.bottomRight}>
        <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
          <Animated.View
            style={{ transform: [{ scale: likeAnim }], marginBottom: 25 }}
          >
            <Ionicons
              name={'heart'}
              size={32}
              color={liked ? '#ef4444' : Colors.text}
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleListen} activeOpacity={0.7}>
          <Animated.View
            style={{ transform: [{ scale: listenAnim }], marginBottom: 25 }}
          >
            <Ionicons
              name={'volume-high'}
              size={32}
              color={listening ? 'gold' : Colors.text}
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
          <Animated.View
            style={{ transform: [{ scale: shareAnim }], marginBottom: 25 }}
          >
            <Ionicons name={'share-social'} size={32} color={Colors.text} />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
            <Ionicons
              name={'bookmark'}
              size={32}
              color={saved ? 'gold' : Colors.text}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
      {/* Bottom Sheet for Share */}
      {showSheet && (
        <Animated.View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Share</Text>
          <TouchableOpacity onPress={closeSheet} style={styles.sheetClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {/* Add your share options here */}
        </Animated.View>
      )}
    </View>
  );
};

export default function IndexScreen() {
  const [factIndex, setFactIndex] = useState(0);
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerText}>DOPA</Text>
        <TouchableOpacity
          style={styles.streakButton}
          onPress={() => router.push('/streak')}
          activeOpacity={0.7}
        >
          <Ionicons name="flame" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={MOCK_FACTS}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FactCarousel fact={item} />}
        style={{ flex: 1 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
          setFactIndex(idx);
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
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
  streakButton: {
    position: 'absolute',
    right: 24,
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 8 : 58,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 100,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0,
    zIndex: 1,
  },
  cardContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: Colors.cardBackground,
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    zIndex: 2,
  },
  bottomRight: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    alignItems: 'center',
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 220,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetClose: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
});
