import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api';

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  todayCompleted: boolean;
  lastStreakDate: string | null;
  canEarnStreakToday: boolean;
  milestoneReached: boolean;
}

interface StreakStore extends StreakData {
  showStreakModal: boolean;
  isLoading: boolean;
  lastCelebrationDate: string | null;
  hasUnseenStreakNotification: boolean; // New: tracks if user has unseen streak achievement
  pendingCelebrationStreak: number; // New: stores the streak days to celebrate
  setShowStreakModal: (show: boolean) => void;
  fetchStreakData: () => Promise<StreakData>;
  markCelebrationShown: () => Promise<void>;
  triggerCelebration: (streakDays: number, forceShow?: boolean) => Promise<void>;
  clearCelebrationHistory: () => Promise<void>;
  setStreakNotification: (hasNotification: boolean, streakDays?: number) => void; // New: set notification state
  clearStreakNotification: () => void; // New: clear notification after viewing
}

const useStreakStore = create<StreakStore>((set, get) => ({
  // Initial state
  currentStreak: 0,
  bestStreak: 0,
  todayCompleted: false,
  lastStreakDate: null,
  canEarnStreakToday: false,
  milestoneReached: false,
  showStreakModal: false,
  isLoading: false,
  lastCelebrationDate: null,
  hasUnseenStreakNotification: false,
  pendingCelebrationStreak: 0,

  setShowStreakModal: (show: boolean) => {
    set({ showStreakModal: show });
  },

  fetchStreakData: async () => {
    try {
      set({ isLoading: true });
      
      const response: any = await apiClient.getUserStreak();
      console.log('📊 Fetched streak data:', response);
      
      const streakData: StreakData = {
        currentStreak: response.current_streak || 0,
        bestStreak: response.best_streak || 0,
        todayCompleted: response.today_completed || false,
        lastStreakDate: response.last_streak_date,
        canEarnStreakToday: response.can_earn_streak_today || false,
        milestoneReached: response.milestone_reached || false,
      };

      set({
        ...streakData,
        isLoading: false,
      });

      return streakData; // Return the fetched data

    } catch (error) {
      console.error('❌ Error fetching streak data:', error);
      set({ isLoading: false });
      throw error; // Re-throw to allow caller to handle
    }
  },

  triggerCelebration: async (streakDays: number, forceShow: boolean = false) => {
    const lastCelebrationDate = await AsyncStorage.getItem('lastStreakCelebration');
    const today = new Date().toISOString().split('T')[0];

    console.log(`🎯 triggerCelebration called with streakDays: ${streakDays}, forceShow: ${forceShow}`);
    console.log(`🎯 lastCelebrationDate: ${lastCelebrationDate || 'null'}, today: ${today}`);
    
    const hasntCelebratedToday = lastCelebrationDate !== today;
    const hasValidStreak = streakDays > 0;
    
    console.log(`🎯 Date check: ${hasntCelebratedToday}, Streak check: ${hasValidStreak}`);

    // Show modal if we haven't celebrated this streak yet today OR if forcing
    // When forceShow=true, ignore date check but still require valid streak
    if ((hasntCelebratedToday && hasValidStreak) || (forceShow && hasValidStreak)) {
      console.log(`🎉 Triggering streak celebration for ${streakDays} days!`);
      set({ 
        showStreakModal: true,
        currentStreak: streakDays 
      });
    } else {
      console.log(`🚫 Not showing celebration modal:`);
      console.log(`   • Already celebrated today: ${!hasntCelebratedToday} (last: ${lastCelebrationDate || 'never'})`);
      console.log(`   • forceShow: ${forceShow}`);
      console.log(`   • Valid streak days: ${hasValidStreak} (${streakDays})`);
      console.log(`   • Should show: ${(hasntCelebratedToday && hasValidStreak) || (forceShow && hasValidStreak)}`);
    }
  },

  markCelebrationShown: async () => {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem('lastStreakCelebration', today);
    set({ 
      lastCelebrationDate: today,
      showStreakModal: false 
    });
  },

  // Clear celebration history - useful for new accounts or testing
  clearCelebrationHistory: async () => {
    await AsyncStorage.removeItem('lastStreakCelebration');
    set({ lastCelebrationDate: null });
    console.log('🧹 Cleared celebration history');
  },

  // Set streak notification (when user earns a streak)
  setStreakNotification: (hasNotification: boolean, streakDays: number = 0) => {
    set({ 
      hasUnseenStreakNotification: hasNotification, 
      pendingCelebrationStreak: streakDays 
    });
    console.log(`🔔 Streak notification set: ${hasNotification}, streak: ${streakDays}`);
  },

  // Clear streak notification (when user views it)
  clearStreakNotification: () => {
    set({ 
      hasUnseenStreakNotification: false, 
      pendingCelebrationStreak: 0 
    });
    console.log('🔕 Streak notification cleared');
  },
}));

// Hook for easier usage in components
export const useStreakData = () => {
  const store = useStreakStore();
  
  return {
    // Data
    currentStreak: store.currentStreak,
    bestStreak: store.bestStreak,
    todayCompleted: store.todayCompleted,
    lastStreakDate: store.lastStreakDate,
    canEarnStreakToday: store.canEarnStreakToday,
    milestoneReached: store.milestoneReached,
    isLoading: store.isLoading,
    
    // Modal state
    showStreakModal: store.showStreakModal,
    setShowStreakModal: store.setShowStreakModal,
    
    // Notification state
    hasUnseenStreakNotification: store.hasUnseenStreakNotification,
    pendingCelebrationStreak: store.pendingCelebrationStreak,
    
    // Actions
    fetchStreakData: store.fetchStreakData,
    markCelebrationShown: store.markCelebrationShown,
    triggerCelebration: store.triggerCelebration,
    clearCelebrationHistory: store.clearCelebrationHistory,
    setStreakNotification: store.setStreakNotification,
    clearStreakNotification: store.clearStreakNotification,
  };
};

export default useStreakData; 