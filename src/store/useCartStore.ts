import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartService } from '@/services/cart.service';

export interface CartItem {
    id: string | number;
    productId: string | number;
    name: string;
    price: number; // Đây là giá trị tiền thực tế user phải trả (Cọc hoặc Full)
    originalPrice?: number; // Giá gốc để tham chiếu
    quantity: number;
    image: string;
    variantId?: number;
    sku?: string;
    type_code?: string;

    // FIELDS MỚI CHO PRE-ORDER
    payment_option?: 'DEPOSIT' | 'FULL_PAYMENT';
    deposit_amount?: number;
    full_price?: number;
    max_qty_per_user?: number;
    maxStock?: number;
}

interface CartState {
    items: CartItem[];
    cartId?: number;
    total: number;
    isLoading: boolean;

    fetchCart: () => Promise<void>;
    addToCart: (product: any & { paymentOption?: 'DEPOSIT' | 'FULL_PAYMENT', max_qty_per_user?: number }) => Promise<void>;
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
                if (!token) return;

                set({ isLoading: true });
                try {
                    const data = await cartService.getCart();
                    // Map lại dữ liệu từ BE để đảm bảo total tính đúng
                    const items = data.items.map((i: any) => ({
                        ...i,
                        // Nếu là DEPOSIT thì dùng deposit_amount, ngược lại dùng price
                        price: i.payment_option === 'DEPOSIT' ? (i.deposit_amount || i.price) : i.price
                    }));

                    set({
                        items: items,
                        total: items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0),
                        cartId: data.cartId
                    });
                } catch (error) {
                    console.error('Fetch cart failed', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            addToCart: async (product) => {
                // 1. Sanitize Inputs
                const productId = Number(product.id || product.productId); // Handle both naming conventions
                const variantId = product.variantId ? Number(product.variantId) : undefined;
                const quantity = Number(product.quantity) || 1;
                const paymentOption = product.paymentOption || 'DEPOSIT';
                const typeCode = product.type_code || 'RETAIL';
                const maxQty = product.max_qty_per_user ? Number(product.max_qty_per_user) : undefined;

                // Guard: Invalid ID
                if (!productId || isNaN(productId)) {
                    console.error("❌ Invalid Product ID in addToCart:", product);
                    return;
                }

                // --- CONFLICT CHECK (Rule: Cannot mix payment options for same item) ---
                const currentItems = get().items;
                const existingItem = currentItems.find(i =>
                    Number(i.productId) === productId &&
                    Number(i.variantId) === variantId
                );

                if (existingItem) {
                    // Check mixed payment mode
                    if (existingItem.payment_option && existingItem.payment_option !== paymentOption) {
                        const msg = `You already have this item with '${existingItem.payment_option === 'DEPOSIT' ? 'Deposit' : 'Full Payment'}' option. Please remove it first to change payment mode.`;
                        throw new Error(msg); // Let UI catch this
                    }

                    // Check max_qty_per_user (Accumulated)
                    if (maxQty !== undefined && (existingItem.quantity + quantity) > maxQty) {
                        const msg = `Limit exceeded. You can only buy ${maxQty} of this item per user.`;
                        throw new Error(msg); // Let UI catch this
                    }
                } else {
                    // Check max_qty_per_user (New Item)
                    if (maxQty !== undefined && quantity > maxQty) {
                        const msg = `Limit exceeded. You can only buy ${maxQty} of this item per user.`;
                        throw new Error(msg);
                    }
                }

                const token = localStorage.getItem('accessToken');

                // --- XÁC ĐỊNH GIÁ (FIX LỖI 0đ & Price Logic) ---
                let effectivePrice = product.price;
                if (typeCode === 'PREORDER') {
                    if (paymentOption === 'DEPOSIT') {
                        effectivePrice = Number(product.deposit_amount) || Number(product.price);
                    } else {
                        effectivePrice = Number(product.full_price) || Number(product.price);
                    }
                }

                // 1. Nếu đã login -> Gọi API
                if (token) {
                    try {
                        await cartService.addToCart({
                            productId: productId,
                            variantId: variantId,
                            quantity,
                            paymentOption // Gửi option lên server
                        });
                        await get().fetchCart(); // Refresh lại cart chuẩn từ server
                    } catch (error: any) {
                        // Re-throw server error (which handles max_qty server side)
                        // But we want to catch "Bad Request" and show user
                        console.error('Add to cart failed', error);
                        throw new Error(error.response?.data?.message || 'Failed to add to cart');
                    }
                    return;
                }

                // 2. Nếu chưa login (Local Cart)
                let newItems;
                if (existingItem) {
                    newItems = currentItems.map(i => {
                        if (Number(i.productId) === productId && Number(i.variantId) === variantId) {
                            return { ...i, quantity: i.quantity + quantity };
                        }
                        return i;
                    });
                } else {
                    newItems = [...currentItems, {
                        id: `temp-${Date.now()}`,
                        productId: productId,
                        name: product.name,
                        price: effectivePrice, // Lưu giá đã tính toán
                        originalPrice: product.price,
                        quantity,
                        image: product.image,
                        variantId: variantId,
                        sku: product.sku,
                        type_code: typeCode,
                        payment_option: paymentOption,
                        deposit_amount: Number(product.deposit_amount),
                        full_price: Number(product.full_price),
                        max_qty_per_user: maxQty
                    }];
                }

                // Tính lại tổng tiền
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },

            removeFromCart: async (itemId) => {
                // Giữ nguyên logic cũ...
                const token = localStorage.getItem('accessToken');
                if (token) {
                    await cartService.removeFromCart(Number(itemId));
                    await get().fetchCart();
                    return;
                }
                const newItems = get().items.filter(i => i.id !== itemId);
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },

            updateQuantity: async (itemId, quantity) => {
                if (quantity < 1) return;

                // Validate Max Qty (Local Check before API/State)
                const currentItems = get().items;
                const targetItem = currentItems.find(i => i.id == itemId); // Loose equality for string/number id

                if (targetItem && targetItem.max_qty_per_user !== undefined) {
                    if (quantity > targetItem.max_qty_per_user) {
                        // We can't easily throw here as it might be used in a callback, 
                        // but we can just RETURN and do nothing (effectively blocking).
                        // Ideally, return a rejection or toast, but store is pure logic.
                        // Let's console warn and return.
                        console.warn(`Cannot update: Limit ${targetItem.max_qty_per_user} exceeded.`);
                        return;
                    }
                }

                const token = localStorage.getItem('accessToken');
                if (token) {
                    try {
                        await cartService.updateQuantity(Number(itemId), quantity);
                        await get().fetchCart();
                    } catch (e) { console.error(e); }
                    return;
                }
                const newItems = get().items.map(i => i.id === itemId ? { ...i, quantity } : i);
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                set({ items: newItems, total });
            },

            clearCart: async () => {
                set({ items: [], total: 0, cartId: undefined });
            },
        }),
        {
            name: 'figi-cart-storage',
            partialize: (state) => ({ items: state.items, total: state.total }),
        }
    )
);