import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

export interface OpexConfig {
  marketing_pct: number;
  staff_pct: number;
  storage_pct: number;
  risk_pct: number;
  tax_pct: number;
}

export interface RankConfig {
  value: number;
  minOrder: number;
  maxCap: number;
  quantity: number;
}

export interface WeeklyVoucherConfig {
  is_enabled: boolean;
  BRONZE: RankConfig;
  SILVER: RankConfig;
  GOLD: RankConfig;
  DIAMOND: RankConfig;
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

  getWeeklyVoucherConfig: async (): Promise<ApiResponse<WeeklyVoucherConfig>> => {
    const response = await axiosInstance.get('/system/weekly-voucher');
    return response.data;
  },

  updateWeeklyVoucherConfig: async (dto: WeeklyVoucherConfig): Promise<ApiResponse<WeeklyVoucherConfig>> => {
    const response = await axiosInstance.patch('/system/weekly-voucher', dto);
    return response.data;
  },
};
