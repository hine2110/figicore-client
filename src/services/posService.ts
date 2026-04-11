import { axiosInstance } from '@/lib/axiosInstance';
import type {
    PosSession,
    PosProduct,
    CreatePosOrderRequest,
    PosOrder,
} from '@/types/pos.types';

const API_BASE = '/pos';

// Session Management
export const openSession = async (opening_cash: number, note?: string) => {
    const response = await axiosInstance.post(`${API_BASE}/sessions/open`, {
        opening_cash,
        note,
    });
    return response.data;
};

export const closeSession = async (
    sessionId: number,
    closing_cash: number,
    note?: string,
    expenses?: number,
    cash_breakdown?: any,
    cash_revenue_app?: number
) => {
    const response = await axiosInstance.post(`${API_BASE}/sessions/${sessionId}/close`, {
        closing_cash,
        note,
        expenses,
        cash_breakdown,
        cash_revenue_app,
    });
    return response.data;
};

export const getCurrentSession = async (): Promise<{ success: boolean; data: PosSession | null; suggested_opening_cash?: number }> => {
    const response = await axiosInstance.get(`${API_BASE}/sessions/current`);
    return response.data;
};

export const getSessions = async (page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data: PosSession[];
    total: number;
    page: number;
    limit: number;
}> => {
    const response = await axiosInstance.get(`${API_BASE}/sessions`, {
        params: { page, limit }
    });
    return response.data;
};

export const getSessionDetails = async (sessionId: number): Promise<{
    success: boolean;
    data: PosSession & { orders: any[] };
}> => {
    const response = await axiosInstance.get(`${API_BASE}/sessions/${sessionId}`);
    return response.data;
};

// Product Search
export const searchProducts = async (query: {
    q?: string;
    category_id?: string;
    brand_id?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
}): Promise<{ success: boolean; count: number; data: PosProduct[] }> => {
    const response = await axiosInstance.get('/products/pos-search', { params: query });
    return response.data;
};

// Get All Categories
export const getCategories = async (): Promise<{
    id: number;
    name: string;
    slug: string;
}[]> => {
    const response = await axiosInstance.get('/categories');
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

// Create QR pending order (PENDING_PAYMENT, waits for SePay webhook)
export const createPosQrOrder = async (orderData: CreatePosOrderRequest): Promise<{
    success: boolean;
    message: string;
    data: PosOrder & { payment_ref_code: string };
}> => {
    const response = await axiosInstance.post(`${API_BASE}/orders/create-qr`, orderData);
    return response.data;
};

// Real-time Order Sync
export const getActiveOrder = async (): Promise<PosOrder | null> => {
    const response = await axiosInstance.get(`${API_BASE}/orders/active`);
    return response.data;
};

export const syncActiveOrder = async (syncData: {
    user_id?: number;
    items: { variant_id: number; quantity: number }[];
    note?: string;
    discount_amount?: number;
}): Promise<PosOrder | null> => {
    const response = await axiosInstance.post(`${API_BASE}/orders/sync`, syncData);
    return response.data;
};

// Order Management
export const getOrders = async (params: {
    page?: number;
    limit?: number;
    date?: string;
    payment_method?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}): Promise<{
    success: boolean;
    count: number;
    data: PosOrder[];
    total: number;
    total_revenue: number;
    page: number;
    limit: number;
}> => {
    const response = await axiosInstance.get(`${API_BASE}/orders`, {
        params
    });
    return response.data;
};

export const getOrderById = async (orderId: number): Promise<{
    success: boolean;
    message: string;
    data: PosOrder;
}> => {
    const response = await axiosInstance.get(`${API_BASE}/orders/${orderId}`);
    return response.data;
};

export const cancelOrder = async (orderId: number): Promise<{
    success: boolean;
    message: string;
    data: PosOrder;
}> => {
    const response = await axiosInstance.post(`${API_BASE}/orders/${orderId}/cancel`);
    return response.data;
};

// Customer Search
export const searchCustomer = async (query: string, page: number = 1, limit: number = 15): Promise<{
    success: boolean;
    count: number;
    data: any[];
    total: number;
    page: number;
    limit: number;
}> => {
    const response = await axiosInstance.get(`${API_BASE}/orders/search-customer`, {
        params: { q: query, page, limit },
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
    const response = await axiosInstance.get(`${API_BASE}/sessions/analytics`);
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
