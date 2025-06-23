import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48 - GRID_SPACING) / 2;

const MOCK_SAVED_FACTS = [
  {
    id: '1',
    fact: 'Your brain uses 20% of the total oxygen in your body.',
    topic: 'Science',
    icon: '🧬',
    color: '#FF6B6B',
  },
  {
    id: '2',
    fact: 'One day on Venus is longer than one year on Venus.',
    topic: 'Space',
    icon: '🚀',
    color: '#4ECDC4',
  },
  {
    id: '3',
    fact: "The ocean contains 97% of Earth's water.",
    topic: 'Nature',
    icon: '🌊',
    color: '#A78BFA',
  },
  {
    id: '4',
    fact: 'The human brain can process images in as little as 13 milliseconds!',
    topic: 'Psychology',
    icon: '🧠',
    color: '#F472B6',
  },
];

export default function SavedScreen() {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';

  const renderSavedItem = (item: (typeof MOCK_SAVED_FACTS)[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.gridItem}
      onPress={() => {
        // Handle item press
      }}
    >
      <LinearGradient
        colors={[`${item.color}20`, 'transparent']}
        style={styles.gridItemGradient}
      >
        <BlurView
          intensity={100}
          tint={isDark ? 'dark' : 'light'}
          style={styles.gridItemContent}
        >
          <View
            style={[styles.topicBadge, { backgroundColor: `${item.color}20` }]}
          >
            <Text style={styles.topicIcon}>{item.icon}</Text>
            <Text style={[styles.topicText, { color: item.color }]}>
              {item.topic}
            </Text>
          </View>
          <Text
            style={[styles.factText, { color: Colors.text }]}
            numberOfLines={4}
          >
            {item.fact}
          </Text>
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>Saved Facts</Text>
        <View
          style={[
            styles.savesCounter,
            {
              backgroundColor: Colors.cardBackground,
            },
          ]}
        >
          <Text style={[styles.savesText, { color: Colors.textSecondary }]}>
            Saves remaining:
          </Text>
          <Text style={[styles.savesNumber, { color: Colors.text }]}>8/10</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>{MOCK_SAVED_FACTS.map(renderSavedItem)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 16,
  },
  savesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  savesText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  savesNumber: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH * 1.2,
    marginBottom: GRID_SPACING,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridItemGradient: {
    flex: 1,
    padding: 1,
  },
  gridItemContent: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  topicIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  topicText: {
    fontSize: 12,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
  factText: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    lineHeight: 20,
  },
});
