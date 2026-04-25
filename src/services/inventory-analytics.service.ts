import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

// Các loại đề xuất từ AI
export type RecommendationType = 'CLEARANCE' | 'RESTOCK';

// Trạng thái quản lý đề xuất
export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

// Cấu trúc chi tiết một bản tin đề xuất (bao gồm Relation Data)
export interface InventoryRecommendation {
  id: number;
  variant_id: number;
  type: RecommendationType;
  reason: string;
  financial_note: string | null;
  suggested_action_value: string | null;
  status: RecommendationStatus;
  created_at: string;
  updated_at: string;
  
  product_variants: {
    sku: string;
    stock_available: number;
    products: {
      name: string;
    };
  };
}

// Params lọc cho API GET
export interface RecommendationQueryParams {
  status?: RecommendationStatus;
  type?: RecommendationType;
  page?: string;
  limit?: string;
}

/**
 * Service quản lý các yêu cầu phân tích kho bổng AI
 */
export const inventoryAnalyticsService = {
  /**
   * Kích hoạt tiến trình AI phân tích kho hàng (Real-time)
   */
  triggerAIAnalysis: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/analytics/trigger-inventory-check');
    return response.data;
  },

  /**
   * Lấy danh sách các đề xuất nhập/xả hàng từ Database
   */
  getRecommendations: async (params?: RecommendationQueryParams): Promise<ApiResponse<{ data: InventoryRecommendation[], meta: any }>> => {
    const response = await axiosInstance.get('/analytics/recommendations', { params });
    return response.data;
  },

  /**
   * Phê duyệt và thực thi một đề xuất AI
   */
  applyRecommendation: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.patch(`/analytics/recommendations/${id}/apply`);
    return response.data;
  },

  /**
   * Lấy toàn bộ danh sách tồn kho thực tế từ DB
   */
  getGlobalInventory: async (): Promise<ApiResponse<any[]>> => {
    const response = await axiosInstance.get('/analytics/global');
    return response.data;
  },

  /**
   * AI Phân tích Rủi ro & Gợi ý Giá Hộp Mù
   */
  analyzeBlindboxRisk: async (payload: { minValue: number, maxValue: number, suggestedPrice?: number }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/analytics/blindbox-pricing', payload);
    return response.data;
  },

  /**
   * Trigger Market Intelligence Scan (Tavily + Groq)
   */
  triggerMarketScan: async (): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/analytics/market-intel/scan');
    return response.data;
  },

  /**
   * Lấy danh sách Market Intelligence từ DB
   */
  getMarketIntel: async (params?: { brand?: string; status?: string; category?: string; page?: string; limit?: string }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get('/analytics/market-intel', { params });
    return response.data;
  },
};
