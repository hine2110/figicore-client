import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types';

const BASE = '/admin';

export const adminService = {
    getAuditLogs: async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
        const response = await axiosInstance.get(`${BASE}/audit-logs`, { params });
        return response.data;
    },

    getSystemStats: async (): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.get(`${BASE}/stats`);
        return response.data;
    },

    getPendingRequests: async (): Promise<any[]> => {
        const response = await axiosInstance.get(`${BASE}/requests`);
        return response.data;
    },

    resolveRequest: async (id: number, action: 'approve' | 'reject') => {
        const response = await axiosInstance.post(`${BASE}/request/${id}/${action}`);
        return response.data;
    }
};
