import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartService } from '@/services/cart.service';

export interface CartItem {
    id: string | number;
    productId: string | number;
    quantity: number;
    price: number;
    payment_option?: string;
    max_qty_per_user?: number;

    // Nested structure from Backend
    product_variants: {
        variant_id?: number;
        products: {
            name: string;
            image: string;
            type_code: string;
            sku?: string;
        };
        price?: any;
        product_preorder_configs?: any;
    };

    // Optional / Legacy (to avoid breaking if accessed, but should use nested)
    promotion?: import('@/types/product').ProductPromotion;
    originalPrice?: number;
    livestream_id?: number;
}

interface CartState {
    items: CartItem[];
    cartId?: number;
    total: number;
    isLoading: boolean;

    fetchCart: () => Promise<void>;
    addToCart: (product: any & { paymentOption?: 'DEPOSIT' | 'FULL_PAYMENT', max_qty_per_user?: number, livestream_id?: number, livestreamId?: number }) => Promise<void>;
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
                        // Fix: Price logic for Pre-order must respect stored payment_option
                        // For Retail/Blindbox, price is just price.
                        // For Pre-order: if DEPOSIT -> deposit_amount. if FULL -> full_price.
                        price: i.product_variants?.products?.type_code === 'PREORDER'
                            ? (i.payment_option === 'FULL_PAYMENT'
                                ? (i.product_variants?.product_preorder_configs?.full_price || i.full_price || i.price)
                                : (i.product_variants?.product_preorder_configs?.deposit_amount || i.deposit_amount || i.price))
                            : i.price
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
                const livestreamId = product.livestreamId ? Number(product.livestreamId) : product.livestream_id ? Number(product.livestream_id) : undefined;

                // Guard: Invalid ID
                if (!productId || isNaN(productId)) {
                    console.error("❌ Invalid Product ID in addToCart:", product);
                    return;
                }

                // --- CONFLICT CHECK (Rule: Cannot mix payment options for same item) ---
                const currentItems = get().items;
                const existingItem = currentItems.find(i =>
                    Number(i.productId) === productId &&
                    Number(i.product_variants?.variant_id) === variantId &&
                    // Current Rule: User can have both options but usually we merge? 
                    // No, if user adds Deposit then Adds Full -> They are distinct items or we block.
                    // User Request: "hiện tại tôi chọn cọc 300k add to cart sau đó chọn cọc full 1tr2 vẫn âdd to cart nhưng kiểm tra cart là cọc 300 cho 2 sản phẩm đó"
                    // => System merged them incorrectly. We must match payment_option too.
                    (i.payment_option || 'DEPOSIT') === paymentOption &&
                    (i.livestream_id || undefined) === (livestreamId || undefined) // Prevent merging live vs non-live
                );

                if (existingItem) {
                    // Logic: If same Variant + Same Option -> Merge Quantity
                    // If same Variant + Diff Option -> Treated as new item (above check fails) 
                    // BUT do we allow same variant with diff options in cart?
                    // User said: "chọn cọc 300k... sau đó chọn cọc full 1tr2"
                    // If we allow both, they should be separate lines.
                    // If we enforce 1 option per variant, we throw error.
                    // Let's SUPPORT both as separate items for flexibility, unless business rule strictly forbids.
                    // Given the bug report, the issue was MERGING them. So checking payment_option in .find() fixes the merge issue.

                    // We DO need to check Max Qty across ALL items of same variant though?
                    // "Anti-scalping limit reached. You can only buy X units of this item."
                    // So we should sum quantity of ALL items with same variant_id.

                    const sameVariantItems = currentItems.filter(i => Number(i.product_variants?.variant_id) === variantId);
                    const totalVariantQty = sameVariantItems.reduce((sum, i) => sum + i.quantity, 0);

                    // Check max_qty_per_user (Accumulated)
                    if (maxQty !== undefined && (totalVariantQty + quantity) > maxQty) {
                        const msg = `Limit exceeded. You can only buy ${maxQty} of this item per user (across all options).`;
                        throw new Error(msg);
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
                            paymentOption: paymentOption as any, // Ensure type match
                            livestreamId: livestreamId
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
                        if (
                            Number(i.productId) === productId && 
                            Number(i.product_variants?.variant_id) === variantId && 
                            (i.payment_option || 'DEPOSIT') === paymentOption &&
                            (i.livestream_id || undefined) === (livestreamId || undefined)
                        ) {
                            return { ...i, quantity: i.quantity + quantity };
                        }
                        return i;
                    });
                } else {
                    newItems = [...currentItems, {
                        id: `temp-${Date.now()}`,
                        productId: productId,
                        quantity,
                        price: effectivePrice,
                        payment_option: paymentOption,
                        max_qty_per_user: maxQty,
                        originalPrice: product.price,
                        livestream_id: livestreamId,
                        // Construct nested object for UI compatibility
                        product_variants: {
                            variant_id: variantId,
                            products: {
                                name: product.name,
                                image: product.image,
                                type_code: typeCode,
                                sku: product.sku
                            },
                            product_preorder_configs: {
                                deposit_amount: Number(product.deposit_amount),
                                full_price: Number(product.full_price)
                            }
                        }
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