import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import FlashSaleProgress from './FlashSaleProgress';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from '@/components/ui/use-toast';

export interface FlashSaleItem {
    product_id: number;
    variant_id: number;
    name: string;
    image?: string;
    brand?: string;
    is_flash_sale: boolean;
    flash_sale_price: number;
    original_price: number;
    sold: number;
    quota: number;
    start_time: string; // ISO string
    end_time: string;   // ISO string
    stock_available?: number;
}

interface FlashSaleCardProps {
    item: FlashSaleItem;
}

const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function FlashSaleCard({ item }: FlashSaleCardProps) {
    const navigate = useNavigate();
    const addToCart = useCartStore((s) => s.addToCart);
    const { toast } = useToast();
    const [adding, setAdding] = useState(false);

    const discountPct = item.original_price > 0
        ? Math.round((1 - item.flash_sale_price / item.original_price) * 100)
        : 0;

    const isSoldOut = item.sold >= item.quota;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSoldOut || adding) return;
        setAdding(true);
        try {
            await addToCart({
                id: String(item.product_id),
                variantId: item.variant_id,
                name: item.name,
                price: item.flash_sale_price,
                image: item.image || '',
                category: 'Flash Sale',
                rating: 0,
                reviews: 0,
            } as any);
            toast({ title: '⚡ Flash price locked!', description: `${item.name} added to cart.`, duration: 2000 });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err?.message || 'Could not add item.' });
        } finally {
            setAdding(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex flex-col rounded-2xl overflow-hidden bg-gradient-to-b from-[#1a0a00] to-[#0d0d0d] border border-orange-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer group"
            onClick={() => navigate(`/customer/product/${item.product_id}`)}
        >
            {/* Discount Badge */}
            {discountPct > 0 && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-red-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg shadow-red-900/50 tracking-wide">
                    <Zap className="w-3 h-3 fill-white" />
                    -{discountPct}%
                </div>
            )}

            {/* Image */}
            <div className="aspect-square relative overflow-hidden">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-950/30">
                        <Zap className="w-12 h-12 text-orange-700/40" />
                    </div>
                )}

                {/* Image gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent opacity-80" />

                {/* Sold Out overlay */}
                {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <span className="bg-gray-700 text-gray-200 text-xs font-extrabold px-5 py-2 rounded-full uppercase tracking-widest shadow-xl">
                            Sold Out
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2.5 p-3 flex-1">
                {/* Brand */}
                {item.brand && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/70">
                        {item.brand}
                    </span>
                )}

                {/* Name */}
                <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-orange-300 transition-colors">
                    {item.name}
                </h3>

                {/* Prices */}
                <div className="flex items-end gap-2 mt-auto">
                    <span className="text-orange-400 font-extrabold text-lg leading-none">
                        {fmt(item.flash_sale_price)}
                    </span>
                    <span className="text-white/35 text-xs line-through font-medium leading-none mb-0.5">
                        {fmt(item.original_price)}
                    </span>
                </div>

                {/* Progress */}
                <FlashSaleProgress sold={item.sold} quota={item.quota} />

                {/* CTA */}
                <button
                    onClick={handleAddToCart}
                    disabled={isSoldOut || adding}
                    className={`mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200
                        ${isSoldOut
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            : adding
                            ? 'bg-orange-600/50 text-orange-200 cursor-wait'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 shadow-lg shadow-orange-900/40 hover:shadow-orange-500/40 active:scale-95'
                        }`}
                >
                    {!isSoldOut && <ShoppingCart className="w-3.5 h-3.5" />}
                    {isSoldOut ? 'Sold Out' : adding ? 'Adding...' : 'Add to Cart'}
                </button>
            </div>
        </motion.div>
    );
}
