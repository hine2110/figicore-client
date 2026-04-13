import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Trophy,
    Zap,
    Plus,
    Minus
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
    const [quantity, setQuantity] = useState(1);

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
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // --- CAROUSEL LOGIC ---
    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % products.length);
        setQuantity(1);
    };
    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
        setQuantity(1);
    };
    const handleSelect = (index: number) => {
        setActiveIndex(index);
        setQuantity(1);
    };

    const product = products[activeIndex];

    const getCardStyle = (index: number) => {
        const len = products.length;
        if (len === 0) return {};

        let diff = (index - activeIndex + len) % len;
        if (diff > len / 2) diff -= len;

        // Active Center
        if (diff === 0) {
            return {
                x: 0,
                y: 0,
                scale: 1,
                zIndex: 50,
                opacity: 1,
                rotateY: 0,
                filter: 'brightness(1.1) drop-shadow(0 0 40px rgba(180, 150, 80, 0.2))',
            };
        }
        // Adjacent Sides
        if (Math.abs(diff) === 1 || (len > 2 && diff === len - 1) || (len > 2 && diff === 1 - len)) {
            const side = diff > 0 ? 1 : -1;
            return {
                x: side * 220,
                y: 40,
                scale: 0.7,
                zIndex: 10,
                opacity: 0.25,
                rotateY: side * -50,
                filter: 'brightness(0.4) blur(4px)',
            };
        }

        return { x: 0, y: 100, scale: 0.5, zIndex: 0, opacity: 0, rotateY: 0, filter: 'brightness(0)' };
    };

    const handleAcquire = async () => {
        if (!product) return;
        try {
            await useCartStore.getState().addToCart({
                id: product.product_id,
                name: product.name,
                price: Number((product as any).product_blindboxes?.price || 0),
                image: Array.isArray(product.media_urls) ? product.media_urls[0] : (product.media_urls as any),
                quantity: quantity,
                type_code: 'BLINDBOX',
                variantId: product.product_variants?.[0]?.variant_id
            });

            toast({
                title: "Extraction Initiated",
                description: `${quantity}x ${product.name} prepared for collection.`,
                className: "bg-zinc-900 border-white/10 text-white font-mono-tag"
            });
            navigate('/customer/cart');
        } catch (e) {
            toast({ title: "Extraction Error", description: "Protocol failed. Please retry.", variant: "destructive" });
        }
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p);

    if (loading) return (
        <div className="h-screen bg-[#0A0A0B] flex items-center justify-center">
            <div className="relative">
                <div className="w-12 h-12 border-2 border-white/5 border-t-amber-500/50 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-500/50 animate-pulse" />
                </div>
            </div>
        </div>
    );

    if (!product) return <div className="h-screen bg-[#0A0A0B] text-white flex items-center justify-center font-luxury-serif italic">The Archive is Empty.</div>;

    return (
        <CustomerLayout activePage="blind-box" hideFooter darkNav>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;500&display=swap');
                
                .font-luxury-serif { font-family: 'Playfair Display', serif; }
                .font-mono-tag { font-family: 'JetBrains Mono', monospace; }

                .arcane-card {
                    background: linear-gradient(135deg, rgba(20, 20, 22, 0.95) 0%, rgba(10, 10, 12, 0.98) 100%);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 50px 100px -20px rgba(0,0,0,0.9);
                }

                .btn-gold-gradient {
                    background: linear-gradient(135deg, #d4af37 0%, #a47e1b 100%);
                    color: #000;
                    box-shadow: 0 10px 30px -5px rgba(212, 175, 55, 0.3);
                }

                .carousel-perspective {
                    perspective: 2500px;
                }

                .cinematic-vignette {
                    background: radial-gradient(circle at 50% 40%, transparent 0%, rgba(0,0,0,0.4) 100%);
                }

                .arcane-glow {
                    background: radial-gradient(circle at 50% -10%, rgba(180, 150, 80, 0.08) 0%, transparent 70%);
                }

                .quantity-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    transition: all 0.2s;
                    color: #71717a;
                }
                .quantity-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    border-color: rgba(255,255,255,0.1);
                }
                .quantity-input {
                    background: transparent;
                    border: none;
                    width: 40px;
                    text-align: center;
                    color: #fff;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                }
                .quantity-input:focus { outline: none; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 4px; }
            `}</style>

            <div className="relative min-h-[calc(100vh-64px)] w-full flex flex-col bg-[#0A0A0B] overflow-hidden select-none">

                {/* 1. CINEMATIC BACKGROUND ELEMENTS (Snow / Particles) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 cinematic-vignette" />
                    <div className="absolute top-0 left-0 w-full h-full arcane-glow" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-[0.05] mix-blend-overlay" />

                    {/* Snow Particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -20, x: Math.random() * 100 + "%" }}
                                animate={{
                                    opacity: [0, 0.6, 0],
                                    y: ["0vh", "100vh"],
                                    x: [null, (Math.random() - 0.5) * 50 + "px"]
                                }}
                                transition={{
                                    duration: 15 + Math.random() * 25,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: Math.random() * 10
                                }}
                                className="absolute w-[2px] h-[2px] bg-white/20 rounded-full"
                            />
                        ))}
                    </div>
                </div>

                {/* 2. MAIN SCENIC CONTENT */}
                <div className="flex-1 container mx-auto px-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10 pb-20">

                    {/* LEFT SIDE: 3D CAROUSEL (7 Cols) */}
                    <div className="lg:col-span-7 relative h-[55vh] flex flex-col items-center justify-center carousel-perspective">

                        <AnimatePresence initial={false}>
                            {products.map((p, index) => {
                                const style = getCardStyle(index);
                                if (style.opacity === 0) return null;

                                return (
                                    <motion.div
                                        key={p.product_id}
                                        onClick={() => handleSelect(index)}
                                        animate={{
                                            x: style.x,
                                            y: style.y,
                                            scale: style.scale,
                                            zIndex: style.zIndex,
                                            opacity: style.opacity,
                                            rotateY: style.rotateY,
                                            filter: style.filter
                                        }}
                                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                                        className={`absolute w-[300px] md:w-[380px] aspect-[4/5] flex items-center justify-center cursor-pointer ${activeIndex === index ? 'cursor-default' : 'hover:brightness-125'}`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <div className="relative w-full h-full group">
                                            {/* Outer Border / Frame */}
                                            <div className={`absolute inset-0 border rounded-[3rem] transition-all duration-700 ${activeIndex === index ? 'border-amber-500/20 scale-105' : 'border-white/5'}`} />

                                            {/* The Container */}
                                            <div className="w-full h-full bg-[#1A1A1C]/20 backdrop-blur-sm rounded-[2.8rem] flex items-center justify-center p-10 overflow-hidden relative">
                                                <img
                                                    src={Array.isArray(p.media_urls) ? p.media_urls[0] : (p.media_urls as any)}
                                                    alt={p.name}
                                                    className="w-full h-full object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover:scale-110"
                                                />

                                                {/* Active Box Extra Shine */}
                                                {activeIndex === index && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/[0.03] to-transparent animate-pulse" />
                                                )}
                                            </div>

                                            {/* Floor Shadow Refined */}
                                            {activeIndex === index && (
                                                <motion.div
                                                    layoutId="floor-shadow"
                                                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 h-16 bg-black/80 blur-[40px] rounded-full opacity-60 z-[-1]"
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* NAV INDICATORS (No Arrows) */}
                        <div className="absolute bottom-[-60px] flex items-center gap-3">
                            {products.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(i)}
                                    className={`h-1 transition-all duration-700 rounded-full ${activeIndex === i ? 'w-10 bg-amber-500/40' : 'w-2 bg-white/5 hover:bg-white/10'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE: ARCANE ARTIFACT CARD (5 Cols) */}
                    <div className="lg:col-span-12 lg:hidden h-24" /> {/* Spacer for mobile */}

                    <div className="lg:col-span-5 flex justify-center lg:justify-end">
                        <motion.div
                            key={product.product_id}
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="arcane-card w-full max-w-lg p-12 md:p-14 rounded-[3.5rem] relative group"
                        >
                            <div className="space-y-10">
                                <div className="space-y-4 pt-4">
                                    <div className="flex flex-col">
                                        <h2 className="text-4xl md:text-5xl font-luxury-serif text-white tracking-tighter uppercase leading-[0.85] drop-shadow-2xl">
                                            {product.name}
                                        </h2>
                                        <p className="font-mono-tag text-[10px] text-amber-500/60 tracking-[0.3em] uppercase mt-4">Arcane Series | Collection #04</p>
                                    </div>
                                    <p className="text-zinc-400 text-[11px] font-modern-sans italic mt-2 opacity-70 tracking-wide">
                                        "Witness the Unseen Mysteries"
                                    </p>
                                    <div className="w-12 h-[1px] bg-amber-500/20 my-6" />
                                    <div className="text-zinc-300 text-[13px] leading-relaxed opacity-90 font-light whitespace-pre-line overflow-y-auto max-h-[140px] custom-scrollbar pr-2 font-modern-sans">
                                        {product.description || "Extraction protocols ready. Waiting for user authorization to reveal the artifact sequence..."}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* STATUS & QUANTITY SELECTOR */}
                                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                        <div className="inline-flex items-center gap-3 px-3 py-1.5 border border-amber-500/20 bg-amber-500/[0.03] rounded-md">
                                            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-[9px] font-mono-tag text-amber-500/80 uppercase tracking-widest font-bold">In Archive</span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] font-mono-tag text-zinc-600 uppercase tracking-widest">Quantity</span>
                                            <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-xl p-1">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="quantity-btn"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <input
                                                    type="text"
                                                    value={quantity}
                                                    readOnly
                                                    className="quantity-input"
                                                />
                                                <button
                                                    onClick={() => setQuantity(Math.min(20, quantity + 1))}
                                                    className="quantity-btn"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-mono-tag text-zinc-600 uppercase tracking-[0.2em]">Acquisition Value</p>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-5xl font-light text-white tracking-tighter">
                                                {formatPrice(Number((product as any).product_blindboxes?.price || 0))}
                                            </span>
                                            <span className="text-[11px] font-mono-tag text-zinc-700 tracking-widest uppercase">VND</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsPrizePoolOpen(true)}
                                        className="h-16 border-white/5 bg-white/[0.02] text-zinc-400 font-mono-tag text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white/5 hover:text-white hover:border-white/10 transition-all font-medium"
                                    >
                                        Drop Rates
                                    </Button>
                                    <Button
                                        onClick={handleAcquire}
                                        className="h-16 btn-gold-gradient font-bold font-mono-tag text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:brightness-110 active:scale-95 transition-all"
                                    >
                                        Unbox Now
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>

                {/* MODAL: RARITY MANIFEST */}
                <AnimatePresence>
                    {isPrizePoolOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsPrizePoolOpen(false)}
                                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 35, stiffness: 250 }}
                                className="fixed bottom-0 left-0 right-0 z-[110] arcane-card rounded-t-[4rem] p-12 md:p-20 max-h-[90vh] overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-5xl mx-auto">
                                    <div className="flex justify-between items-start mb-20">
                                        <div className="space-y-3">
                                            <h3 className="text-5xl font-luxury-serif italic text-white leading-none tracking-tight">Yield Configuration</h3>
                                            <div className="flex items-center gap-4 text-zinc-600 font-mono-tag text-[10px] uppercase tracking-[0.3em] italic">
                                                <Zap className="w-4 h-4 text-amber-500/40" />
                                                <span>Encrypted Archive Probabilities</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsPrizePoolOpen(false)} className="group p-5 border border-white/5 rounded-full hover:bg-white/5 transition-all">
                                            <X className="w-6 h-6 text-zinc-700 group-hover:text-white" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
                                        {/* Visualization */}
                                        <div className="lg:col-span-5 relative aspect-square">
                                            <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-[100px] animate-pulse" />
                                            <div className="relative h-full w-full bg-[#1A1A1C]/30 border border-white/5 rounded-[3rem] flex items-center justify-center p-16">
                                                <Trophy className="w-40 h-40 text-amber-500/10 drop-shadow-[0_0_30px_rgba(212,175,55,0.1)]" />
                                            </div>
                                        </div>

                                        {/* Probability Table */}
                                        <div className="lg:col-span-7 space-y-12">
                                            {(() => {
                                                const bb = (product as any).product_blindboxes || {};
                                                const min = Number(bb.min_value || 0);
                                                const max = Number(bb.max_value || 0);
                                                const ticket = Number(bb.price || 0);
                                                const z1Upper = ticket * 0.9;
                                                const z2Upper = ticket * 1.3;
                                                const z3Upper = max * 0.9;

                                                return [
                                                    { tier: "Legendary (Jackpot)", rate: "1%", desc: `Ultimate artifact anomalies. Value up to ${formatPrice(max)}.`, color: "bg-amber-500/30" },
                                                    { tier: "Big Win", rate: "4%", desc: "High-value variants and exclusive editions.", color: "bg-zinc-500" },
                                                    { tier: "Fair Zone", rate: "60%", desc: "Consistent value. Matches acquisition cost.", color: "bg-zinc-600" },
                                                    { tier: "Common (Shop Profit)", rate: "35%", desc: "Standard archives. Stable construction quality.", color: "bg-zinc-800" }
                                                ].map((row, i) => (
                                                    <div key={i} className="group space-y-4">
                                                        <div className="flex justify-between items-end">
                                                            <div className="space-y-1">
                                                                <span className="text-zinc-600 font-mono-tag text-[10px] uppercase tracking-widest">{row.tier} Archive</span>
                                                                <p className="text-zinc-400 text-xs font-light max-w-xs">{row.desc}</p>
                                                            </div>
                                                            <span className="text-3xl font-luxury-serif italic text-white">{row.rate}</span>
                                                        </div>
                                                        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: row.rate }}
                                                                transition={{ duration: 1.5, delay: i * 0.2 }}
                                                                className={`h-full ${row.color}`}
                                                            />
                                                        </div>
                                                    </div>
                                                ));
                                            })()}

                                            <div className="pt-10 border-t border-white/5">
                                                <p className="text-[10px] text-zinc-600 font-mono-tag leading-relaxed opacity-60">
                                                    Extraction probability protocol is verified by Secure Cryptographic Randomization. Values are adjusted according to Archive Availability.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </CustomerLayout>
    );
}
