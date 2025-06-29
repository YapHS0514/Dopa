import { supabase } from './supabase';
import Constants from 'expo-constants';
import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

// Determine API URL from Expo config
let API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

// Handle emulator/device IP mapping
if (Platform.OS !== 'web' && API_URL?.includes('0.0.0.0')) {
  const port = API_URL.split(':').pop();
  const hostUri = Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    API_URL = `http://${hostIp}:${port}`;
    console.log('Updated API URL for device:', API_URL);
  }
}

if (!API_URL) {
  console.error('API URL not found in Expo config');
}

console.log('API URL configured as:', API_URL);

interface ApiError {
  detail: string;
  status?: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  total_points: number;
  streak_days: number;
  last_active: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  streak_days: number;
  total_coins: number;
  onboarding_completed: boolean;
}

interface UserResponse {
  id: string;
  email: string;
  profile: UserProfile;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private readonly timeout = 5000;
  private readonly maxRetries = 3;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseUrl = API_URL;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        if (!config || config.__retryCount >= this.maxRetries) {
          return Promise.reject(error);
        }

        config.__retryCount = config.__retryCount || 0;
        config.__retryCount++;

        console.log(`Retrying request to ${config.url}, ${this.maxRetries - config.__retryCount} attempts remaining`);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return this.axiosInstance(config);
      }
    );
  }

  setToken(token: string | null) {
    console.log('Setting API client token:', token ? 'Token present' : 'No token');
    this.token = token;
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  private async handleRequest<T>(request: Promise<any>): Promise<T> {
    try {
      const response = await request;
      return response.data;
    } catch (error: any) {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data,
      });

      if (error.response?.status === 429) {
        throw new Error('Too many attempts. Please try again later.');
      }

      throw new Error(error.response?.data?.detail || error.message);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    console.log('Making GET request to:', endpoint);
    return this.handleRequest<T>(this.axiosInstance.get(endpoint));
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    console.log('Making POST request to:', endpoint);
    console.log('Request data:', data);
    return this.handleRequest<T>(this.axiosInstance.post(endpoint, data));
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    console.log('Making PUT request to:', endpoint);
    console.log('Request data:', data);
    return this.handleRequest<T>(this.axiosInstance.put(endpoint, data));
  }

  async delete<T>(endpoint: string): Promise<T> {
    console.log('Making DELETE request to:', endpoint);
    return this.handleRequest<T>(this.axiosInstance.delete(endpoint));
  }

  // ✅ Content-related methods (from your version)
  async getContents(limit = 20, offset = 0, topicId?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (topicId) {
      params.append('topic_id', topicId);
    }

    return this.get(`/api/contents?${params}`);
  }

  async recordInteraction(contentId: string, interactionType: string, interactionValue: number) {
    return this.post('/api/interactions', {
      content_id: contentId,
      interaction_type: interactionType,
      interaction_value: interactionValue,
    });
  }

  async getUserStats() {
    return this.get('/api/interactions/stats');
  }

  async getTopics() {
    return this.get('/api/topics');
  }

  async getUserPreferences() {
    return this.get('/api/user/preferences');
  }

  async updateUserPreferences(preferences: Array<{ topic_id: string; points: number }>) {
    return this.post('/api/user/preferences', preferences);
  }

  async getSavedContent() {
    return this.get('/api/saved');
  }

  async saveContent(contentId: string) {
    return this.post('/api/saved', { content_id: contentId });
  }

  async removeSavedContent(savedContentId: string) {
    return this.delete(`/api/saved/${savedContentId}`);
  }

  async getUserCoins() {
    return this.get('/api/user/coins');
  }

  async addUserCoins(amount: number, reason: string) {
    return this.post('/api/user/coins/add', { amount, reason });
  }

  async spendUserCoins(amount: number, reason: string) {
    return this.post('/api/user/coins/spend', { amount, reason });
  }

  async getRecommendations(limit = 10) {
    return this.get(`/api/recommendations?limit=${limit}`);
  }

  async createContent(content: {
    title: string;
    summary: string;
    content_type?: string;
    topic_id?: string;
    tags?: string[];
    difficulty_level?: number;
    estimated_read_time?: number;
  }) {
    return this.post('/api/contents', content);
  }

  // ✅ Auth-related methods (from your friend's version)
  async signUp(email: string, password: string, username: string): Promise<UserResponse> {
    return this.post('/api/auth/signup', { email, password, username });
  }

  async signIn(email: string, password: string): Promise<UserResponse> {
    return this.post('/api/auth/signin', { email, password });
  }

  async signOut(): Promise<void> {
    return this.post('/api/auth/signout', {});
  }

  async getProfile(): Promise<UserProfile> {
    return this.get('/api/auth/profile');
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    return this.get('/api/user/profile');
  }

  async updateUserAvatar(avatarUrl: string): Promise<any> {
    return this.put('/api/user/profile/avatar', { avatar_url: avatarUrl });
  }

  async updateUsername(username: string): Promise<any> {
    return this.put('/api/user/profile/username', { username });
  }

  async completeOnboarding(): Promise<void> {
    return this.put('/api/auth/profile/onboarding', {});
  }
}

export const apiClient = new ApiClient();
