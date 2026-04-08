import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
    ShoppingCart,
    Eye,
    Heart,
    Smile,
    X,
    Zap,
    Package,
    Tag,
    Wifi,
    WifiOff,
    ChevronLeft,
    Flame,
    ShoppingBag,
    Users,
    Star,
    Info,
    ArrowLeft,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { livestreamsService } from "@/services/livestreams.service";
import api from "@/services/api";
import {
    LiveKitRoom,
    VideoTrack,
    AudioTrack,
    useTracks,
    TrackReference,
    useLocalParticipant,
    useRemoteParticipants,
    useConnectionState,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import '@livekit/components-styles';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";

// ── Floating Emoji Reactions ──
const FloatingReaction = memo(({ reaction, onComplete }: {
    reaction: { id: number; symbol: string };
    onComplete: (id: number) => void;
}) => (
    <motion.div
        initial={{ y: 0, opacity: 1, scale: 0.5 }}
        animate={{ y: -300, opacity: 0, scale: 1.5, x: (Math.random() - 0.5) * 60 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        onAnimationComplete={() => onComplete(reaction.id)}
        className="absolute bottom-16 right-6 pointer-events-none text-3xl z-50"
    >
        {reaction.symbol}
    </motion.div>
));

// ── Video Stream Component ──
const AdminVideoStream = memo(() => {
    const videoTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }], { onlySubscribed: true });
    const audioTracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: false }], { onlySubscribed: true });
    const adminVideoTrack = videoTracks[0];

    if (!adminVideoTrack) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-neutral-900">
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                    <Wifi className="w-16 h-16 text-white/10" />
                </motion.div>
                <span className="text-xs font-mono tracking-widest uppercase text-white/20">Awaiting Stream...</span>
            </div>
        );
    }

    return (
        <>
            <VideoTrack trackRef={adminVideoTrack as TrackReference} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            {audioTracks.map(at => <AudioTrack key={at.participant.identity} trackRef={at as TrackReference} />)}
        </>
    );
});

// ── Live Status Badge ──
const LiveBadge = memo(() => {
    const state = useConnectionState();
    const live = state === ConnectionState.Connected;
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-widest ${live ? 'bg-rose-600' : 'bg-neutral-700'}`}>
            {live && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
            {live ? 'LIVE' : 'Offline'}
        </div>
    );
});

// ── Viewer Count ──
const ViewerCount = memo(() => {
    const { localParticipant } = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();
    const count = (localParticipant && !localParticipant.permissions?.canPublish ? 1 : 0)
        + remoteParticipants.filter(p => !p.permissions?.canPublish).length;
    return (
        <div className="flex items-center gap-1 text-white/70 text-[10px] font-mono">
            <Eye className="w-3 h-3" />
            <span className="font-bold">{count}</span>
        </div>
    );
});

// ── Stock Urgency Bar ──
const StockBar = memo(({ current, max = 100 }: { current: number; max?: number }) => {
    const pct = Math.min((current / max) * 100, 100);
    const color = pct < 20 ? 'bg-rose-500' : pct < 50 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
    );
});

// ── Markdown Helper ──
const MarkdownText = memo(({ text, className }: { text: string, className?: string }) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
        <div className={`space-y-1.5 ${className || ''}`}>
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i}>
                        {parts.map((p, j) => {
                            if (p.startsWith('**') && p.endsWith('**')) {
                                return <strong key={j} className="text-neutral-300 font-bold">{p.slice(2, -2)}</strong>;
                            }
                            return <span key={j}>{p}</span>;
                        })}
                    </p>
                );
            })}
        </div>
    );
});


// ── Global Flash Sale Timer ──
const FlashSaleTimer = memo(({ endTime }: { endTime: number }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, endTime - Date.now()));

    useEffect(() => {
        const interval = setInterval(() => {
            const left = Math.max(0, endTime - Date.now());
            setTimeLeft(left);
            if (left <= 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    if (timeLeft <= 0) return null;

    const m = Math.floor(timeLeft / 60000).toString().padStart(2, '0');
    const s = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');

    return (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-rose-600/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(225,29,72,0.5)] border border-rose-500 animate-pulse">
            <Flame className="w-2.5 h-2.5" />
            Ends in {m}:{s}
        </div>
    );
});

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export default function CustomerLivestreamRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { addToCart, fetchCart } = useCartStore();
    const socketRef = useRef<Socket | null>(null);

    const [stream, setStream] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const livekitUrl = import.meta.env.VITE_LIVEKIT_WS_URL;

    // UI State
    const [pinnedProduct, setPinnedProduct] = useState<any>(null);
    const [featuredProduct, setFeaturedProduct] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [reactions, setReactions] = useState<{ id: number; symbol: string }[]>([]);
    const [heartsCount, setHeartsCount] = useState(0);
    const [addedProductId, setAddedProductId] = useState<number | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null); // for detail sheet (reactive ID)
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [flashSaleEnds, setFlashSaleEnds] = useState<Record<number, number>>({});
    const [recentBuyer, setRecentBuyer] = useState<{name: string, product: string} | null>(null);
    const reactionIdCounter = useRef(0);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<any>(null);

    const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    /** Live Pricing Priority: Flash Sale > Live -2% > Original */
    const computeLivePrice = (basePrice: number, flashSalePrice?: number | null): number => {
        if (flashSalePrice && flashSalePrice > 0) return Number(flashSalePrice);
        return Math.round(Number(basePrice) * 0.98);
    };

    /**
     * Returns true only when flash sale price exists AND timer hasn't expired yet.
     * Uses variantId to look up the end time from flashSaleEnds state.
     */
    const isFlashActive = (variantId: number, flashSalePrice?: number | null): boolean => {
        if (!flashSalePrice || flashSalePrice <= 0) return false;
        const endTime = flashSaleEnds[variantId];
        if (!endTime) return true; // no timer tracked yet — server says it's active, trust it
        return Date.now() < endTime;
    };

    const fetchLivestream = useCallback(async () => {
        try {
            const data = await livestreamsService.getLivestreamById(Number(id));
            if (data.status === 'ENDED') {
                toast({ title: "Session Closed", description: "This broadcast has ended." });
                navigate('/customer/home');
                return null;
            }
            setStream(data);

            // Set pinned or first product as featured
            if (data.pinned_product_id) {
                const pinned = data.products?.find((p: any) => p.variant_id === data.pinned_product_id);
                if (pinned) {
                    setPinnedProduct(pinned.product_variants);
                    setFeaturedProduct(pinned);
                }
            } else if (data.products?.length > 0) {
                setFeaturedProduct(data.products[0]);
            }
            return data;
        } catch (error) {
            console.error("Fetch failed", error);
            return null;
        }
    }, [id, navigate, toast]);

    useEffect(() => {
        if (!user || !id) return;
        let isMounted = true;

        const loadData = async () => {
            try {
                const data = await fetchLivestream();
                if (!data) return;

                if (isMounted) setHeartsCount(data.hearts_count || 0);

                const tokenRes = await api.get(`/livekit/token`, {
                    params: {
                        room: `LIVE-${id}`,
                        username: user?.full_name || `Viewer-${user?.user_id}`,
                        isHost: 'false',
                        identity: `Viewer_${user?.user_id || Date.now()}_${Math.floor(Math.random() * 1000)}`
                    }
                });
                setLivekitToken(tokenRes.data.token);

                if (!isMounted) return;

                const socket = io(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000'}/livestream-live`);
                socketRef.current = socket;

                socket.on('connect', () => {
                    socket.emit('join_room', { roomId: `LIVE-${id}`, userId: user?.user_id, isHost: false });
                });

                socket.on('chat_history', (history: any[]) => {
                    setChatMessages(history.map(msg => ({
                        id: msg.id, name: msg.name, text: msg.text, rank: msg.rank,
                        isSelf: user != null && msg.userId === user.user_id,
                        isAdmin: msg.name === 'Admin'
                    })));
                });

                socket.on('chat_message', (msg: any) => {
                    setChatMessages(prev => [...prev, { ...msg, isSelf: user != null && msg.userId === user.user_id, isAdmin: msg.name === 'Admin' }]);
                });

                const handleProductHighlight = async (data: { variant_id: number }) => {
                    if (data.variant_id === 0) {
                        setPinnedProduct(null);
                        setFeaturedProduct(null);
                        return;
                    }

                    // 1. Try to find in current stream products
                    let product = streamRef.current?.products?.find((p: any) => p.variant_id === data.variant_id);

                    // 2. If not found, it might be a newly added product. Sync with backend.
                    if (!product) {
                        const updatedStream = await fetchLivestream();
                        product = updatedStream?.products?.find((p: any) => p.variant_id === data.variant_id);
                    }

                    // 3. Update pinned state
                    if (product) {
                        setPinnedProduct(product.product_variants);
                        setFeaturedProduct(product);
                        toast({ 
                            title: "New Item Featured!", 
                            description: product.product_variants?.products?.name || "The host is highlighting a new item." 
                        });
                    }
                };

                socket.on('product_pinned', handleProductHighlight);
                socket.on('product_focused', handleProductHighlight);

                // Listen to inventory/products updates from admin actions
                socket.on('products_updated', () => {
                    if (isMounted) fetchLivestream();
                });
                socket.on('product_update', () => {
                    if (isMounted) fetchLivestream();
                });

                socket.on('flash_sale_started', (data: any) => { 
                    if (data?.end_time) { 
                        setFlashSaleEnds(prev => ({ ...prev, [data.variant_id]: new Date(data.end_time).getTime() })); 
                    } 
                    if (isMounted) fetchLivestream(); 
                }); 
                
                socket.on('flash_sale_ended', (data: any) => { 
                    setFlashSaleEnds(prev => { 
                        const next = { ...prev }; 
                        delete next[data?.variant_id]; 
                        return next; 
                    }); 
                    if (isMounted) fetchLivestream(); 
                });

                socket.on('reaction_received', (data: { symbol: string }) => {
                    const rid = ++reactionIdCounter.current;
                    setReactions(prev => [...prev, { id: rid, symbol: data.symbol }]);
                    if (data.symbol === '❤️') setHeartsCount(prev => prev + 1);
                });

                socket.on('new_order', (data: any) => {
                    setRecentBuyer({ name: data.customer_name, product: data.product_name });
                    setTimeout(() => setRecentBuyer(null), 4000);
                });

                socket.on('stats_update', (stats: any) => {
                    if (stats.hearts !== undefined) setHeartsCount(stats.hearts);
                });

                socket.on('room_closed', async () => {
                    // Refresh cart so backend recalculates prices back to original
                    try { await fetchCart(); } catch (_) { /* silent */ }
                    toast({
                        title: "Broadcast Ended",
                        description: "Live pricing has expired — cart prices have reverted to standard.",
                    });
                    navigate('/customer/home');
                });

                setIsLoading(false);
            } catch (error) {
                console.error("Load failed", error);
                toast({ title: "Error", description: "Failed to connect to this live session.", variant: "destructive" });
                navigate('/customer/home');
            }
        };

        loadData();
        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
            }
        };
    }, [id, user, navigate, fetchLivestream]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

    const handleSendChat = useCallback(() => {
        if (!chatInput.trim() || !socketRef.current) return;
        const rankCode = (user as any)?.current_rank_code ?? user?.customers?.current_rank_code ?? 'BRONZE';
        socketRef.current.emit('send_chat', {
            roomId: `LIVE-${id}`,
            userId: user?.user_id,
            name: user?.full_name || 'Viewer',
            text: chatInput.trim(),
            rank: rankCode
        });
        setChatInput('');
    }, [chatInput, id, user]);

    const getRankColor = (rankCode: string) => {
        if (!rankCode) return 'text-neutral-400';
        switch (rankCode.toUpperCase()) {
            case 'NEWBIE':
            case 'BRONZE': return 'text-orange-400';
            case 'ACTIVE': return 'text-blue-400';
            case 'ELITE': return 'text-purple-400';
            case 'LEGENDARY': return 'text-rose-400';
            default: return 'text-emerald-400';
        }
    };

    const handleReaction = useCallback((symbol: string) => {
        if (!socketRef.current) return;
        socketRef.current.emit('send_reaction', { roomId: `LIVE-${id}`, symbol });
        const rid = ++reactionIdCounter.current;
        setReactions(prev => [...prev, { id: rid, symbol }]);
        if (symbol === '❤️') setHeartsCount(prev => prev + 1);
    }, [id]);

    const handleAddToCart = useCallback(async (variant: any, immediate = false) => {
        if (!variant) return;
        try {
            await addToCart({ id: variant.product_id, variantId: variant.variant_id, quantity: 1, livestream_id: Number(id) });
            setAddedProductId(variant.variant_id);
            setTimeout(() => setAddedProductId(null), 2000);
            toast({ title: "Added to Cart!", description: `${variant.products?.name || variant.option_name} is ready.` });
            if (immediate) navigate('/customer/cart');
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.message || "Out of stock", variant: "destructive" });
        }
    }, [addToCart, id, navigate, toast]);

    // ⚠️ useMemo MUST be before any early returns (Rules of Hooks)
    const products = stream?.products || [];

    // Group all variants of the selected product for the Detail Sheet
    const selectedProductGroup = useMemo(() => {
        if (!selectedProductId) return null;
        const allVariants = products.filter((p: any) => p.product_variants?.products?.product_id === selectedProductId);
        if (allVariants.length === 0) return null;
        const first = allVariants[0];
        return {
            product_id: selectedProductId,
            product_name: first.product_variants?.products?.name,
            description: first.product_variants?.description,
            variants: allVariants, // all variants (Standard, Combo, etc.)
        };
    }, [selectedProductId, products]);

    // The currently selected variant within the Detail Sheet
    const currentVariant = useMemo(() => {
        if (!selectedProductGroup || !selectedVariantId) return selectedProductGroup?.variants[0] || null;
        return selectedProductGroup.variants.find((v: any) => v.variant_id === selectedVariantId) || selectedProductGroup.variants[0];
    }, [selectedProductGroup, selectedVariantId]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#06070a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    <div className="w-14 h-14 rounded-full border-t-2 border-rose-500 animate-spin shadow-[0_0_20px_rgba(244,63,94,0.3)]" />
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-rose-500 animate-pulse">Connecting...</p>
                </div>
            </div>
        );
    }

    const featured = featuredProduct;
    const otherProducts = products.filter((p: any) => p.variant_id !== featured?.variant_id);

    return (
        <div className="fixed inset-0 bg-[#08090e] text-white font-sans overflow-hidden flex flex-col">

            {/* ── TOP NAVIGATION BAR ── */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#0c0d14]/80 backdrop-blur-sm border-b border-white/[0.04] shrink-0">
                <button onClick={() => navigate('/customer/home')} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Back</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">FigiCore</div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Live Shopping</div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-mono">
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>{heartsCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-mono">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span>{products.length} items live</span>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex flex-1 gap-0 overflow-hidden">

                {/* ══ LEFT: VIDEO PLAYER (60%) ══ */}
                <div className="flex-[6] flex flex-col p-4 gap-3 min-w-0">
                    {/* Video Container */}
                    <div className="flex-1 rounded-2xl overflow-hidden relative bg-neutral-900 border border-white/[0.06] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
                        {livekitToken && (
                            <LiveKitRoom token={livekitToken} serverUrl={livekitUrl} connect={true} video={false} audio={false} className="w-full h-full">
                                <AdminVideoStream />

                                {/* Video Overlay: Host Info */}
                                <div className="absolute top-4 left-4 flex items-center gap-2.5 z-10">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg ring-2 ring-black/30 shrink-0">
                                        {stream?.host_name?.[0] || 'H'}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-black text-white leading-none drop-shadow">{stream?.host_name || 'FigiCore Host'}</span>
                                        <div className="flex items-center gap-2">
                                            <LiveBadge />
                                            <ViewerCount />
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Buyer Notification (Social Proof) */}
                                <AnimatePresence>
                                    {recentBuyer && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -50, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 50, scale: 0.9 }}
                                            className="absolute top-20 left-4 z-20 bg-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.4)] px-4 py-2.5 rounded-2xl border border-emerald-400/50 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                <ShoppingBag className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black uppercase text-emerald-100 tracking-widest leading-none mb-1">New Order!</p>
                                                <p className="text-[10px] font-black text-white leading-none capitalize italic">
                                                    {recentBuyer.name} just copped {recentBuyer.product}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Floating Reactions Layer */}
                                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                                    <AnimatePresence>
                                        {reactions.map(r => (
                                            <FloatingReaction key={r.id} reaction={r} onComplete={rid => setReactions(p => p.filter(x => x.id !== rid))} />
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Chat Overlay on Video */}
                                <div className="absolute bottom-4 left-4 z-30 w-[320px] flex flex-col gap-2 pointer-events-none">
                                    {/* Messages Display */}
                                    <div
                                        className="h-[260px] overflow-y-auto scrollbar-none flex flex-col justify-end pointer-events-auto pb-1"
                                        style={{ maskImage: 'linear-gradient(to top, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)' }}
                                    >
                                        <div className="space-y-1.5 flex flex-col">
                                            {chatMessages.slice(-40).map((msg, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex gap-2 items-baseline w-fit max-w-full drop-shadow-md"
                                                >
                                                    <div className={`text-[12px] px-3 py-1.5 rounded-2xl leading-tight max-w-[280px] break-words ${msg.isAdmin
                                                        ? 'bg-rose-600/90 text-white font-bold border border-rose-500/30'
                                                        : 'bg-black/40 backdrop-blur-sm text-white/95 border border-white/10'
                                                        }`}>
                                                        <span className={`font-black mr-1.5 text-[10px] ${msg.isAdmin ? 'text-rose-100' : getRankColor(msg.rank)}`}>{msg.name}</span>
                                                        {msg.text}
                                                    </div>
                                                </motion.div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>
                                    </div>

                                    {/* Chat Input */}
                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/[0.07] rounded-2xl px-3 py-2 shrink-0 pointer-events-auto shadow-xl">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                            placeholder="Live chat..."
                                            className="flex-1 bg-transparent text-xs text-white placeholder:text-neutral-400 outline-none"
                                        />
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="text-neutral-400 hover:text-white transition-colors">
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent side="top" align="start" className="p-0 border-none bg-transparent z-50">
                                                <EmojiPicker theme={Theme.DARK} onEmojiClick={d => setChatInput(p => p + d.emoji)} height={320} width={280} />
                                            </PopoverContent>
                                        </Popover>
                                        <button onClick={handleSendChat} className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-500 flex items-center justify-center transition-all shrink-0">
                                            <Zap className="w-3.5 h-3.5 fill-current text-white" />
                                        </button>
                                    </div>
                                </div>
                            </LiveKitRoom>
                        )}
                    </div>

                    {/* Reaction Bar below video */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            {['❤️', '🔥', '👏', '🚀', '🎁'].map(symbol => (
                                <motion.button
                                    key={symbol}
                                    whileTap={{ scale: 0.75 }}
                                    whileHover={{ scale: 1.15 }}
                                    onClick={() => handleReaction(symbol)}
                                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-lg transition-all"
                                >
                                    {symbol}
                                </motion.button>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/customer/cart')}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-bold text-neutral-400 hover:text-white"
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            View Cart
                        </button>
                    </div>
                </div>

                {/* ══ RIGHT: PRODUCT PANEL (40%) ══ */}
                <div className="flex-[4] flex flex-col border-l border-white/[0.05] bg-[#0c0d15] overflow-hidden min-w-[340px] max-w-[460px] relative">

                    {/* Featured Product Hero */}
                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.05] shrink-0">
                        <div className="text-[8px] font-black uppercase text-neutral-600 tracking-[0.3em] mb-3 flex items-center gap-2">
                            {pinnedProduct ? (
                                <><Tag className="w-3 h-3 text-amber-500" /><span className="text-amber-500">Now Featured</span></>
                            ) : (
                                <><Star className="w-3 h-3 text-rose-500" /><span className="text-rose-500">Featured Product</span></>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {featured ? (
                                <motion.div key={featured.variant_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <div className="flex gap-4">
                                        {/* Product Image — click to open detail sheet */}
                                        <button
                                            onClick={() => setSelectedProductId(featured.product_variants?.products?.product_id)}
                                            className="w-28 h-28 rounded-2xl bg-neutral-800 border border-white/5 overflow-hidden shrink-0 relative group cursor-pointer"
                                        >
                                            <img
                                                src={featured.product_variants?.media_assets?.[0]?.url || "/placeholder.png"}
                                                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                                alt=""
                                            />
                                            {/* Timer Overlay */}
                                            {flashSaleEnds[featured.variant_id] && (
                                                <FlashSaleTimer endTime={flashSaleEnds[featured.variant_id]} />
                                            )}
                                            {/* Badge: FLASH SALE or LIVE -2% — only show if timer hasn't expired */}
                                            {isFlashActive(featured.variant_id, featured.flash_sale_price) ? (
                                                <div className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                    <Flame className="w-2 h-2" />SALE
                                                </div>
                                            ) : (
                                                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                    <Zap className="w-2 h-2" />-2%
                                                </div>
                                            )}
                                            {/* Hover: View Detail */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center rounded-2xl">
                                                <div className="opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 flex flex-col items-center gap-1">
                                                    <Info className="w-5 h-5 text-white" />
                                                    <span className="text-[7px] font-black text-white uppercase tracking-widest">Details</span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <button
                                                    onClick={() => setSelectedProductId(featured.product_variants?.products?.product_id)}
                                                    className="text-left w-full group"
                                                >
                                                    <h2 className="text-sm font-black text-white leading-tight mb-1 line-clamp-2 uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                                                        {featured.product_variants?.products?.name || featured.product_variants?.option_name || 'Product'}
                                                    </h2>
                                                </button>
                                                <span className="text-[9px] text-neutral-500 font-bold uppercase">{featured.product_variants?.option_name}</span>
                                            </div>

                                            <div>
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-xl font-black text-rose-500 font-mono leading-none">
                                                        {fmt(computeLivePrice(Number(featured.product_variants?.price), featured.flash_sale_price))}
                                                    </span>
                                                    <span className="text-xs text-neutral-600 line-through font-mono">
                                                        {fmt(Number(featured.product_variants?.price))}
                                                    </span>
                                                </div>
                                                {isFlashActive(featured.variant_id, featured.flash_sale_price) ? (
                                                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-rose-600/20 border border-rose-500/30 rounded-full">
                                                        <Flame className="w-2.5 h-2.5 text-rose-500" />
                                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-wide">Flash Sale — Limited!</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                                                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-wide">Live Exclusive -2%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Buttons */}
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            onClick={() => handleAddToCart(featured.product_variants)}
                                            variant="outline"
                                            className="flex-1 h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-wider"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                                            Add to Cart
                                        </Button>
                                        <Button
                                            onClick={() => handleAddToCart(featured.product_variants, true)}
                                            className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-rose-900/30"
                                        >
                                            Buy Now →
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-6 text-center opacity-20">
                                    <Package className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest">No featured product</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Other Products List — Phương án A: Grid 2 cột dọc, scroll dọc tự nhiên */}
                    {otherProducts.length > 0 && (
                        <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 min-h-0">
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="text-[8px] font-black uppercase text-neutral-600 tracking-[0.3em]">Also Available</div>
                                <span className="text-[8px] font-mono text-neutral-700">{otherProducts.length} items</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {otherProducts.map((p: any) => (
                                    <motion.div
                                        key={p.variant_id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 group"
                                    >
                                        {/* Tap to open detail sheet */}
                                        <button
                                            onClick={() => setSelectedProductId(p.product_variants?.products?.product_id)}
                                            className="w-full text-left"
                                        >
                                            <div className="w-full aspect-square bg-neutral-900 relative overflow-hidden">
                                                <img
                                                    src={p.product_variants?.media_assets?.[0]?.url || "/placeholder.png"}
                                                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                                                    alt=""
                                                />
                                                {isFlashActive(p.variant_id, p.flash_sale_price) ? (
                                                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-rose-600 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full">
                                                        <Flame className="w-2 h-2" />SALE
                                                    </div>
                                                ) : (
                                                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-amber-500 text-black text-[6px] font-black px-1.5 py-0.5 rounded-full">
                                                        <Zap className="w-2 h-2" />-2%
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                    <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                        <Info className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </div>
                                                <AnimatePresence>
                                                    {addedProductId === p.variant_id && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                            className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                                                        >
                                                            <span className="text-emerald-400 text-[9px] font-black">✓ Added</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="px-2.5 pt-2 pb-2">
                                                <p className="text-[9px] font-black text-white leading-tight line-clamp-2 uppercase group-hover:text-amber-400 transition-colors mb-1">
                                                    {p.product_variants?.products?.name || p.product_variants?.option_name}
                                                </p>
                                                <p className="text-[9px] font-black text-rose-500 font-mono leading-none">
                                                    {fmt(computeLivePrice(Number(p.product_variants?.price), p.flash_sale_price))}
                                                </p>
                                                <p className="text-[8px] text-neutral-600 line-through font-mono mt-0.5">
                                                    {fmt(Number(p.product_variants?.price))}
                                                </p>
                                            </div>
                                        </button>
                                        {/* Quick Add to Cart */}
                                        <div className="px-2.5 pb-2.5">
                                            <button
                                                onClick={() => handleAddToCart(p.product_variants)}
                                                className="w-full h-7 rounded-xl bg-white/5 hover:bg-rose-600/80 border border-white/10 hover:border-rose-500/50 text-white text-[8px] font-black uppercase tracking-wide transition-all"
                                            >
                                                + Cart
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Product Detail Sheet — Multi-Variant, Reactive ── */}
                    <AnimatePresence>
                        {selectedProductId && selectedProductGroup && currentVariant && (
                            <motion.div
                                key={selectedProductId}
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                className="absolute bottom-0 left-0 right-0 z-30 bg-[#10111a] border-t border-white/10 rounded-t-3xl shadow-2xl p-5"
                                style={{ maxHeight: '75%', overflowY: 'auto' }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Product Detail</span>
                                    <button onClick={() => { setSelectedProductId(null); setSelectedVariantId(null); }} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Image — updates per selected variant */}
                                <div className="w-full h-40 rounded-2xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center relative">
                                    <img
                                        src={currentVariant.product_variants?.media_assets?.[0]?.url || "/placeholder.png"}
                                        className="h-full object-contain p-3 transition-opacity duration-200"
                                        alt=""
                                    />
                                    {currentVariant.flash_sale_price && flashSaleEnds[currentVariant.variant_id] && (
                                        <FlashSaleTimer endTime={flashSaleEnds[currentVariant.variant_id]} />
                                    )}
                                </div>

                                {/* Product Name */}
                                <h3 className="text-sm font-black text-white uppercase mb-1 leading-tight">
                                    {selectedProductGroup.product_name}
                                </h3>

                                {/* Variant Selector — shows all variants as pills */}
                                {selectedProductGroup.variants.length > 1 && (
                                    <div className="mb-4">
                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-2">Select Option</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProductGroup.variants.map((v: any) => {
                                                const isActive = (selectedVariantId ?? selectedProductGroup.variants[0].variant_id) === v.variant_id;
                                                const livePrice = computeLivePrice(Number(v.product_variants?.price), v.flash_sale_price);
                                                return (
                                                    <button
                                                        key={v.variant_id}
                                                        onClick={() => setSelectedVariantId(v.variant_id)}
                                                        className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${
                                                            isActive
                                                                ? 'border-rose-500 bg-rose-600/10 text-white'
                                                                : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/20 hover:text-white'
                                                        }`}
                                                    >
                                                        <span className="text-[9px] font-black uppercase leading-none mb-1">
                                                            {v.product_variants?.option_name}
                                                        </span>
                                                        <span className={`text-[10px] font-black font-mono ${ isFlashActive(v.variant_id, v.flash_sale_price) ? 'text-rose-400' : 'text-amber-400'}` }>
                                                            {fmt(livePrice)}
                                                        </span>
                                                        {isFlashActive(v.variant_id, v.flash_sale_price) && (
                                                            <span className="text-[7px] font-black text-rose-500 uppercase tracking-wide mt-0.5 flex items-center gap-0.5">
                                                                <Flame className="w-2 h-2" />SALE
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Selected Variant Info */}
                                <div className="mb-4">
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase mb-2">
                                        {currentVariant.product_variants?.option_name}&nbsp;·&nbsp;SKU: {currentVariant.product_variants?.sku}
                                    </p>
                                    <div className="flex items-baseline gap-2 mb-1.5">
                                        <span className="text-2xl font-black text-rose-500 font-mono">
                                            {fmt(computeLivePrice(Number(currentVariant.product_variants?.price), currentVariant.flash_sale_price))}
                                        </span>
                                        <span className="text-sm text-neutral-600 line-through font-mono">
                                            {fmt(Number(currentVariant.product_variants?.price))}
                                        </span>
                                    </div>
                                    {isFlashActive(currentVariant.variant_id, currentVariant.flash_sale_price) ? (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600/20 border border-rose-500/30 rounded-full">
                                            <Flame className="w-2.5 h-2.5 text-rose-500" />
                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-wide">Flash Sale Active</span>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wide">Live Exclusive -2%</span>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {(selectedProductGroup.description || currentVariant.product_variants?.description) && (
                                    <MarkdownText
                                        text={currentVariant.product_variants?.description || selectedProductGroup.description}
                                        className="text-[11px] text-neutral-400 mb-4 leading-relaxed tracking-wide"
                                    />
                                )}

                                {/* Actions */}
                                <div className="flex flex-col gap-2 mt-2">
                                    <Button
                                        onClick={() => { handleAddToCart(currentVariant.product_variants, true); setSelectedProductId(null); setSelectedVariantId(null); }}
                                        className="w-full h-11 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                                    >
                                        <Zap className="w-4 h-4 mr-2 fill-current" />
                                        Buy Now
                                    </Button>
                                    <Button
                                        onClick={() => { handleAddToCart(currentVariant.product_variants); setSelectedProductId(null); setSelectedVariantId(null); }}
                                        variant="outline"
                                        className="w-full h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5 mr-2" />
                                        Add to Cart
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
