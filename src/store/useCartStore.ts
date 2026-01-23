import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

interface CartState {
    items: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            total: 0,
            addToCart: (product) => {
                const items = get().items;
                const existingItem = items.find(i => i.productId === product.id);

                let newItems;
                if (existingItem) {
                    newItems = items.map(i =>
                        i.productId === product.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    );
                } else {
                    newItems = [...items, {
                        id: Math.random().toString(36).substr(2, 9),
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: product.image
                    }];
                }

                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },
            removeFromCart: (productId) => {
                const newItems = get().items.filter(i => i.productId !== productId);
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },
            updateQuantity: (productId, quantity) => {
                if (quantity < 1) return;
                const newItems = get().items.map(i =>
                    i.productId === productId ? { ...i, quantity } : i
                );
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },
            clearCart: () => set({ items: [], total: 0 }),
        }),
        {
            name: 'figi-cart-storage',
        }
    )
);
