import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { MOCK_FACTS, Fact } from '../../constants/MockData';
import { TopicTags } from '../../components/TopicTags';

/**
 * TODO: BACKEND INTEGRATION CHECKLIST FOR SAVED SCREEN
 * 
 * 1. DATA LAYER:
 *    - Replace MOCK_SAVED_FACTS with real Supabase queries
 *    - Implement saved_facts table: user_id, fact_id, saved_at, user_notes
 *    - Add real-time subscriptions for save/unsave events
 *    - Implement offline caching with sync when online
 * 
 * 2. USER MANAGEMENT:
 *    - Fetch user's saves limit based on subscription tier
 *    - Track saves count and update in real-time
 *    - Implement premium tier unlimited saves
 * 
 * 3. ANALYTICS & TRACKING:
 *    - Track saved fact views, modal interactions, shares
 *    - Measure engagement metrics (time spent, scroll depth)
 *    - Log all user interactions for personalization
 * 
 * 4. CONTENT DELIVERY:
 *    - Implement image CDN with fallbacks
 *    - Add source URL validation and credibility scores
 *    - Track content quality metrics (image load rates, etc.)
 * 
 * 5. FEATURES TO ADD:
 *    - User notes on saved facts
 *    - Collections/folders for organizing saves
 *    - Search within saved facts
 *    - Export saved facts functionality
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48 - GRID_SPACING) / 2;

// TODO: BACKEND INTEGRATION - SAVED FACTS DATA
// TODO: Pull saved cards from user profile (e.g., Supabase 'saved' table)
// TODO: Implement real-time sync when facts are saved/unsaved from other screens
// TODO: Add pagination for large numbers of saved facts
// TODO: Sync save/unsave actions to backend with optimistic update
// TODO: Handle offline mode - cache saved facts locally

// Use the same facts as the learn page - simulate saved facts (first 8 facts for demo)
// TODO: Replace with actual saved facts from user's profile in backend
// TODO: Fetch saved facts with: userId, factId, savedAt timestamp, userNotes
const MOCK_SAVED_FACTS = MOCK_FACTS.slice(0, 8);

export default function SavedScreen() {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [selectedFact, setSelectedFact] = useState<Fact | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // TODO: BACKEND INTEGRATION - SHARE ANALYTICS
  // TODO: Track share analytics to backend (userId, factId, shareMethod, timestamp)
  // TODO: Implement share attribution tracking for viral content analysis
  const handleShare = async () => {
    if (!selectedFact) return;
    
    try {
      const shareMessage = `🧠 ${selectedFact.hook}\n\n${selectedFact.summary}${selectedFact.sourceUrl ? `\n\nRead more: ${selectedFact.sourceUrl}` : ''}`;
      
      await Share.share({
        message: shareMessage,
        title: 'Interesting Fact from DOPA',
      });
      
      // TODO: Log successful share event to backend analytics
      // TODO: Track which facts are shared most often for content optimization
      // TODO: Implement referral tracking if shared links are clicked
    } catch (error) {
      console.log('Error sharing:', error);
      // TODO: Log share error to backend for debugging
      // TODO: Implement retry mechanism for failed analytics calls
    }
  };

  const renderSavedItem = (item: (typeof MOCK_SAVED_FACTS)[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.gridItem}
      onPress={() => {
        // TODO: BACKEND INTEGRATION - SAVED FACT ANALYTICS
        // TODO: Track saved fact view analytics to backend (userId, factId, viewedAt)
        // TODO: Update fact view count in user profile
        // TODO: Track time spent reading saved facts for engagement metrics
        setSelectedFact(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.gridItemContent}>
        {/* Topic Tags */}
        {item.tags && item.tags.length > 0 && (
          <TopicTags tags={item.tags} style={styles.cardTopicTags} />
        )}
        
        {/* Fact Content */}
        <View style={styles.factContent}>
          <Text style={styles.factTitle} numberOfLines={2}>
            {item.hook}
          </Text>
          <Text
            style={styles.factText}
            numberOfLines={3}
          >
            {item.summary}
          </Text>
        </View>
      </View>
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
          {/* TODO: BACKEND INTEGRATION - SAVES LIMIT */}
          {/* TODO: Replace with dynamic saves count from user profile backend */}
          {/* TODO: Fetch user's current saves count and subscription limit */}
          {/* TODO: Implement premium tier with unlimited saves */}
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

      {/* Modal for displaying full saved fact details */}
      {/* TODO: BACKEND INTEGRATION - MODAL ANALYTICS */}
      {/* TODO: Add modal analytics tracking for fact views to backend */}
      {/* TODO: Track modal open/close events for engagement analysis */}
      {/* TODO: Measure time spent in modal for reading comprehension metrics */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedFact(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Fact</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                >
                  <Feather name="share" size={20} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedFact(null);
                  }}
                >
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedFact && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Fact Hook Title */}
                <Text style={styles.modalFactTitle}>{selectedFact.hook}</Text>
                
                {/* Topic Tags */}
                {selectedFact.tags && selectedFact.tags.length > 0 && (
                  <View style={styles.modalTagsContainer}>
                    <TopicTags tags={selectedFact.tags} />
                  </View>
                )}

                {/* Fact Image */}
                {selectedFact.image && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: selectedFact.image }}
                      style={styles.factImage}
                      onError={() => {
                        // TODO: BACKEND INTEGRATION - IMAGE ERROR HANDLING
                        // TODO: Log image loading errors to backend for debugging
                        // TODO: Implement fallback image service or CDN
                        // TODO: Track image load failure rates for content quality
                        console.log('Failed to load image:', selectedFact.image);
                      }}
                    />
                  </View>
                )}

                {/* Fact Summary */}
                <Text style={styles.modalSummary}>{selectedFact.summary}</Text>

                {/* Full Content (if available) */}
                {selectedFact.fullContent && (
                  <Text style={styles.modalFullContent}>{selectedFact.fullContent}</Text>
                )}

                {/* Inline Share Button */}
                <TouchableOpacity style={styles.inlineShareButton} onPress={handleShare}>
                  <Feather name="share" size={18} color="#3B82F6" />
                  <Text style={styles.inlineShareText}>Share this fact</Text>
                </TouchableOpacity>

                {/* TODO: BACKEND INTEGRATION - SOURCE URL NAVIGATION */}
                {/* TODO: Add source URL link when available from backend */}
                {/* TODO: Add navigation to source URL with in-app browser */}
                {/* TODO: Track source link clicks for content attribution */}
                {/* TODO: Implement source credibility scoring */}
                {selectedFact.sourceUrl && (
                  <TouchableOpacity 
                    style={styles.sourceButton}
                    onPress={() => {
                      // TODO: Open source URL in in-app browser
                      // TODO: Track source click analytics to backend
                      console.log('Opening source:', selectedFact.sourceUrl);
                    }}
                  >
                    <Text style={styles.sourceButtonText}>View Source</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40, // Extra space at bottom for better scrolling experience
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
  gridItemContent: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E5E7EB', // Same light gray as learn page fact cards
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cardTopicTags: {
    marginBottom: 12,
  },
  factContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  factTitle: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151', // Dark gray for good contrast on light background
  },
  factText: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    lineHeight: 20,
    color: '#374151', // Dark gray for good readability
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    minHeight: '60%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    display: 'flex',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  modalFactTitle: {
    fontSize: 18,
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 24,
  },
  modalTagsContainer: {
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  factImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  modalSummary: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  inlineShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  inlineShareText: {
    color: '#3B82F6',
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
  modalFullContent: {
    fontSize: 15,
    fontFamily: 'SF-Pro-Display',
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  sourceButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  sourceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    fontWeight: '600',
  },
});
