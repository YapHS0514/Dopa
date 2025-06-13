import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
  detail: string;
  status?: number;
}

class ApiClient {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      const error: ApiError = {
        detail: data.detail || 'An error occurred',
        status: response.status
      };
      throw error;
    }
    
    return data;
  }

  async get(endpoint: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async post(endpoint: string, data: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(response);
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