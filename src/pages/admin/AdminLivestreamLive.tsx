import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LiveKitRoom,
    useLocalParticipant,
    useTracks,
    VideoTrack,
    TrackReference,
    useRemoteParticipants,
    useMediaDeviceSelect,
    useConnectionState,
    useRoomContext
} from '@livekit/components-react';
import { Track, VideoPresets, VideoCodec } from 'livekit-client';
import '@livekit/components-styles';
import {
    Activity,
    Globe,
    Signal,
    MoreHorizontal,
    Monitor,
    Maximize2,
    Minimize2,
    Volume2,
    Loader2,
    ArrowLeft,
    Users,
    VideoOff,
    MonitorPlay,
    Zap,
    Power,
    ShoppingBag,
    Tag,
    Share2,
    Package,
    ShoppingCart,
    Heart,
    Flame,
    Megaphone,
    X,
    Plus,
    LayoutGrid,
    TrendingUp,
    UserMinus,
    UserX,
    MessageSquare,
    Anchor,
    History,
    RefreshCw,
    Sparkles,
    AlertTriangle,
    Gift,
    Play,
    RotateCw,
    Trophy,
    Crown,
    Settings,
    Maximize,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { productsService } from '@/services/products.service';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { livestreamsService } from '@/services/livestreams.service';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Utilities ──
const getUserColor = (name: string) => {
    const colors = [
        'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400',
        'text-fuchsia-400', 'text-indigo-400', 'text-sky-400', 'text-teal-400'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const formatPriceShort = (p: number | string | undefined | null) => {
    const value = Number(p);
    if (isNaN(value)) return { amount: '0', currency: 'đ' };
    const parts = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).formatToParts(value);
    const amountStr = parts.filter(p => p.type !== 'currency').map(p => p.value).join('').trim();
    return { amount: amountStr, currency: 'đ' };
};

const formatPrice = (p: number | string | undefined | null) => {
    const value = Number(p);
    if (isNaN(value)) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// ── Live Pricing Priority Logic ──
const computeLivePrice = (basePrice: number | string | undefined | null, flashSalePrice?: number | string | null): number => {
    const base = Number(basePrice) || 0;
    const flash = Number(flashSalePrice) || 0;
    if (flash > 0) return flash;
    return Math.round(base * 0.98); // -2% for Live
};

// ── Components ──

const StatusBadge = memo(({ isLive }: { isLive: boolean }) => (
    <div className={`flex items-center gap-2 pr-3 pl-1.5 py-0.5 rounded-full border ${isLive ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-rose-500 animate-pulse' : 'bg-neutral-600'}`} />
        <span className="text-[9px] font-black uppercase tracking-widest">{isLive ? 'Transmission Live' : 'Standby'}</span>
    </div>
));

const StreamTimer = memo(({ startTime }: { startTime?: string }) => {
    const [duration, setDuration] = useState("00:00:00");

    useEffect(() => {
        if (!startTime) return;
        const start = new Date(startTime).getTime();
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = now - start;
            if (diff < 0) return;

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setDuration([
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':'));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
            <History className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-mono font-black text-emerald-500">{duration}</span>
        </div>
    );
});

const PinnedProductPriceCard = memo(({ product, livestreamId }: { product: any, livestreamId?: number }) => {
    if (!product) return (
        <div className="bg-[#1a1b23] border border-dashed border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-neutral-600 min-h-[140px]">
            <Tag className="w-8 h-8 opacity-10 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-center">No Active<br />Focus Item</span>
        </div>
    );

    const variantData = product.product_variants || product;
    const basePrice = Number(variantData.price) || 0;
    const livePrice = computeLivePrice(basePrice, product.flash_sale_price);
    const { amount, currency } = formatPriceShort(livePrice);
    const displayName = variantData.products?.name || variantData.option_name || variantData.name || 'Unknown Product';

    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/50 via-emerald-400/20 to-emerald-500/50 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#1a1b23] border border-white/5 rounded-2xl p-5 flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Live Pinned Item</span>
                    <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[7px] font-black text-rose-500 uppercase tracking-widest animate-pulse">🔴 Live -2%</div>
                </div>
                <h3 className="text-xs font-black text-white uppercase truncate mb-3" title={displayName}>{displayName}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-500 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        {amount}
                    </span>
                    <span className="text-xl font-black text-emerald-500/60 ">{currency}</span>
                    <span className="text-[9px] text-neutral-600 line-through font-mono ml-auto">{formatPrice(basePrice)}</span>
                </div>
                <div className="absolute top-4 right-4 animate-pulse">
                    <Tag className="w-4 h-4 text-emerald-500/30" />
                </div>
            </div>
        </div>
    );
});

const StatTile = memo(function StatTile({ label, value, icon: Icon, trend }: { label: string, value: any, icon: any, trend?: string }) {
    return (
        <div className="bg-[#111218] border border-white/5 rounded-xl p-4 flex flex-col gap-1 transition-all hover:bg-white/5 group">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
                <Icon className="w-3 h-3 group-hover:text-white transition-colors" />
                {label}
            </div>
            <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-neutral-200 font-mono">{value}</span>
                {trend && <span className="text-[7px] font-black text-emerald-500 ml-2 animate-pulse">{trend}</span>}
            </div>
        </div>
    );
});

const LiveInventoryLog = memo(({
    products,
    onAdd,
    onPin,
    onRemove,
    onFlashSale,
    onFocus,
    onRestock,
    focusedId,
    pinnedId
}: {
    products: any[],
    onAdd: any,
    onPin: any,
    onRemove: any,
    onFlashSale: any,
    onFocus: (id: number) => void,
    onRestock: (id: number, amt: number) => void,
    focusedId?: number,
    pinnedId?: number
}) => {
    const sortedProducts = useMemo(() => {
        if (!products) return [];
        return [...products].sort((a, b) => {
            if (a.variant_id === pinnedId) return -1;
            if (b.variant_id === pinnedId) return 1;
            return 0;
        });
    }, [products, pinnedId]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-emerald-500">
                <LayoutGrid className="w-3 h-3" />
                Inventory
                <span className="ml-auto text-neutral-600 font-mono">{products?.length || 0} active</span>
                {onAdd}
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto scrollbar-none pr-1 pb-10">
                {sortedProducts.map((p: any, idx: number) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className={`group relative flex flex-col rounded-3xl border transition-all duration-500 overflow-hidden ${pinnedId === p.variant_id ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'bg-white/[0.03] backdrop-blur-md border-white/5 hover:bg-white/5 hover:border-white/10 hover:shadow-2xl'}`}
                    >
                        {/* Top Section: Media & Primary Info */}
                        <div className="p-4 flex gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/5 p-1.5 shrink-0 overflow-hidden relative shadow-inner">
                                <img src={p.product_variants?.media_assets?.[0]?.url || "/placeholder.png"} className="w-full h-full object-contain opacity-90 transition-transform duration-700 group-hover:scale-110" alt="" />
                                {pinnedId === p.variant_id && (
                                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center animate-pulse">
                                        <Tag className="w-6 h-6 text-amber-500" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col min-w-0 justify-center">
                                <h3 className="text-[10px] font-black text-white leading-tight uppercase italic tracking-tighter mb-1 break-words group-hover:text-amber-400 transition-colors">
                                    {p.product_variants?.products?.name || p.product_variants?.option_name || 'Unknown Product'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-neutral-500 uppercase px-2 py-0.5 bg-white/5 rounded-full">{p.product_variants?.option_name}</span>
                                    <span className="text-[7px] font-mono text-neutral-600 uppercase">SKU: {p.product_variants?.sku?.slice(-6) || '---'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Stats row + Button row (separate to avoid layout shift) */}
                        <div className="px-4 pb-4 flex flex-col gap-2">
                            {/* Stats Row */}
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[6px] font-black uppercase text-neutral-600 tracking-widest leading-none mb-0.5">Live Price (-2%)</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-black text-emerald-500 font-mono drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] truncate">
                                            {formatPrice(computeLivePrice(p.product_variants?.price, p.flash_sale_price))}
                                        </span>
                                        <span className="text-[7px] text-neutral-600 line-through font-mono opacity-50">
                                            {formatPrice(p.product_variants?.price)}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-px h-5 bg-white/5 mx-1 shrink-0" />
                                <div className="flex flex-col shrink-0 text-right">
                                    <span className="text-[6px] font-black uppercase text-neutral-600 tracking-widest leading-none mb-0.5">{Number(p.flash_sale_price) > 0 ? 'Flash Stock' : 'Stock'}</span>
                                    <span className={`text-[11px] font-black font-mono ${(Number(p.flash_sale_price) > 0 ? p.flash_sale_stock : p.product_variants?.stock_available) < 10 ? 'text-rose-500' : 'text-neutral-300'}`}>
                                        {Number(p.flash_sale_price) > 0 ? p.flash_sale_stock : p.product_variants?.stock_available}
                                    </span>
                                </div>
                            </div>

                            {/* Control Bar — always full-width, never squished */}
                            <div className="flex items-center justify-end gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5 shadow-inner w-full">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`w-8 h-8 rounded-xl transition-all ${pinnedId === p.variant_id ? 'bg-amber-500 text-white' : 'hover:bg-amber-500/20 text-amber-500'}`}
                                    onClick={() => onPin(p.variant_id)}
                                    title="Pin to Screen"
                                >
                                    <Tag className="w-3.5 h-3.5" />
                                </Button>
                                <FlashSaleTrigger
                                    variant={p.product_variants}
                                    onTrigger={(price: number, stock: number) => onFlashSale(p.variant_id, price, stock)}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-8 h-8 rounded-xl hover:bg-rose-500/20 text-rose-500 transition-all"
                                    onClick={() => onRemove(p.variant_id)}
                                    title="Remove from list"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {!products?.length && (
                    <div className="py-12 text-center opacity-10">
                        <Package className="w-10 h-10 mx-auto mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Depleted</span>
                    </div>
                )}
            </div>
        </div>
    );
});

const PostLiveReportModal = ({ isOpen, data, onConfirm }: { isOpen: boolean, data: any, onConfirm: () => void }) => (
    <Dialog open={isOpen} onOpenChange={() => { }}>
        <DialogContent className="bg-[#0f1015] border-white/10 rounded-[2.5rem] max-w-md p-0 overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.15)]">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150"></div>
                </div>
                <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md mx-auto mb-4 flex items-center justify-center shadow-2xl border border-white/30 rotate-3">
                    <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Transmission Report</h2>
                <p className="text-emerald-100/60 text-[8px] font-mono uppercase tracking-[0.3em] mt-1">Status: Success • Verified</p>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-center">
                        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1 block">Total Revenue</span>
                        <span className="text-xl font-black text-emerald-500 font-mono tracking-tighter">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data?.revenue || 0)}</span>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-center">
                        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1 block">Orders Confirmed</span>
                        <span className="text-xl font-black text-white font-mono tracking-tighter">{data?.orderCount || 0}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                        <ShoppingBag className="w-3 h-3 text-emerald-500" />
                        Top Performing Asset
                    </div>
                    <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase italic truncate max-w-[200px]">{data?.topProduct || 'N/A'}</span>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest">Best Seller</div>
                    </div>
                </div>

                <Button
                    onClick={onConfirm}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-[0.2em] h-14 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all"
                >
                    Dismiss & Sync Studio
                </Button>
            </div>
        </DialogContent>
    </Dialog>
);

const SystemHealth = memo(() => {
    const remoteParticipants = useRemoteParticipants();
    const room = useRoomContext();
    const connectionState = useConnectionState(room);

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'connected': return 'text-emerald-500';
            case 'reconnecting': return 'text-amber-500';
            case 'disconnected': return 'text-rose-500';
            default: return 'text-neutral-500';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-blue-500">
                <Activity className="w-3 h-3" />
                Transmission Health
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter">Stability</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(connectionState)}`}>
                        <span className={`w-1 h-1 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
                        {connectionState === 'connected' ? 'Optimized' : 'Fallback'}
                    </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="text-neutral-600 uppercase">Latency</span>
                    <span className="text-neutral-400 uppercase">24ms (WebRTC)</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="text-neutral-600 uppercase">Audience</span>
                    <span className="text-neutral-400 uppercase">{remoteParticipants.length} Synchronized</span>
                </div>
            </div>
        </div>
    );
});

const PublicLuckyWheel = memo(({
    participants,
    winnerId,
    onClose,
    title = "Giveaway Draw"
}: {
    participants: { userId: number, name: string }[],
    winnerId?: number,
    onClose?: () => void,
    title?: string
}) => {
    const [isSpinning, setIsSpinning] = useState(true);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (!winnerId) {
            const interval = setInterval(() => setRotation(r => r + 45), 100);
            return () => clearInterval(interval);
        } else {
            setIsSpinning(false);
            setRotation(360 * 5 + 90);

            const duration = 3000;
            const end = Date.now() + duration;
            const frame = () => {
                const conf = document.createElement('div');
                conf.style.position = 'absolute';
                conf.style.left = Math.random() * 100 + '%';
                conf.style.top = '-10%';
                conf.style.width = '10px';
                conf.style.height = '10px';
                conf.style.backgroundColor = ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6'][Math.floor(Math.random() * 4)];
                conf.style.transition = 'all 2s ease-in';
                document.body.appendChild(conf);

                requestAnimationFrame(() => {
                    conf.style.top = '110%';
                    conf.style.transform = `rotate(${Math.random() * 360}deg)`;
                });

                setTimeout(() => conf.remove(), 2000);
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
        }
    }, [winnerId]);

    const winnerName = (participants || []).find(p => p.userId === winnerId)?.name || 'Someone';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative bg-[#0f1015] border border-white/10 p-12 rounded-[3.5rem] shadow-[0_0_120px_rgba(245,158,11,0.25)] flex flex-col items-center max-w-lg w-full overflow-hidden"
            >
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[120px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[100px] translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none" />

                {onClose && (
                    <button 
                        onClick={onClose} 
                        className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-xl z-20"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
                
                <div className="text-center mb-10 relative z-10">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">{title}</h2>
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-3" />
                    <p className="text-amber-500/80 font-mono text-xs font-black tracking-[0.3em] uppercase animate-pulse">
                        {isSpinning ? 'Selecting Lucky Winner...' : 'Target Identified'}
                    </p>
                </div>

                <div className="relative w-72 h-72 mb-12">
                    {/* Indicator Arrow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-5 z-20">
                        <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[24px] border-l-transparent border-r-transparent border-t-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-bounce"></div>
                    </div>
                    
                    <motion.div 
                        animate={{ rotate: rotation }}
                        transition={winnerId ? { duration: 4, type: 'spring', bounce: 0.25 } : { ease: "linear", duration: 0.5, repeat: Infinity }}
                        className="w-full h-full rounded-full border-4 border-amber-500/30 overflow-hidden relative shadow-[0_0_60px_rgba(245,158,11,0.2)] bg-[#1a1b23] group-hover:border-amber-500/50 transition-colors"
                    >
                        {(!participants || participants.length === 0) ? (
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-600 text-[10px] font-black uppercase tracking-widest italic font-outfit">Awaiting Participants</div>
                        ) : (
                            participants.map((p, i) => {
                                const angle = (360 / participants.length) * i;
                                const colors = ['#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];
                                const color = colors[i % colors.length];
                                
                                return (
                                    <div 
                                        key={p.userId}
                                        className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left border-l border-white/20"
                                        style={{ 
                                            transform: `rotate(${angle}deg)`,
                                            backgroundColor: color,
                                            clipPath: `polygon(0 100%, 100% 100%, 100% 0)` // Triangle segment
                                        }}
                                    >
                                        <div 
                                            className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px] drop-shadow-md" 
                                            style={{ 
                                                transform: `rotate(${90 + (360/participants.length)/2}deg) translate(40px, -15px)`,
                                                transformOrigin: '0 0'
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </motion.div>
                    
                    {/* Inner Hub */}
                    <div className="absolute inset-0 m-auto w-16 h-16 bg-[#0f1015] border-4 border-amber-500/40 rounded-full z-10 flex items-center justify-center shadow-inner relative group">
                        <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                        <Gift className="w-6 h-6 text-amber-500 relative z-10" />
                    </div>
                </div>

                <AnimatePresence>
                    {!isSpinning && winnerId && (
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="text-center relative z-10 w-full"
                        >
                            <div className="inline-flex flex-col items-center gap-4 w-full">
                                <div className="px-8 py-4 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-rose-500/20 border border-amber-500/30 rounded-[2rem] shadow-2xl">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Trophy className="w-6 h-6 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                        <span className="text-3xl font-black text-white uppercase italic tracking-tighter shadow-amber-500/20">{winnerName}</span>
                                    </div>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em]">Official Livestream Winner</p>
                                </div>

                                {onClose && (
                                    <Button 
                                        onClick={onClose}
                                        className="h-14 px-10 bg-white/5 hover:bg-amber-500 text-white hover:text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all shadow-xl"
                                    >
                                        Dismiss Results
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
});

const DraggableGiveawayWidget = memo(({
    giveawayConfig,
    setGiveawayConfig,
    activeGiveaway,
    isGiveawayPopupOpen,
    setIsGiveawayPopupOpen,
    giveawayParticipantCount,
    onStartGiveaway,
    onDrawWinner,
    isSetupMode,
    setIsSetupMode,
    position,
    setPosition,
    inventory = [],
    socketRef,
    roomName,
    id,
    setActiveGiveaway,
    setGiveawayParticipantCount
}: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!activeGiveaway?.end_time) {
            setTimeLeft(0);
            return;
        }
        const interval = setInterval(() => {
            const end = new Date(activeGiveaway.end_time).getTime();
            const now = Date.now();
            const diff = Math.max(0, Math.floor((end - now) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeGiveaway?.end_time]);

    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    const filteredInventory = useMemo(() => {
        return (inventory || []).filter((item: any) => {
            const v = item.product_variants;
            const search = (searchTerm || '').toLowerCase();
            const nameMatch = (v?.products?.name || '').toLowerCase().includes(search);
            const optionMatch = (v?.option_name || '').toLowerCase().includes(search);
            const skuMatch = (v?.sku || '').toLowerCase().includes(search);
            return nameMatch || optionMatch || skuMatch;
        });
    }, [inventory, searchTerm]);

    return (
        <div className="fixed left-6 bottom-32 z-[100] pointer-events-none">
            <motion.div
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => setPosition({ x: position.x + info.offset.x, y: position.y + info.offset.y })}
                style={{ x: position.x, y: position.y }}
                className="pointer-events-auto"
            >
                {isGiveawayPopupOpen ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="bg-[#1a1b23]/95 backdrop-blur-xl border border-white/10 w-[440px] rounded-[2.5rem] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[60px] -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                                    <Gift className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Giveaway Hub</span>
                                    <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-widest">Global Rewards System</span>
                                </div>
                            </div>
                            <button
                                className="p-2.5 hover:bg-white/5 rounded-2xl text-neutral-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                                onClick={() => setIsGiveawayPopupOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {isSetupMode && !activeGiveaway ? (
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">Selection Strategy</label>
                                        <div className="flex items-center gap-2">
                                            <Search className="w-3 h-3 text-neutral-700" />
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                className="bg-transparent border-none text-[9px] font-bold text-neutral-400 placeholder:text-neutral-700 focus:outline-none w-48"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-none border-b border-white/5 pb-4">
                                        {filteredInventory.length > 0 ? filteredInventory.map((item: any) => {
                                            const v = item.product_variants;
                                            const displayName = v?.products?.name || v?.option_name || 'Unknown Product';
                                            return (
                                                <button
                                                    key={item.variant_id}
                                                    onClick={() => setGiveawayConfig({ ...giveawayConfig, variantId: item.variant_id })}
                                                    className={`flex items-center gap-4 p-3 rounded-2xl border transition-all text-left ${giveawayConfig.variantId === item.variant_id ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-black/40 overflow-hidden shrink-0 border border-white/5 p-1">
                                                        <img src={v?.media_assets?.[0]?.url || "/placeholder.png"} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="text-[10px] font-black truncate uppercase italic">{displayName}</span>
                                                            <span className="text-[9px] font-mono font-black text-amber-500">{formatPrice(v?.price)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[7px] font-mono text-neutral-600 uppercase tracking-tighter">SKU: {v?.sku || 'N/A'}</span>
                                                            <span className={`text-[7px] font-mono uppercase tracking-tighter ${v?.stock_available > 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                                                Qty: {v?.stock_available}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        }) : (
                                            <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/5">
                                                <span className="text-[10px] font-black uppercase text-neutral-700 tracking-widest italic">No matches found</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-neutral-500 tracking-widest pl-1">Magic Keyword</label>
                                        <Input
                                            value={giveawayConfig.keyword}
                                            onChange={(e) => setGiveawayConfig({ ...giveawayConfig, keyword: e.target.value })}
                                            className="h-11 bg-black/40 border-white/5 text-[11px] font-black tracking-[0.2em] rounded-2xl focus:border-amber-500/50"
                                            placeholder="GIVEAWAY"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-neutral-500 tracking-widest pl-1">Duration (s)</label>
                                        <Input
                                            type="number"
                                            value={giveawayConfig.durationSeconds}
                                            onChange={(e) => setGiveawayConfig({ ...giveawayConfig, durationSeconds: parseInt(e.target.value) })}
                                            className="h-11 bg-black/40 border-white/5 text-[11px] font-black rounded-2xl focus:border-amber-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-neutral-500 tracking-widest pl-1">Entries (Slots)</label>
                                        <Input
                                            type="number"
                                            value={giveawayConfig.slots}
                                            onChange={(e) => setGiveawayConfig({ ...giveawayConfig, slots: parseInt(e.target.value) })}
                                            className="h-11 bg-black/40 border-white/5 text-[11px] font-black rounded-2xl focus:border-amber-500/50"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={onStartGiveaway}
                                    disabled={!giveawayConfig.variantId}
                                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-[11px] uppercase tracking-[0.3em] h-12 rounded-[1.5rem] shadow-2xl shadow-amber-900/20 mt-2 group"
                                >
                                    <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Launch Round
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8 relative z-10">
                                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />

                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-500 uppercase font-black tracking-[0.3em] mb-4">Entries Verified</span>
                                        <div className="text-7xl font-mono font-black text-amber-500 mb-2 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform duration-500">
                                            {giveawayParticipantCount}
                                        </div>
                                    </div>

                                    {activeGiveaway?.end_time && (
                                        <div className="mt-6 p-5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-[2rem] border border-white/5 flex items-center justify-between relative overflow-hidden group/timer shadow-inner">
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-rose-500/5 opacity-0 group-hover/timer:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-start relative z-10">
                                                <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Time Remaining</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-3xl font-mono font-black tracking-tighter ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                                                        {m}<span className="opacity-30 mx-0.5">:</span>{s}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-white/5" />
                                            <div className="flex flex-col items-end relative z-10">
                                                <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Target Slots</span>
                                                <span className="text-3xl font-mono font-black text-blue-400 tracking-tighter">{activeGiveaway?.slots || giveawayConfig.slots}</span>
                                            </div>
                                        </div>
                                    )}

                                    {!activeGiveaway?.end_time && (
                                        <div className="flex items-center justify-center gap-2 mt-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="block text-[8px] text-neutral-600 uppercase tracking-[0.2em] font-black">Capacity: {activeGiveaway?.slots || giveawayConfig.slots} participants</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={onDrawWinner}
                                        disabled={giveawayParticipantCount === 0}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-[0.3em] h-14 rounded-[1.5rem] shadow-2xl shadow-emerald-900/40 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <div className="flex items-center gap-2">
                                            <RotateCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                            Start Visual Draw
                                        </div>
                                    </Button>
                                    {!activeGiveaway && (
                                        <button
                                            onClick={() => setIsSetupMode(true)}
                                            className="text-[9px] font-black text-neutral-600 hover:text-amber-500 uppercase tracking-[0.2em] mt-2 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft className="w-3 h-3" /> Reconfigure Logic
                                        </button>
                                    )}
                                    {activeGiveaway && giveawayParticipantCount === 0 && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Hủy bỏ Giveaway này và cấu hình lại?")) {
                                                    socketRef.current?.emit('cancel_giveaway', {
                                                        roomId: roomName,
                                                        livestreamId: Number(id),
                                                        giveawayId: activeGiveaway.id
                                                    });
                                                    // Immediate local reset
                                                    setActiveGiveaway(null);
                                                    setIsSetupMode(true);
                                                    setGiveawayParticipantCount(0);
                                                }
                                            }}
                                            className="text-[9px] font-black text-rose-500/60 hover:text-rose-500 uppercase tracking-[0.2em] mt-2 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <X className="w-3 h-3" /> Cancel & Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        layoutId="giveaway-hub"
                        className="cursor-move"
                        onTap={() => setIsGiveawayPopupOpen(true)}
                    >
                        <Button
                            className="w-20 h-20 rounded-[2.5rem] bg-amber-500 hover:bg-amber-400 text-white shadow-[0_20px_50px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center relative group pointer-events-none"
                        >
                            <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Gift className="w-9 h-9 relative z-10" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-4 border-[#0a0b10] rounded-full scale-0 group-hover:scale-100 transition-transform" />
                        </Button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
});

export default function AdminLivestreamLive() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();

    const [token, setToken] = useState('');
    const [stream, setStream] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStreaming, setIsStreaming] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [latestOrder, setLatestOrder] = useState<any>(null);
    const [pinnedProduct, setPinnedProduct] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [viewerCount, setViewerCount] = useState(0);
    const [heartsCount, setHeartsCount] = useState(0);
    const [sharesCount, setSharesCount] = useState(0);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [isFullscreenMode, setIsFullscreenMode] = useState(false);
    const [focusedVariantId, setFocusedVariantId] = useState<number | null>(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [pinnedComment, setPinnedComment] = useState<any>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; desc: string; onConfirm: () => void } | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const roomName = `LIVE-${id}`;
    const livekitUrl = import.meta.env.VITE_LIVEKIT_WS_URL;

    const [giveawayConfig, setGiveawayConfig] = useState<any>({ slots: 50, durationSeconds: 60, keyword: 'GIFT' + Math.floor(Math.random() * 1000) });
    const [activeGiveaway, setActiveGiveaway] = useState<any>(null);
    const [isGiveawayPopupOpen, setIsGiveawayPopupOpen] = useState(false);
    const [giveawayParticipantCount, setGiveawayParticipantCount] = useState(0);
    const [isGiveawayWheelVisible, setIsGiveawayWheelVisible] = useState(false);
    const [giveawayWinner, setGiveawayWinner] = useState<any>(null);
    const [giveawayParticipantsList, setGiveawayParticipantsList] = useState<{ userId: number, name: string }[]>([]);
    const [isGiveawaySetupMode, setIsGiveawaySetupMode] = useState(true);
    const [giveawayPosition, setGiveawayPosition] = useState({ x: 0, y: 0 });

    const fetchLivestream = async () => {
        try {
            const data = await livestreamsService.getLivestreamById(Number(id));
            if (data.status === 'ENDED') {
                toast({ title: "Session Closed", description: "This session has already ended." });
                navigate('/admin/livestreams');
                return;
            }
            setStream(data);
            if (data.pinned_product_id) {
                const pinned = data.products.find((p: any) => p.variant_id === data.pinned_product_id);
                if (pinned) setPinnedProduct(pinned);
            } else {
                setPinnedProduct(null);
            }
            setHeartsCount(data.hearts_count || 0);
            setSharesCount(data.shares_count || 0);

            // Fetch existing orders for this session to get accurate count
            try {
                const sessionOrders = await api.get(`/livestreams/${id}/orders`);
                if (sessionOrders.data && Array.isArray(sessionOrders.data)) {
                    setOrders(sessionOrders.data);
                }
            } catch (err) {
                console.error("Failed to fetch session orders:", err);
            }



        } catch (error) {
            console.error("Failed to fetch stream:", error);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                await fetchLivestream();
                const tokenRes = await api.get(`/livekit/token`, {
                    params: {
                        room: roomName,
                        username: user?.full_name || 'Host',
                        isHost: 'true',
                        identity: `Host_${user?.user_id || Date.now()}_${Math.floor(Math.random() * 1000)}`
                    }
                });
                setToken(tokenRes.data.token);

                if (!isMounted) return;

                const socket = io(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000'}/livestream-live`, {
                    auth: {
                        token: localStorage.getItem('accessToken')
                    }
                });
                socketRef.current = socket;

                socket.on('connect', () => {
                    socket.emit('join_room', { roomId: roomName, userId: user?.user_id, isHost: true });
                });

                socket.on('chat_history', (history: any[]) => setChatMessages(history));
                socket.on('chat_message', (msg: any) => setChatMessages(prev => [...prev, msg]));
                socket.on('new_order', (data: any) => {
                    setOrders(prev => [data, ...prev]);
                    setLatestOrder(data);
                    setTimeout(() => setLatestOrder(null), 5000);
                });
                socket.on('viewer_update', (data: { count: number }) => setViewerCount(data.count));
                socket.on('stats_update', (stats: any) => {
                    if (stats.hearts !== undefined) setHeartsCount(stats.hearts);
                    if (stats.shares !== undefined) setSharesCount(stats.shares);
                });
                socket.on('product_pinned', () => {
                    if (isMounted) fetchLivestream();
                });
                socket.on('product_update', () => {
                    if (isMounted) fetchLivestream(); // Re-fetch to update Live Inventory Stock
                });
                socket.on('flash_sale_started', () => {
                    if (isMounted) fetchLivestream();
                });
                socket.on('new_heart', () => setHeartsCount(prev => prev + 1));
                socket.on('new_share', () => setSharesCount(prev => prev + 1));
                socket.on('broadcast_notification', (data: any) => setBroadcasts(prev => [data, ...prev]));
                socket.on('product_focused', (data: { variant_id: number }) => setFocusedVariantId(data.variant_id));
                socket.on('product_unfocused', () => setFocusedVariantId(null));
                socket.on('comment_pinned', (data: any) => setPinnedComment(data));
                socket.on('user_kicked', (data: { user_id: number, user_name: string }) => {
                    if (user?.user_id === data.user_id) {
                        toast({ title: "Session Disconnected", description: "You have been removed from this room.", variant: "destructive" });
                        navigate('/');
                    }
                });

                // --- GIVEAWAY SOCKET HOOKS ---
                socket.on('giveaway_started', (data: any) => {
                    setActiveGiveaway(data);
                    setGiveawayParticipantCount(data.current_entries || 0);
                    setIsGiveawayPopupOpen(true);
                });
                socket.on('giveaway_entry_count', (data: any) => {
                    setGiveawayParticipantCount(data.count);
                });
                socket.on('giveaway_draw_started', (data: any) => {
                    setGiveawayParticipantsList(data.participants || []);
                    setGiveawayWinner(null);
                    setIsGiveawayWheelVisible(true);
                    setIsGiveawayPopupOpen(false); // Hide the configurator popup
                });
                socket.on('giveaway_winner_selected', (data: any) => {
                    setGiveawayWinner(data);
                    setActiveGiveaway(null);
                    // Prepare for next round configuration
                    setIsGiveawaySetupMode(true);
                    setGiveawayParticipantCount(0);
                    // Note: giveawayParticipantsList is NOT cleared here so the wheel stays populated until dismissed
                });
                socket.on('giveaway_cancelled', () => {
                    setActiveGiveaway(null);
                    setIsGiveawaySetupMode(true);
                    setGiveawayParticipantCount(0);
                    toast({ title: "Giveaway Cancelled", description: "The current round has been terminated." });
                });

                setIsLoading(false);
            } catch (error) {
                console.error("Init failed:", error);
                setIsLoading(false);
            }
        };
        if (user && id) init();
        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
            }
        };
    }, [id, user]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    const handlePinProduct = async (productId: number) => {
        try {
            await api.post(`/livestreams/${id}/pin`, { productId });
            await fetchLivestream();
            socketRef.current?.emit('pin_product', { roomId: `LIVE-${id}`, livestreamId: Number(id), variantId: productId });
            toast({ title: "Product Pinned" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to pin", variant: "destructive" });
        }
    };

    const handleAddProducts = async (variantIds: number[]) => {
        try {
            await api.post(`/livestreams/${id}/products`, { variantIds });
            await fetchLivestream();
            socketRef.current?.emit('refresh_products', { roomId: roomName, livestreamId: Number(id) });
            toast({ title: "Inventory Updated", description: `Injected ${variantIds.length} new items.` });
        } catch (error: any) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const handleToggleRecording = () => {
        if (!isStreaming) {
            toast({ title: "Action Required", description: "You must be Live to start recording." });
            return;
        }
        const next = !isRecording;
        setIsRecording(next);
        socketRef.current?.emit('toggle_recording', { livestreamId: Number(id), active: next });
        toast({
            title: next ? "Recording Started" : "Recording Stopped",
            description: next ? "Session is being captured for evidence." : "Recording saved to server archive."
        });
    };

    // --- GIVEAWAY ACTIONS ---
    const handleStartGiveaway = async () => {
        if (!giveawayConfig.variantId || !giveawayConfig.keyword) {
            toast({ title: "Setup Required", description: "Please select a prize and keyword.", variant: "destructive" });
            return;
        }

        try {
            // 1. Create Giveaway Session in DB
            const res = await api.post(`/livestreams/${id}/giveaways`, {
                variantId: giveawayConfig.variantId,
                keyword: giveawayConfig.keyword,
                slotsLimit: giveawayConfig.slots
            });

            const newGiveaway = res.data;

            // 2. Broadcast to all users
            socketRef.current?.emit('trigger_giveaway', {
                roomId: roomName,
                livestreamId: Number(id),
                giveawayId: newGiveaway.id,
                durationSeconds: giveawayConfig.durationSeconds
            });

            setIsGiveawaySetupMode(false);
            toast({ title: "Giveaway Started!" });
        } catch (error: any) {
            toast({ title: "Failed to Start", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    // Note: To match Random Wheel requirement, we trigger draw separately first before winner selection
    const handleDrawWinner = () => {
        socketRef.current?.emit('select_giveaway_winner', {
            roomId: roomName,
            livestreamId: Number(id)
        });
    };

    const handleRemoveProduct = async (variantId: number) => {
        setConfirmConfig({
            isOpen: true,
            title: "Remove Item?",
            desc: "This will remove the product from the current livestream inventory.",
            onConfirm: async () => {
                try {
                    await livestreamsService.removeProduct(Number(id), variantId);
                    await fetchLivestream();
                    socketRef.current?.emit('refresh_products', { roomId: roomName, livestreamId: Number(id) });
                    toast({ title: "Item Removed" });
                } catch (error: any) {
                    toast({ title: "Failed", description: error.message, variant: "destructive" });
                }
            }
        });
    };

    const handleTriggerFlashSale = async (variantId: number, price: number, stock: number) => {
        socketRef.current?.emit('trigger_flash_sale', { roomId: roomName, livestreamId: Number(id), variantId, price, stock });
        toast({ title: "🔥 Flash Sale Triggered" });
    };

    const handleSendBroadcast = (content: string) => {
        if (!content.trim()) return;
        socketRef.current?.emit('admin_broadcast', { roomId: roomName, livestreamId: Number(id), content });
    };

    const handleToggleStreaming = async () => {
        try {
            if (!isStreaming) {
                await livestreamsService.startSession(Number(id));
                setIsStreaming(true);
                toast({ title: "Broadcast Started", description: "You are now LIVE!" });
            } else {
                await livestreamsService.endSession(Number(id));
                setIsStreaming(false);
                toast({ title: "Broadcast Stopped", description: "You are off air." });
            }
        } catch (error: any) {
            toast({ title: "Operation Failed", description: error.response?.data?.message || error.message, variant: "destructive" });
        }
    };

    const handleEndSession = async () => {
        setConfirmConfig({
            isOpen: true,
            title: "Terminate Session?",
            desc: "This will disconnect all viewers and close the broadcast room forever.",
            onConfirm: async () => {
                try {
                    await livestreamsService.endSession(Number(id));
                    const report = await api.get(`/livestreams/${id}/report`).then(res => res.data);
                    setReportData(report);
                    setIsReportOpen(true);
                } catch (error: any) {
                    toast({ title: "Failed", description: error.response?.data?.message, variant: "destructive" });
                }
            }
        });
    };

    const handleFocusProduct = (variantId: number) => {
        if (focusedVariantId === variantId) {
            socketRef.current?.emit('unfocus_product', { roomId: roomName, livestreamId: Number(id) });
            setFocusedVariantId(null);
        } else {
            socketRef.current?.emit('focus_product', { roomId: roomName, livestreamId: Number(id), variantId });
            setFocusedVariantId(variantId);
            toast({ title: "Product Focused", description: "All viewers now see this highlighted." });
        }
    };

    const handleRestock = async (variantId: number, amount: number) => {
        try {
            await api.patch(`/livestreams/${id}/products/${variantId}/restock`, { amount });
            await fetchLivestream();
            socketRef.current?.emit('refresh_products', { roomId: roomName, livestreamId: Number(id) });
            toast({ title: "Restock Success", description: `Added ${amount} units in real-time.` });
        } catch (error: any) {
            toast({ title: "Restock Failed", variant: "destructive" });
        }
    };

    const handlePinComment = (msg: any) => {
        socketRef.current?.emit('pin_comment', {
            roomId: roomName,
            messageId: msg.id || Date.now(),
            content: msg.text,
            name: msg.name
        });
        toast({ title: "Comment Pinned" });
    };

    const handleKickUser = (userId: number, userName: string) => {
        setConfirmConfig({
            isOpen: true,
            title: `Kick ${userName}?`,
            desc: "They will be disconnected from the room immediately.",
            onConfirm: () => {
                socketRef.current?.emit('kick_user', { roomId: roomName, userId, userName });
                toast({ title: "Moderation Action", description: `${userName} has been removed.` });
            }
        });
    };

    const handleConfirmReview = () => {
        setIsReportOpen(false);
        navigate('/admin/livestreams');
    };

    if (isLoading || !token) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#08090d] text-white">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="w-12 h-12 animate-spin text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]" />
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-rose-500 animate-pulse">Initializing Studio VR...</p>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={false}
            audio={false}
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            options={{
                publishDefaults: { simulcast: true, videoCodec: 'h264' as VideoCodec, videoEncoding: VideoPresets.h1080.encoding },
                videoCaptureDefaults: { resolution: VideoPresets.h1080.resolution }
            }}
            className="flex h-screen bg-[#08090d] text-white overflow-hidden font-outfit"
        >
            <AdminStudioContent
                isFullscreenMode={isFullscreenMode}
                setIsFullscreenMode={setIsFullscreenMode}
                viewerCount={viewerCount}
                orders={orders}
                latestOrder={latestOrder}
                heartsCount={heartsCount}
                sharesCount={sharesCount}
                stream={stream}
                pinnedProduct={pinnedProduct}
                focusedVariantId={focusedVariantId}
                isStreaming={isStreaming}
                isRecording={isRecording}
                chatMessages={chatMessages}
                chatEndRef={chatEndRef}
                id={id}
                navigate={navigate}
                handleEndSession={handleEndSession}
                handleToggleRecording={handleToggleRecording}
                handleToggleStreaming={handleToggleStreaming}
                handleSendBroadcast={handleSendBroadcast}
                handlePinComment={handlePinComment}
                handleKickUser={handleKickUser}
                handlePinProduct={handlePinProduct}
                handleRemoveProduct={handleRemoveProduct}
                handleTriggerFlashSale={handleTriggerFlashSale}
                handleFocusProduct={handleFocusProduct}
                handleRestock={handleRestock}
                handleAddProducts={handleAddProducts}
                isReportOpen={isReportOpen}
                setIsReportOpen={setIsReportOpen}
                reportData={reportData}
                handleConfirmReview={handleConfirmReview}
                pinnedComment={pinnedComment}
                setPinnedComment={setPinnedComment}

                // Giveaway Props
                giveawayConfig={giveawayConfig}
                setGiveawayConfig={setGiveawayConfig}
                activeGiveaway={activeGiveaway}
                isGiveawayPopupOpen={isGiveawayPopupOpen}
                setIsGiveawayPopupOpen={setIsGiveawayPopupOpen}
                giveawayParticipantCount={giveawayParticipantCount}
                handleStartGiveaway={handleStartGiveaway}
                handleDrawWinner={handleDrawWinner}
                isGiveawayWheelVisible={isGiveawayWheelVisible}
                setIsGiveawayWheelVisible={setIsGiveawayWheelVisible}
                giveawayWinner={giveawayWinner}
                giveawayParticipantsList={giveawayParticipantsList}
                setGiveawayParticipantsList={setGiveawayParticipantsList}
                isGiveawaySetupMode={isGiveawaySetupMode}
                setIsGiveawaySetupMode={setIsGiveawaySetupMode}
                giveawayPosition={giveawayPosition}
                setGiveawayPosition={setGiveawayPosition}
                socketRef={socketRef}
                roomName={roomName}
                setActiveGiveaway={setActiveGiveaway}
                setGiveawayParticipantCount={setGiveawayParticipantCount}
            />
            {confirmConfig && (
                <Dialog open={confirmConfig.isOpen} onOpenChange={(open) => !open && setConfirmConfig(null)}>
                    <DialogContent className="bg-[#0f1015] border-white/10 rounded-3xl max-w-sm p-8 text-center">
                        <DialogTitle className="text-white font-black uppercase tracking-widest text-xs mb-2">{confirmConfig.title}</DialogTitle>
                        <p className="text-[10px] text-neutral-500 mb-8">{confirmConfig.desc}</p>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 text-neutral-400 text-[10px] font-black uppercase tracking-widest" onClick={() => setConfirmConfig(null)}>Cancel</Button>
                            <Button className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest" onClick={() => { confirmConfig.onConfirm(); setConfirmConfig(null); }}>Confirm</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </LiveKitRoom>
    );
}

function AdminStudioContent(props: any) {
    const {
        isFullscreenMode, setIsFullscreenMode, viewerCount, orders, latestOrder, heartsCount, sharesCount,
        stream, pinnedProduct, focusedVariantId, isStreaming, isRecording, chatMessages,
        chatEndRef, id, navigate, handleEndSession, handleToggleRecording,
        handleToggleStreaming, handleSendBroadcast, handlePinComment,
        handleKickUser, handlePinProduct, handleRemoveProduct,
        handleTriggerFlashSale, handleFocusProduct, handleRestock, handleAddProducts,
        isReportOpen, setIsReportOpen, reportData, handleConfirmReview, pinnedComment, setPinnedComment,
        // Giveaway
        giveawayConfig, setGiveawayConfig, activeGiveaway, isGiveawayPopupOpen, setIsGiveawayPopupOpen,
        giveawayParticipantCount, handleStartGiveaway, handleDrawWinner,
        isGiveawayWheelVisible, setIsGiveawayWheelVisible, giveawayWinner, giveawayParticipantsList, setGiveawayParticipantsList,
        isGiveawaySetupMode, setIsGiveawaySetupMode,
        giveawayPosition, setGiveawayPosition,
        socketRef, roomName, setActiveGiveaway, setGiveawayParticipantCount
    } = props;
    const { toast } = useToast();
    const { localParticipant } = useLocalParticipant();

    const onToggleStreaming = async () => {
        try {
            if (!isStreaming) {
                // Request permissions explicitly inside click handler
                await localParticipant.setCameraEnabled(true);
                await localParticipant.setMicrophoneEnabled(true);
            } else {
                await localParticipant.setCameraEnabled(false);
                await localParticipant.setMicrophoneEnabled(false);
            }
            await handleToggleStreaming();
        } catch (error: any) {
            console.error("Media error:", error);
            if (error.name === 'NotAllowedError') {
                toast({
                    title: "Permission Denied",
                    description: "Please allow camera/mic access in your browser settings to go live.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Media Error", description: error.message, variant: "destructive" });
            }
        }
    };

    return (
        <>
            {/* ── COLUMN 1: ANALYTICS & INVENTORY (20%) ── */}
            {!isFullscreenMode && (
                <aside className="w-[20%] shrink-0 flex flex-col bg-[#0a0b10] border-r border-white/5 p-6 space-y-8 overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-left duration-500">
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => navigate('/admin/livestreams')} className="text-neutral-600 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                        <h1 className="text-[10px] font-black tracking-[0.2em] uppercase text-neutral-400">Broadcaster Studio</h1>
                    </div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
                            <Activity className="w-3 h-3 text-rose-500" />
                            Live Metrics
                        </div>
                        <PinnedProductPriceCard product={pinnedProduct} />
                        <div className="grid grid-cols-2 gap-3">
                            <StatTile label="Viewers" value={viewerCount} icon={Users} />
                            <StatTile 
                                label="Orders" 
                                value={useMemo(() => {
                                    // Count unique actual orders by masking out the giveaway 'G-' prefix duplicates if any, 
                                    // or just count unique order_id from the list if they are mixed
                                    const uniqueIds = new Set(orders.map((o: any) => o.order_id?.toString().replace('G-', '')));
                                    return uniqueIds.size;
                                }, [orders])} 
                                icon={ShoppingBag} 
                                trend={orders.length > 0 ? `+${orders.length}` : undefined} 
                            />
                            <StatTile label="Hearts" value={heartsCount} icon={Heart} />
                            <StatTile label="Shares" value={sharesCount} icon={Share2} />
                        </div>
                    </section>

                    <section className="pt-2">
                        <LiveInventoryLog
                            products={stream?.products || []}
                            onAdd={<LiveInventorySelector onAdd={handleAddProducts} existingIds={stream?.products?.map((p: any) => p.variant_id) || []} />}
                            onPin={handlePinProduct}
                            onRemove={handleRemoveProduct}
                            onFlashSale={handleTriggerFlashSale}
                            onFocus={handleFocusProduct}
                            onRestock={handleRestock}
                            focusedId={focusedVariantId || undefined}
                            pinnedId={stream?.pinned_product_id}
                        />
                    </section>

                    <section className="pt-2">
                        <SystemHealth />
                    </section>

                    <div className="mt-auto pt-8 space-y-3">
                        <Button variant="outline" className="w-full h-11 bg-white/5 border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-white/10 transition-all">
                            <Share2 className="w-3.5 h-3.5" /> Share Stream
                        </Button>
                        <Button onClick={handleEndSession} variant="ghost" className="w-full h-11 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 transition-all">
                            <Power className="w-3.5 h-3.5" /> Terminate Session
                        </Button>
                    </div>
                </aside>
            )}

            {/* ── COLUMN 2: MAIN STAGE (60%) ── */}
            <main className={`flex-1 flex flex-col min-w-0 bg-[#08090d] transition-all duration-500 ${isFullscreenMode ? 'p-0' : 'p-6 gap-6'}`}>
                {/* Stage Header */}
                {!isFullscreenMode && (
                    <div className="flex items-center justify-between z-10">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600">Broadcast Node #42</span>
                                <span className="text-neutral-800">|</span>
                                <h2 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">{stream?.title || 'Premier Unboxing'}</h2>
                            </div>
                        </div>
                        <StatusBadge isLive={isStreaming} />
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleRecording}
                                className={`h-8 px-3 rounded-full border transition-all ${isRecording ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'}`}
                            >
                                <div className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-rose-500' : 'bg-neutral-600'}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{isRecording ? 'REC ACTIVE' : 'Start REC'}</span>
                            </Button>
                            {isStreaming && <StreamTimer startTime={stream?.start_time} />}
                            <div className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                        </div>
                    </div>
                )}

                {/* Video Container */}
                <div className={`flex-1 bg-[#111218] border border-white/5 overflow-hidden shadow-2xl relative flex flex-col items-center justify-center transition-all duration-500 group ${isFullscreenMode ? 'rounded-0 border-none' : 'rounded-[2.5rem]'}`}>
                    <AnimatePresence mode="wait">
                        {!isStreaming ? (
                            <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center px-12">
                                <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                                    <VideoOff className="w-8 h-8 text-neutral-700 opacity-20" />
                                </div>
                                <h2 className="text-xl font-black text-neutral-700 italic tracking-tighter uppercase mb-1">Transmission Standby</h2>
                                <p className="text-neutral-800 font-mono text-[8px] tracking-[0.2em] uppercase">Hardware optimization complete • Ready for broadcast</p>
                            </motion.div>
                        ) : (
                            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                                <AdminStreamPreview />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Floating Donate-style Notification */}
                    <AnimatePresence>
                        {latestOrder && (
                            <motion.div
                                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r ${latestOrder.type === 'GIVEAWAY' ? 'from-amber-600 to-yellow-500 shadow-[0_0_50px_rgba(245,158,11,0.6)]' : 'from-emerald-600 to-teal-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]'} backdrop-blur-xl border border-white/20 rounded-[2rem] p-2 pl-4 pr-6 flex items-center gap-4 overflow-hidden`}
                            >
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full animate-[shimmer_2s_infinite]"></div>

                                <div className="relative w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30 animate-bounce shadow-xl">
                                    {latestOrder.type === 'GIVEAWAY' ? <Gift className="w-6 h-6 text-white" /> : <ShoppingBag className="w-6 h-6 text-white" />}
                                </div>
                                <div className="relative flex flex-col justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 drop-shadow-md">
                                        {latestOrder.type === 'GIVEAWAY' ? '🎊 CHÚC MỪNG QUÀ TẶNG!' : '🎉 ĐƠN HÀNG MỚI!'}
                                    </span>
                                    <span className="text-sm font-black text-white italic drop-shadow-lg truncate max-w-[300px]">
                                        {latestOrder.customer_name} {latestOrder.type === 'GIVEAWAY' ? `vừa thắng: ${latestOrder.product_name}` : `vừa chốt ${latestOrder.quantity}x ${latestOrder.product_name}`}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stage Floating Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 px-6 flex items-center shadow-2xl">
                            <StudioTrackToggle />
                        </div>
                    </div>

                    {/* Screen Actions (Maximize etc) */}
                    <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <button
                            onClick={() => setIsFullscreenMode(!isFullscreenMode)}
                            className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center transition-all border border-white/10 hover:border-white/20 hover:scale-110 active:scale-95 shadow-2xl"
                        >
                            {isFullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center transition-all border border-white/10 hover:border-white/20 hover:scale-110 active:scale-95 shadow-2xl">
                            <Volume2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Product Info Bar / Control Bar */}
                {!isFullscreenMode && (
                    <div className="shrink-0 space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
                        <div className="bg-[#111218] rounded-2xl border border-white/5 p-4 flex items-center justify-between shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center p-2">
                                    <img src={pinnedProduct?.image_url || "/placeholder.png"} className="w-full h-full object-contain opacity-80" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white uppercase italic">{pinnedProduct?.product_name || 'Broadcasting Live'}</span>
                                    <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-tighter">{pinnedProduct ? `SKU: ${pinnedProduct.sku || '---'}` : 'Setting up showcase...'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-end">
                                    <span className="text-[6px] font-black uppercase text-neutral-600 tracking-tighter">Market Value</span>
                                    <span className="text-sm font-black text-white font-mono">{pinnedProduct ? formatPrice(pinnedProduct.price) : '--'}</span>
                                </div>
                                <Button
                                    onClick={onToggleStreaming}
                                    className={`w-40 h-12 font-black text-[10px] uppercase tracking-[0.3em] rounded-[1rem] transition-all duration-500 ${isStreaming ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]'}`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isStreaming ? <Power className="w-4 h-4" /> : <MonitorPlay className="w-4 h-4 animate-pulse" />}
                                        {isStreaming ? 'Stop Broadcast' : 'Transmit Live'}
                                    </span>
                                    {!isStreaming && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ── COLUMN 3: ACTIVITY & ORDERS (20%) ── */}
            {!isFullscreenMode && (
                <aside className="w-[20%] shrink-0 flex flex-col bg-[#0a0b10] border-l border-white/5 p-6 gap-6 overflow-hidden animate-in fade-in slide-in-from-right duration-500">
                    <section className="shrink-0 space-y-3">
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-emerald-500">
                            <ShoppingCart className="w-3 h-3" />
                            Live Orders Log
                        </div>
                        <div className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-none">
                            {orders.length > 0 ? orders.map((order: any, ix: number) => {
                                const isGiveaway = order.type === 'GIVEAWAY' || order.amount === 0;
                                
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        key={ix} 
                                        className={`p-3 rounded-2xl bg-white/5 border group transition-all ${isGiveaway ? 'border-amber-500/20 hover:border-amber-500/50' : 'border-white/5 hover:border-emerald-500/30'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {isGiveaway && <Gift className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                                                <span className={`text-[9px] font-black uppercase italic truncate ${isGiveaway ? 'text-amber-500' : 'text-white'}`}>
                                                    {order.customer_name}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-black font-mono ${isGiveaway ? 'text-amber-500/60' : 'text-emerald-500'}`}>
                                                {isGiveaway ? '🎁 GIVEAWAY' : formatPrice(order.amount)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[7px] font-mono text-neutral-600 uppercase tracking-tighter">
                                            <span>{isGiveaway ? 'Winner Identified' : 'Verified Trans.'}</span>
                                            <span>{order.time || 'Just now'}</span>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="p-10 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center flex flex-col items-center gap-3">
                                    <ShoppingCart className="w-8 h-8 opacity-10" />
                                    <span className="text-[8px] font-black uppercase text-neutral-700 tracking-widest">Awaiting First Sale</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="flex-1 flex flex-col pt-4 border-t border-white/5 min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
                                <Globe className="w-3 h-3 text-emerald-500" />
                                Broadcaster Chat
                            </div>
                            <span className="text-[8px] font-mono text-neutral-700">{chatMessages.length} active</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-4 hide-scrollbar">
                            {chatMessages.map((msg: any, ix: number) => (
                                <div key={ix} className="flex gap-2 group animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="w-5 h-5 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-[8px] text-neutral-600 relative overflow-hidden">
                                        {msg.name?.charAt(0) || 'U'}
                                        {/* Viewer Mod Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-[#1a1b23] border-white/10">
                                                <DropdownMenuItem onClick={() => handlePinComment(msg)} className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest gap-2">
                                                    <Anchor className="w-3 h-3" /> Pin Message
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleKickUser(msg.user_id || 0, msg.name || 'User')} className="text-[10px] text-rose-500 font-bold uppercase tracking-widest gap-2">
                                                    <UserX className="w-3 h-3" /> Terminate Access
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={`text-[8px] font-black uppercase tracking-tight truncate ${getUserColor(msg.name || 'User')}`}>{msg.name}</span>
                                            <span className="text-[7px] font-mono text-neutral-700 ml-auto shrink-0 uppercase">{msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : '00:00'}</span>
                                        </div>
                                        <p className="text-[10px] leading-relaxed break-words font-medium text-neutral-400">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="mt-4 shrink-0 p-3 bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Megaphone className="w-3 h-3 text-emerald-500" />
                                <span className="text-[8px] font-black uppercase text-emerald-500 tracking-[0.2em]">Live Broadcast</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Type session-wide message..."
                                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-neutral-700 transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendBroadcast(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                        </div>
                    </section>
                </aside>
            )}

            {/* Post-Live Metrics Overlay */}
            <PostLiveReportModal
                isOpen={isReportOpen}
                data={reportData}
                onConfirm={handleConfirmReview}
            />

            {/* Pinned Comment Overlay */}
            <AnimatePresence>
                {pinnedComment && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-xs"
                    >
                        <div className="bg-[#1a1b23]/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-3 shadow-2xl">
                            <Anchor className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="flex-1 overflow-hidden">
                                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">{pinnedComment.name}</span>
                                <p className="text-[9px] text-white font-medium leading-relaxed">{pinnedComment.content}</p>
                            </div>
                            <button onClick={() => setPinnedComment(null)} className="text-neutral-600 hover:text-white transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DraggableGiveawayWidget
                giveawayConfig={giveawayConfig}
                setGiveawayConfig={setGiveawayConfig}
                activeGiveaway={activeGiveaway}
                isGiveawayPopupOpen={isGiveawayPopupOpen}
                setIsGiveawayPopupOpen={setIsGiveawayPopupOpen}
                giveawayParticipantCount={giveawayParticipantCount}
                onStartGiveaway={handleStartGiveaway}
                onDrawWinner={handleDrawWinner}
                isSetupMode={isGiveawaySetupMode}
                setIsSetupMode={setIsGiveawaySetupMode}
                position={giveawayPosition}
                setPosition={setGiveawayPosition}
                inventory={stream?.products || []}
                socketRef={socketRef}
                roomName={roomName}
                id={id}
                setActiveGiveaway={setActiveGiveaway}
                setGiveawayParticipantCount={setGiveawayParticipantCount}
            />

            {/* Public Lucky Wheel Display */}
            <AnimatePresence>
                {isGiveawayWheelVisible && (
                    <PublicLuckyWheel
                        participants={giveawayParticipantsList}
                        winnerId={giveawayWinner?.user_id}
                        onClose={() => {
                            setIsGiveawayWheelVisible(false);
                            setGiveawayParticipantsList([]); // Clear list only when user dismisses the result
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function AdminStreamPreview() {
    const cameraTracks = useTracks([Track.Source.Camera]);
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const activeTrack = screenShareTracks.length > 0 ? screenShareTracks[0] : cameraTracks[0];

    if (!activeTrack) return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-neutral-500 relative">
            <div className="w-32 h-32 rounded-full bg-neutral-900 flex items-center justify-center border border-white/5 shadow-inner">
                <VideoOff className="w-10 h-10 opacity-10 animate-pulse" />
            </div>
            <div className="text-center">
                <p className="text-[10px] font-black tracking-[0.4em] uppercase opacity-20">Transmission Standby</p>
                <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/5 rounded-full border border-rose-500/10">
                    <StatusBadge isLive={false} />
                </div>
            </div>
        </div>
    );

    return <VideoTrack trackRef={activeTrack as TrackReference} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />;
}

function StudioTrackToggle() {
    const { localParticipant } = useLocalParticipant();
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isControlsVisible, setIsControlsVisible] = useState(true);

    const { devices: cameras, activeDeviceId: activeCameraId, setActiveMediaDevice: setCamera } = useMediaDeviceSelect({ kind: 'videoinput' });
    const { devices: mics, activeDeviceId: activeMicId, setActiveMediaDevice: setMic } = useMediaDeviceSelect({ kind: 'audioinput' });

    const toggleCamera = async () => { const next = !isCameraOn; await localParticipant.setCameraEnabled(next); setIsCameraOn(next); };
    const toggleMic = async () => { const next = !isMicOn; await localParticipant.setMicrophoneEnabled(next); setIsMicOn(next); };

    return (
        <div className="flex flex-col items-center gap-4">
            <AnimatePresence>
                {isControlsVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-8 py-2 px-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl"
                    >
                        {/* Mic Control */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <button onClick={toggleMic} className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${isMicOn ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-rose-500/10 border-rose-500/30 text-rose-500"}`}>
                                    <Signal className={`w-5 h-5 ${isMicOn ? '' : 'rotate-180 opacity-40'}`} />
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded-lg text-neutral-500 hover:text-white">
                                            <MoreHorizontal className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#1a1b23] border-white/10 text-white min-w-[200px]">
                                        <div className="px-3 py-2 text-[8px] font-black uppercase text-neutral-500 tracking-widest border-b border-white/5 mb-1">Select Microphone</div>
                                        {mics.map(device => (
                                            <DropdownMenuItem
                                                key={device.deviceId}
                                                onClick={() => setMic(device.deviceId)}
                                                className={`text-[10px] font-bold ${activeMicId === device.deviceId ? 'text-emerald-500 bg-emerald-500/5' : 'text-neutral-400'}`}
                                            >
                                                {device.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-500">{isMicOn ? 'Signal Active' : 'Muted'}</span>
                        </div>

                        {/* Camera Control */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <button onClick={toggleCamera} className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${isCameraOn ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-rose-500/10 border-rose-500/30 text-rose-500"}`}>
                                    {isCameraOn ? <Monitor className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded-lg text-neutral-500 hover:text-white">
                                            <MoreHorizontal className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#1a1b23] border-white/10 text-white min-w-[200px]">
                                        <div className="px-3 py-2 text-[8px] font-black uppercase text-neutral-500 tracking-widest border-b border-white/5 mb-1">Select Camera</div>
                                        {cameras.map(device => (
                                            <DropdownMenuItem
                                                key={device.deviceId}
                                                onClick={() => setCamera(device.deviceId)}
                                                className={`text-[10px] font-bold ${activeCameraId === device.deviceId ? 'text-emerald-500 bg-emerald-500/5' : 'text-neutral-400'}`}
                                            >
                                                {device.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-500">{isCameraOn ? 'Cam Live' : 'Cam Off'}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visibility Toggle */}
            <button
                onClick={() => setIsControlsVisible(!isControlsVisible)}
                className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all group relative overflow-hidden"
            >
                <div className={`transition-transform duration-500 ${isControlsVisible ? 'rotate-180' : 'rotate-0'}`}>
                    <Plus className="w-4 h-4" />
                </div>
                {!isControlsVisible && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Toggle Controls
                    </span>
                )}
            </button>
        </div>
    );
}

function FlashSaleTrigger({ variant, onTrigger }: { variant: any, onTrigger: (price: number, stock: number) => void }) {
    const [price, setPrice] = useState(Number(variant.price)); // Init with current full price
    const [stock, setStock] = useState(10);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [aiInfo, setAiInfo] = useState<{ reason: string; strategy: string } | null>(null);

    const costPrice = Number(variant.cost_price) || 0;
    const isBelowCost = price < costPrice;

    const handleAISuggest = async () => {
        setIsSuggesting(true);
        try {
            const res = await api.get(`/api/ai-suggest/${variant.variant_id}`);
            const { price: suggestedPrice, reason, strategy } = res.data;
            setPrice(Number(suggestedPrice));
            setAiInfo({ reason, strategy });
        } catch (err) {
            console.error("AI Suggestion failed", err);
            // Fallback: Use simple logic
            setPrice(Math.round(Math.max(variant.price * 0.8, costPrice * 1.1)));
            setAiInfo({
                reason: "Không thể kết nối AI, sử dụng quy tắc giá an toàn mặc định.",
                strategy: "FALLBACK"
            });
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                    <Flame className="w-3.5 h-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-[#1a1b23] border border-white/10 p-5 rounded-3xl shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] -translate-y-1/2 translate-x-1/2" />

                <div className="space-y-4 relative z-10">
                    <div className="pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-rose-500" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Flash Sale Module</h4>
                        </div>
                        <p className="text-[8px] text-neutral-500 leading-tight">AI-assisted pricing for immediate broadcast surge.</p>
                    </div>

                    <div className="space-y-3">
                        {/* Price Input Area */}
                        <div className="space-y-1.5 px-0.5">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[8px] text-neutral-600 uppercase font-black tracking-tighter">Sale Price (VND)</label>
                                {costPrice > 0 && (
                                    <span className="text-[8px] text-neutral-700 font-mono">Cost: {formatPrice(costPrice)}</span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(Number(e.target.value))}
                                    className={`w-full bg-black/40 border rounded-xl px-3 py-3 text-xs text-white outline-none transition-all font-mono font-black ${isBelowCost ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-white/10 focus:border-rose-500'}`}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleAISuggest}
                                    disabled={isSuggesting}
                                    className="absolute right-1 top-1 bottom-1 bg-white/5 hover:bg-white/10 text-[8px] font-black uppercase tracking-widest text-emerald-500 h-auto px-2 rounded-lg border border-white/5"
                                >
                                    {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨ AI Suggest"}
                                </Button>
                            </div>

                            {aiInfo && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-white/5 border border-white/5 rounded-xl p-2.5 mt-2 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${aiInfo.strategy === 'LIQUIDATION' ? 'bg-rose-500/20 text-rose-500' :
                                                    aiInfo.strategy === 'SCARCITY' ? 'bg-amber-500/20 text-amber-500' :
                                                        aiInfo.strategy === 'GROWTH' ? 'bg-emerald-500/20 text-emerald-500' :
                                                            'bg-neutral-500/20 text-neutral-500'
                                                }`}>
                                                {aiInfo.strategy} STRATEGY
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-neutral-400 italic leading-snug">"{aiInfo.reason}"</p>
                                </motion.div>
                            )}

                            {isBelowCost && (
                                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 mt-2 px-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Critical: Below Cost Price!</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Stock Limit Area */}
                        <div className="space-y-1.5 px-0.5">
                            <label className="text-[8px] text-neutral-600 uppercase font-black tracking-tighter">Event Inventory Limit</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={e => setStock(Number(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:border-rose-500 outline-none transition-all font-mono font-black"
                            />
                        </div>
                    </div>

                    <Button
                        size="sm"
                        disabled={price <= 0 || stock <= 0}
                        className={`w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mt-2 transition-all duration-300 ${isBelowCost ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_10px_20px_rgba(225,29,72,0.2)]'}`}
                        onClick={() => onTrigger(price, stock)}
                    >
                        Initiate Flash Event
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function LiveInventorySelector({ onAdd, existingIds }: { onAdd: (ids: number[]) => void, existingIds: number[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            productsService.getProducts().then(res => {
                // res is ApiResponse<any[]> or any[]
                const list = Array.isArray(res) ? res : (res as any).data || [];
                const flat: any[] = [];
                list.forEach((p: any) => {
                    if (p.type_code === 'RETAIL' && p.product_variants) {
                        p.product_variants.forEach((v: any) => {
                            if (!existingIds.includes(v.variant_id) && v.stock_available > 0) {
                                flat.push({
                                    ...v,
                                    productName: p.name,
                                    imageUrl: p.media_urls?.[0] || v.media_assets?.[0]?.url || p.media_urls?.[0]
                                });
                            }
                        });
                    }
                });
                setProducts(flat);
            });
        }
    }, [isOpen, existingIds]);

    const filtered = products.filter(p => p.productName.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-[#0f1015] border-white/10 rounded-[2.5rem] max-w-md p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                <DialogTitle className="text-white font-black uppercase tracking-[0.2em] text-xs mb-6 text-center">In-Live Stock Injection</DialogTitle>
                <div className="space-y-6">
                    <div className="relative group">
                        <Input
                            placeholder="Lookup SKU or Name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/5 border-white/10 focus:border-emerald-500 rounded-2xl h-12 text-xs text-white pl-4 transition-all"
                        />
                    </div>
                    <ScrollArea className="h-[350px] pr-4">
                        <div className="space-y-3">
                            {filtered.map(p => (
                                <div key={p.variant_id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-black shrink-0 overflow-hidden border border-white/5 p-1">
                                            {p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-contain" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-black text-white leading-tight mb-1 truncate w-40">{p.productName}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-neutral-500 font-mono tracking-tighter">{p.option_name} | {p.sku}</span>
                                                <span className="text-[9px] text-rose-500/50 font-mono font-bold">Stock: {p.stock_available}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(p.variant_id)}
                                        onChange={() => setSelected(prev => prev.includes(p.variant_id) ? prev.filter(id => id !== p.variant_id) : [...prev, p.variant_id])}
                                        className="w-5 h-5 rounded-lg border-white/10 bg-black accent-emerald-500 cursor-pointer"
                                    />
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="py-20 text-center opacity-10 flex flex-col items-center gap-3">
                                    <Package className="w-10 h-10" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">No matching assets</span>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <Button
                        disabled={selected.length === 0}
                        onClick={() => { onAdd(selected); setIsOpen(false); setSelected([]); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] h-14 shadow-xl transition-all"
                    >
                        Inject {selected.length} Item(s)
                    </Button>
                </div>
            </DialogContent>
            <Button size="icon" variant="ghost" onClick={() => setIsOpen(true)} className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                <Plus className="w-3.5 h-3.5" />
            </Button>
        </Dialog>
    );
}
