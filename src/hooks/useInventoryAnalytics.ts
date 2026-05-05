import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryAnalyticsService,
  RecommendationQueryParams
} from '@/services/inventory-analytics.service';
import { toast } from 'sonner';

/**
 * Hook to get list of restock/clearance suggestions from Database
 * @param params Filter by Status (status) or Type (type)
 */
export const useGetRecommendations = (params?: RecommendationQueryParams) => {
  return useQuery({
    queryKey: ['inventory-recommendations', params],
    queryFn: async () => {
      const response = await inventoryAnalyticsService.getRecommendations(params);
      if (!response.success) {
        throw new Error(response.message || 'Error fetching recommendation data');
      }
      // API trả về { success, data: { data: [...], meta } }
      // Chúng ta trả về mảng data bên trong để các component dễ xử lý
      return response.data.data;
    },
    // Giữ dữ liệu cũ trong lúc fetch dữ liệu mới để UI không bị giật
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook kích hoạt AI phân tích kho hàng thời gian thực
 */
export const useTriggerAI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Hiển thị thông báo đang xử lý vì AI có thể mất vài giây
      const promise = inventoryAnalyticsService.triggerAIAnalysis();

      toast.promise(promise, {
        loading: 'AI is analyzing inventory...',
        success: 'Analysis complete!',
        error: 'Error triggering AI analysis',
      });

      const response = await promise;
      if (!response.success) {
        throw new Error(response.message || 'AI Analysis failed');
      }
      // AI trả về trực tiếp kết quả phân tích trong data
      return response.data;
    },
    onSuccess: () => {
      // Làm mới cache để cập nhật danh sách đề xuất mới nhất vào UI
      queryClient.invalidateQueries({
        queryKey: ['inventory-recommendations'],
      });
    },
  });
};

/**
 * Hook phê duyệt và thực thi một đề xuất AI
 */
export const useApplyRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await inventoryAnalyticsService.applyRecommendation(id);
      if (!response.success) {
        throw new Error(response.message || 'Approval failed');
      }
      return response.data;
    },
    onSuccess: (_, id) => {
      toast.success(`Recommendation #${id} successfully applied!`);
      // Remove from PENDING list
      queryClient.invalidateQueries({
        queryKey: ['inventory-recommendations'],
      });
      // Làm mới bảng tồn kho thực tế
      queryClient.invalidateQueries({
        queryKey: ['global-inventory'],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error applying recommendation');
    }
  });
};

/**
 * Hook lấy danh sách tồn kho toàn hệ thống từ Database
 */
export const useGetGlobalInventory = () => {
  return useQuery({
    queryKey: ['global-inventory'],
    queryFn: async () => {
      const response = await inventoryAnalyticsService.getGlobalInventory();
      if (!response.success) {
        throw new Error(response.message || 'Error fetching inventory data');
      }
      return response.data;
    }
  });
};

/**
 * Hook to get Market Intelligence list from DB
 */
export const useGetMarketIntel = (params?: { brand?: string; status?: string; category?: string }) => {
  return useQuery({
    queryKey: ['market-intel', params],
    queryFn: async () => {
      const response = await inventoryAnalyticsService.getMarketIntel({ ...params, limit: '50' });
      if (!response.success) throw new Error('Failed to fetch market intel');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

/**
 * Hook trigger Market Intelligence Scan (Tavily + Groq)
 */
export const useTriggerMarketScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const promise = inventoryAnalyticsService.triggerMarketScan();
      toast.promise(promise, {
        loading: '🌐 AI is scanning market... (may take 15-30 seconds)',
        success: (res: any) => `✅ Scan complete! Found ${res?.data?.saved || 0} new products`,
        error: 'Error scanning market. Check TAVILY_API_KEY.',
      });
      const response = await promise;
      if (!response.success) throw new Error('Market scan failed');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intel'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error scanning market');
    },
  });
};
