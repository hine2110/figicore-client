import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartService } from '@/services/cart.service';

export interface CartItem {
    id: string | number; // Local ID (string) or DB ID (number)
    productId: string | number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    variantId?: number;
    sku?: string;
    // Add other fields as needed
}

interface CartState {
    items: CartItem[];
    cartId?: number; // DB Cart ID
    total: number;
    isLoading: boolean;

    // Actions
    fetchCart: () => Promise<void>;
    addToCart: (product: any) => Promise<void>;
    removeFromCart: (itemId: string | number) => Promise<void>;
    updateQuantity: (itemId: string | number, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,
            isLoading: false,

            fetchCart: async () => {
                const token = localStorage.getItem('accessToken');
                if (!token) return; // Stay with local items if guest

                set({ isLoading: true });
                try {
                    const data = await cartService.getCart();
                    set({
                        items: data.items,
                        total: data.total,
                        cartId: data.cartId,
                        isLoading: false
                    });
                } catch (error) {
                    console.error("Failed to fetch cart", error);
                    set({ isLoading: false });
                }
            },

            addToCart: async (product) => {
                const token = localStorage.getItem('accessToken');

                // --- Logged In Logic ---
                if (token) {
                    try {
                        // Optimistic Update (Optional, skipping for safety first)
                        // Call API
                        const payload = {
                            productId: Number(product.productId),
                            variantId: product.variantId ? Number(product.variantId) : undefined,
                            quantity: product.quantity
                        };
                        const updatedCart = await cartService.addToCart(payload);
                        set({
                            items: updatedCart.items,
                            total: updatedCart.total,
                            cartId: updatedCart.cartId
                        });
                    } catch (error) {
                        console.error("Add to cart failed", error);
                        // toast error?
                    }
                    return;
                }

                // --- Guest Logic (Local Storage) ---
                const items = get().items;
                const existingItem = items.find(i => i.productId === product.productId && i.variantId === product.variantId);

                let newItems;
                if (existingItem) {
                    newItems = items.map(i =>
                        (i.productId === product.productId && i.variantId === product.variantId)
                            ? { ...i, quantity: i.quantity + product.quantity }
                            : i
                    );
                } else {
                    newItems = [...items, {
                        ...product,
                        id: Math.random().toString(36).substr(2, 9), // Local Temp ID
                    }];
                }

                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },

            removeFromCart: async (itemId) => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    try {
                        const updatedCart = await cartService.removeFromCart(Number(itemId));
                        set({ items: updatedCart.items, total: updatedCart.total });
                    } catch (e) { console.error(e); }
                    return;
                }

                const newItems = get().items.filter(i => i.id !== itemId);
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },

            updateQuantity: async (itemId, quantity) => {
                if (quantity < 1) return;

                const token = localStorage.getItem('accessToken');
                if (token) {
                    try {
                        const updatedCart = await cartService.updateQuantity(Number(itemId), quantity);
                        set({ items: updatedCart.items, total: updatedCart.total });
                    } catch (e) { console.error(e); }
                    return;
                }

                const newItems = get().items.map(i =>
                    i.id === itemId ? { ...i, quantity } : i
                );
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },

            clearCart: async () => {
                // Client-side clear for logout (don't call API to delete DB items!)
                // If we wanted to empty the cart in DB, we'd call API.
                // But for "Logout", we just clear local state.
                set({ items: [], total: 0, cartId: undefined });
            },
        }),
        {
            name: 'figi-cart-storage',
            partialize: (state) => ({ items: state.items, total: state.total }), // Don't persist isLoading
        }
    )
);
