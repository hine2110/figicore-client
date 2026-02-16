import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Box,
    Truck,
    Info,
    X,
    Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import CustomerLayout from '@/layouts/CustomerLayout';
import { productsService } from '@/services/products.service';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/types/product';

export default function BlindBoxShop() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPrizePoolOpen, setIsPrizePoolOpen] = useState(false);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await productsService.getProducts({ type_code: 'BLINDBOX', limit: 20 });
                const data = Array.isArray(res) ? res : (res as any).data || [];
                setProducts(data);
                if (data.length > 0) setLoading(false);
            } catch (error) {
                console.error("Failed to fetch blindboxes", error);
            }
        };
        fetchProducts();
    }, []);

    // --- CAROUSEL LOGIC ---
    const handleNext = () => setActiveIndex((prev) => (prev + 1) % products.length);
    const handlePrev = () => setActiveIndex((prev) => (prev - 1 + products.length) % products.length);

    const product = products[activeIndex];

    const getCardStyle = (index: number) => {
        const len = products.length;
        if (len === 0) return {};

        let diff = (index - activeIndex + len) % len;
        if (diff > len / 2) diff -= len;

        // Active
        if (diff === 0) {
            return {
                x: 0,
                // Reduced scale slightly for better fit on laptop screens
                scale: 1.15,
                zIndex: 50,
                opacity: 1,
                rotateY: 0,
                filter: 'brightness(1.1)',
            };
        }
        // Right Slot
        if (diff === 1) {
            return {
                x: 260, // Tighter spacing
                scale: 0.75, // Smaller side items
                zIndex: 10,
                opacity: 0.5, // More fade to emphasize center
                rotateY: -45,
                filter: 'brightness(0.4) blur(1px)', // Added blur for depth
            };
        }
        // Left Slot
        if (diff === -1 || diff === len - 1) {
            return {
                x: -260, // Tighter spacing
                scale: 0.75,
                zIndex: 10,
                opacity: 0.5,
                rotateY: 45,
                filter: 'brightness(0.4) blur(1px)',
            };
        }

        return {
            x: diff > 0 ? 600 : -600,
            scale: 0.5,
            zIndex: 0,
            opacity: 0,
            rotateY: 0,
            filter: 'brightness(0)',
        };
    };

    const handleAcquire = async () => {
        if (!product) return;
        try {
            await useCartStore.getState().addToCart({
                id: product.product_id,
                name: product.name,
                price: Number((product as any).product_blindboxes?.price || 0),
                image: Array.isArray(product.media_urls) ? product.media_urls[0] : (typeof product.media_urls === 'string' ? product.media_urls : ''),
                quantity: 1,
                type_code: 'BLINDBOX',
                variantId: product.product_variants?.[0]?.variant_id
            });

            toast({
                title: "Acquired.",
                description: `${product.name} added to your collection.`,
                className: "bg-black text-white border-white/20 font-serif"
            });
            navigate('/customer/cart');
        } catch (e) {
            toast({ title: "Error", description: "Could not acquire item.", variant: "destructive" });
        }
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white font-serif tracking-widest uppercase">Loading Collection...</div>;
    if (!product) return <div className="h-screen bg-black text-white flex items-center justify-center">No Collection Available</div>;

    const brandName = (product as any).brands?.name || "Premium Brand";
    const seriesName = (product as any).series?.name || "Series Collection";
    const categoryName = (product as any).categories?.name || "Blindbox";
    const description = (product as any).description || "Unveil the mystery within. This exclusive collection features meticulously crafted figures designed to surprise and delight.";

    // Ambient Color based on index (simulating tier color)
    const ambientColors = ['bg-amber-500/20', 'bg-purple-500/20', 'bg-blue-500/20', 'bg-emerald-500/20'];
    const currentGlow = ambientColors[product.product_id % ambientColors.length];

    return (
        <CustomerLayout activePage="blind-box">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
                .font-luxury-heading { font-family: 'Playfair Display', serif; }
                .font-luxury-body { font-family: 'Montserrat', sans-serif; }
            `}</style>

            {/* FULL SCREEN WRAPPER - PREVENT SCROLL */}
            <div className="relative h-screen w-full bg-black text-white overflow-hidden font-luxury-body selection:bg-amber-500/30 flex flex-col">

                {/* 1. CINEMATIC BACKGROUND */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Spotlight Layout: Light from top center */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-neutral-950 to-black" />

                    {/* Floating Particles Overlay */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(15)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute bg-white rounded-full opacity-0 animate-float-up"
                                style={{
                                    width: Math.random() * 2 + 1 + 'px',
                                    height: Math.random() * 2 + 1 + 'px',
                                    left: Math.random() * 100 + '%',
                                    top: '100%',
                                    animationDelay: Math.random() * 5 + 's',
                                    animationDuration: Math.random() * 10 + 10 + 's'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* 2. MAIN STAGE - COMPACT LAYOUT */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-16 md:pt-4 h-full max-h-[90vh]">

                    {/* 3D CAROUSEL & VISUALS */}
                    <div className="relative w-full max-w-5xl h-[45vh] md:h-[55vh] flex items-center justify-center perspective-[1000px] mb-4">

                        {/* Ambient Glow Behind Product */}
                        <div className={`absolute w-[300px] h-[300px] rounded-full blur-[100px] ${currentGlow} transition-colors duration-700`} />

                        <AnimatePresence>
                            {products.map((p, index) => {
                                const style = getCardStyle(index);
                                if (style.opacity === 0) return null;

                                const isCenter = style.x === 0;

                                return (
                                    <motion.div
                                        key={p.product_id}
                                        initial={false}
                                        animate={{
                                            x: style.x,
                                            scale: style.scale,
                                            zIndex: style.zIndex,
                                            opacity: style.opacity,
                                            rotateY: style.rotateY,
                                            filter: style.filter
                                        }}
                                        transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 20 }}
                                        className="absolute w-[240px] md:w-[320px] aspect-[3/4] rounded-xl overflow-visible cursor-pointer" // overflow-visible for reflection
                                        onClick={() => setActiveIndex(index)}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Main Card */}
                                        <div className="w-full h-full relative group rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-black/40 backdrop-blur-md">
                                            {p.media_urls?.[0] ? (
                                                <img
                                                    src={typeof p.media_urls[0] === 'string' ? p.media_urls[0] : (p.media_urls[0] as any).url}
                                                    alt={p.name}
                                                    className="w-full h-full object-contain p-2" // Contain to ensure whole figure is seen
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
                                        </div>

                                        {/* Reflection Effect (Only for active item to save perf) */}
                                        {isCenter && (
                                            <div
                                                className="absolute top-full left-0 w-full h-[40%] opacity-30 pointer-events-none"
                                                style={{
                                                    transform: 'scaleY(-1) translateY(-10px)',
                                                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), transparent)',
                                                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), transparent)'
                                                }}
                                            >
                                                {p.media_urls?.[0] && (
                                                    <img
                                                        src={typeof p.media_urls[0] === 'string' ? p.media_urls[0] : (p.media_urls[0] as any).url}
                                                        alt=""
                                                        className="w-full h-full object-contain p-2 filter blur-[2px]"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Navigation Arrows */}
                        <div className="absolute inset-x-0 w-full max-w-[90%] md:max-w-3xl mx-auto flex justify-between items-center z-50 pointer-events-none">
                            <button onClick={handlePrev} className="pointer-events-auto p-3 rounded-full border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button onClick={handleNext} className="pointer-events-auto p-3 rounded-full border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* DETAILS PANEL - COMPACT */}
                    <div className="text-center space-y-3 z-50 w-full max-w-xl px-4">
                        <motion.div
                            key={product.product_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center"
                        >
                            {/* META BADGES (Moved Above Title) */}
                            <div className="flex flex-wrap justify-center gap-2 mb-2 scale-90 origin-center">
                                {[brandName, seriesName, categoryName].map((badge, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded border border-amber-500/20 text-[10px] uppercase tracking-widest text-amber-200/80 font-medium bg-black/40 backdrop-blur-sm">
                                        {badge}
                                    </span>
                                ))}
                            </div>

                            <h1 className="text-2xl md:text-4xl font-luxury-heading text-white tracking-tight leading-none mb-2 shadow-black drop-shadow-lg">
                                {product.name}
                            </h1>

                            <div className="text-xl md:text-2xl font-luxury-heading text-amber-100 py-1 mb-2 shadow-black drop-shadow-md">
                                {formatPrice(Number((product as any).product_blindboxes?.price || 0))}
                            </div>

                            {/* DESCRIPTION HOOK */}
                            <div
                                className="mb-6 relative group cursor-pointer max-w-md mx-auto"
                                onClick={() => setIsDescriptionOpen(true)}
                            >
                                <p className="text-neutral-400 text-sm font-sans line-clamp-2 leading-relaxed px-4">
                                    {description}
                                </p>
                                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-amber-500/70 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Info className="w-3 h-3" />
                                    <span>Read Full Story</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleAcquire}
                                    className="h-10 px-6 bg-white/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-100 font-luxury-heading tracking-widest text-xs uppercase transition-all backdrop-blur-md"
                                >
                                    <Sparkles className="w-3 h-3 mr-2" />
                                    Acquire
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => setIsPrizePoolOpen(true)}
                                    className="h-10 px-4 text-slate-400 hover:text-white text-[10px] uppercase tracking-widest hover:bg-white/5"
                                >
                                    View Prizes
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                </div>

                {/* 3. HOW IT WORKS - COMPACT */}
                <div className="relative z-40 w-full border-t border-white/5 bg-black/60 backdrop-blur-xl py-3 mt-auto">
                    <div className="max-w-2xl mx-auto px-6 flex justify-between md:justify-around items-center gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                            <Box className="w-3 h-3 text-amber-200" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-300">Choose Box</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex flex-col md:flex-row items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                            <Sparkles className="w-3 h-3 text-purple-300" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-300">Unbox</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex flex-col md:flex-row items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                            <Truck className="w-3 h-3 text-emerald-300" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-300">Deliver</span>
                        </div>
                    </div>
                </div>

                {/* 4. PRIZE POOL DRAWER */}
                <AnimatePresence>
                    {isPrizePoolOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsPrizePoolOpen(false)}
                                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                            />

                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0A0A0A] border-t border-white/10 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
                            >
                                <div className="max-w-2xl mx-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-luxury-heading text-white">Prize Composition</h2>
                                        <button onClick={() => setIsPrizePoolOpen(false)}>
                                            <X className="w-5 h-5 text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="relative group rounded-lg overflow-hidden bg-gradient-to-br from-amber-900/20 to-black border border-amber-500/20 p-1">
                                            <div className="absolute top-2 left-2 z-10 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                Jackpot
                                            </div>
                                            <div className="aspect-square bg-black/40 rounded overflow-hidden relative">
                                                <img
                                                    src={product.media_urls?.[0] ? (typeof product.media_urls[0] === 'string' ? product.media_urls[0] : (product.media_urls[0] as any).url) : ''}
                                                    alt="Jackpot"
                                                    className="w-full h-full object-contain opacity-80"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Trophy className="w-4 h-4 text-amber-400" />
                                                    <h3 className="font-luxury-heading text-base">Odds</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest">
                                                            <span>Common</span>
                                                            <span>75%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-slate-500 w-[75%]" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] text-amber-200 uppercase tracking-widest">
                                                            <span>Rare</span>
                                                            <span>20%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-amber-400 w-[20%]" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] text-purple-300 uppercase tracking-widest">
                                                            <span>Legendary</span>
                                                            <span>5%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-purple-500 w-[5%]" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* 5. DESCRIPTION MODAL */}
                <AnimatePresence>
                    {isDescriptionOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsDescriptionOpen(false)}
                                className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-full max-w-lg p-6 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-luxury-heading text-amber-100">Product Story</h3>
                                    <button onClick={() => setIsDescriptionOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <p className="text-slate-300 font-luxury-body text-sm leading-relaxed whitespace-pre-wrap">
                                        {description}
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button variant="outline" size="sm" onClick={() => setIsDescriptionOpen(false)} className="text-xs uppercase tracking-widest">
                                        Close
                                    </Button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </CustomerLayout>
    );
}
