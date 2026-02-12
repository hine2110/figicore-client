import { axiosInstance } from '@/lib/axiosInstance';

export const cartService = {
    // Get current user's cart
    getCart: async () => {
        const response = await axiosInstance.get('/cart');
        return response.data; // Expected { cartId, items: [], total }
    },

    // Add item to cart
    // UPDATE: Thêm field paymentOption vào payload
    addToCart: async (payload: {
        productId: number,
        variantId?: number,
        quantity: number,
        paymentOption?: 'DEPOSIT' | 'FULL_PAYMENT'
    }) => {
        const response = await axiosInstance.post('/cart', payload);
        return response.data; // Return updated cart
    },

    // Update item quantity
    updateQuantity: async (itemId: number, quantity: number) => {
        const response = await axiosInstance.patch(`/cart/${itemId}`, { quantity });
        return response.data;
    },

    // Remove item
    removeFromCart: async (itemId: number) => {
        const response = await axiosInstance.delete(`/cart/${itemId}`);
        return response.data;
    },

    // Clear cart
    clearCart: async () => {
        const response = await axiosInstance.delete('/cart');
        return response.data;
    }
};