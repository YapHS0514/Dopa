import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api';

interface StreakData {
  activeDays: number;
  streakDays: string[];
  currentStreak: number;
  bestStreak: number;
  streakRevivalCount: number;
  todayCompleted: boolean;
  rewardEarned: boolean;
}

interface StreakStore extends StreakData {
  showStreakModal: boolean;
  isLoading: boolean;
  lastCelebrationDate: string | null;
  setShowStreakModal: (show: boolean) => void;
  fetchStreakData: () => Promise<void>;
  markCelebrationShown: () => Promise<void>;
}

const useStreakStore = create<StreakStore>((set, get) => ({
  // Initial state
  activeDays: 0,
  streakDays: [],
  currentStreak: 0,
  bestStreak: 0,
  streakRevivalCount: 0,
  todayCompleted: false,
  rewardEarned: false,
  showStreakModal: false,
  isLoading: false,
  lastCelebrationDate: null,

  setShowStreakModal: (show: boolean) => {
    set({ showStreakModal: show });
  },

  fetchStreakData: async () => {
    try {
      set({ isLoading: true });
      
      const response: any = await apiClient.get('/api/user/streak');
      const streakData: StreakData = {
        activeDays: response.active_days,
        streakDays: response.streak_days,
        currentStreak: response.current_streak,
        bestStreak: response.best_streak,
        streakRevivalCount: response.streak_revival_count,
        todayCompleted: response.today_completed,
        rewardEarned: response.reward_earned,
      };

      // Load last celebration date from storage
      const lastCelebrationDate = await AsyncStorage.getItem('lastStreakCelebration');
      const today = new Date().toISOString().split('T')[0];

      // Show modal if today is completed and we haven't celebrated today
      const shouldShowModal = streakData.todayCompleted && 
                            streakData.currentStreak > 0 && 
                            lastCelebrationDate !== today;

      set({
        ...streakData,
        lastCelebrationDate,
        showStreakModal: shouldShowModal,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error fetching streak data:', error);
      set({ isLoading: false });
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
}));

// Hook for easier usage in components
export const useStreakData = () => {
  const store = useStreakStore();
  
  return {
    // Data
    activeDays: store.activeDays,
    streakDays: store.streakDays,
    currentStreak: store.currentStreak,
    bestStreak: store.bestStreak,
    streakRevivalCount: store.streakRevivalCount,
    todayCompleted: store.todayCompleted,
    rewardEarned: store.rewardEarned,
    isLoading: store.isLoading,
    
    // Modal state
    showStreakModal: store.showStreakModal,
    setShowStreakModal: store.setShowStreakModal,
    
    // Actions
    fetchStreakData: store.fetchStreakData,
    markCelebrationShown: store.markCelebrationShown,
  };
};

export default useStreakData; 