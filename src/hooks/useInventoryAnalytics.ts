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
      return response.data;
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
