
import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

export interface Province {
    ProvinceID: number;
    ProvinceName: string;
}

export interface District {
    DistrictID: number;
    DistrictName: string;
    ProvinceID: number;
}

export interface Ward {
    WardCode: string;
    WardName: string;
    DistrictID: number;
}

export interface Address {
    address_id: number;
    recipient_name: string;
    recipient_phone: string;
    province_id: number;
    district_id: number;
    ward_code: string;
    detail_address: string;
    is_default: boolean;
    province_name?: string; // Optional, might need to map ID to Name in UI
    district_name?: string;
    ward_name?: string;
}

export const addressService = {
    // --- Master Data ---
    getProvinces: async (): Promise<ApiResponse<Province[]>> => {
        const response = await axiosInstance.get('/address/provinces');
        return response.data;
    },

    getDistricts: async (provinceId: number): Promise<ApiResponse<District[]>> => {
        const response = await axiosInstance.get(`/address/districts/${provinceId}`);
        return response.data;
    },

    getWards: async (districtId: number): Promise<ApiResponse<Ward[]>> => {
        const response = await axiosInstance.get(`/address/wards/${districtId}`);
        return response.data;
    },

    // --- CRUD ---
    getMyAddresses: async (): Promise<ApiResponse<Address[]>> => {
        const response = await axiosInstance.get('/address');
        return response.data;
    },

    createAddress: async (data: any): Promise<ApiResponse<Address>> => {
        const response = await axiosInstance.post('/address', data);
        return response.data;
    },

    updateAddress: async (id: number, data: any): Promise<ApiResponse<Address>> => {
        const response = await axiosInstance.put(`/address/${id}`, data);
        return response.data;
    },

    deleteAddress: async (id: number): Promise<ApiResponse<void>> => {
        const response = await axiosInstance.delete(`/address/${id}`);
        return response.data;
    }
};
