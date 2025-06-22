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