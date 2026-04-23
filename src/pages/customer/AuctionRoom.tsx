import { useState, useEffect, useRef, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Clock, ShieldAlert, Zap, Trophy, BadgeInfo, XCircle, Anchor, Smile, Monitor } from 'lucide-react';
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
import { LiveKitRoom, VideoTrack, AudioTrack, useTracks, TrackReference } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from "framer-motion";
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';

const FloatingReaction = memo(({ reaction, onComplete }: { reaction: { id: number; symbol: string; leftP: number }; onComplete: (id: number) => void }) => {
    return (
        <motion.div
            initial={{ y: 0, opacity: 1, scale: 0.5, x: 0 }}
            animate={{
                y: -400,
                opacity: 0,
                scale: 1.5,
                x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50]
            }}
            transition={{ duration: 3, ease: "easeOut" }}
            onAnimationComplete={() => onComplete(reaction.id)}
            className="absolute bottom-10 pointer-events-none text-2xl z-50"
            style={{ right: `${reaction.leftP}%` }}
        >
            {reaction.symbol}
        </motion.div>
    );
});

// Inner component to extract and render the admin's video + audio tracks
const AdminVideoStream = memo(() => {
    // Subscribe to the remote Camera track (video)
    const videoTracks = useTracks(
        [{ source: Track.Source.Camera, withPlaceholder: false }],
        { onlySubscribed: true }
    );

    // Subscribe to the remote Microphone track (audio)
    const audioTracks = useTracks(
        [{ source: Track.Source.Microphone, withPlaceholder: false }],
        { onlySubscribed: true }
    );

    const adminVideoTrack = videoTracks.find(t => t.participant.identity !== "" && t.publication);
    const adminAudioTracks = audioTracks.filter(t => t.participant.identity !== "" && t.publication);

    if (!adminVideoTrack) {
        return (
            <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-white/5 opacity-50 relative z-10 transition-transform duration-[2s]">
                <Anchor className="w-24 h-24 lg:w-48 lg:h-48 drop-shadow-2xl animate-pulse text-white/20" />
                <span className="text-sm font-mono tracking-[0.3em] uppercase opacity-70 text-white/40">Awaiting Broadcast...</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 relative z-10">
            {/* Render video */}
            <VideoTrack
                trackRef={adminVideoTrack as TrackReference}
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
            />
            {/* Render all audio tracks so customer can hear the broadcaster */}
            {adminAudioTracks.map(audioTrack => (
                <AudioTrack
                    key={audioTrack.participant.identity}
                    trackRef={audioTrack as TrackReference}
                />
            ))}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[10px] font-mono text-white tracking-widest uppercase">LIVE STREAM</span>
            </div>
        </div>
    );
});


const LiveViewerCount = memo(() => {
    const { localParticipant } = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();

    // Check if local participant is a viewer (not a publisher/admin)
    const isLocalViewer = localParticipant && !localParticipant.permissions?.canPublish;

    // Count remote viewers
    const remoteViewersCount = remoteParticipants.filter(p => !p.permissions?.canPublish).length;

    const totalViewers = (isLocalViewer ? 1 : 0) + remoteViewersCount;

    return (
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white/90">
            <span className="text-[10px]">👁</span>
            <span className="text-[10px] font-mono font-bold">{totalViewers}</span>
        </div>
    );
});

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
    const [reactions, setReactions] = useState<{ id: number; symbol: string; leftP: number }[]>([]);
    const reactionIdCounter = useRef(0);
    const [emojis, setEmojis] = useState<{ id: number, emoji: string, leftP: number }[]>([]);
    const emojiIdCounter = useRef(1);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState<string>('--:--:--');
    const [customBidInput, setCustomBidInput] = useState<string>('');
    const [customBidError, setCustomBidError] = useState<string | null>(null);

    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const livekitUrl = import.meta.env.VITE_LIVEKIT_WS_URL;

    // Chat state
    const [chatMessages, setChatMessages] = useState<{ id: number; name: string; text: string; isSelf: boolean; isAdmin?: boolean }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);


    // [New UX] Quick bid buttons logic - multiples of step_price
    const getQuickBidSteps = () => {
        const step = auction ? Number(auction.step_price) : 10000;
        return [step, step * 2, step * 5];
    };
    const quickBidSteps = getQuickBidSteps();

    // [New] Participation state
    const [isJoined, setIsJoined] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [isJoining, setIsJoining] = useState(false);

    const formatPrice = (p: number | string | undefined | null) => {
        const value = Number(p);
        if (isNaN(value)) return '0 đ';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
    };

    useEffect(() => {
        if (!user || !id) return;

        let isMounted = true;

        const loadAuction = async () => {
            try {
                const data = await auctionsService.getAuctionById(Number(id));
                if (!isMounted) return;
                setAuction(data);

                // [Unified Load] Always fetch latest status and balance for non-DRAFT auctions
                try {
                    const [statusData, walletRes] = await Promise.all([
                        auctionsService.getMyStatus(Number(id)),
                        api.get('/wallets/my-wallet')
                    ]);
                    setIsJoined(statusData?.is_joined || false);
                    setWalletBalance(Number(walletRes.data.balance_available) || 0);

                    const p = statusData?.participant;
                    if (p && p.status === 'WINNER') {
                        setIsWinner(true);
                    } else if (p && p.status === 'FORFEITED') {
                        setIsForfeited(true);
                    }
                } catch (err) {
                    console.error("Failed to fetch initial status/wallet:", err);
                }

                // [Guard] After time is up, ONLY the winner can enter (to pay). Others are blocked.
                const isTimeUp = ['AWAITING_PAYMENT', 'COMPLETED', 'FAILED_NO_BUYER', 'CANCELLED'].includes(data.status_code);
                const isCurrentUserWinner = data.winner_id != null && user?.user_id === data.winner_id;

                if (isTimeUp && !isCurrentUserWinner) {
                    toast({
                        title: '🔒 Room Archived',
                        description: 'The live session has concluded. You can find the results in the Vault Archives.',
                        variant: 'destructive'
                    });
                    navigate('/customer/auctions');
                    return;
                }

                // Treat COMPLETED with winner as AWAITING_PAYMENT for UI purposes
                setAuctionState({
                    currentPrice: data.auction_bids?.[0] ? Number(data.auction_bids[0].bid_amount) : Number(data.start_price),
                    status: (data.status_code === 'COMPLETED' && (data.winner_id || user?.user_id === data.winner_id)) ? 'AWAITING_PAYMENT' : data.status_code
                });

                // Hydrate historical bids from API response (if any)
                if (data.auction_bids && data.auction_bids.length > 0) {
                    setBids(data.auction_bids.map((b: any) => ({
                        bidId: b.bid_id,
                        bidderName: b.users?.full_name || `User ID ${b.user_id}`,
                        bidAmount: Number(b.bid_amount),
                        createdAt: b.created_at
                    })));
                }

                // Fetch LiveKit token for Customer (Viewer) - even if concluded, as long as room isn't closed
                try {
                    const tokenRes = await api.get(`/livekit/token`, {
                        params: {
                            room: `AUC-${id}`,
                            username: user?.full_name || `Viewer-${user?.user_id}`,
                            isHost: 'false'
                        }
                    });
                    if (isMounted) setLivekitToken(tokenRes.data.token);
                } catch (lkError) {
                    console.error("Failed to load LiveKit token:", lkError);
                }

                // Initialize Socket - always connect to receive room_closed
                const socketUrl = `${(import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com').replace('/api', '')}/auction-live`;
                
                console.log(`[Socket] Connecting to: ${socketUrl}`);
                const socket = io(socketUrl, {
                    transports: ['websocket', 'polling'],
                    withCredentials: true,
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });
                socketRef.current = socket;

                // [Gap 11] Initialize countdown from auction times
                if (data.start_time) setStartTime(new Date(data.start_time));
                if (data.end_time) setEndTime(new Date(data.end_time));

                socket.on('connect', () => {
                    console.log('Connected to Auction Live Terminal');
                    socket.emit('join_room', { auctionId: Number(id), userId: user.user_id });
                    setIsLoading(false);
                });

                socket.on('room_state', (state: any) => {
                    setAuctionState((prev: any) => ({ ...prev, ...state }));
                });

                socket.on('new_bid', (bid: any) => {
                    // Normalize bid amount and handle potential field name variations
                    const normalizedBid = {
                        bidId: bid.bidId || bid.bid_id,
                        bidderName: bid.bidderName || bid.user_name || bid.users?.full_name || 'Anonymous',
                        bidAmount: Number(bid.bidAmount || bid.bid_amount || bid.amount),
                        createdAt: bid.createdAt || bid.created_at || new Date().toISOString()
                    };

                    if (isNaN(normalizedBid.bidAmount)) {
                        console.error("Received invalid bid amount from socket:", bid);
                        return;
                    }

                    setBids((prev: any[]) => {
                        if (prev.some(p => p.bidId === normalizedBid.bidId)) return prev;
                        return [normalizedBid, ...prev];
                    });

                    setAuctionState((prev: any) => ({ ...prev, currentPrice: normalizedBid.bidAmount }));

                    setIncomingBid(true);
                    setTimeout(() => setIncomingBid(false), 500);
                });

                socket.on('bid_error', (error: any) => {
                    toast({ title: "Bid Rejected", description: error.message, variant: "destructive" });
                    setIsPlacingBid(false);
                });

                socket.on('auction_ended', (data: { auctionId: number, winnerId: number | null }) => {
                    const userIsWinner = user != null && data.winnerId === user.user_id;
                    setAuctionState((prev: any) => ({ ...prev, status: 'AWAITING_PAYMENT' }));
                    setIsWinner(userIsWinner);
                    // Auto-show result modal for all participants
                    setTimeout(() => setShowEndModal(true), 1200);
                    toast({ title: userIsWinner ? '🏆 You Won!' : 'Auction Ended', description: userIsWinner ? 'Proceed to checkout to claim your prize!' : 'Bidding is now closed.', className: userIsWinner ? 'bg-amber-600 text-white border-none' : 'bg-rose-600 text-white border-none' });
                });

                // [Gap 11] Anti-snipe: server extends end_time -> update countdown
                socket.on('end_time_extended', (data: { auctionId: number, newEndTime: string, message?: string }) => {
                    setEndTime(new Date(data.newEndTime));
                    toast({
                        title: '⏱ Time Extended',
                        description: data.message || 'Auction time has been extended!',
                        className: 'bg-amber-600 text-white font-bold'
                    });
                });

                socket.on('reaction_received', (data: { symbol: string }) => {
                    const id = ++reactionIdCounter.current;
                    const leftP = Math.floor(Math.random() * 20) + 5; // right side offset 5-25%
                    setReactions(prev => [...prev, { id, symbol: data.symbol, leftP }]);
                });

                socket.on('room_closed', (data: { message: string }) => {
                    toast({ title: 'Session Ended', description: data.message });
                    navigate('/customer/auctions');
                });

                // [New] Real-time participation/deposit detection
                socket.on('participation_updated', async (data: { userId: number, isJoined: boolean }) => {
                    if (user && data.userId === user.user_id) {
                        setIsJoined(data.isJoined);
                        try {
                            const walletRes = await api.get('/wallets/my-wallet');
                            setWalletBalance(Number(walletRes.data.balance_available) || 0);
                        } catch (err) { /* ignore */ }

                        if (data.isJoined) {
                            toast({ title: 'Verified', description: 'Registration complete. You can now bid!', className: 'bg-emerald-600 text-white border-none' });
                        }
                    }
                });

                // [Gap 10] Winner forfeited -> notify top 2
                socket.on('winner_forfeited', async (data: { auctionId: number, newWinnerId: number | null, status: string }) => {
                    setAuctionState((prev: any) => ({ ...prev, status: data.status }));

                    // Fetch latest participant status
                    try {
                        const statusData = await auctionsService.getMyStatus(Number(id));
                        const p = statusData?.participant;
                        setIsJoined(statusData?.is_joined || false);
                        setIsWinner(p?.status === 'WINNER');
                        setIsForfeited(p?.status === 'FORFEITED');
                    } catch { /* ignore */ }

                    if (user && data.newWinnerId === user.user_id) {
                        setShowEndModal(true);
                        toast({ title: '🎯 Your Chance!', description: 'Previous winner forfeited. You are authorized to purchase!', className: 'bg-amber-600 text-white border-none' });
                    } else if (data.status === 'FAILED_NO_BUYER') {
                        toast({ title: 'Auction Concluded', description: 'No buyer secured.', variant: 'destructive' });
                    }
                });

                socket.on('auction_announcement', (data: any) => {
                    toast({ title: 'System', description: data.message });
                });

                socket.on('room_emoji', (data: { emoji: string }) => {
                    const newId = emojiIdCounter.current++;
                    const newEmoji = {
                        id: newId,
                        emoji: data.emoji,
                        leftP: Math.random() * 80 + 10 // 10% to 90%
                    };
                    setEmojis((prev: any[]) => [...prev, newEmoji]);
                    // Remove after animation (2000ms duration)
                    setTimeout(() => {
                        setEmojis((prev: any[]) => prev.filter((e: any) => e.id !== newId));
                    }, 2000);
                });
                socket.on('chat_history', (history: any[]) => {
                    setChatMessages(history.map(msg => ({
                        id: msg.id,
                        name: msg.name,
                        text: msg.text,
                        isAdmin: msg.isAdmin || msg.name === 'Admin',
                        isSelf: user != null && msg.userId === user.user_id
                    })));
                });

                socket.on('chat_message', (msg: { messageId: number; userId: number; name: string; text: string }) => {
                    setChatMessages(prev => {
                        if (prev.some(m => m.id === msg.messageId)) return prev;
                        return [...prev, {
                            id: msg.messageId,
                            name: msg.name,
                            text: msg.text,
                            isAdmin: msg.name === 'Admin',
                            isSelf: user != null && msg.userId === user.user_id
                        }];
                    });
                });
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

    // [Auto-scroll chat]
    useEffect(() => {
        if (chatMessages.length > 0) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    useEffect(() => {
        const targetDate = auctionState.status === 'UPCOMING' ? startTime : endTime;
        if (!targetDate) return;
        
        const tick = () => {
            const diff = targetDate.getTime() - Date.now();
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
    }, [endTime, startTime, auctionState.status]);

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
        if (!socketRef.current || !id || !user || !auction) return;

        const incrementValue = Number(customBidInput.replace(/\D/g, ''));
        const stepValue = Number(auction.step_price);

        if (!incrementValue) {
            setCustomBidError("Please enter an amount to add");
            return;
        }

        // Validate multiple of step_price
        if (incrementValue % stepValue !== 0) {
            setCustomBidError(`Amount must be a multiple of ${formatPrice(stepValue)}`);
            return;
        }

        const bidValue = auctionState.currentPrice + incrementValue;

        setCustomBidError(null);
        setIsPlacingBid(true);
        socketRef.current.emit('place_bid', {
            auctionId: Number(id),
            userId: user.user_id,
            bidAmount: bidValue
        });
        setCustomBidInput(''); // reset input after bid
        setTimeout(() => setIsPlacingBid(false), 800);
    };

    const handleCustomBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, ''); // only digits

        if (raw) {
            // format as currency
            setCustomBidInput(Number(raw).toLocaleString('en-US'));
        } else {
            setCustomBidInput('');
        }
        setCustomBidError(null); // clear error when typing
    };

    const handleJoinConfirm = async () => {
        if (!id || !user || !auction) return;

        if (walletBalance < Number(auction.deposit_fee)) {
            toast({
                title: "Insufficient Balance",
                description: "Please top up your wallet to join the auction",
                variant: "destructive"
            });
            navigate('/customer/wallet');
            return;
        }

        setIsJoining(true);
        try {
            const res = await auctionsService.joinAuction(Number(id));
            if (res.success) {
                setIsJoined(true);
                setShowJoinModal(false);
                toast({
                    title: "Registration Success",
                    description: "You are now authorized to place bids",
                    className: "bg-emerald-600 text-white"
                });
                // Optionally refresh wallet balance
                const walletRes = await api.get('/wallets/my-wallet');
                setWalletBalance(Number(walletRes.data.balance_available) || 0);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to join auction",
                variant: "destructive"
            });
        } finally {
            setIsJoining(false);
        }
    };

    // Navigate to standard Checkout using order's paymentRef — resolves auction order by prefix
    const handleClaimCheckout = async () => {
        // [Guard] Check address before proceeding to checkout
        try {
            const addrRes = await api.get('/address');
            if (!addrRes.data || addrRes.data.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Shipping Address Required',
                    description: 'Please add a shipping address in your profile to complete checkout.'
                });
                navigate('/customer/profile');
                return;
            }
        } catch {
            // Silent fail — allow through if API unreachable
        }

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

    /*
    const handleSendEmoji = (emoji: string) => {
        if (!socketRef.current || !id) return;
        socketRef.current.emit('send_emoji', { auctionId: Number(id), emoji });
    };
    */

    const handleSendReaction = (symbol: string) => {
        if (!socketRef.current) return;
        socketRef.current.emit('send_reaction', { auctionId: Number(id), symbol });
        // Also show locally immediately for responsiveness
        const rid = ++reactionIdCounter.current;
        const leftP = Math.floor(Math.random() * 20) + 5;
        setReactions(prev => [...prev, { id: rid, symbol, leftP }]);
    };

    const removeReaction = (rid: number) => {
        setReactions(prev => prev.filter(r => r.id !== rid));
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 bg-red-600/20 blur-xl rounded-full animate-pulse z-0"></div>
                    <div className="animate-spin w-12 h-12 border-2 border-white/10 border-t-red-500 rounded-full z-10"></div>
                </div>
            </div>
        );
    }

    // Helper: generate a consistent colour for a username (for chat avatars)

    return (
        <div className="fixed inset-0 font-sans text-white overflow-hidden bg-[#08090d]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1)_0%,_rgba(8,9,13,1)_100%)] pointer-events-none" />

            {/* ── Floating Emojis ── */}
            <div className="absolute inset-x-0 bottom-0 h-[60vh] pointer-events-none z-[80] overflow-hidden">
                {emojis.map((em: any) => (
                    <div key={em.id} className="absolute bottom-0 text-4xl animate-float-up opacity-0" style={{ left: `${em.leftP}%` }}>
                        {em.emoji}
                    </div>
                ))}
            </div>

            {/* ════════════════════════════════════════
                HEADER
            ════════════════════════════════════════ */}
            <header className="h-12 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0a0b10]/80 backdrop-blur-xl shrink-0 absolute top-0 left-0 right-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/customer/auctions')} className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444]"></span>
                            Live Terminal
                        </div>
                        <h1 className="text-sm font-black text-white leading-none tracking-tight">VAULT #{id}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    <ShieldAlert className="w-3.5 h-3.5" /> Secure Connection
                </div>
            </header>

            {/* ════════════════════════════════════════
                MAIN — 3-Column Layout
            ════════════════════════════════════════ */}
            <main className="absolute top-12 left-0 right-0 bottom-0 flex flex-row overflow-hidden">

                {/* ── COL 1: VIDEO THEATER (~55%) ── */}
                <div className="flex-[2.2] relative flex flex-col overflow-hidden">

                    {/* Full-height video fill */}
                    <div className="absolute inset-0">
                        {livekitToken ? (
                            <LiveKitRoom
                                video={false}
                                audio={false}
                                token={livekitToken}
                                serverUrl={livekitUrl}
                                connect={true}
                                options={{
                                    adaptiveStream: true,
                                    dynacast: true,
                                    videoCaptureDefaults: {
                                        resolution: { width: 1920, height: 1080 },
                                    },
                                }}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <AdminVideoStream />
                                <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-[0_0_16px_rgba(239,68,68,0.5)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Stream</span>
                                    </div>
                                    <LiveViewerCount />
                                </div>
                            </LiveKitRoom>
                        ) : (() => {
                            const variant = auction?.product_variants;
                            const mainProduct = variant?.products;
                            let imageUrl: string | null = null;
                            
                            // Image Priority Logic
                            const prodImg = (typeof mainProduct?.media_urls === 'string' ? JSON.parse(mainProduct.media_urls) : mainProduct?.media_urls)?.[0];
                            const variantImg = (typeof variant?.media_assets === 'string' ? JSON.parse(variant.media_assets) : variant?.media_assets)?.[0]?.url;
                            imageUrl = prodImg || variantImg;
                            return (
                                <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
                                     {/* Background Ambient Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 transform rotate-12 scale-150"></div>
                                    
                                    {imageUrl ? (
                                        <div className="relative w-[85%] h-[85%] flex items-center justify-center">
                                            {/* Product Pedestal Glow */}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[10%] bg-white/10 blur-[60px] rounded-full"></div>
                                            
                                            <motion.img 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                                src={imageUrl} 
                                                alt={mainProduct?.name} 
                                                className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] relative z-10 rounded-3xl" 
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <div className="w-14 h-14 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/50">Establishing Secure Uplink...</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>


                    {/* Product info — bottom left */}
                    <div className="absolute bottom-4 left-4 z-20">
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl">
                            <p className="text-sm font-bold text-white mb-0.5">{auction?.product_variants?.products?.name || 'Loading auction...'}</p>
                            <p className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                                <ShieldAlert className="w-3 h-3" /> Authenticity Verified
                            </p>
                        </div>
                    </div>

                    {/* Incoming bid glow */}
                    {incomingBid && <div className="absolute inset-0 border-2 border-red-500/60 pointer-events-none z-10 animate-out fade-out zoom-out duration-700"></div>}

                    {/* Winner celebration overlay on video */}
                    <AnimatePresence>
                        {isWinner && auctionState.status === 'AWAITING_PAYMENT' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 pointer-events-none z-20"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.18)_0%,transparent_70%)] animate-pulse" />
                                <div className="absolute inset-0 border-2 border-amber-400/40 rounded-none" />
                                <motion.div
                                    initial={{ y: -30, opacity: 0, scale: 0.8 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                                >
                                    <div className="text-6xl mb-3 drop-shadow-2xl">🏆</div>
                                    <p className="text-2xl font-black text-amber-300 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] uppercase tracking-widest">YOU WON!</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Flying Reactions Layer */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                        <AnimatePresence>
                            {reactions.map(r => (
                                <FloatingReaction key={r.id} reaction={r} onComplete={removeReaction} />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Interaction Buttons - Bottom Right floating on Video */}
                    <div className="absolute bottom-20 right-4 z-40 flex flex-col gap-3">
                        <button
                            onClick={() => handleSendReaction('❤️')}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 active:scale-95 text-xl"
                        >
                            ❤️
                        </button>
                        <button
                            onClick={() => handleSendReaction('🔥')}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 active:scale-95 text-xl"
                        >
                            🔥
                        </button>
                    </div>
                </div>

                {/* ── COL 2: LIVE CHAT (YouTube style) ── */}
                <div className="w-[260px] xl:w-[300px] shrink-0 flex flex-col border-l border-white/[0.06]" style={{ background: 'rgba(15,15,15,0.98)' }}>

                    {/* Chat header */}
                    <div className="px-4 py-3 border-b border-white/[0.06] shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Live Chat</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 pr-10 flex flex-col gap-4 hide-scrollbar-completely min-h-0">
                        <div className="flex-1" /> {/* Spacer to push messages to bottom */}
                        {chatMessages.length === 0 && (
                            <p className="text-center text-[10px] font-mono text-white/20 uppercase tracking-widest pt-8 uppercase font-black">Waiting for messages...</p>
                        )}
                        {chatMessages.map((msg) => {
                            const colors = [
                                'from-blue-400 to-indigo-500',
                                'from-emerald-400 to-teal-500',
                                'from-rose-400 to-orange-500',
                                'from-purple-400 to-pink-500',
                                'from-amber-400 to-yellow-500'
                            ];
                            const colorIdx = (msg.name?.length || 0) % colors.length;
                            const userColor = colors[colorIdx];

                            return (
                                <div key={msg.id} className="flex gap-3 items-start animate-in slide-in-from-bottom-2 duration-300 group">
                                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg bg-gradient-to-br ${userColor}`}>
                                        {msg.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${(msg.isAdmin || msg.name === 'Admin') ? 'text-rose-500' : 'text-neutral-300'}`}>
                                                {msg.name}
                                            </span>
                                            <span className="text-[8px] font-mono text-neutral-700">12:34</span>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 group-hover:bg-white/[0.07] transition-all">
                                            <p className="text-xs text-neutral-200 leading-relaxed break-words">{msg.text}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>


                    {/* Chat input */}
                    <div className="border-t border-white/[0.06] p-3 shrink-0">
                        {['COMPLETED', 'FAILED_NO_BUYER', 'CANCELLED'].includes(auctionState.status) ? (
                            <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white/40 italic">
                                <Monitor className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Archived Session • Read Only</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-xl px-2 py-1.5">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button 
                                            disabled={!['ACTIVE', 'UPCOMING', 'AWAITING_PAYMENT'].includes(auctionState.status)}
                                            className="text-white/40 hover:text-white transition-colors p-1.5 shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent side="top" align="start" className="p-0 border-none bg-transparent shadow-2xl w-auto mb-4 z-[100]">
                                        <EmojiPicker
                                            theme={Theme.DARK}
                                            onEmojiClick={(emojiData) => {
                                                setChatInput(prev => prev + emojiData.emoji);
                                            }}
                                            lazyLoadEmojis={true}
                                            skinTonesDisabled={true}
                                            searchDisabled={false}
                                            height={400}
                                            width={320}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && chatInput.trim() && socketRef.current && ['ACTIVE', 'UPCOMING', 'AWAITING_PAYMENT'].includes(auctionState.status)) {
                                            socketRef.current.emit('send_chat', {
                                                auctionId: Number(id),
                                                userId: user?.user_id,
                                                name: user?.full_name || 'Guest',
                                                text: chatInput.trim()
                                            });
                                            setChatInput('');
                                        }
                                    }}
                                    disabled={!['ACTIVE', 'UPCOMING', 'AWAITING_PAYMENT'].includes(auctionState.status)}
                                    placeholder={['ACTIVE', 'UPCOMING', 'AWAITING_PAYMENT'].includes(auctionState.status) ? "Type a message..." : "Chat is disabled"}
                                    className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/20 outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    onClick={() => {
                                        if (!chatInput.trim() || !socketRef.current || !['ACTIVE', 'UPCOMING', 'AWAITING_PAYMENT'].includes(auctionState.status)) return;
                                        socketRef.current.emit('send_chat', {
                                            auctionId: Number(id),
                                            userId: user?.user_id,
                                            name: user?.full_name || 'Guest',
                                            text: chatInput.trim()
                                        });
                                        setChatInput('');
                                    }}
                                    disabled={!['ACTIVE', 'UPCOMING', 'AWAITING_PAYMENT'].includes(auctionState.status)}
                                    className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                >
                                    <Zap className="w-4 h-4 fill-white" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── COL 3: BID TERMINAL (~22%) ── */}
                <div className="w-[250px] xl:w-[280px] shrink-0 flex flex-col border-l border-white/[0.06] overflow-y-auto scrollbar-hide" style={{ background: 'rgba(12,12,12,0.98)' }}>

                    {/* Timer + Status */}
                    <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-rose-400" />
                                <span className={`text-xl font-black font-mono tracking-tight ${countdown.startsWith('00:00') ? 'text-red-400 animate-pulse' : 'text-white'}`}>{countdown}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${auctionState.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-neutral-400 border border-white/10'}`}>
                                {auctionState.status === 'LOADING' ? '...' : auctionState.status}
                            </span>
                        </div>
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Next Bid</p>
                        <p className="text-2xl font-black text-rose-500">
                            {formatPrice(auctionState.currentPrice + (auction ? Number(auction.step_price) : 0))}
                        </p>
                    </div>

                    {/* Highest bid */}
                    {bids.length > 0 && (
                        <div className="px-4 py-3 border-b border-white/[0.06] shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                            <p className="text-[10px] font-black font-mono text-amber-500/80 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Trophy className="w-3.5 h-3.5" /> Highest Bidder
                            </p>
                            <motion.div
                                key={bids[0]?.bidId}
                                initial={false}
                                animate={{
                                    boxShadow: [
                                        "0 0 15px rgba(251,191,36,0.2)",
                                        "0 0 40px rgba(251,191,36,0.6)",
                                        "0 0 15px rgba(251,191,36,0.2)"
                                    ],
                                    borderColor: [
                                        "rgba(251,191,36,0.2)",
                                        "rgba(251,191,36,1)",
                                        "rgba(251,191,36,0.2)"
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`rounded-2xl p-4 bg-[#111218] border border-amber-500/30 relative overflow-hidden`}
                            >
                                {/* Animated LED-like Ring */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none">
                                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0%,#fbbf24_15%,transparent_30%,#fbbf24_45%,transparent_60%,#fbbf24_75%,transparent_90%)] animate-[spin_8s_linear_infinite]" />
                                </div>
                                <div className="absolute top-0 right-0 p-3"><Trophy className="w-4 h-4 text-amber-500/20" /></div>
                                <p className={`text-2xl font-black font-mono tracking-tight text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] relative z-10`}>
                                    {formatPrice(bids[0]?.bidAmount)}
                                </p>
                                <div className="flex items-center gap-2 mt-1 relative z-10">
                                    <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-500">
                                        {bids[0]?.bidderName?.charAt(0) || 'U'}
                                    </div>
                                    <p className="text-[10px] font-black text-white/70 uppercase tracking-wider truncate">{bids[0]?.bidderName}</p>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Recent Bids */}
                    <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">Recent Bids</p>
                        {bids.length === 0 ? (
                            <p className="text-[10px] text-neutral-600 font-mono">No bids yet</p>
                        ) : (
                            <div className="space-y-1.5">
                                {bids.slice(0, 3).map((bid, idx) => (
                                    <div key={bid.bidId} className={`flex items-center justify-between px-2.5 py-2 rounded-lg ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
                                        <div>
                                            <p className={`text-[11px] font-bold ${idx === 0 ? 'text-amber-300' : 'text-white/70'}`}>{bid.bidderName}</p>
                                            <p className={`text-xs font-black font-mono ${idx === 0 ? 'text-amber-200' : 'text-white/50'}`}>{formatPrice(bid.bidAmount)}</p>
                                        </div>
                                        <span className="text-[9px] font-mono text-neutral-600">#{bids.length - idx}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                    {/* Bid Actions */}
                    <div className="px-4 py-3 flex flex-col gap-2 shrink-0 mt-auto">
                        {(auctionState.status === 'ACTIVE' || auctionState.status === 'UPCOMING') ? (
                            <>
                                {isJoined ? (
                                    <>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {quickBidSteps.map(stepVal => {
                                                const displayVal = stepVal >= 1_000_000
                                                    ? `+${stepVal / 1_000_000}M`
                                                    : `+${stepVal / 1_000}K`;
                                                return (
                                                    <button
                                                        key={stepVal}
                                                        disabled={isPlacingBid || auctionState.status !== 'ACTIVE'}
                                                        onClick={() => handlePlaceBid(stepVal)}
                                                        className="h-8 bg-white/[0.07] hover:bg-white/15 border border-white/10 text-white font-bold text-[10px] font-mono rounded-lg transition-all disabled:opacity-40"
                                                    >
                                                        {displayVal}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={customBidInput}
                                                    onChange={handleCustomBidChange}
                                                    placeholder={`Add Amount (e.g., ${Number(auction?.step_price || 10000).toLocaleString('en-US')})`}
                                                    disabled={isPlacingBid || auctionState.status !== 'ACTIVE'}
                                                    className={`w-full h-10 bg-white/[0.06] border ${customBidError ? 'border-red-500/50' : 'border-white/10'} text-white text-xs font-mono rounded-xl px-3 outline-none focus:border-white/30 transition-all placeholder:text-white/20 disabled:opacity-40`}
                                                />
                                            </div>
                                            <button
                                                onClick={handleDirectBid}
                                                disabled={isPlacingBid || auctionState.status !== 'ACTIVE' || !customBidInput}
                                                className="h-10 px-4 bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                                            >
                                                {isPlacingBid ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Zap className="w-3.5 h-3.5 fill-current" />}
                                                BID
                                            </button>
                                        </div>
                                        {customBidError && <p className="text-red-400 text-[10px] font-mono">* {customBidError}</p>}
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setShowJoinModal(true)}
                                        className="h-12 w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black uppercase tracking-[0.1em] rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Deposit to Bid
                                    </Button>
                                )}
                            </>
                        ) : isForfeited ? (
                            <div className="flex flex-col gap-2">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                                    <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                                    <p className="text-[10px] font-mono text-red-400 tracking-widest uppercase">Order Forfeited</p>
                                </div>
                                <button onClick={() => navigate('/customer/auctions')} className="w-full h-9 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-white rounded-xl font-bold uppercase tracking-widest transition-all text-[10px]">
                                    Return to Vault
                                </button>
                            </div>
                        ) : auctionState.status === 'AWAITING_PAYMENT' && isWinner ? (
                            <div className="flex flex-col gap-2">
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                                    <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                    <p className="text-[10px] font-mono text-amber-300 tracking-widest uppercase">You Won — Pay Now</p>
                                </div>
                                <button onClick={handleClaimCheckout} className="w-full h-9 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black uppercase tracking-widest transition-all text-[10px]">
                                    🏆 Claim Checkout
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                <BadgeInfo className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                                <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">AUCTION CONCLUDED</p>
                                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-4">Waiting for Admin to close the room</p>
                                <button onClick={() => navigate('/customer/auctions')} className="w-full h-9 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase transition-all">
                                    Optional: Exit Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* ── Deposit Registration Modal ── */}
            <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
                <DialogContent className="bg-[#050505]/95 backdrop-blur-3xl border border-white/10 text-white max-w-[400px] p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:rounded-[2rem] outline-none">
                    <div className="p-8 flex flex-col items-center text-center pt-10">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                            <ShieldAlert className="w-8 h-8 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-2">Registration Required</h2>
                        <DialogDescription className="text-neutral-400 text-sm leading-relaxed mb-6">
                            To participate in bidding, a security deposit is required. This amount will be fully refunded if you do not win the auction.
                        </DialogDescription>

                        <div className="w-full space-y-4 mb-8">
                            <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                <span className="text-xs text-neutral-500 uppercase tracking-widest font-mono">Security Deposit</span>
                                <span className="text-lg font-black text-amber-400">{auction ? formatPrice(Number(auction.deposit_fee)) : '...'}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                <span className="text-xs text-neutral-500 uppercase tracking-widest font-mono">Available Balance</span>
                                <span className={`text-lg font-black ${walletBalance < Number(auction?.deposit_fee) ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {formatPrice(walletBalance)}
                                </span>
                            </div>
                        </div>

                        <Button
                            disabled={isJoining}
                            onClick={handleJoinConfirm}
                            className="w-full bg-white hover:bg-neutral-200 text-black h-14 rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all"
                        >
                            {isJoining ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Authorize Deposit"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setShowJoinModal(false)}
                            className="w-full text-neutral-500 hover:text-white mt-2 h-10 rounded-xl text-xs uppercase tracking-widest"
                        >
                            Decline
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Auction End Modal ── */}
            <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
                <DialogContent className="bg-[#050505]/95 backdrop-blur-3xl border border-white/10 text-white max-w-[420px] p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:rounded-[2.5rem] outline-none">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></div>
                    {isWinner ? (
                        <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,0,0.1)_0%,transparent_60%)] animate-pulse pointer-events-none z-0"></div>
                            <div className="p-8 flex flex-col items-center text-center relative z-10 pt-12">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-white/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(251,191,36,0.5)] animate-bounce">
                                    <span className="text-4xl text-black">🎉</span>
                                </div>
                                <h2 className="text-3xl font-black tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">YOU WON!</h2>
                                <DialogDescription className="text-neutral-300 text-sm leading-relaxed max-w-[280px] mx-auto">
                                    Congratulations! You secured the artifact for {auctionState.currentPrice ? formatPrice(auctionState.currentPrice) : ''}.
                                </DialogDescription>
                                <div className="mt-6 w-full flex flex-col gap-3">
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center text-xs text-amber-200">
                                        Your deposit remains locked. Proceed to Secure Checkout to finalize payment.
                                    </div>
                                    <Button onClick={handleClaimCheckout} className="w-full bg-amber-500 hover:bg-amber-600 text-black h-14 rounded-2xl font-black uppercase tracking-widest text-[13px]">
                                        Claim Artifact
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowEndModal(false)} className="w-full text-neutral-400 hover:text-white h-12 rounded-2xl text-[13px]">
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-8 flex flex-col items-center text-center pt-12">
                                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mb-6">
                                    <Clock className="w-6 h-6 text-neutral-400" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight mb-2">Auction Concluded</h2>
                                <DialogDescription className="text-neutral-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                                    The hammer has fallen. Unfortunately, you did not secure the artifact this time.
                                </DialogDescription>
                                <div className="mt-6 w-full flex flex-col gap-3">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center text-xs text-neutral-300">
                                        Your secure deposit of <strong className="text-white">{auction ? formatPrice(Number(auction.deposit_fee)) : ''}</strong> has been fully refunded.
                                    </div>
                                    <Button onClick={() => navigate('/customer/auctions')} className="w-full bg-white hover:bg-neutral-200 text-black h-14 rounded-2xl font-bold uppercase tracking-widest text-[13px]">
                                        Return to Vaults
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(0.5); opacity: 0; }
                    20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
                    80% { opacity: 0.8; transform: translateY(-150px) scale(1); }
                    100% { transform: translateY(-200px) scale(0.8); opacity: 0; }
                }
                .animate-float-up { animation: float-up 2s ease-out forwards; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
