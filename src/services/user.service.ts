import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types';
import { UserDTO, UserListParams } from '@/types/user.types';

const BASE = '/users';

export const userService = {
    getUsers: async (params: UserListParams & PaginationParams): Promise<PaginatedResponse<UserDTO>> => {
        const response = await axiosInstance.get(BASE, { params });
        return response.data;
    },

    getUserById: async (id: string): Promise<ApiResponse<UserDTO>> => {
        const response = await axiosInstance.get(`${BASE}/${id}`);
        return response.data;
    },

    updateUser: async (id: string, data: Partial<UserDTO>): Promise<ApiResponse<UserDTO>> => {
        const response = await axiosInstance.patch(`${BASE}/${id}`, data);
        return response.data;
    },

    updateRole: async (id: string, role: string): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.patch(`${BASE}/${id}/role`, { role });
        return response.data;
    },

    updateStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE') => {
        const response = await axiosInstance.patch(`${BASE}/${id}/status`, { status });
        return response.data;
    },
    getNextEmployeeId: async (role: string): Promise<{ code: string }> => {
        const response = await axiosInstance.get(`${BASE}/next-id?role=${role}`);
        return response.data;
    },

    createBulk: async (data: { users: any[] }) => {
        const response = await axiosInstance.post(`${BASE}/bulk`, data);
        return response.data;
    }
};
