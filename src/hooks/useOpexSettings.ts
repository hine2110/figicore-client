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
      toast.success('OPEX config successfully updated!');
      queryClient.invalidateQueries({ queryKey: ['system-opex'] });
      // Also invalidate analytics recommendations since calculation logic changed
      queryClient.invalidateQueries({ queryKey: ['inventory-recommendations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error updating config');
    },
  });
};
