import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

export interface OpexConfig {
  marketing_pct: number;
  staff_pct: number;
  storage_pct: number;
  risk_pct: number;
  tax_pct: number;
}

export const systemService = {
  getOpexConfig: async (): Promise<ApiResponse<OpexConfig>> => {
    const response = await axiosInstance.get('/system/opex');
    return response.data;
  },

  updateOpexConfig: async (dto: OpexConfig): Promise<ApiResponse<OpexConfig>> => {
    const response = await axiosInstance.patch('/system/opex', dto);
    return response.data;
  },
};
