import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

interface StreakUpdateResponse {
  success: boolean;
  message: string;
  streak_days: number;
  previous_streak: number;
  coins_earned: number;
  milestone_reached: boolean;
}

interface DailyContentStore {
  todayContentIds: Set<string>;
  lastTrackingDate: string | null;
  dailyThreshold: number;
  streakEarned: boolean;
  isCheckingStreak: boolean;
  
  // Actions - now accept optional userId
  initializeDaily: (userId?: string) => Promise<void>;
  trackContentInteraction: (contentId: string, userId?: string) => Promise<{
    thresholdReached: boolean;
    streakEarned: boolean;
    isNewThreshold: boolean;
  }>; // Returns detailed tracking info
  resetDaily: (userId?: string) => void;
  getProgress: () => { current: number; threshold: number; canEarnStreak: boolean };
}

const useDailyContentStore = create<DailyContentStore>((set, get) => ({
  todayContentIds: new Set(),
  lastTrackingDate: null,
  dailyThreshold: 4,
  streakEarned: false,
  isCheckingStreak: false,

  initializeDaily: async (userId?: string) => {
    if (!userId) {
      console.warn('🚨 No user ID provided for daily content tracking');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const storageKey = `dailyContentTracking_${userId}`; // ✅ User-specific key
    
    console.log(`🔑 Initializing daily tracking with key: "${storageKey}"`);
    console.log(`📅 Today's date: ${today}`);
    
    const stored = await AsyncStorage.getItem(storageKey);
    console.log(`💾 Stored data found:`, stored ? 'YES' : 'NO');
    
    if (stored) {
      const data = JSON.parse(stored);
      console.log(`📊 Parsed stored data:`, data);
      
      // Reset if it's a new day
      if (data.date !== today) {
        console.log(`🆕 New day detected! Resetting progress (was ${data.date}, now ${today})`);
        set({
          todayContentIds: new Set(),
          lastTrackingDate: today,
          streakEarned: false
        });
        await AsyncStorage.setItem(storageKey, JSON.stringify({
          date: today,
          contentIds: [],
          streakEarned: false
        }));
        console.log(`✅ Reset complete - starting fresh for ${today}`);
      } else {
        // Restore today's data
        const contentIds = new Set<string>(data.contentIds || []);
        console.log(`🔄 Restoring today's data - ${contentIds.size} content pieces already consumed`);
        set({
          todayContentIds: contentIds,
          lastTrackingDate: data.date,
          streakEarned: data.streakEarned || false
        });
        console.log(`📈 Current progress: ${contentIds.size}/4, streakEarned: ${data.streakEarned || false}`);
      }
    } else {
      // First time - initialize for today
      console.log(`🎯 First time setup for user ${userId}`);
      set({
        todayContentIds: new Set(),
        lastTrackingDate: today,
        streakEarned: false
      });
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        date: today,
        contentIds: [],
        streakEarned: false
      }));
      console.log(`✅ Initialized fresh tracking for ${today}`);
    }
  },

  trackContentInteraction: async (contentId: string, userId?: string) => {
    if (!userId) {
      console.warn('🚨 No user ID provided for tracking content interaction');
      return {
        thresholdReached: false,
        streakEarned: false,
        isNewThreshold: false,
      };
    }

    console.log(`🎯 Tracking interaction for content: ${contentId} (User: ${userId})`);
    
    const state = get();
    
    // Initialize if needed
    if (!state.lastTrackingDate) {
      console.log(`🔄 No tracking date found, initializing daily tracking...`);
      await state.initializeDaily(userId);
    }

    // Early return if streak already earned today - no need to track more content
    if (state.streakEarned) {
      console.log(`🏆 Streak already earned today - skipping content tracking for ${contentId}`);
      return {
        thresholdReached: true, // Since streak was earned, threshold was reached
        streakEarned: false,    // Not earned from this interaction
        isNewThreshold: false,  // Not new since already earned
      };
    }
    
    // Check if we already tracked this content today
    const alreadyTracked = state.todayContentIds.has(contentId);
    console.log(`🔍 Content already tracked today: ${alreadyTracked ? 'YES' : 'NO'}`);
    
    // Add content ID to today's set
    const updatedContentIds = new Set(state.todayContentIds);
    const sizeBefore = updatedContentIds.size;
    updatedContentIds.add(contentId);
    const sizeAfter = updatedContentIds.size;
    
    const currentCount = updatedContentIds.size;
    const thresholdMet = currentCount >= state.dailyThreshold;
    const wasThresholdMet = sizeBefore >= state.dailyThreshold;
    const isNewThreshold = thresholdMet && !wasThresholdMet && sizeAfter > sizeBefore; // Just reached threshold
    const canEarnStreak = thresholdMet && !state.streakEarned;
    
    console.log(`📊 DAILY CONTENT CONSUMED: ${currentCount}/${state.dailyThreshold} unique pieces`);
    console.log(`📈 Progress Details:`);
    console.log(`   • Content added: ${sizeBefore} → ${sizeAfter} ${sizeAfter > sizeBefore ? '(NEW!)' : '(duplicate)'}`);
    console.log(`   • Threshold met: ${thresholdMet ? 'YES' : 'NO'} (need ${state.dailyThreshold})`);
    console.log(`   • Just reached threshold: ${isNewThreshold ? 'YES' : 'NO'}`);
    console.log(`   • Streak already earned: ${state.streakEarned ? 'YES' : 'NO'}`);
    console.log(`   • Can earn streak: ${canEarnStreak ? 'YES' : 'NO'}`);
    
    // Update state
    set({
      todayContentIds: updatedContentIds,
    });
    
    // Save to storage with user-specific key
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `dailyContentTracking_${userId}`; // ✅ User-specific key
    const storageData = {
      date: today,
      contentIds: Array.from(updatedContentIds),
      streakEarned: state.streakEarned
    };
    
    console.log(`💾 Saving to storage key: "${storageKey}"`);
    console.log(`💾 Storage data:`, storageData);
    
    await AsyncStorage.setItem(storageKey, JSON.stringify(storageData));
    
    let streakEarned = false;
    
    // Check if we should trigger streak update
    if (canEarnStreak && !state.isCheckingStreak) {
      console.log('🔥 Daily threshold reached! Attempting to earn streak...');
      
      set({ isCheckingStreak: true });
      
      try {
        const streakResponse = await apiClient.updateDailyStreak() as StreakUpdateResponse;
        console.log('🎉 Streak update response:', streakResponse);
        
        if (streakResponse.success) {
          // Mark streak as earned for today
          set({ streakEarned: true });
          
          await AsyncStorage.setItem(storageKey, JSON.stringify({
            date: today,
            contentIds: Array.from(updatedContentIds),
            streakEarned: true
          }));
          
          console.log(`🔥 Streak earned! New streak: ${streakResponse.streak_days} days`);
          streakEarned = true;
        }
      } catch (error) {
        console.error('❌ Error updating streak:', error);
      } finally {
        set({ isCheckingStreak: false });
      }
    } else if (!canEarnStreak) {
      console.log(`🚫 Cannot earn streak because:`);
      if (!thresholdMet) {
        console.log(`   • Not enough content consumed (${currentCount}/${state.dailyThreshold})`);
      }
      if (state.streakEarned) {
        console.log(`   • Streak already earned today`);
      }
    }
    
    return {
      thresholdReached: thresholdMet,
      streakEarned,
      isNewThreshold,
    };
  },

  resetDaily: (userId?: string) => {
    set({
      todayContentIds: new Set(),
      streakEarned: false,
      lastTrackingDate: null
    });
    
    const storageKey = userId ? `dailyContentTracking_${userId}` : 'dailyContentTracking';
    AsyncStorage.removeItem(storageKey);
  },

      getProgress: () => {
      const state = get();
      return {
        current: state.todayContentIds.size,
        threshold: state.dailyThreshold,
        canEarnStreak: state.todayContentIds.size >= state.dailyThreshold && !state.streakEarned
      };
    }
}));

// Hook for easier usage
export const useDailyContentTracker = () => {
  const store = useDailyContentStore();
  const { user } = useAuth(); // ✅ Get current user
  const userId = user?.id;
  
  // Debug: Log user information
  console.log(`🔐 Daily Content Tracker Hook - User ID: ${userId || 'NOT LOGGED IN'}`);
  
  // ✅ Memoize functions to prevent infinite re-renders
  const initializeDaily = useCallback(() => {
    console.log(`🎬 initializeDaily called for user: ${userId}`);
    return store.initializeDaily(userId);
  }, [store.initializeDaily, userId]);
  
  const trackContentInteraction = useCallback(async (contentId: string) => {
    console.log(`📱 trackContentInteraction called for content: ${contentId}, user: ${userId}`);
    const result = await store.trackContentInteraction(contentId, userId);
    console.log(`🎯 Tracking result:`, result);
    
    // Return just the streakEarned boolean for backward compatibility
    // But also return the full result for components that need it
    return {
      ...result,
      // Legacy support - return true if streak was earned OR if threshold was just reached
      streakEarned: result.streakEarned || result.isNewThreshold,
    };
  }, [store.trackContentInteraction, userId]);
  
  const resetDaily = useCallback(() => {
    console.log(`🔄 resetDaily called for user: ${userId}`);
    return store.resetDaily(userId);
  }, [store.resetDaily, userId]);
  
  return {
    // Data
    progress: store.getProgress(),
    streakEarned: store.streakEarned,
    isCheckingStreak: store.isCheckingStreak,
    
    // Actions - memoized to prevent infinite loops
    initializeDaily,
    trackContentInteraction,
    resetDaily,
  };
};

export default useDailyContentTracker; 