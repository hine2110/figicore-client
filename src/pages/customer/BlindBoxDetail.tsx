import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Countdown from 'react-countdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Zap,
    Trophy,
    Hourglass,
    ChevronRight,
    ShieldCheck,
    Truck,
    RefreshCcw,
    X,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { Product, ProductBlindbox } from '@/types/product';
import CustomerLayout from '@/layouts/CustomerLayout';

const WINNERS = [
    { user: 'Alex_99', item: 'Golden Dragon', tier: 'LEGENDARY' },
    { user: 'Sarah.K', item: 'Cyber Ninja', tier: 'RARE' },
    { user: 'Mike23', item: 'Mecha Soldier', tier: 'COMMON' },
    { user: 'J.Doe', item: 'Void Walker', tier: 'RARE' },
];

interface BlindBoxDetailProps {
    product: Product;
    onAddToCart: (qty: number) => void;
    formatPrice: (price: number) => string;
}

export default function BlindBoxDetail({ product, onAddToCart, formatPrice }: BlindBoxDetailProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [quantity] = useState(1);
    const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);

    const blindbox = (product.product_blindboxes || {}) as Partial<ProductBlindbox>;
    const now = new Date().getTime();
    const startTime = blindbox.start_time ? new Date(blindbox.start_time).getTime() : now;
    const endTime = blindbox.end_time ? new Date(blindbox.end_time).getTime() : (now + 86400000 * 7);

    const [phase, setPhase] = useState<'UPCOMING' | 'ACTIVE' | 'ENDED'>('ACTIVE');

    useEffect(() => {
        const checkPhase = () => {
            const current = new Date().getTime();
            if (current < startTime) setPhase('UPCOMING');
            else if (current >= endTime) setPhase('ENDED');
            else setPhase('ACTIVE');
        };
        checkPhase();
        const interval = setInterval(checkPhase, 1000);
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    const totalStock = product.product_variants.reduce((acc, v) => acc + (v.stock_available || 0), 0);
    const maxSlots = Math.max(100, totalStock * 1.5);
    const soldSlots = maxSlots - totalStock;
    const soldPercentage = Math.min(100, Math.round((soldSlots / maxSlots) * 100));

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWinnerIndex(prev => (prev + 1) % WINNERS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleBuy = () => {
        if (phase === 'UPCOMING') {
            toast({ title: "Wait for the drop!", description: "This blindbox hasn't started yet.", variant: "default" });
            return;
        }
        if (phase === 'ENDED') {
            toast({ title: "Ended", description: "This event has ended.", variant: "destructive" });
            return;
        }
        onAddToCart(quantity);
    };

    const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
        if (completed) return <span className="text-zinc-500">Event Ended</span>;
        const pad = (n: number) => String(n).padStart(2, '0');
        return (
            <div className="flex items-center gap-4 text-3xl md:text-5xl font-light font-modern-sans tracking-tight text-white">
                <div className="flex flex-col items-center">
                    <span className="text-white">{pad(days * 24 + hours)}</span>
                    <span className="text-[9px] font-mono-tag text-zinc-600 uppercase tracking-widest mt-1">Hrs</span>
                </div>
                <span className="text-zinc-800 pb-5">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-white">{pad(minutes)}</span>
                    <span className="text-[9px] font-mono-tag text-zinc-600 uppercase tracking-widest mt-1">Min</span>
                </div>
                <span className="text-zinc-800 pb-5">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-amber-500/80">{pad(seconds)}</span>
                    <span className="text-[9px] font-mono-tag text-zinc-600 uppercase tracking-widest mt-1">Sec</span>
                </div>
            </div>
        );
    };

    return (
        <CustomerLayout activePage="blindbox">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
                
                .font-luxury-serif { font-family: 'Playfair Display', serif; }
                .font-modern-sans { font-family: 'Inter', sans-serif; }
                .font-mono-tag { font-family: 'JetBrains Mono', monospace; }

                .artifact-glow {
                    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
                }

                .pedestal-line {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent);
                }
            `}</style>

            <div className="min-h-screen bg-[#0A0A0B] text-white font-modern-sans selection:bg-amber-500/30 pb-20 overflow-x-hidden relative">

                {/* BACKGROUND LAYER */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full opacity-30" />
                    <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full opacity-30" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                {/* LIVE TICKER (Floating Bottom Left) */}
                <div className="fixed bottom-10 left-10 z-50 hidden lg:block">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentWinnerIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-l-amber-500/30 border-l-2"
                        >
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-mono-tag text-[10px] text-amber-500/80">
                                {WINNERS[currentWinnerIndex].user[0]}
                            </div>
                            <div className="text-[11px] font-mono-tag tracking-tight">
                                <p className="text-zinc-500 uppercase mb-0.5">Extraction Protocol Successful</p>
                                <p className="text-white">
                                    <span className="text-amber-500/80">{WINNERS[currentWinnerIndex].user}</span> acquired <span className="italic">{WINNERS[currentWinnerIndex].item}</span>
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* MAIN CONTENT */}
                <div className="container mx-auto px-6 py-12 relative z-10 max-w-7xl">

                    {/* BREADCRUMBS */}
                    <div className="flex items-center gap-4 text-[10px] font-mono-tag uppercase tracking-[0.2em] mb-12 text-zinc-600">
                        <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/customer/home')}>Home</span>
                        <ChevronRight className="w-3 h-3 opacity-30" />
                        <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/customer/blindbox')}>Vault</span>
                        <ChevronRight className="w-3 h-3 opacity-30" />
                        <span className="text-amber-500/60 italic">{product.name} Artifact</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">

                        {/* LEFT: ARTIFACT SHOWCASE */}
                        <div className="relative">
                            <div className="absolute inset-0 artifact-glow z-0" />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1 }}
                                className="relative aspect-[4/5] bg-black/20 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm z-10 group"
                            >
                                <img
                                    src={Array.isArray(product.media_urls) ? product.media_urls[0] : product.media_urls}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-12 transition-transform duration-1000 group-hover:scale-110 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-60" />
                                
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-[1px] pedestal-line opacity-50" />
                            </motion.div>
                        </div>

                        {/* RIGHT: DATA & EXTRACTION */}
                        <div className="space-y-12">

                            {/* TITLE BLOCK */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-4 h-4 text-amber-500/50" />
                                    <span className="text-amber-500/50 font-mono-tag text-[9px] uppercase tracking-[0.4em]">Classified Series Collection</span>
                                </div>

                                <h1 className="text-5xl md:text-7xl font-luxury-serif italic text-white leading-[1.1]">
                                    {product.name}
                                </h1>

                                <div className="flex items-baseline gap-6 pt-2">
                                    <span className="text-5xl font-light text-white tracking-tighter">
                                        {formatPrice(Number(blindbox.price || 0))}
                                    </span>
                                    <span className="text-zinc-700 font-mono-tag text-xs tracking-tighter uppercase">VND • Secure Value</span>
                                </div>
                            </div>

                            {/* DROP TIMER & STATUS */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-8 backdrop-blur-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-[10px] font-mono-tag uppercase tracking-widest text-zinc-500">
                                        <Hourglass className="w-4 h-4 text-amber-500/40" />
                                        {phase === 'UPCOMING' ? 'Drop Sequence Initiating' : phase === 'ACTIVE' ? 'Time Remaining' : 'Vault Status'}
                                    </div>
                                    {phase === 'ACTIVE' && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-amber-500/80 text-[10px] font-mono-tag uppercase tracking-widest">Active Drop</span>
                                        </div>
                                    )}
                                </div>

                                <div className="py-2">
                                    {phase !== 'ENDED' ? (
                                        <Countdown
                                            date={phase === 'UPCOMING' ? startTime : endTime}
                                            renderer={renderer}
                                        />
                                    ) : (
                                        <div className="text-3xl font-luxury-serif italic text-zinc-700">Vault Depleted</div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-mono-tag uppercase tracking-[0.2em] text-zinc-600">
                                        <span>Inventory Levels</span>
                                        <span className="text-zinc-400">{soldSlots} / {maxSlots} Units Claimed</span>
                                    </div>
                                    <div className="h-[1px] bg-zinc-900 w-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${soldPercentage}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-amber-500/40"
                                        />
                                    </div>
                                    <p className="text-[9px] text-zinc-600 font-mono-tag italic">
                                        High demand detected. Availability is non-guaranteed.
                                    </p>
                                </div>
                            </div>

                            {/* EXTRACTION BUTTON */}
                            <div className="pt-4">
                                <Button
                                    size="lg"
                                    onClick={handleBuy}
                                    disabled={phase !== 'ACTIVE' || totalStock <= 0}
                                    className={cn(
                                        "w-full h-20 text-[11px] font-bold uppercase tracking-[0.3em] rounded-full transition-all duration-500",
                                        phase === 'ACTIVE'
                                            ? "bg-white text-black hover:bg-zinc-200 shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-[0.98]"
                                            : "bg-zinc-900 text-zinc-700 border border-white/5 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        {phase === 'UPCOMING' ? 'Wait for Signal' : phase === 'ENDED' || totalStock <= 0 ? 'Archive Closed' : (
                                            <>
                                                SECURE ARTIFACT <Zap className="w-4 h-4 fill-black" />
                                            </>
                                        )}
                                    </div>
                                </Button>
                            </div>

                            {/* RARITY SPECTRUM */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-4 h-4 text-zinc-600" />
                                    <h3 className="text-[10px] font-mono-tag uppercase tracking-[0.3em] text-zinc-400">Yield Configuration</h3>
                                </div>
                                <div className="grid gap-4">
                                    {(() => {
                                        const min = Number(blindbox.min_value || 0);
                                        const max = Number(blindbox.max_value || 0);
                                        const ticket = Number(blindbox.price || 0);
                                        const z1Upper = ticket * 0.9;
                                        const z2Upper = ticket * 1.3;
                                        const z3Upper = max * 0.9;

                                        return [
                                            { tier: "Legendary (Jackpot)", odds: "1%", val: `MAX: ${formatPrice(max)}`, color: "border-amber-500/30 text-amber-200/60" },
                                            { tier: "Big Win", odds: "4%", val: `${formatPrice(Math.max(z2Upper, min))} - ${formatPrice(Math.max(z2Upper, z3Upper))}`, color: "border-white/20 text-white/50" },
                                            { tier: "Fair Zone", odds: "60%", val: "NEAR TICKET VALUE", color: "border-white/10 text-white/40" },
                                            { tier: "Common (Shop Profit)", odds: "35%", val: "STABLE EDITIONS", color: "border-white/5 text-zinc-600" }
                                        ].map((t, idx) => (
                                            <div key={idx} className={cn(
                                                "border p-5 rounded-2xl flex items-center justify-between group transition-all duration-500",
                                                t.color
                                            )}>
                                                <div className="flex items-center gap-5">
                                                    <div className="text-[10px] font-mono-tag uppercase tracking-[0.2em]">{t.tier}</div>
                                                    <div className="w-[1px] h-4 bg-white/5" />
                                                    <div className="text-[9px] font-mono-tag uppercase tracking-widest">{t.odds} Drop Rate</div>
                                                </div>
                                                <div className="text-[9px] font-mono-tag uppercase tracking-widest italic">{t.val}</div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* COMPLIANCE SIGNALS */}
                            <div className="grid grid-cols-3 gap-8 pt-10 border-t border-white/5">
                                {[
                                    { icon: ShieldCheck, label: "VERIFIED ODDS" },
                                    { icon: Truck, label: "SECURE LOGISTICS" },
                                    { icon: RefreshCcw, label: "DIRECT MINT" }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 text-center opacity-40 hover:opacity-100 transition-opacity cursor-default">
                                        <item.icon className="w-4 h-4 text-zinc-500" />
                                        <span className="text-[8px] font-mono-tag uppercase tracking-[0.2em]">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
