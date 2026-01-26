
import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

export const productsService = {
    getProducts: async (params?: { search?: string }): Promise<ApiResponse<any[]>> => {
        const query = params?.search ? `?search=${encodeURIComponent(params.search)}` : '';
        const response = await axiosInstance.get(`/products${query}`);
        return response.data;
    },

    searchInbound: async (query: string): Promise<ApiResponse<any[]>> => {
        // Mapping to standard getProducts with search for now, simulating /search-inbound
        return productsService.getProducts({ search: query });
    },

    quickCreate: async (name: string): Promise<ApiResponse<any>> => {
        // Quick create a RETAIL product with minimal info
        const payload = {
            name,
            type_code: 'RETAIL',
            variants: [
                {
                    sku: `SKU-${Date.now()}`, // Auto-gen SKU
                    option_name: 'Standard',
                    price: 0
                }
            ]
        };
        const response = await axiosInstance.post('/products', payload);
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
