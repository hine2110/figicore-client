import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types';
import { CreateOrderPayload, OrderDTO } from '@/types/order.types';

const BASE = '/orders';

export const orderService = {
    getMyOrders: async (params: PaginationParams): Promise<PaginatedResponse<OrderDTO>> => {
        const response = await axiosInstance.get(`${BASE}/my-orders`, { params });
        return response.data;
    },

    createOrder: async (payload: CreateOrderPayload): Promise<ApiResponse<OrderDTO>> => {
        const response = await axiosInstance.post(BASE, payload);
        return response.data;
    },

    getOrderById: async (id: string): Promise<ApiResponse<OrderDTO>> => {
        const response = await axiosInstance.get(`${BASE}/${id}`);
        return response.data;
    },

    // Staff/Admin only
    getAllOrders: async (params: PaginationParams & { status?: string }): Promise<PaginatedResponse<OrderDTO>> => {
        const response = await axiosInstance.get(BASE, { params });
        return response.data;
    },

    updateStatus: async (id: string, status: string): Promise<ApiResponse<OrderDTO>> => {
        const response = await axiosInstance.patch(`${BASE}/${id}/status`, { status });
        return response.data;
    }
};
