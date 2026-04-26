import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryAnalyticsService,
  RecommendationQueryParams
} from '@/services/inventory-analytics.service';
import { toast } from 'sonner';

/**
 * Hook lấy danh sách đề xuất nhập/xả hàng từ Database
 * @param params Bộ lọc theo Trạng thái (status) hoặc Loại (type)
 */
export const useGetRecommendations = (params?: RecommendationQueryParams) => {
  return useQuery({
    queryKey: ['inventory-recommendations', params],
    queryFn: async () => {
      const response = await inventoryAnalyticsService.getRecommendations(params);
      if (!response.success) {
        throw new Error(response.message || 'Lỗi khi lấy dữ liệu đề xuất');
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
        loading: 'AI đang phân tích kho hàng...',
        success: 'Phân tích hoàn tất!',
        error: 'Lỗi khi kích hoạt AI phân tích',
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
        throw new Error(response.message || 'Phê duyệt thất bại');
      }
      return response.data;
    },
    onSuccess: (_, id) => {
      toast.success(`Đề xuất #${id} đã được thực thi thành công!`);
      // Xóa khỏi danh sách PENDING
      queryClient.invalidateQueries({
        queryKey: ['inventory-recommendations'],
      });
      // Làm mới bảng tồn kho thực tế
      queryClient.invalidateQueries({
        queryKey: ['global-inventory'],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi phê duyệt đề xuất');
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
        throw new Error(response.message || 'Lỗi khi lấy dữ liệu tồn kho');
      }
      return response.data;
    }
  });
};

/**
 * Hook lấy danh sách Market Intelligence từ DB
 */
export const useGetMarketIntel = (params?: { brand?: string; status?: string; category?: string }) => {
  return useQuery({
    queryKey: ['market-intel', params],
    queryFn: async () => {
      const response = await inventoryAnalyticsService.getMarketIntel({ ...params, limit: '50' });
      if (!response.success) throw new Error('Failed to fetch market intel');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 phút cache
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
        loading: '🌐 AI đang quét thị trường... (có thể mất 15-30 giây)',
        success: (res: any) => `✅ Quét xong! Tìm thấy ${res?.data?.saved || 0} sản phẩm mới`,
        error: 'Lỗi khi quét thị trường. Kiểm tra TAVILY_API_KEY.',
      });
      const response = await promise;
      if (!response.success) throw new Error('Market scan failed');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-intel'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi quét thị trường');
    },
  });
};
