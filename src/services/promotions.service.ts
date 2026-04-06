import api from './api';

export interface Promotion {
    promotion_id: number;
    name: string;
    type_code: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: string | number;
    start_time: string;  // "HH:mm" e.g. "09:00"
    end_time: string;    // "HH:mm" e.g. "11:00"
    start_date?: string;
    end_date?: string;
    is_recurring: boolean;
    is_active: boolean;
    is_flash_sale?: boolean;
    flash_sale_quota?: number;
    min_apply_price?: number | string;
    max_apply_price?: number | string;
    _count?: { product_variants: number };
    promotion_items?: any[];
}

export interface PromotionPreviewResult {
    safe_count: number;
    conflict_count: number;
    safe_products?: { product_id: number; name: string }[];
    conflict_products?: {
        product_id: number;
        name: string;
        current_promotion: {
            promotion_id: number;
            name: string;
            value: number;
            end_time: string;
        };
    }[];
    safe_variants?: { variant_id: number; name: string }[];
    conflict_variants?: {
        variant_id: number;
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
    start_date?: string; // ISO date string, optional
    end_date?: string;   // ISO date string, optional
    is_recurring?: boolean;
    is_active?: boolean;
    is_flash_sale?: boolean;
    items?: {
        variant_id: number;
        flash_sale_price: number;
        quota: number;
    }[];
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

    resume: async (id: number) => {
        const response = await api.patch(`/product-promotions/${id}/resume`);
        return response.data;
    },

    previewByPriceRange: async (id: number, range: { minPrice: number, maxPrice: number }): Promise<PromotionPreviewResult> => {
        const response = await api.post<PromotionPreviewResult>(`/product-promotions/${id}/preview-range`, range);
        return response.data;
    },

    applyByPriceRange: async (id: number, range: { minPrice: number, maxPrice: number }, overwrite: boolean = true) => {
        const response = await api.post(`/product-promotions/${id}/apply-range`, { ...range, overwrite });
        return response.data;
    },

    applyByVariantIds: async (id: number, variantIds: number[]) => {
        const response = await api.post(`/product-promotions/${id}/apply-variants`, { variant_ids: variantIds });
        return response.data;
    },

    previewByVariantIds: async (variantIds: number[], currentPromotionId?: number): Promise<PromotionPreviewResult> => {
        const response = await api.post<PromotionPreviewResult>('/product-promotions/preview-variants', { variantIds, currentPromotionId });
        return response.data;
    },

    getActiveFlashSales: async (): Promise<any[]> => {
        const response = await api.get<any[]>('/product-promotions/active-flash-sales');
        return response.data;
    }
};
