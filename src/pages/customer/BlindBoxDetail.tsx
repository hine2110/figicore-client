import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Countdown from 'react-countdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Zap,
    Trophy,
    Hourglass,
    Gift,
    ChevronRight,
    ShieldCheck,
    Truck,
    RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { Product, ProductBlindbox } from '@/types/product';
import CustomerLayout from '@/layouts/CustomerLayout';

// --- MOCK DATA FOR LIVE TICKER ---
const WINNERS = [
    { user: 'Alex_99', item: 'Golden Dragon (Legendary)', tier: 'LEGENDARY' },
    { user: 'Sarah.K', item: 'Cyber Ninja (Rare)', tier: 'RARE' },
    { user: 'Mike23', item: 'Mecha Soldier', tier: 'COMMON' },
    { user: 'J.Doe', item: 'Void Walker (Rare)', tier: 'RARE' },
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

    // --- TIME & STATUS LOGIC ---
    // Safely access start_time / end_time from product_blindboxes
    const blindbox = (product.product_blindboxes || {}) as Partial<ProductBlindbox>;
    // Ensure accurate Date parsing
    const now = new Date().getTime();
    const startTime = blindbox.start_time ? new Date(blindbox.start_time).getTime() : now;
    const endTime = blindbox.end_time ? new Date(blindbox.end_time).getTime() : (now + 86400000 * 7); // Default 7 days

    // Determine Phase
    /*
      PHASES:
      1. UPCOMING: now < startTime
      2. ACTIVE:   startTime <= now < endTime
      3. ENDED:    now >= endTime
    */

    const [phase, setPhase] = useState<'UPCOMING' | 'ACTIVE' | 'ENDED'>('ACTIVE');

    useEffect(() => {
        const checkPhase = () => {
            const current = new Date().getTime();
            if (current < startTime) setPhase('UPCOMING');
            else if (current >= endTime) setPhase('ENDED');
            else setPhase('ACTIVE');
        };
        checkPhase();
        const interval = setInterval(checkPhase, 1000); // Check every second
        return () => clearInterval(interval);
    }, [startTime, endTime]);


    // --- STOCK LOGIC ---
    // Calculate total stock from variants
    const totalStock = product.product_variants.reduce((acc, v) => acc + (v.stock_available || 0), 0);
    // Mock "Total Slots" for scarcity if not provided (e.g., assume 80% sold to create FOMO if totalStock is low)
    // Or just use real data if we had "initial_stock".
    // Let's SIMULATE scarcity:
    // If we assume standard set is 100, and current is X.
    const maxSlots = Math.max(100, totalStock * 1.5); // Mock max
    const soldSlots = maxSlots - totalStock;
    const soldPercentage = Math.min(100, Math.round((soldSlots / maxSlots) * 100));


    // --- LIVE TICKER EFFECT ---
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWinnerIndex(prev => (prev + 1) % WINNERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);


    // --- HANDLERS ---
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

    // --- RENDERERS ---
    const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
        if (completed) {
            // If checking UPCOMING -> ACTIVE
            if (phase === 'UPCOMING') return <span>Live Now!</span>;
            return <span>Ended</span>;
        }
        // Pad zeros
        const pad = (n: number) => String(n).padStart(2, '0');
        return (
            <div className="flex items-center gap-2 text-2xl md:text-4xl font-black font-mono tracking-widest text-[#00FF9C] drop-shadow-[0_0_10px_rgba(0,255,156,0.6)]">
                <div className="bg-black/50 px-2 rounded border border-[#00FF9C]/30">{pad(days * 24 + hours)}</div>
                <span className="animate-pulse">:</span>
                <div className="bg-black/50 px-2 rounded border border-[#00FF9C]/30">{pad(minutes)}</div>
                <span className="animate-pulse">:</span>
                <div className="bg-black/50 px-2 rounded border border-[#00FF9C]/30">{pad(seconds)}</div>
            </div>
        );
    };

    return (
        <CustomerLayout activePage="blindbox">
            {/* DARK / GAMING THEME CONTAINER */}
            <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-[#00FF9C] selection:text-black pb-20 overflow-x-hidden relative">

                {/* BACKGROUND EFFECTS */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#00FF9C]/10 blur-[150px] rounded-full animate-pulse delay-1000" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
                </div>

                {/* LIVE TICKER (Floating Bottom Left) */}
                <div className="fixed bottom-6 left-6 z-50 hidden md:block">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentWinnerIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xs">
                                {WINNERS[currentWinnerIndex].user[0]}
                            </div>
                            <div className="text-sm">
                                <p className="font-bold text-slate-200">
                                    <span className="text-[#00FF9C]">{WINNERS[currentWinnerIndex].user}</span> just pulled
                                </p>
                                <p className={cn(
                                    "font-bold text-xs uppercase tracking-wider",
                                    WINNERS[currentWinnerIndex].tier === 'LEGENDARY' ? "text-amber-400 drop-shadow-md" :
                                        WINNERS[currentWinnerIndex].tier === 'RARE' ? "text-purple-400" : "text-slate-400"
                                )}>
                                    {WINNERS[currentWinnerIndex].item}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>


                {/* MAIN CONTENT */}
                <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">

                    {/* BREADCRUMBS */}
                    <div className="flex items-center gap-2 text-xs md:text-sm mb-8 text-slate-500 font-mono uppercase tracking-wider">
                        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/customer/home')}>Home</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/customer/blindbox')}>Blind Box</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#00FF9C] font-bold">{product.name}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                        {/* LEFT: HERO IMAGE / MYSTERY BOX */}
                        <div className="relative group">
                            {/* "Rarity" Glow behind image */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-[#00FF9C]/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-700" />

                            <motion.div
                                animate={phase === 'ACTIVE' ? { y: [0, -15, 0] } : {}}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="relative aspect-[4/5] bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10"
                            >
                                {/* Main Image */}
                                <img
                                    src={Array.isArray(product.media_urls) ? product.media_urls[0] : (typeof product.media_urls === 'string' ? product.media_urls : '')}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

                                {/* Floating Badge */}
                                <div className="absolute top-6 right-6">
                                    <Badge className="bg-[#00FF9C] text-black hover:bg-[#00FF9C] border-0 px-3 py-1 text-xs font-black tracking-widest uppercase shadow-[0_0_20px_#00FF9C]">
                                        Mystery Box
                                    </Badge>
                                </div>
                            </motion.div>
                        </div>


                        {/* RIGHT: INFO & ACTIONS */}
                        <div className="space-y-8 pt-4">

                            {/* TITLE & PRICE */}
                            <div className="space-y-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 mb-2"
                                >
                                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                                    <span className="text-amber-400 font-bold tracking-widest text-xs uppercase">Limited Edition Series</span>
                                </motion.div>

                                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
                                    {product.name}
                                </h1>

                                <div className="flex items-baseline gap-4 pt-2">
                                    <span className="text-5xl font-black text-[#00FF9C] drop-shadow-[0_0_15px_rgba(0,255,156,0.4)]">
                                        {formatPrice(Number(blindbox.price || 0))}
                                    </span>
                                    <span className="text-slate-500 font-mono text-lg line-through decoration-red-500 decoration-2">
                                        {/* Mock Higher Price logic for FOMO? Or just omit base price */}
                                        {formatPrice(Number(blindbox.price || 0) * 1.5)}
                                    </span>
                                </div>
                            </div>


                            {/* COUNTDOWN & STOCK (The "Urgency" Module) */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur-md">

                                {/* Countdown Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                                        <Hourglass className="w-4 h-4 text-[#00FF9C]" />
                                        {phase === 'UPCOMING' ? 'Dropping In' : phase === 'ACTIVE' ? 'Ending In' : 'Event Status'}
                                    </div>
                                    {phase === 'ACTIVE' && (
                                        <div className="flex items-center gap-1.5 ">
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                            </span>
                                            <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Selling Fast</span>
                                        </div>
                                    )}
                                </div>

                                {/* COUNTDOWN */}
                                {phase !== 'ENDED' ? (
                                    <Countdown
                                        date={phase === 'UPCOMING' ? startTime : endTime}
                                        renderer={renderer}
                                    />
                                ) : (
                                    <div className="text-3xl font-black text-red-500 uppercase">SOLD OUT / ENDED</div>
                                )}


                                {/* STOCK PROGRESS BAR */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                                        <span>Total Stock</span>
                                        <span>{soldSlots} / {maxSlots} Claimed</span>
                                    </div>
                                    <div className="relative h-4 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${soldPercentage}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-pink-500 to-[#00FF9C]"
                                        />
                                        {/* Striped pattern overlay */}
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.2)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50" />
                                    </div>
                                    <p className="text-xs text-right text-slate-500 font-mono">
                                        {phase === 'ACTIVE' ? "Hurry! Stock is volatile." : "Prepare your wallets."}
                                    </p>
                                </div>
                            </div>


                            {/* ACTION BUTTON */}
                            <div className="pt-2">
                                <motion.div
                                    whileHover={phase === 'ACTIVE' ? { scale: 1.02 } : {}}
                                    whileTap={phase === 'ACTIVE' ? { scale: 0.98 } : {}}
                                >
                                    <Button
                                        size="lg"
                                        onClick={handleBuy}
                                        disabled={phase !== 'ACTIVE' || totalStock <= 0}
                                        className={cn(
                                            "w-full h-20 text-2xl font-black italic uppercase tracking-wider rounded-xl transition-all duration-300 relative overflow-hidden group",
                                            phase === 'ACTIVE'
                                                ? "bg-[#00FF9C] text-black hover:bg-[#00FF9C] hover:shadow-[0_0_40px_rgba(0,255,156,0.6)]"
                                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                        )}
                                    >
                                        {/* Shimmer Effect */}
                                        {phase === 'ACTIVE' && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] translate-x-[-200%] animate-[shimmer_2s_infinite]" />
                                        )}

                                        <div className="relative z-10 flex flex-col items-center leading-none gap-1">
                                            {phase === 'UPCOMING' ? (
                                                <span>Coming Soon</span>
                                            ) : phase === 'ENDED' || totalStock <= 0 ? (
                                                <span>Sold Out</span>
                                            ) : (
                                                <>
                                                    <span className="flex items-center gap-3">
                                                        OPEN NOW <Zap className="w-6 h-6 fill-black" />
                                                    </span>
                                                    <span className="text-xs font-bold tracking-[0.2em] opacity-80">Test Your Luck</span>
                                                </>
                                            )}
                                        </div>
                                    </Button>
                                </motion.div>
                            </div>

                            {/* TIER SHOWCASE (What you can win) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-lg font-bold uppercase tracking-wider text-white">Prize Pool</h3>
                                </div>
                                <div className="grid gap-3">
                                    {/* MOCK TIERS if no real config, or map variants if they have tier info */}
                                    {/* Since backend logic puts tiers in variants or config, let's visualize the STRUCTURE requested */}

                                    {/* Legendary Tier */}
                                    <div className="relative overflow-hidden bg-gradient-to-r from-amber-900/40 to-black border border-amber-500/50 p-4 rounded-xl flex items-center justify-between group cursor-default hover:border-amber-400 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-xl">
                                                ?
                                            </div>
                                            <div>
                                                <div className="text-amber-400 font-bold uppercase tracking-wider text-sm">Legendary <span className="text-xs opacity-70 ml-2">5% Chance</span></div>
                                                <div className="text-slate-300 text-xs">Values up to {formatPrice(Number(blindbox.max_value || 0))}</div>
                                            </div>
                                        </div>
                                        <Gift className="w-6 h-6 text-amber-400 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                    </div>

                                    {/* Rare Tier */}
                                    <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 to-black border border-purple-500/50 p-4 rounded-xl flex items-center justify-between group cursor-default hover:border-purple-400 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-black text-xl">
                                                ?
                                            </div>
                                            <div>
                                                <div className="text-purple-400 font-bold uppercase tracking-wider text-sm">Rare <span className="text-xs opacity-70 ml-2">20% Chance</span></div>
                                                <div className="text-slate-300 text-xs">Exclusive variants</div>
                                            </div>
                                        </div>
                                        <Gift className="w-6 h-6 text-purple-400 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                    </div>

                                    {/* Common Tier */}
                                    <div className="relative overflow-hidden bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 font-black text-xl">
                                                ?
                                            </div>
                                            <div>
                                                <div className="text-slate-300 font-bold uppercase tracking-wider text-sm">Common <span className="text-xs opacity-70 ml-2">75% Chance</span></div>
                                                <div className="text-slate-500 text-xs">Standard edition</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TRUST SIGNALS (Dark Mode) */}
                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                                {[
                                    { icon: ShieldCheck, label: "Provably Fair" },
                                    { icon: Truck, label: "Instant Reveal" },
                                    { icon: RefreshCcw, label: "Detailed Logs" }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center gap-2 text-center group cursor-default">
                                        <div className="p-2 rounded-full bg-white/5 text-slate-400 group-hover:bg-[#00FF9C]/20 group-hover:text-[#00FF9C] transition-colors">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 group-hover:text-slate-300 transition-colors">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes shimmer {
                        100% {
                            transform: translateX(200%) skewX(-20deg);
                        }
                    }
                `}</style>
            </div>
        </CustomerLayout>
    );
}
