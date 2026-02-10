import { useState, useEffect } from 'react';
import { Package, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PosProduct, PosProductVariant } from '@/types/pos.types';

interface PosProductCardProps {
    product: PosProduct;
    onAddToCart: (product: PosProduct, variant: PosProductVariant) => void;
}

export function PosProductCard({ product, onAddToCart }: PosProductCardProps) {
    const [selectedVariant, setSelectedVariant] = useState<PosProductVariant | null>(null);

    // Initialize with first variant
    // Initialize or update selected variant when product changes
    useEffect(() => {
        if (product.variants && product.variants.length > 0) {
            if (selectedVariant) {
                // Try to find the currently selected variant in the new product data
                const updatedVariant = product.variants.find(v => v.variant_id === selectedVariant.variant_id);
                if (updatedVariant) {
                    setSelectedVariant(updatedVariant);
                    return;
                }
            }
            // Default to first variant if none selected or not found
            setSelectedVariant(product.variants[0]);
        }
    }, [product, selectedVariant?.variant_id]); // Depend on variant_id instead of whole object to avoid loops if needed, though product change drives this

    if (!selectedVariant) return null;

    const currentPrice = selectedVariant.price;
    const currentStock = selectedVariant.current_stock;
    const currentThumbnail = selectedVariant.thumbnail || product.thumbnail;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click if we add click handler to card later
        if (currentStock > 0) {
            onAddToCart(product, selectedVariant);
        }
    };

    return (
        <div className="group bg-white rounded-[1.75rem] border border-neutral-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-100/50 transition-all duration-300 flex flex-col overflow-hidden h-full relative cursor-pointer active:scale-[0.98]">
            {/* Image Area */}
            <div className="p-2">
                <div className="aspect-square bg-neutral-50 rounded-2xl relative overflow-hidden flex items-center justify-center border border-neutral-50">
                    {currentThumbnail ? (
                        <img
                            src={currentThumbnail}
                            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500 will-change-transform"
                            alt={product.product_name}
                        />
                    ) : (
                        <Package className="w-12 h-12 text-neutral-300 opacity-50" />
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-white/90 backdrop-blur-md text-neutral-900 font-bold shadow-sm border border-neutral-100 hover:bg-white text-xs px-2.5 py-1 rounded-full">
                            {currentPrice.toLocaleString('vi-VN')}₫
                        </Badge>
                    </div>

                    {/* Stock Status Badge */}
                    {currentStock > 0 ? (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                            {currentStock <= 5 ? (
                                <Badge variant="outline" className="bg-amber-50/90 text-amber-700 border-amber-200 text-[10px] shadow-sm backdrop-blur-sm px-2 py-0.5 whitespace-nowrap">
                                    Low Stock: {currentStock}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-emerald-50/90 text-emerald-700 border-emerald-200 text-[10px] shadow-sm backdrop-blur-sm px-2 py-0.5 whitespace-nowrap">
                                    In Stock: {currentStock}
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <Badge variant="destructive" className="font-bold uppercase tracking-wider px-3 py-1">Out of Stock</Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="px-4 pb-4 pt-1 flex flex-col flex-1 gap-3">

                {/* Title */}
                <h3 className="font-bold text-neutral-900 text-[0.9rem] line-clamp-2 leading-snug min-h-[2.4em]" title={product.product_name}>
                    {product.product_name}
                </h3>

                {/* Variant Selector */}
                <div className="mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                        {product.variants.map((variant) => (
                            <button
                                key={variant.variant_id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVariant(variant);
                                }}
                                className={cn(
                                    "text-[10px] px-2.5 py-1.5 rounded-full border transition-all truncate max-w-full font-semibold",
                                    selectedVariant.variant_id === variant.variant_id
                                        ? "bg-neutral-900 text-white border-neutral-900 shadow-md transform scale-105"
                                        : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700"
                                )}
                                title={`${variant.option_name} - Stock: ${variant.current_stock}`}
                            >
                                {variant.option_name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={currentStock <= 0}
                    className={cn(
                        "w-full h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300",
                        currentStock > 0
                            ? "bg-neutral-900 text-white hover:bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                            : "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                    )}
                >
                    <Plus className="w-4 h-4" />
                    <span>ADD TO CART</span>
                </button>
            </div>
        </div>
    );
}
