import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Clock, ShieldAlert, BadgeInfo, Zap, TrendingUp, Anchor, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { auctionsService } from "@/services/auctions.service";
import api from "@/services/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
} from "@/components/ui/dialog";

export default function CustomerAuctionRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);

    const [auction, setAuction] = useState<any>(null);
    const [auctionState, setAuctionState] = useState<any>({ currentPrice: 0, status: 'LOADING' });
    const [bids, setBids] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [incomingBid, setIncomingBid] = useState(false);
    const [isPlacingBid, setIsPlacingBid] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [isForfeited, setIsForfeited] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ message: string, type: string } | null>(null);
    const [emojis, setEmojis] = useState<{ id: number, emoji: string, leftP: number }[]>([]);
    // [Gap 11] Countdown state — driven by real end_time, updated on anti-snipe
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState<string>('--:--:--');
    const emojiIdCounter = useRef(0);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    useEffect(() => {
        if (!user || !id) return;

        let isMounted = true;

        const loadAuction = async () => {
            try {
                const data = await auctionsService.getAuctionById(Number(id));
                if (!isMounted) return;
                setAuction(data);

                if (data.status_code === 'COMPLETED' || data.status_code === 'AWAITING_PAYMENT' || data.status_code === 'FAILED_NO_BUYER') {
                    // Load static data
                    setAuctionState({
                        currentPrice: data.auction_bids?.[0] ? Number(data.auction_bids[0].bid_amount) : Number(data.start_price),
                        // Treat COMPLETED with winner as AWAITING_PAYMENT for UI purposes
                        status: data.status_code
                    });

                    setBids(data.auction_bids?.map((b: any) => ({
                        bidId: b.bid_id,
                        bidderName: b.users?.full_name || `User ID ${b.user_id}`,
                        bidAmount: Number(b.bid_amount),
                        createdAt: b.created_at
                    })) || []);

                    // [FIX] Kiểm tra winner cho cả COMPLETED (data cũ) và AWAITING_PAYMENT (data mới)
                    // Luôn luôn lấy trạng thái mới nhất từ API để check FORFEITED và WINNER chính xác.
                    try {
                        const statusData = await auctionsService.getMyStatus(Number(id));
                        const p = statusData?.participant;
                        if (p && p.status === 'WINNER') {
                            setIsWinner(true);
                        } else if (p && p.status === 'FORFEITED') {
                            setIsForfeited(true);
                        }
                    } catch { /* ignore */ }

                    // Backward compatibility cho COMPLETED nếu API getMyStatus không đủ thông tin
                    if (!isWinner && data.winner_id && user && data.winner_id === user.user_id) {
                        setIsWinner(true);
                    }
                    if (data.status_code === 'COMPLETED' && isWinner) {
                        setAuctionState((prev: any) => ({ ...prev, status: 'AWAITING_PAYMENT' }));
                    }

                    setIsLoading(false);

                } else {
                    // Initialize Socket for active/upcoming
                    const socket = io(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000'}/auction-live`);
                    socketRef.current = socket;

                    // [Gap 11] Khởi tạo countdown từ end_time của auction
                    if (data.end_time) setEndTime(new Date(data.end_time));

                    // Hydrate historical bids from API response (if any)
                    if (data.auction_bids && data.auction_bids.length > 0) {
                        setBids(data.auction_bids.map((b: any) => ({
                            bidId: b.bid_id,
                            bidderName: b.users?.full_name || `User ID ${b.user_id}`,
                            bidAmount: Number(b.bid_amount),
                            createdAt: b.created_at
                        })));
                    }

                    socket.on('connect', () => {
                        console.log('Connected to Auction Live Terminal');
                        socket.emit('join_room', { auctionId: Number(id), userId: user.user_id });
                        setIsLoading(false);
                    });

                    socket.on('room_state', (state: any) => {
                        setAuctionState(state);
                    });

                    socket.on('new_bid', (bid: any) => {
                        setBids((prev: any[]) => {
                            if (prev.some(p => p.bidId === bid.bidId)) return prev;
                            return [bid, ...prev];
                        });

                        setAuctionState((prev: any) => ({ ...prev, currentPrice: bid.bidAmount }));

                        setIncomingBid(true);
                        setTimeout(() => setIncomingBid(false), 500);
                    });

                    socket.on('bid_error', (error: any) => {
                        toast({ title: "Bid Rejected", description: error.message, variant: "destructive" });
                        setIsPlacingBid(false);
                    });

                    socket.on('auction_ended', (data: { auctionId: number, winnerId: number | null }) => {
                        setAuctionState((prev: any) => ({ ...prev, status: 'AWAITING_PAYMENT' }));
                        setIsWinner(user != null && data.winnerId === user.user_id);
                        setShowEndModal(true);
                    });

                    // [Gap 11] Anti-snipe: server gia hạn end_time → cập nhật countdown
                    socket.on('end_time_extended', (data: { auctionId: number, newEndTime: string }) => {
                        setEndTime(new Date(data.newEndTime));
                        setFlashMessage({ message: '⏱ +60s — Anti-Snipe!', type: 'warning' });
                        setTimeout(() => setFlashMessage(null), 3000);
                    });

                    // [Gap 10] Winner bị forfeit → thông báo cho top 2
                    socket.on('winner_forfeited', async (data: { auctionId: number, newWinnerId: number | null, status: string }) => {
                        setAuctionState((prev: any) => ({ ...prev, status: data.status }));

                        // Lấy trạng thái participant mới nhất
                        try {
                            const statusData = await auctionsService.getMyStatus(Number(id));
                            const p = statusData?.participant;
                            setIsWinner(p?.status === 'WINNER');
                            setIsForfeited(p?.status === 'FORFEITED');
                        } catch { /* ignore */ }

                        if (user && data.newWinnerId === user.user_id) {
                            setShowEndModal(true);
                            toast({ title: '🎯 Cơ hội của bạn!', description: 'Người thắng không thanh toán. Bạn được quyền mua!', className: 'bg-amber-600 text-white border-none' });
                        } else if (data.status === 'FAILED_NO_BUYER') {
                            toast({ title: 'Auction kết thúc', description: 'Không có người mua.', variant: 'destructive' });
                        }
                    });

                    socket.on('auction_announcement', (data: any) => {
                        setFlashMessage({ message: data.message, type: data.type });
                        setTimeout(() => setFlashMessage(null), 5000);
                    });

                    socket.on('room_emoji', (data: any) => {
                        const newEmoji = {
                            id: emojiIdCounter.current++,
                            emoji: data.emoji,
                            leftP: Math.random() * 80 + 10 // 10% to 90%
                        };
                        setEmojis((prev) => [...prev, newEmoji]);
                        // Remove after animation (2000ms duration)
                        setTimeout(() => {
                            setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
                        }, 2000);
                    });
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to load details", variant: "destructive" });
                navigate('/customer/auctions');
            }
        };

        loadAuction();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [id, user]);

    // [Gap 11] Countdown ticker — updates every second from endTime
    useEffect(() => {
        if (!endTime) return;
        const tick = () => {
            const diff = endTime.getTime() - Date.now();
            if (diff <= 0) {
                setCountdown('00:00:00');
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    const handlePlaceBid = (addedAmount: number) => {
        if (!socketRef.current || !id || !user) return;
        setIsPlacingBid(true);
        const targetAmount = auctionState.currentPrice + addedAmount;
        socketRef.current.emit('place_bid', {
            auctionId: Number(id),
            userId: user.user_id,
            bidAmount: targetAmount
        });
        setTimeout(() => setIsPlacingBid(false), 800); // Debounce visual
    };

    const handleDirectBid = () => {
        if (!socketRef.current || !id || !user) return;
        setIsPlacingBid(true);
        socketRef.current.emit('place_bid', {
            auctionId: Number(id),
            userId: user.user_id,
            bidAmount: auctionState.currentPrice + 100000 // Assuming default step if they just click
        });
        setTimeout(() => setIsPlacingBid(false), 800);
    };

    // Navigate to standard Checkout using order's paymentRef — resolves auction order by prefix
    const handleClaimCheckout = async () => {
        try {
            const res = await api.get(`/orders/by-code/AUC-${id}`);
            const orders: any[] = Array.isArray(res.data) ? res.data : [res.data];
            if (orders.length === 0) throw new Error('No order found');

            // Find any PENDING_PAYMENT order for this auction
            const pendingOrder = orders.find((o: any) => o.status_code === 'PENDING_PAYMENT') || orders[0];
            const paymentRef = pendingOrder?.payment_ref_code;

            if (paymentRef) {
                navigate('/customer/checkout', { state: { paymentRef } });
            } else {
                // Fallback: use legacyAuctionFlag
                navigate('/customer/checkout', { state: { legacyAuctionFlag: true, orderId: `AUC-${id}` } });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Could not load order details. Please try again.', variant: 'destructive' });
        }
    };

    const handleSendEmoji = (emoji: string) => {
        if (!socketRef.current || !id) return;
        socketRef.current.emit('send_emoji', { auctionId: Number(id), emoji });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 bg-red-600/20 blur-xl rounded-full animate-pulse z-0"></div>
                    <div className="animate-spin w-12 h-12 border-2 border-white/10 border-t-red-500 rounded-full z-10"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black font-sans text-white overflow-hidden selection:bg-red-500/30">

            {/* Flash Announcement Overlay */}
            {flashMessage && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[90vw] md:w-auto max-w-4xl px-8 md:px-16 py-8 bg-red-600/90 backdrop-blur-2xl border-4 border-red-500 rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.8)] text-center animate-in zoom-in spin-in-12 duration-700 pointer-events-none">
                    <span className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-yellow-400 animate-ping"></span>
                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-widest uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        {flashMessage.message}
                    </h1>
                </div>
            )}

            {/* Floating Emojis Layer */}
            <div className="absolute inset-x-0 bottom-0 h-[60vh] pointer-events-none z-[80] overflow-hidden">
                {emojis.map((em) => (
                    <div
                        key={em.id}
                        className="absolute bottom-0 text-4xl animate-float-up opacity-0"
                        style={{ left: `${em.leftP}%` }}
                    >
                        {em.emoji}
                    </div>
                ))}
            </div>

            {/* Immersive Background Lighting */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 z-0 ${incomingBid ? 'opacity-100' : 'opacity-40'}`}>
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] bg-red-600/10 blur-[200px] rounded-full mix-blend-screen"></div>
                {incomingBid && (
                    <div className="absolute inset-0 bg-red-600/5 mix-blend-screen animate-in fade-in duration-100"></div>
                )}
            </div>

            {/* Header / Navbar - Sleeker, completely transparent */}
            <header className="h-14 border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 lg:px-10 absolute top-0 left-0 w-full z-50">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/customer/auctions')} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] leading-none mb-1 flex items-center gap-2">
                            {auctionState.status === 'COMPLETED' ? (
                                <><span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span> Vault Archive</>
                            ) : (
                                <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></span> Live Terminal</>
                            )}
                        </span>
                        <h1 className="text-lg font-black text-white leading-none tracking-tight">VAULT #{id}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-black/40 backdrop-blur-md text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                        <ShieldAlert className="w-3.5 h-3.5" /> SECURE CONNECTION
                    </div>
                </div>
            </header>

            {/* Main Content Spli - Fill screen, flex */}
            <main className="absolute top-14 left-0 right-0 bottom-0 flex flex-col lg:flex-row z-10">

                {/* Left side: Immersive Product Theater (65%) */}
                <div className="flex-[1.5] relative flex flex-col items-center justify-center p-2 lg:p-4 overflow-hidden group">

                    {/* Blurred Product Image Background for Depth */}
                    {/* Since this is a placeholder without actual image data yet, we use a glowing div that mimics a blurred image */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
                        <div className="w-[150%] h-[150%] bg-gradient-to-tr from-neutral-800 to-neutral-900 rounded-full blur-[100px] scale-150 saturate-150 mix-blend-screen transition-all duration-[2s]"></div>
                    </div>

                    {/* Floating Product Image - No Box */}
                    <div className="relative w-full max-w-2xl xl:max-w-4xl max-h-[50vh] flex items-center justify-center z-10">
                        {/* Shadow Base for perspective */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-black blur-xl rounded-full opacity-80"></div>

                        {/* Placeholder 3D-feeling Image Representation */}
                        <div className={`w-full h-[30vh] xl:h-[40vh] flex items-center justify-center flex-col gap-4 text-white/5 relative z-10 transition-transform duration-[2s] ${incomingBid ? 'scale-105 drop-shadow-[0_0_40px_rgba(220,38,38,0.2)]' : 'hover:scale-[1.02] drop-shadow-[0_40px_50px_rgba(0,0,0,0.9)]'}`}>
                            {(() => {
                                const variant = auction?.product_variants;
                                const mainProduct = variant?.products;
                                let imageUrl = null;
                                if (variant?.media_assets) {
                                    const assets = typeof variant.media_assets === 'string' ? JSON.parse(variant.media_assets) : variant.media_assets;
                                    imageUrl = assets[0]?.url;
                                } else if (mainProduct?.media_urls) {
                                    const assets = typeof mainProduct.media_urls === 'string' ? JSON.parse(mainProduct.media_urls) : mainProduct.media_urls;
                                    imageUrl = assets[0];
                                }

                                return imageUrl ? (
                                    <img src={imageUrl} alt={mainProduct?.name} className="w-[80%] max-h-full object-contain filter drop-shadow-2xl z-10" />
                                ) : (
                                    <>
                                        <Anchor className="w-48 h-48 drop-shadow-2xl" />
                                        <span className="text-sm font-mono tracking-[0.3em] uppercase opacity-50">Awaiting Product Feed</span>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Minimalist Floating Overlay Data (Bottom Left) */}
                    <div className="absolute bottom-6 lg:bottom-8 left-4 lg:left-8 z-20 pointer-events-none opacity-0 md:opacity-100 transition-opacity">
                        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-4 lg:p-5 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] max-w-sm">
                            <h2 className="text-lg lg:text-xl font-black text-white mb-2 tracking-tight">{auction?.product_variants?.products?.name || "Loading..."}</h2>
                            <div className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest"><BadgeInfo className="w-3.5 h-3.5 text-neutral-500" /> {auction?.product_variants?.option_name || "Edition"}</span>
                                <span className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Authenticity Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: The Glassmorphic Terminal (35%) */}
                <div className="w-full lg:w-[320px] xl:w-[360px] h-full flex flex-col p-2 z-20 shrink-0">

                    <div className="flex-1 bg-white/10 border border-white/20 rounded-[1.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[40px] flex flex-col relative overflow-hidden h-full">

                        {/* Terminal Background Glow */}
                        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent pointer-events-none mix-blend-overlay"></div>

                        {/* Top: Current Highest Bid Focus Area */}
                        <div className={`p-2 xl:p-3 border-b border-white/20 flex flex-col items-center justify-center text-center transition-all duration-300 relative shrink-0 ${incomingBid ? 'bg-rose-500/20' : ''}`}>

                            {/* Pulse burst on new bid */}
                            {incomingBid && <div className="absolute inset-0 border-2 border-rose-500/60 rounded-t-[1.5rem] animate-out fade-out zoom-out-150 duration-700 pointer-events-none"></div>}

                            <div className="flex items-center justify-center gap-2 bg-rose-500/20 border border-rose-400/30 px-3 py-1 rounded-full mb-1 relative shadow-inner">
                                <span className="absolute -left-1 -top-1 w-2 h-2 bg-rose-400 rounded-full animate-ping shadow-[0_0_8px_rgba(244,63,94,1)]"></span>
                                <Clock className="w-3.5 h-3.5 text-rose-300 drop-shadow-md" />
                                <span className={`text-xs font-bold font-mono tracking-widest drop-shadow-md ${countdown.startsWith('00:00') ? 'text-red-300 animate-pulse' : 'text-rose-200'}`}>
                                    {countdown}
                                </span>
                            </div>

                            <p className="text-[9px] font-mono text-white/70 uppercase tracking-[0.2em] mb-0.5 drop-shadow-sm">
                                {auctionState.status === 'COMPLETED' ? 'Final Hammer Price' : 'Target Price'}
                            </p>

                            {/* Make the price massive */}
                            <div className={`text-xl xl:text-3xl font-black tracking-tighter mb-1.5 transition-all duration-300 ${incomingBid ? 'text-rose-300 scale-110 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]' : 'text-white drop-shadow-lg'}`}>
                                {formatPrice(auctionState.currentPrice)}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] xl:text-xs font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                <span className="text-neutral-500 uppercase tracking-widest">Status:</span>
                                <span className={auctionState.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{auctionState.status}</span>
                            </div>
                        </div>

                        {/* Middle: Data Stream (Log) */}
                        <div className="flex-1 p-2 flex flex-col justify-end relative overflow-y-auto overflow-x-hidden inner-shadow-top min-h-0 scrollbar-hide">
                            {/* Gradient mask to fade out the top logs */}
                            <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-neutral-900/90 to-transparent z-10 pointer-events-none mix-blend-overlay"></div>

                            <div className="space-y-1.5 relative z-0 flex flex-col justify-end min-h-full pb-2">
                                {bids.length === 0 && (
                                    <div className="h-full flex items-center justify-center flex-1">
                                        <p className="font-mono text-sm text-neutral-500 uppercase tracking-widest opacity-50">Log Terminal Awaiting Data...</p>
                                    </div>
                                )}

                                {bids.slice(0, 30).map((bid, idx) => (
                                    <div key={bid.bidId} className={`flex justify-between items-center transition-all duration-300 ${idx === 0 ? `bg-white/10 p-2 rounded-xl border backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${incomingBid ? 'border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105 -translate-y-1' : 'border-white/20'}` : 'opacity-40 hover:opacity-100 drop-shadow-sm'}`}>
                                        <div className="flex flex-col gap-0.5">
                                            <div className={`text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${idx === 0 ? 'text-rose-300 drop-shadow-md' : 'text-white/50'}`}>
                                                {idx === 0 ? <TrendingUp className="w-3 h-3 text-rose-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>}
                                                LIVE
                                            </div>
                                            <div className={`text-sm font-bold flex items-center gap-1.5 drop-shadow-md ${idx === 0 ? 'text-white' : 'text-white/80'}`}>
                                                {bid.bidderName} {idx === 0 && <BadgeInfo className="w-3.5 h-3.5 text-blue-300 drop-shadow-md" />}
                                            </div>
                                        </div>
                                        <div className={idx === 0 ? 'text-base font-black text-rose-100 px-2.5 py-1 bg-rose-500/20 border border-rose-400/30 rounded-lg shadow-inner' : 'text-xs font-mono text-white/70 border border-white/20 px-2 py-1 rounded-lg bg-white/5 backdrop-blur-sm'}>
                                            {formatPrice(bid.bidAmount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom: Action Command Panel */}
                        {auctionState.status === 'ACTIVE' || auctionState.status === 'UPCOMING' ? (
                            <div className="p-2 border-t border-white/20 bg-white/5 backdrop-blur-xl relative z-20 shrink-0">
                                <div className="grid grid-cols-3 gap-1.5 mb-2">
                                    {[1, 2, 5].map(multiplier => {
                                        const stepValue = auction ? Number(auction.step_price) * multiplier : 0;
                                        return (
                                            <Button
                                                key={multiplier}
                                                disabled={isPlacingBid || auctionState.status !== 'ACTIVE' || !stepValue}
                                                onClick={() => handlePlaceBid(stepValue)}
                                                variant="outline"
                                                className="h-7 bg-white/10 border-white/20 hover:bg-white/30 hover:border-white/40 text-white font-mono text-[9px] font-bold tracking-wider rounded-md transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md"
                                            >
                                                +{stepValue >= 1000 ? `${stepValue / 1000}K` : stepValue}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button onClick={handleDirectBid} disabled={isPlacingBid || auctionState.status !== 'ACTIVE'} size="lg" className="w-full h-10 rounded-xl bg-white text-black hover:bg-neutral-100 hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)] font-black uppercase tracking-[0.2em] text-[10px] xl:text-xs transition-all duration-300 relative group overflow-hidden">
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out mix-blend-overlay z-0"></span>
                                    <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-md">
                                        {isPlacingBid ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Zap className="w-3.5 h-3.5 fill-current" />}
                                        {auctionState.status !== 'ACTIVE' ? 'AWAITING START' : 'INITIALIZE BID'}
                                    </span>
                                </Button>
                            </div>
                        ) : isForfeited ? (
                            <div className="p-2 border-t border-red-500/30 bg-red-500/5 backdrop-blur-xl relative z-20 flex flex-col gap-2 shrink-0">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                                    <XCircle className="w-4 h-4 text-red-500 mb-1" />
                                    <p className="text-[9px] font-mono text-red-400 tracking-widest uppercase mb-0.5">Order Cancelled & Forfeited</p>
                                    <p className="text-[10px] font-medium text-white/80">Bạn đã hủy đơn hàng. Quyền mua đã bị hủy bỏ và tiền cọc đã bị tịch thu.</p>
                                </div>
                                <Button onClick={() => navigate('/customer/auctions')} size="lg" className="w-full h-10 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-white rounded-xl font-black uppercase tracking-widest transition-all text-[10px]">
                                    Return to Vault
                                </Button>
                            </div>
                        ) : auctionState.status === 'AWAITING_PAYMENT' && isWinner ? (
                            // Winner panel — AWAITING PAYMENT
                            <div className="p-2 border-t border-amber-500/30 bg-amber-500/5 backdrop-blur-xl relative z-20 flex flex-col gap-2 shrink-0">
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                                    <Trophy className="w-4 h-4 text-amber-400 mb-1" />
                                    <p className="text-[9px] font-mono text-amber-300 tracking-widest uppercase mb-0.5">You Won — Payment Required</p>
                                    <p className="text-[10px] font-medium text-white/80">Secure checkout within 24h or forfeit your deposit.</p>
                                </div>
                                {/* Navigate to standard Checkout via paymentRef of auction order */}
                                <Button
                                    onClick={handleClaimCheckout}
                                    size="lg"
                                    className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black uppercase tracking-widest transition-all text-[10px] shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                >
                                    🏆 Claim — Go to Checkout
                                </Button>
                            </div>
                        ) : auctionState.status === 'FAILED_NO_BUYER' ? (
                            // No buyer — auction closed
                            <div className="p-2 border-t border-white/20 bg-white/5 backdrop-blur-xl relative z-20 flex flex-col gap-2 shrink-0">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                                    <XCircle className="w-4 h-4 text-red-400 mb-1" />
                                    <p className="text-[9px] font-mono text-red-300 tracking-widest uppercase mb-0.5">No Buyer — Auction Closed</p>
                                </div>
                                <Button onClick={() => navigate('/customer/auctions')} size="lg" className="w-full h-8 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-lg font-bold uppercase tracking-widest transition-all text-[10px]">
                                    Return to Vault
                                </Button>
                            </div>
                        ) : (
                            <div className="p-2 border-t border-white/20 bg-white/5 backdrop-blur-xl relative z-20 flex flex-col gap-2 shrink-0">
                                <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                                    <BadgeInfo className="w-4 h-4 text-neutral-400 mb-1" />
                                    <p className="text-[9px] font-mono text-neutral-400 tracking-widest uppercase mb-0.5">Auction Completed</p>
                                    <p className="text-[10px] font-medium text-white/80">This artifact has been secured and archived.</p>
                                </div>
                                <Button onClick={() => navigate('/customer/auctions')} size="lg" className="w-full h-8 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-lg shadow-none font-bold uppercase tracking-widest transition-all text-[10px]">
                                    Return to Vault Archives
                                </Button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Floating Reaction Bar */}
                {auctionState.status === 'ACTIVE' && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 p-2 md:px-4 md:py-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <Button variant="ghost" size="icon" onClick={() => handleSendEmoji('🔥')} className="w-10 h-10 md:w-12 md:h-12 rounded-full text-xl md:text-2xl hover:bg-rose-500/20 hover:scale-125 transition-transform"><span className="drop-shadow-lg">🔥</span></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSendEmoji('❤️')} className="w-10 h-10 md:w-12 md:h-12 rounded-full text-xl md:text-2xl hover:bg-rose-500/20 hover:scale-125 transition-transform"><span className="drop-shadow-lg">❤️</span></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSendEmoji('🚀')} className="w-10 h-10 md:w-12 md:h-12 rounded-full text-xl md:text-2xl hover:bg-rose-500/20 hover:scale-125 transition-transform"><span className="drop-shadow-lg">🚀</span></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSendEmoji('⚡')} className="w-10 h-10 md:w-12 md:h-12 rounded-full text-xl md:text-2xl hover:bg-rose-500/20 hover:scale-125 transition-transform"><span className="drop-shadow-lg">⚡</span></Button>
                    </div>
                )}

            </main>

            {/* Auction End Modal */}
            <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
                <DialogContent className="bg-[#050505]/95 backdrop-blur-3xl border border-white/10 text-white max-w-[420px] p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:rounded-[2.5rem] outline-none">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></div>

                    {isWinner ? (
                        <>
                            {/* Confetti Effect Background */}
                            <div className="absolute inset-0 max-w-[420px] bg-left-top bg-no-repeat bg-[radial-gradient(circle,rgba(255,215,0,0.15)_0%,transparent_50%),radial-gradient(circle,rgba(255,0,0,0.15)_0%,transparent_50%)] animate-pulse pointer-events-none z-0"></div>

                            <div className="p-8 pb-0 flex flex-col items-center text-center relative z-10 pt-12">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-white/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(251,191,36,0.5)] relative animate-bounce">
                                    <span className="text-4xl text-black">🎉</span>
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">YOU WON!</h2>
                                <DialogDescription className="text-neutral-300 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
                                    Congratulations! You secured the artifact for {auctionState.currentPrice ? formatPrice(auctionState.currentPrice) : 'Unknown Price'}.
                                </DialogDescription>
                            </div>
                            <div className="p-8 pt-6 relative z-10 flex flex-col gap-3">
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-2 text-center text-xs text-amber-200">
                                    Your deposit remains locked. Please proceed to Secure Checkout to finalize the remaining payment.
                                </div>
                                {/* Navigate to standard Checkout via paymentRef of auction order */}
                                <Button
                                    onClick={handleClaimCheckout}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-black h-14 rounded-2xl font-black uppercase tracking-widest text-[13px] transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                >
                                    Claim Artifact
                                </Button>
                                <Button variant="ghost" onClick={() => setShowEndModal(false)} className="w-full text-neutral-400 hover:text-white h-12 rounded-2xl font-medium tracking-wide text-[13px] transition-all">
                                    Dismiss
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-8 pb-0 flex flex-col items-center text-center relative z-10 pt-12">
                                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mb-6 shadow-inner relative">
                                    <Clock className="w-6 h-6 text-neutral-400" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Auction Concluded</h2>
                                <DialogDescription className="text-neutral-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                                    The hammer has fallen. Unfortunately, you did not secure the artifact this time.
                                </DialogDescription>
                            </div>
                            <div className="p-8 pt-6 relative z-10 flex flex-col gap-3">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2 text-center text-xs text-neutral-300">
                                    Your secure deposit of <strong className="text-white">{auction ? formatPrice(Number(auction.deposit_fee)) : ''}</strong> has been fully refunded to your wallet.
                                </div>
                                <Button onClick={() => navigate('/customer/auctions')} className="w-full bg-white hover:bg-neutral-200 text-black h-14 rounded-2xl font-bold uppercase tracking-widest text-[13px] transition-all">
                                    Return to Vaults
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Global CSS Override for Scrollbar in this room */}
            <style>{`
                .inner-shadow-top::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 40px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
                    z-index: 10;
                    pointer-events: none;
                }
                @keyframes float-up {
                    0% {
                        transform: translateY(0) scale(0.5);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                        transform: translateY(-20px) scale(1.2);
                    }
                    80% {
                        opacity: 0.8;
                        transform: translateY(-150px) scale(1);
                    }
                    100% {
                        transform: translateY(-200px) scale(0.8);
                        opacity: 0;
                    }
                }
                .animate-float-up {
                    animation: float-up 2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

// Add CSS to hide scrollbar
const style = document.createElement('style');
style.innerHTML = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
`;
document.head.appendChild(style);
