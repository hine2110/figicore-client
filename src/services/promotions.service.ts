import api from './api';

export interface Promotion {
    promotion_id: number;
    name: string;
    type_code: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: string | number;
    start_time: string;  // "HH:mm" e.g. "09:00"
    end_time: string;    // "HH:mm" e.g. "11:00"
    is_recurring: boolean;
    is_active: boolean;
    min_apply_price?: number | string;
    max_apply_price?: number | string;
    _count?: { product_variants: number };
}

export interface PromotionPreviewResult {
    safe_count: number;
    conflict_count: number;
    safe_products: { product_id: number; name: string }[];
    conflict_products: {
        product_id: number;
        name: string;
        current_promotion: {
            promotion_id: number;
            name: string;
            value: number;
            end_time: string;
        };
    }[];
}

export interface CreatePromotionDto {
    name: string;
    type_code: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    start_time: string;  // "HH:mm"
    end_time: string;    // "HH:mm"
    is_recurring?: boolean;
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

    update: async (id: number, data: Partial<CreatePromotionDto>) => {
        const response = await api.patch<Promotion>(`/product-promotions/${id}`, data);
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Promotion>(`/product-promotions/${id}`);
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

    previewByPriceRange: async (id: number, range: { minPrice: number, maxPrice: number }): Promise<PromotionPreviewResult> => {
        const response = await api.post<PromotionPreviewResult>(`/product-promotions/${id}/preview-range`, range);
        return response.data;
    },

    applyByPriceRange: async (id: number, range: { minPrice: number, maxPrice: number }, overwrite: boolean = true) => {
        const response = await api.post(`/product-promotions/${id}/apply-range`, { ...range, overwrite });
        return response.data;
    }
};
