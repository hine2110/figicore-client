import axiosClient from './api'; // assuming this is the standard configured axios instance

export interface SystemRecommendation {
  recommendation_id: number;
  target_type: string;
  target_id: number;
  type: string;
  title: string;
  reasoning: string;
  suggested_action: any;
  status_code: string;
  created_at: string;
  updated_at: string;
}

export const aiAssistantService = {
  getRecommendations: async (productId?: string | number): Promise<SystemRecommendation[]> => {
    const url = productId ? `/ai-assistant/recommendations?productId=${productId}` : '/ai-assistant/recommendations';
    const response = await axiosClient.get(url);
    // NestJS defaults to returning the array directly or wrapped in data, assuming direct here based on our controller
    return response.data;
  },

  applyRecommendation: async (id: number, overwrite = false): Promise<any> => {
    const response = await axiosClient.post(`/ai-assistant/recommendations/${id}/apply`, { overwrite });
    return response.data;
  },

  dismissRecommendation: async (id: number): Promise<any> => {
    const response = await axiosClient.patch(`/ai-assistant/recommendations/${id}/dismiss`);
    return response.data;
  }
};
