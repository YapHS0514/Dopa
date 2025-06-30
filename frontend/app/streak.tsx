// streak.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Animated,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useStore } from '../lib/store';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStreakData } from '../hooks/useStreakData';
import StreakCelebrationModal from '../components/StreakCelebrationModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = Array.from({ length: 2100 - 2024 + 1 }, (_, i) => 2024 + i);

export default function StreakScreen() {
  const theme = useStore((state) => state.theme);
  const {
    currentStreak,
    bestStreak,
    todayCompleted,
    lastStreakDate,
    canEarnStreakToday,
    milestoneReached,
    isLoading,
    showStreakModal,
    setShowStreakModal,
    fetchStreakData,
    markCelebrationShown,
    hasUnseenStreakNotification,
    pendingCelebrationStreak,
    clearStreakNotification,
  } = useStreakData();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownY, setDropdownY] = useState(0);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const monthYearBarRef = useRef<View>(null);

  // Fetch streak data on mount
  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  // Show celebration modal if user navigated here with a pending notification
  useEffect(() => {
    console.log('🎭 StreakScreen: Checking celebration modal conditions...');
    console.log(
      `   • hasUnseenStreakNotification: ${hasUnseenStreakNotification}`
    );
    console.log(`   • pendingCelebrationStreak: ${pendingCelebrationStreak}`);
    console.log(`   • showStreakModal: ${showStreakModal}`);

    if (hasUnseenStreakNotification && pendingCelebrationStreak > 0) {
      console.log(
        `🎉 Auto-showing celebration modal for ${pendingCelebrationStreak} day streak`
      );
      setShowStreakModal(true);
    } else {
      console.log('🚫 Celebration modal conditions not met:');
      if (!hasUnseenStreakNotification) {
        console.log('   • No unseen streak notification');
      }
      if (pendingCelebrationStreak <= 0) {
        console.log(
          `   • No pending celebration streak (${pendingCelebrationStreak})`
        );
      }
    }
  }, [
    hasUnseenStreakNotification,
    pendingCelebrationStreak,
    setShowStreakModal,
  ]);

  // Handle closing the celebration modal
  const handleCelebrationClose = () => {
    setShowStreakModal(false);
    markCelebrationShown();
    clearStreakNotification(); // Clear the notification state
    console.log('🎭 Celebration modal closed from streak screen');
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate streak days based on current streak and last streak date
  const generateStreakDays = () => {
    if (!lastStreakDate || currentStreak === 0) return [];

    const streakDays: string[] = [];
    const endDate = new Date(lastStreakDate);

    // Generate consecutive days going backwards from last streak date
    for (let i = 0; i < currentStreak; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      streakDays.push(date.toISOString().split('T')[0]);
    }

    return streakDays;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const streakDays = generateStreakDays(); // ✅ Generate streak days from database data

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      // Check if this day is in the streak days for the current month/year
      const currentDate = new Date(currentYear, currentMonth, i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isActive = streakDays.includes(dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <View key={i} style={styles.calendarDay}>
          <View
            style={[
              styles.calendarDayInner,
              isActive && {
                backgroundColor: '#ef4444',
              },
              isToday &&
                !isActive && {
                  borderWidth: 2,
                  borderColor: '#ef4444',
                },
            ]}
          >
            <Text
              style={[
                styles.calendarDayText,
                {
                  color: isActive ? '#fff' : isToday ? '#ef4444' : Colors.text,
                },
              ]}
            >
              {i}
            </Text>
          </View>
        </View>
      );
    }

    return days;
  };

  const openDropdown = () => {
    if (monthYearBarRef.current) {
      const handle = findNodeHandle(monthYearBarRef.current);
      if (handle) {
        monthYearBarRef.current.measure(
          (
            fx: number,
            fy: number,
            w: number,
            h: number,
            px: number,
            py: number
          ) => {
            setDropdownY(py + h);
            setDropdownVisible(true);
            dropdownAnim.setValue(0);
            Animated.timing(dropdownAnim, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }).start();
          }
        );
      }
    } else {
      setDropdownVisible(true);
      dropdownAnim.setValue(0);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
    Haptics.selectionAsync();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setDropdownVisible(false));
  };

  const confirmSelection = () => {
    closeDropdown();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add chevron handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0 && currentYear === 2024) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (currentMonth === 11 && currentYear === 2100) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <TouchableOpacity
        style={{ position: 'absolute', top: 75, left: 18, zIndex: 100 }}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Feather name="arrow-left" size={28} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.streakCount, { color: Colors.tint }]}>
            {currentStreak} day streak! 🔥
          </Text>
          <View
            style={[styles.encouragementBox, { backgroundColor: '#10B98120' }]}
          >
            <Text style={[styles.encouragementText, { color: Colors.tint }]}>
              {currentStreak >= 7
                ? "You're absolutely crushing it! 🚀"
                : currentStreak >= 3
                ? 'Keep the momentum going! 💪'
                : currentStreak > 0
                ? 'Great start! Keep it up! ⭐'
                : 'Start your learning streak today! 📚'}
            </Text>
          </View>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            hitSlop={{ left: 10, right: 10, top: 10, bottom: 10 }}
          >
            <Feather name="chevron-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            ref={monthYearBarRef}
            onPress={openDropdown}
            activeOpacity={1}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[styles.monthYear, { color: Colors.text }]}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNextMonth}
            hitSlop={{ left: 10, right: 10, top: 10, bottom: 10 }}
          >
            <Feather name="chevron-right" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[
              styles.statButton,
              { backgroundColor: Colors.cardBackground },
            ]}
          >
            <Text style={[styles.statValue, { color: Colors.text }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
              Current Streak
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statButton,
              { backgroundColor: Colors.cardBackground },
            ]}
          >
            <Text style={[styles.statValue, { color: Colors.text }]}>
              {bestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
              Best Streak
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.calendarContainer,
            {
              backgroundColor: Colors.cardBackground,
              borderColor: '#10B98120',
            },
          ]}
        >
          <View style={styles.weekdayHeader}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text
                key={i}
                style={[styles.weekdayText, { color: Colors.textSecondary }]}
              >
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>{renderCalendar()}</View>
        </View>

        <View style={styles.rewardProgress}>
          {milestoneReached ? (
            <Text style={[styles.rewardText, { color: Colors.tint }]}>
              🎉 Congratulations! You've earned 100 coins! 💰
            </Text>
          ) : (
            <>
              <Text
                style={[styles.rewardText, { color: Colors.textSecondary }]}
              >
                💰 Maintain streak for {7 - (currentStreak % 7)} more days to
                earn 100 coins!
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { backgroundColor: '#F59E0B20' }]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: '#F59E0B',
                        width: `${((currentStreak % 7) / 7) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {dropdownVisible && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <Animated.View
            style={[
              styles.dropdownContainer,
              {
                top: dropdownY,
                left: SCREEN_WIDTH * 0.1,
                width: SCREEN_WIDTH * 0.8,
                opacity: dropdownAnim,
                transform: [
                  {
                    translateY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.dropdownLists}>
              <FlatList
                data={MONTHS}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity onPress={() => setCurrentMonth(index)}>
                    <Text
                      style={[
                        styles.dropdownItem,
                        index === currentMonth && styles.selectedDropdownItem,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                getItemLayout={(_, i) => ({
                  length: 40,
                  offset: 40 * i,
                  index: i,
                })}
                initialScrollIndex={Math.max(currentMonth - 2, 0)}
                snapToInterval={40}
                decelerationRate="fast"
                style={styles.dropdownCol}
              />
              <FlatList
                data={YEARS}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setCurrentYear(item)}>
                    <Text
                      style={[
                        styles.dropdownItem,
                        item === currentYear && styles.selectedDropdownItem,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                getItemLayout={(_, i) => ({
                  length: 40,
                  offset: 40 * i,
                  index: i,
                })}
                initialScrollIndex={Math.max(YEARS.indexOf(currentYear) - 2, 0)}
                snapToInterval={40}
                decelerationRate="fast"
                style={styles.dropdownCol}
              />
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Streak Celebration Modal */}
      {(() => {
        console.log('🎭 StreakScreen: Rendering StreakCelebrationModal...');
        console.log(`   • visible: ${showStreakModal}`);
        console.log(
          `   • pendingCelebrationStreak: ${pendingCelebrationStreak}`
        );
        console.log(`   • currentStreak: ${currentStreak}`);
        console.log(
          `   • currentStreak prop: ${
            pendingCelebrationStreak || currentStreak
          }`
        );
        return null;
      })()}
      <StreakCelebrationModal
        visible={showStreakModal}
        currentStreak={pendingCelebrationStreak || currentStreak}
        onClose={handleCelebrationClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  streakCount: { fontSize: 32, fontFamily: 'SF-Pro-Display', marginBottom: 16 },
  encouragementBox: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  encouragementText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthYear: { fontSize: 18, fontFamily: 'SF-Pro-Display' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statButton: {
    width: (SCREEN_WIDTH - 60) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontFamily: 'SF-Pro-Display', marginBottom: 4 },
  statLabel: { fontSize: 14, fontFamily: 'SF-Pro-Display' },
  calendarContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  calendarDayInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDayText: { fontSize: 14, fontFamily: 'SF-Pro-Display' },
  rewardProgress: { padding: 20, marginBottom: 20 },
  rewardText: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBar: { flex: 1 },
  progressFill: { height: '100%', borderRadius: 4 },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: 'black',
    padding: 16,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'column',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  dropdownLists: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownCol: {
    width: 110,
    maxHeight: 200,
    paddingHorizontal: 20,
  },
  dropdownItem: {
    fontSize: 16,
    paddingVertical: 8,
    textAlign: 'center',
    color: Colors.text,
  },
  selectedDropdownItem: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  dropdownConfirmButton: {
    backgroundColor: Colors.tint,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
});
