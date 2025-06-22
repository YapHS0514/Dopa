import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MOCK_DATA = {
  currentStreak: 6,
  activeDaysThisMonth: 15,
  streakRevives: 2,
  activeDays: [1, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 21, 22, 24],
};

export default function StreakScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const isActive = MOCK_DATA.activeDays.includes(i);
      days.push(
        <View key={i} style={styles.calendarDay}>
          <View
            style={[
              styles.calendarDayInner,
              isActive && { backgroundColor: Colors.accent },
            ]}
          >
            <Text
              style={[
                styles.calendarDayText,
                { color: isActive ? Colors.buttonText : Colors.textPrimary },
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.streakCount}>
            {MOCK_DATA.currentStreak} day streak! 🔥
          </Text>
          
          <View style={styles.encouragementBox}>
            <Text style={styles.encouragementText}>
              You're on fire! Keep going! 🎯
            </Text>
          </View>

          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth}>
              <Feather name="chevron-right" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {MOCK_DATA.activeDaysThisMonth}
              </Text>
              <Text style={styles.statLabel}>
                Active Days
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {MOCK_DATA.streakRevives}
              </Text>
              <Text style={styles.statLabel}>
                Streak Revives
              </Text>
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.weekdayHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>
          </View>

          <View style={styles.rewardProgress}>
            <Text style={styles.rewardText}>
              🎁 Maintain streak for 4 more days to unlock a special reward!
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '60%' }]} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  streakCount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 16,
  },
  encouragementBox: {
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 32,
  },
  encouragementText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: Colors.textSecondary,
  },
  calendarContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: (SCREEN_WIDTH - 72) / 7,
    aspectRatio: 1,
    padding: 2,
  },
  calendarDayInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
  rewardProgress: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
  },
  rewardText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
}); 