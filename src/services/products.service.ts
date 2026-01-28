
import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

export const productsService = {
    getProducts: async (params?: { search?: string, brand_id?: number, category_id?: number, series_id?: number, type_code?: string, limit?: number, sort?: string, min_price?: number, max_price?: number }): Promise<ApiResponse<any[]>> => {
        const queryParts = [];
        if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (params?.brand_id) queryParts.push(`brand_id=${params.brand_id}`);
        if (params?.category_id) queryParts.push(`category_id=${params.category_id}`);
        if (params?.series_id) queryParts.push(`series_id=${params.series_id}`);
        if (params?.type_code) queryParts.push(`type_code=${params.type_code}`);
        if (params?.limit) queryParts.push(`limit=${params.limit}`);
        if (params?.sort) queryParts.push(`sort=${params.sort}`);
        if (params?.min_price) queryParts.push(`min_price=${params.min_price}`);
        if (params?.max_price) queryParts.push(`max_price=${params.max_price}`);

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const response = await axiosInstance.get(`/products${queryString}`);
        return response.data;
    },

    getOne: async (id: number): Promise<any> => {
        const response = await axiosInstance.get(`/products/${id}`);
        return response.data;
    },

    searchInbound: async (query: string): Promise<ApiResponse<any[]>> => {
        return productsService.getProducts({ search: query });
    },

    quickCreate: async (data: { name: string, brand_id?: number, variant_names?: string[] }): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post('/products/quick-create', data);
        return response.data;
    },

    create: async (data: any): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post('/products', data);
        return response.data;
    },

    update: async (id: number, data: any): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.patch(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.delete(`/products/${id}`);
        return response.data;
    },

    toggleStatus: async (id: number): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.patch(`/products/${id}/toggle-status`);
        return response.data;
    },

    // Generic Entity Methods for SmartSelect
    getEntities: async (entity: string): Promise<ApiResponse<any[]>> => {
        const response = await axiosInstance.get(`/${entity}`);
        return response.data;
    },

    createEntity: async (entity: string, name: string): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post(`/${entity}/quick-create`, { name });
        return response.data;
    }
};
