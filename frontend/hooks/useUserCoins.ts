import { create } from 'zustand';
import { apiClient } from '../lib/api';

interface UserCoinsState {
  coins: number;
  isLoading: boolean;
  error: string | null;
  fetchCoins: () => Promise<void>;
  addCoins: (amount: number, reason: string) => Promise<void>;
  spendCoins: (amount: number, reason: string) => Promise<void>;
}

const useUserCoinsStore = create<UserCoinsState>((set, get) => ({
  coins: 0,
  isLoading: false,
  error: null,

  fetchCoins: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getUserCoins() as { coins: number };
      set({ coins: response.coins, isLoading: false });
    } catch (error) {
      console.error('Error fetching user coins:', error);
      set({ error: 'Failed to fetch coins', isLoading: false });
    }
  },

  addCoins: async (amount: number, reason: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.addUserCoins(amount, reason) as { coins: number };
      set({ coins: response.coins, isLoading: false });
    } catch (error) {
      console.error('Error adding coins:', error);
      set({ error: 'Failed to add coins', isLoading: false });
    }
  },

  spendCoins: async (amount: number, reason: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.spendUserCoins(amount, reason) as { coins: number };
      set({ coins: response.coins, isLoading: false });
    } catch (error) {
      console.error('Error spending coins:', error);
      set({ error: 'Failed to spend coins', isLoading: false });
    }
  },
}));

export const useUserCoins = () => {
  const { coins, isLoading, error, fetchCoins, addCoins, spendCoins } = useUserCoinsStore();

  return {
    coins,
    isLoading,
    error,
    fetchCoins,
    addCoins,
    spendCoins,
  };
};
 