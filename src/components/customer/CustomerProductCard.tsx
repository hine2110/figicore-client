import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from "@/components/ui/use-toast";
import { useState } from 'react';
import { calculateFinalPrice } from '@/lib/utils';
import { ProductPromotion } from '@/types/product';

interface ProductCardProps {
    product: {
        id: string; // Mapped from product_id
        name: string;
        price: number;
        originalPrice?: number;
        image: string;
        category: string;
        rating: number;
        reviews: number;
        isNew?: boolean;

        // Data might come as pre-calculated stock OR list of variants
        stock_available?: number;
        product_variants?: any[]; // <--- ADD THIS to support calculating total stock
        product_promotions?: ProductPromotion[] | any;
    };
}

export default function CustomerProductCard({ product }: ProductCardProps) {
    const addToCart = useCartStore((state) => state.addToCart);
    const [isAdded, setIsAdded] = useState(false);
    const { toast } = useToast();

    // --- LOGIC FIX: CALCULATE TOTAL STOCK ---
    const isPreorder = product.product_variants?.some((v: any) => v.product_preorder_configs);

    let isSoldOut = false;

    if (isPreorder) {
        // Sum remaining slots for Pre-order
        const totalSlots = product.product_variants?.reduce((sum, v) => {
            const conf = v.product_preorder_configs;
            return sum + ((conf?.total_slots || 0) - (conf?.sold_slots || 0));
        }, 0) || 0;
        isSoldOut = totalSlots <= 0;
    } else {
        // Standard Retail Logic
        const totalStock = product.product_variants?.length
            ? product.product_variants.reduce((sum, v) => sum + (v.stock_available || 0), 0)
            : (product.stock_available || 0);
        isSoldOut = totalStock <= 0;
    }
    // ----------------------------------------

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await addToCart(product);
            setIsAdded(true);

            toast({
                title: "Added to cart",
                description: `${product.name} has been added to your cart.`,
                duration: 2000,
            });

            setTimeout(() => setIsAdded(false), 2000);
        } catch (error: any) {
            console.error("Quick add failed", error);
            // Show error toast
            toast({
                variant: "destructive",
                title: "Cannot add item",
                description: error.message || "An error occurred.",
            });
        }
    };

    // Logic calculation to be robust
    const promo = Array.isArray(product.product_promotions) ? product.product_promotions[0] : product.product_promotions;

    // Calculate final price using the helper that respects range
    const finalPrice = calculateFinalPrice(product.price, promo);
    const hasDiscount = finalPrice < product.price;

    return (
        <Link to={`/customer/product/${product.id}`} className="group relative block overflow-hidden rounded-xl bg-white border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Status Badges */}
                {product.isNew && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">New</span>
                )}
                {product.originalPrice && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Sale</span>
                )}

                {/* --- FIX: USE CALCULATED TOTAL STOCK --- */}
                {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <span className="bg-black/80 text-yellow-400 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg backdrop-blur-sm">
                            SOLD OUT
                        </span>
                    </div>
                )}

                {!isSoldOut && (
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                        <Button
                            onClick={handleAddToCart}
                            className={`w-full backdrop-blur-sm shadow-sm font-medium transition-all ${isAdded ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white/90 text-neutral-900 hover:bg-blue-600 hover:text-white'}`}
                            size="sm"
                        >
                            {isAdded ? <Check className="w-4 h-4 mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                            {isAdded ? 'Added' : 'Add to Cart'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-4">
                <p className="text-xs text-neutral-500 mb-1 font-medium">{product.category}</p>
                <h3 className="text-neutral-900 font-semibold truncate group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>

                <div className="mt-2 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-neutral-700">{product.rating}</span>
                    <span className="text-xs text-neutral-400">({product.reviews})</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    {/* TYPE-AWARE PRICE DISPLAY */}
                    {(() => {
                        // Helper
                        const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

                        let displayPrice = product.price || 0;
                        let priceLabel = "";
                        let showOriginal = false;

                        // 1. Blindbox Logic
                        if ((product as any).type_code === 'BLINDBOX' && (product as any).product_blindboxes?.[0]) {
                            displayPrice = Number((product as any).product_blindboxes[0].price);
                        }
                        // 2. Pre-order Logic
                        else if ((product as any).type_code === 'PREORDER' && product.product_variants?.length) {
                            const deposits = product.product_variants
                                .map((v: any) => Number(v.product_preorder_configs?.deposit_amount || 0))
                                .filter((d: number) => d > 0);

                            if (deposits.length > 0) {
                                displayPrice = Math.min(...deposits);
                                priceLabel = "Cọc: ";
                            } else {
                                // Fallback to full price
                                const prices = product.product_variants.map((v: any) => Number(v.product_preorder_configs?.full_price || 0));
                                displayPrice = Math.min(...prices);
                            }
                        }
                        // 3. Retail Logic (Default)
                        else {
                            if (hasDiscount) {
                                displayPrice = finalPrice;
                                showOriginal = true;
                            }
                        }

                        return (
                            <span className="text-lg font-bold text-neutral-900">
                                <span className="text-xs font-normal text-neutral-500 mr-1">{priceLabel}</span>
                                {formatPrice(displayPrice)}
                                {showOriginal && (
                                    <span className="ml-2 text-sm text-neutral-400 line-through">
                                        {formatPrice(product.price)}
                                    </span>
                                )}
                            </span>
                        );
                    })()}

                    {/* Hide originalPrice from prop if we are handling discount internally to avoid confusion, 
                        OR only show it if it differs from product.price logic. 
                        For now, removing the double-display risk. */}
                </div>
            </div>
        </Link>
    );
}
