import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../lib/store';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

const MOCK_DATA = {
  weeklyFacts: 24,
  currentStreak: 6,
  totalFacts: 156,
  totalXP: 3200,
  level: 12,
  nextLevelXP: 4000,
  badges: [
    {
      id: '1',
      name: 'Early Bird',
      icon: '🌅',
      description: 'Complete 5 facts before 9 AM',
    },
    {
      id: '2',
      name: 'Night Owl',
      icon: '🦉',
      description: 'Complete 5 facts after 10 PM',
    },
    {
      id: '3',
      name: 'Science Whiz',
      icon: '🧬',
      description: 'Master 50 science facts',
    },
    {
      id: '4',
      name: 'Space Explorer',
      icon: '🚀',
      description: 'Master 50 space facts',
    },
    {
      id: '5',
      name: 'Nature Lover',
      icon: '🌿',
      description: 'Master 50 nature facts',
    },
  ],
};

export default function ProgressScreen() {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  const renderBadge = (badge: (typeof MOCK_DATA.badges)[0]) => (
    <TouchableOpacity
      key={badge.id}
      style={[styles.badge, { backgroundColor: Colors.cardBackground }]}
    >
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <Text style={[styles.badgeName, { color: Colors.text }]}>
        {badge.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors.text }]}>
            Progress 🔥
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.weeklyBox}>
            <View style={styles.weeklyContent}>
              <Text style={styles.weeklyTitle}>
                This Week
              </Text>
              <Text style={styles.weeklyStats}>
                You've learned {MOCK_DATA.weeklyFacts} new facts! 🎉
              </Text>
            </View>
          </View>

          <View style={styles.levelProgress}>
            <View style={styles.levelHeader}>
              <Text style={[styles.levelText, { color: Colors.text }]}>
                Level {MOCK_DATA.level}
              </Text>
              <Text style={[styles.xpText, { color: Colors.textSecondary }]}>
                {MOCK_DATA.totalXP} / {MOCK_DATA.nextLevelXP} XP
              </Text>
            </View>
            <View
              style={[styles.progressBar, { backgroundColor: Colors.border }]}
            >
              <LinearGradient
                colors={['#10B981', '#4ECDC4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (MOCK_DATA.totalXP / MOCK_DATA.nextLevelXP) * 100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              onPress={() => router.push('/streak')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: Colors.cardBackground,
                  },
                ]}
              >
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={[styles.statValue, { color: Colors.text }]}>
                  {MOCK_DATA.currentStreak}
                </Text>
                <Text
                  style={[styles.statLabel, { color: Colors.textSecondary }]}
                >
                  Current Streak
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: Colors.cardBackground,
                },
              ]}
            >
              <Text style={styles.statIcon}>🧠</Text>
              <Text style={[styles.statValue, { color: Colors.text }]}>
                {MOCK_DATA.totalFacts}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
                Total Facts
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: Colors.cardBackground,
                },
              ]}
            >
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={[styles.statValue, { color: Colors.text }]}>
                {MOCK_DATA.totalXP}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
                Total XP
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: Colors.cardBackground,
                },
              ]}
            >
              <Text style={styles.statIcon}>🎖️</Text>
              <Text style={[styles.statValue, { color: Colors.text }]}>
                {MOCK_DATA.badges.length}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
                Badges
              </Text>
            </View>
          </View>

          <View style={styles.badgesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>
                Badges
              </Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowBadgesModal(true)}
              >
                <Text style={[styles.viewAllText, { color: Colors.tint }]}>
                  View All
                </Text>
                <Feather name="chevron-right" size={16} color={Colors.tint} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesContainer}
            >
              {MOCK_DATA.badges.map(renderBadge)}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showBadgesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBadgesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View
            animation="fadeInUp"
            style={[
              styles.modalContent,
              { backgroundColor: Colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                Your Badges
              </Text>
              <TouchableOpacity onPress={() => setShowBadgesModal(false)}>
                <Feather name="x" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MOCK_DATA.badges}
              renderItem={({ item, index }) => (
                <View style={styles.modalBadgeRow}>
                  <View
                    style={[
                      styles.modalBadgeIcon,
                      {
                        backgroundColor: `${
                          item.icon.slice(1, 3) + item.icon.slice(4, 6)
                        }20`,
                      },
                    ]}
                  >
                    <Text style={styles.modalBadgeIconText}>{item.icon}</Text>
                  </View>
                  <View style={styles.modalBadgeInfo}>
                    <Text
                      style={[styles.modalBadgeName, { color: Colors.text }]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.modalBadgeDescription,
                        {
                          color: Colors.textSecondary,
                        },
                      ]}
                    >
                      {item.description}
                    </Text>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalBadgesList}
              showsVerticalScrollIndicator={false}
            />
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center', // Center the title
  },
  title: {
    fontSize: 32,
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  weeklyBox: {
    borderRadius: 20,
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  weeklyContent: {
    padding: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  weeklyTitle: {
    fontSize: 22,
    fontFamily: 'SF-Pro-Display',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#F5F5F5', // Force white for better visibility
  },
  weeklyStats: {
    fontSize: 17,
    fontFamily: 'SF-Pro-Display',
    lineHeight: 26,
    color: '#E5E5E5', // Slightly off-white for better contrast
    fontWeight: '500',
  },
  levelProgress: {
    marginBottom: 24,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
  },
  xpText: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'SF-Pro-Display',
  },
  badgesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SF-Pro-Display',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    marginRight: 4,
  },
  badgesContainer: {
    paddingRight: 20,
  },
  badge: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 100,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'SF-Pro-Display',
  },
  modalBadgesList: {
    paddingBottom: 20,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalBadgeIconText: {
    fontSize: 24,
  },
  modalBadgeInfo: {
    flex: 1,
  },
  modalBadgeName: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    marginBottom: 4,
  },
  modalBadgeDescription: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    opacity: 0.8,
  },
});
