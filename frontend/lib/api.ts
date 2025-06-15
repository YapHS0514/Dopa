import { supabase } from './supabase';
import Constants from 'expo-constants';
import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

// Get API URL from Expo config
let API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

// If we're on a physical device or emulator, replace 0.0.0.0 with the host IP
if (Platform.OS !== 'web' && API_URL?.includes('0.0.0.0')) {
  // Extract the port number
  const port = API_URL.split(':').pop();
  // Get the host IP from the Expo manifest
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

console.log('API URL configured as:', API_URL); // Debug log

interface ApiError {
  detail: string;
  status?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private readonly timeout = 5000; // 5 second timeout
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

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        // If the error has no config or we've already retried the maximum times, throw the error
        if (!config || config.__retryCount >= this.maxRetries) {
          return Promise.reject(error);
        }

        // Increment the retry count
        config.__retryCount = config.__retryCount || 0;
        config.__retryCount++;

        console.log(`Retrying request to ${config.url}, ${this.maxRetries - config.__retryCount} attempts remaining`);

        // Delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));

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
        data: error.response?.data
      });
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

  async delete<T>(endpoint: string): Promise<T> {
    console.log('Making DELETE request to:', endpoint);
    return this.handleRequest<T>(this.axiosInstance.delete(endpoint));
  }

  // Content methods
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

  async getRecommendations(limit = 10) {
    return this.get(`/api/recommendations?limit=${limit}`);
  }

  // Admin methods
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
}

export const apiClient = new ApiClient();