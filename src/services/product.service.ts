import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types';
import { ProductDTO, ProductListParams } from '@/types/product.types';

const BASE = '/products';

export const productService = {
    getProducts: async (params: ProductListParams & PaginationParams): Promise<PaginatedResponse<ProductDTO>> => {
        const response = await axiosInstance.get(BASE, { params });
        return response.data;
    },

    getProductById: async (id: string): Promise<ApiResponse<ProductDTO>> => {
        const response = await axiosInstance.get(`${BASE}/${id}`);
        return response.data;
    },

    getFeatured: async (): Promise<ApiResponse<ProductDTO[]>> => {
        const response = await axiosInstance.get(`${BASE}/featured`);
        return response.data;
    }
};
