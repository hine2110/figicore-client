import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';
import { LoginPayload, RegisterPayload, AuthResponse, VerifyOtpPayload } from '@/types/auth.types';

export const authService = {
    login: async (payload: LoginPayload): Promise<ApiResponse<AuthResponse>> => {
        const response = await axiosInstance.post('/auth/login', payload);
        return response.data;
    },

    sendOtp: async (payload: RegisterPayload): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post('/auth/send-otp', payload);
        return response.data;
    },

    register: async (payload: VerifyOtpPayload): Promise<ApiResponse<AuthResponse>> => {
        const response = await axiosInstance.post('/auth/register', payload);
        return response.data;
    },

    logout: async (): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.post('/auth/logout');
        return response.data;
    },

    getCurrentUser: async (): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.get('/auth/me');
        return response.data;
    },

    forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post('/auth/reset-password', { token, newPassword });
        return response.data;
    },
};
