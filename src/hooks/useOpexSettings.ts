import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemService, OpexConfig } from '@/services/system.service';
import { toast } from 'sonner';

export const useGetOpexConfig = () => {
  return useQuery({
    queryKey: ['system-opex'],
    queryFn: async () => {
      const response = await systemService.getOpexConfig();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
  });
};

export const useUpdateOpexConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: OpexConfig) => {
      const response = await systemService.updateOpexConfig(dto);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cấu hình OPEX đã được cập nhật thành công!');
      queryClient.invalidateQueries({ queryKey: ['system-opex'] });
      // Cũng cần invalidate analytics recommendations vì logic tính toán đã thay đổi
      queryClient.invalidateQueries({ queryKey: ['inventory-recommendations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi cập nhật cấu hình');
    },
  });
};
