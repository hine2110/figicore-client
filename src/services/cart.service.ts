import api from './api';

export const cartService = {
    // Get current user's cart
    getCart: async () => {
        const response = await api.get('/cart');
        return response.data; // Expected { cartId, items: [], total }
    },

    // Add item to cart
    addToCart: async (payload: { productId: number, variantId?: number, quantity: number }) => {
        const response = await api.post('/cart', payload);
        return response.data; // Return updated cart
    },

    // Update item quantity
    updateQuantity: async (itemId: number, quantity: number) => {
        const response = await api.patch(`/cart/${itemId}`, { quantity });
        return response.data;
    },

    // Remove item
    removeFromCart: async (itemId: number) => {
        const response = await api.delete(`/cart/${itemId}`);
        return response.data;
    },

    // Clear cart (Client side trigger for server cleanup if needed, but usually server handles)
    // Actually our backend endpoint for clear is DELETE /cart
    clearCart: async () => {
        const response = await api.delete('/cart');
        return response.data;
    }
};
