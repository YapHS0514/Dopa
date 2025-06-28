import { create } from 'zustand';

interface UserProfile {
  age_group: '8-12' | '13-17' | '18-25';
  selected_topics: string[];
  level: number;
  xp: number;
  coins: number;
  streak: number;
  facts_learned: number;
  badges: string[];
}

interface AppState {
  theme: 'light' | 'dark';
  userProfile: UserProfile | null;
  savedFacts: any[];
  setTheme: (theme: 'light' | 'dark') => void;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  addSavedFact: (fact: any) => void;
  removeSavedFact: (factId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'light',
  userProfile: null,
  savedFacts: [],
  setTheme: (theme) => set({ theme }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  updateUserProfile: (updates) =>
    set((state) => ({
      userProfile: state.userProfile
        ? { ...state.userProfile, ...updates }
        : null,
    })),
  addSavedFact: (fact) =>
    set((state) => ({ savedFacts: [...state.savedFacts, fact] })),
  removeSavedFact: (factId) =>
    set((state) => ({
      savedFacts: state.savedFacts.filter((f) => f.id !== factId),
    })),
}));

// Enhanced Reel Audio Store for TikTok-like behavior with proper cleanup
interface ReelAudioState {
  // Track user's manual mute preferences per reel
  manualMutePreferences: { [contentId: string]: boolean };
  currentlyPlayingId: string | null;
  // Track video refs for proper cleanup
  videoRefs: { [contentId: string]: any };
  
  // User actions
  setManualMute: (contentId: string, isMuted: boolean) => void;
  toggleMute: (contentId: string) => boolean;
  
  // State queries
  isManuallyMuted: (contentId: string) => boolean;
  shouldBeMuted: (contentId: string, isVisible: boolean) => boolean;
  
  // Playback tracking and cleanup
  setCurrentlyPlaying: (contentId: string | null) => void;
  getCurrentlyPlaying: () => string | null;
  registerVideoRef: (contentId: string, ref: any) => void;
  unregisterVideoRef: (contentId: string) => void;
  pausePreviousVideo: (newContentId: string) => Promise<void>;
  pauseAllVideos: () => Promise<void>;
}

export const useReelAudioStore = create<ReelAudioState>((set, get) => ({
  manualMutePreferences: {},
  currentlyPlayingId: null,
  videoRefs: {},
  
  setManualMute: (contentId: string, isMuted: boolean) => {
    set((state) => ({
      manualMutePreferences: {
        ...state.manualMutePreferences,
        [contentId]: isMuted
      }
    }));
    console.log(`🔧 Store: Set manual mute for ${contentId}: ${isMuted}`);
  },
  
  toggleMute: (contentId: string) => {
    const state = get();
    const currentlyMuted = state.isManuallyMuted(contentId);
    const newMutedState = !currentlyMuted;
    
    state.setManualMute(contentId, newMutedState);
    console.log(`🔧 Store: Toggled ${contentId} from ${currentlyMuted} to ${newMutedState}`);
    
    return newMutedState;
  },
  
  isManuallyMuted: (contentId: string) => {
    const state = get();
    // If no preference set, default to false (will be unmuted when visible)
    return state.manualMutePreferences[contentId] ?? false;
  },
  
  shouldBeMuted: (contentId: string, isVisible: boolean) => {
    const state = get();
    
    if (!isVisible) {
      // Always mute when not visible
      return true;
    }
    
    // When visible, respect user's manual preference
    return state.isManuallyMuted(contentId);
  },
  
  setCurrentlyPlaying: (contentId: string | null) => {
    set({ currentlyPlayingId: contentId });
    console.log(`🔧 Store: Currently playing ${contentId}`);
  },
  
  getCurrentlyPlaying: () => get().currentlyPlayingId,
  
  registerVideoRef: (contentId: string, ref: any) => {
    set((state) => ({
      videoRefs: { ...state.videoRefs, [contentId]: ref }
    }));
    console.log(`🔧 Store: Registered video ref for ${contentId}`);
  },
  
  unregisterVideoRef: (contentId: string) => {
    set((state) => {
      const newRefs = { ...state.videoRefs };
      delete newRefs[contentId];
      return { videoRefs: newRefs };
    });
    console.log(`🔧 Store: Unregistered video ref for ${contentId}`);
  },
  
  pausePreviousVideo: async (newContentId: string) => {
    const state = get();
    const previousId = state.currentlyPlayingId;
    
    if (previousId && previousId !== newContentId && state.videoRefs[previousId]) {
      console.log(`⏸️ Store: Pausing previous video ${previousId} for new video ${newContentId}`);
      try {
        const previousRef = state.videoRefs[previousId];
        await previousRef.pauseAsync();
        console.log(`✅ Store: Successfully paused ${previousId}`);
      } catch (error) {
        console.error(`❌ Store: Error pausing ${previousId}:`, error);
      }
    }
  },
  
  pauseAllVideos: async () => {
    const state = get();
    console.log(`⏸️ Store: Pausing all videos due to navigation`);
    
    // Pause all registered video refs
    const pausePromises = Object.entries(state.videoRefs).map(async ([contentId, videoRef]) => {
      try {
        await videoRef.pauseAsync();
        console.log(`✅ Store: Paused video ${contentId}`);
      } catch (error) {
        console.error(`❌ Store: Error pausing video ${contentId}:`, error);
      }
    });
    
    await Promise.all(pausePromises);
    
    // Clear currently playing
    set({ currentlyPlayingId: null });
    console.log(`✅ Store: All videos paused`);
  },
})); 