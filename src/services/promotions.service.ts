import api from './api';

export interface Promotion {
    promotion_id: number;
    name: string;
    type_code: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: string | number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    min_apply_price?: number | string;
    max_apply_price?: number | string;
    _count?: {
        products: number;
    };
}

export interface CreatePromotionDto {
    name: string;
    type_code: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    start_date: string;
    end_date: string;
    is_active?: boolean;
    min_apply_price?: number;
    max_apply_price?: number;
}

export const PromotionsService = {
    getAll: async () => {
        const response = await api.get<Promotion[]>('/product-promotions');
        return response.data;
    },

    create: async (data: CreatePromotionDto) => {
        const response = await api.post<Promotion>('/product-promotions', data);
        return response.data;
    },

    apply: async (id: number, productIds: number[]) => {
        const response = await api.post(`/product-promotions/${id}/apply`, { product_ids: productIds });
        return response.data;
    },

    removeProducts: async (id: number, productIds: number[]) => {
        const response = await api.post(`/product-promotions/${id}/remove`, { product_ids: productIds });
        return response.data;
    },
    
    delete: async (id: number) => {
        const response = await api.delete(`/product-promotions/${id}`);
        return response.data;
    },

    applyByPriceRange: async (id: number, range: { minPrice: number, maxPrice: number }) => {
        const response = await api.post(`/product-promotions/${id}/apply-range`, range);
        return response.data;
    }
};
