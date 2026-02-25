import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

const BASE = '/returns';

export interface ReturnItemPayload {
    order_item_id: number;
    quantity: number;
}

export interface CreateReturnPayload {
    order_id: number;
    reason?: string;
    unbox_video_url: string;
    defect_image_urls?: string;
    items: ReturnItemPayload[];
}

export const returnService = {
    // Customer
    createRequest: async (payload: CreateReturnPayload): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post(`${BASE}/request`, payload);
        return response.data;
    },

    getMyRequests: async (): Promise<ApiResponse<any[]>> => {
        const response = await axiosInstance.get(`${BASE}/my-requests`);
        return response.data;
    },

    // Admin
    getAllRequests: async (): Promise<ApiResponse<any[]>> => {
        const response = await axiosInstance.get(`${BASE}/all`);
        return response.data;
    },

    updateStatus: async (id: number, status: 'SHIPPING_TO_WAREHOUSE' | 'REJECTED', adminNote?: string): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.patch(`${BASE}/${id}/status`, { status, admin_note: adminNote });
        return response.data;
    },

    // Warehouse
    receiveAtWarehouse: async (id: number): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.patch(`${BASE}/${id}/receive`);
        return response.data;
    },

    inspectReturn: async (id: number, payload: { items: any[] }): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.patch(`${BASE}/${id}/inspect`, payload);
        return response.data;
    }
};
