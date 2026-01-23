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
    }
};
