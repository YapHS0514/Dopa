import { supabase } from './supabase';
import Constants from 'expo-constants';

// Get API URL from Expo config
const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
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

  constructor() {
    this.baseUrl = API_URL;
  }

  setToken(token: string | null) {
    console.log('Setting API client token:', token ? 'Token present' : 'No token');
    this.token = token;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData
      });
      throw new Error(errorData?.detail || response.statusText);
    }
    return response.json();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    console.log('Making GET request to:', endpoint);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    console.log('Making POST request to:', endpoint);
    console.log('Request data:', data);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    console.log('Making DELETE request to:', endpoint);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
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