import api from './api';

export interface Voucher {
    promotion_id: number;
    name?: string;
    code: string;
    discount_value?: number;
    discount_type?: string;
    min_order_value?: number;
    apply_rank_code?: string;
    max_quantity?: number;
    collected_quantity?: number;
    is_public?: boolean;
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
    created_at?: string;
}

export interface CollectibleVoucher extends Voucher {
    is_collected: boolean;
    can_collect: boolean;
    is_out_of_stock: boolean;
}

export interface MyVoucher {
    id: number;
    user_id: number;
    promotion_id: number;
    status: 'COLLECTED' | 'USED' | 'EXPIRED';
    collected_at: string;
    used_at?: string | null;
    created_at: string;
    promotions: Voucher;
}

export interface CreateVoucherDto {
    code: string;
    discount_value?: number;
    discount_type?: string;
    min_order_value?: number;
    apply_rank_code?: string;
    max_quantity?: number;
    is_public?: boolean;
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
}

export const VouchersService = {
    // Admin APIs
    getAll: async () => {
        const response = await api.get<Voucher[]>('/promotions');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Voucher>(`/promotions/${id}`);
        return response.data;
    },

    create: async (data: CreateVoucherDto) => {
        const response = await api.post<Voucher>('/promotions', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CreateVoucherDto>) => {
        const response = await api.patch<Voucher>(`/promotions/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/promotions/${id}`);
        return response.data;
    },

    resume: async (id: number) => {
        const response = await api.patch(`/promotions/${id}/resume`);
        return response.data;
    },

    // Customer APIs
    getCollectible: async () => {
        const response = await api.get<CollectibleVoucher[]>('/promotions/collectible');
        return response.data;
    },

    collect: async (id: number) => {
        const response = await api.post(`/promotions/${id}/collect`);
        return response.data;
    },

    getMyVouchers: async () => {
        const response = await api.get<MyVoucher[]>('/promotions/my-vouchers');
        return response.data;
    }
};
