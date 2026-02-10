import { axiosInstance } from '@/lib/axiosInstance';
import type {
    PosSession,
    PosProduct,
    CreatePosOrderRequest,
    PosOrder,
} from '@/types/pos.types';

const API_BASE = '/pos';

// Session Management
export const openSession = async (opening_cash: number) => {
    const response = await axiosInstance.post(`${API_BASE}/sessions/open`, {
        opening_cash,
    });
    return response.data;
};

export const closeSession = async (sessionId: number, closing_cash: number, note?: string) => {
    const response = await axiosInstance.post(`${API_BASE}/sessions/${sessionId}/close`, {
        closing_cash,
        note,
    });
    return response.data;
};

export const getCurrentSession = async (): Promise<{ success: boolean; data: PosSession | null }> => {
    const response = await axiosInstance.get(`${API_BASE}/sessions/current`);
    return response.data;
};

// Product Search
export const searchProducts = async (query: {
    q?: string;
    category_id?: string;
    brand_id?: string;
}): Promise<{ success: boolean; count: number; data: PosProduct[] }> => {
    const response = await axiosInstance.get('/products/pos-search', { params: query });
    return response.data;
};

// Order Creation
export const createPosOrder = async (orderData: CreatePosOrderRequest): Promise<{
    success: boolean;
    message: string;
    data: PosOrder;
}> => {
    const response = await axiosInstance.post(`${API_BASE}/orders`, orderData);
    return response.data;
};

// Order Management
export const getOrders = async (): Promise<{
    success: boolean;
    count: number;
    data: PosOrder[];
}> => {
    const response = await axiosInstance.get(`${API_BASE}/orders`);
    return response.data;
};

// Customer Search
export const searchCustomer = async (query: string): Promise<{
    success: boolean;
    count: number;
    data: Array<{
        user_id: number;
        full_name: string;
        phone: string | null;
        email: string | null;
        total_orders?: number;
        customers?: {
            current_rank_code: string;
            total_spent: number;
            loyalty_points: number;
        };
    }>;
}> => {
    const response = await axiosInstance.get(`${API_BASE}/orders/search-customer`, {
        params: { q: query },
    });
    return response.data;
};

// Register new customer
export const registerCustomer = async (data: {
    full_name: string;
    phone: string;
    email?: string;
}): Promise<{
    success: boolean;
    message: string;
    data: {
        user_id: number;
        full_name: string;
        phone: string;
        email: string | null;
        customers: {
            current_rank_code: string;
            total_spent: number;
        };
    };
}> => {
    const response = await axiosInstance.post(`${API_BASE}/orders/register-customer`, data);
    return response.data;
};

// Analytics
export const getSessionAnalytics = async (): Promise<{
    success: boolean;
    data: any;
}> => {
    const response = await axiosInstance.get(`${API_BASE}/orders/analytics`);
    return response.data;
};

// Customer Purchase History
export const getCustomerOrderHistory = async (userId: number): Promise<{
    success: boolean;
    data: {
        customer: {
            user_id: number;
            full_name: string;
            email: string | null;
            phone: string | null;
            rank_code: string;
            rank_name: string;
        };
        statistics: {
            total_orders: number;
            total_spent: number;
            avg_order_value: number;
            first_order_date: Date | null;
            last_order_date: Date | null;
        };
        top_products: Array<{
            product_name: string;
            quantity: number;
            total_spent: number;
        }>;
        orders: Array<{
            order_id: number;
            order_code: string;
            created_at: Date;
            total_amount: number;
            payment_method_code: string;
            status_code: string;
            items: Array<{
                product_name: string;
                variant_name: string;
                quantity: number;
                unit_price: number;
                subtotal: number;
            }>;
        }>;
    };
}> => {
    const response = await axiosInstance.get(`${API_BASE}/orders/customer/${userId}`);
    return response.data;
};
