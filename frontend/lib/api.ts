import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

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

  async get(endpoint: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post(endpoint: string, data: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete(endpoint: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
}

export const apiClient = new ApiClient();