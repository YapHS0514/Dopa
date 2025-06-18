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
import { Colors } from '../../constants/Colors';
import { useStore } from '../../lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
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
              isActive && { backgroundColor: Colors[isDark ? 'dark' : 'light'].tint },
            ]}
          >
            <Text
              style={[
                styles.calendarDayText,
                { color: isActive ? '#FFFFFF' : Colors[isDark ? 'dark' : 'light'].text },
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
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDark ? 'dark' : 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.streakCount, { color: '#FF6B6B' }]}>
            {MOCK_DATA.currentStreak} day streak! 🔥
          </Text>
          
          <View style={[styles.encouragementBox, { backgroundColor: '#10B98120' }]}>
            <Text style={[styles.encouragementText, { color: '#10B981' }]}>
              You're on fire! Keep going! 🎯
            </Text>
          </View>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth}>
            <Feather 
              name="chevron-left" 
              size={24} 
              color={Colors[isDark ? 'dark' : 'light'].text} 
            />
          </TouchableOpacity>
          <Text style={[styles.monthYear, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Feather 
              name="chevron-right" 
              size={24} 
              color={Colors[isDark ? 'dark' : 'light'].text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground }]}
          >
            <Text style={[styles.statValue, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
              {MOCK_DATA.activeDaysThisMonth}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
              Active Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statButton, { backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground }]}
          >
            <Text style={[styles.statValue, { color: Colors[isDark ? 'dark' : 'light'].text }]}>
              {MOCK_DATA.streakRevives}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
              Streak Revives
            </Text>
          </TouchableOpacity>
        </View>

        <View 
          style={[
            styles.calendarContainer,
            { 
              backgroundColor: Colors[isDark ? 'dark' : 'light'].cardBackground,
              borderColor: '#10B98120',
            }
          ]}
        >
          <View style={styles.weekdayHeader}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text 
                key={index}
                style={[styles.weekdayText, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}
              >
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>
        </View>

        <View style={styles.rewardProgress}>
          <Text style={[styles.rewardText, { color: Colors[isDark ? 'dark' : 'light'].textSecondary }]}>
            🎁 Maintain streak for 4 more days to unlock a special reward!
          </Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { backgroundColor: '#F59E0B20' }
              ]}
            >
              <View 
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: '#F59E0B',
                    width: '60%',
                  }
                ]} 
              />
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  streakCount: {
    fontSize: 32,
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  encouragementBox: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  encouragementText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
  },
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
  statValue: {
    fontSize: 24,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
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
    fontFamily: 'SpaceMono',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
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
    fontFamily: 'SpaceMono',
  },
  rewardProgress: {
    padding: 20,
    marginBottom: 20,
  },
  rewardText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
}); 