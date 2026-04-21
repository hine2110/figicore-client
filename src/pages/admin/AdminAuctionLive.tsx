import { useState, useEffect, useRef } from 'react';
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
    Clock,
    Globe,
    Signal,
    MoreHorizontal,
    Monitor,
    Maximize2,
    Volume2,
    Loader2,
    ArrowLeft,
    Users,
    VideoOff,
    MonitorPlay,
    Trophy,
    Mic,
    MicOff,
    Video,
    ChevronDown,
    Zap,
    Power,
    Gavel
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { io, Socket } from 'socket.io-client';
import { format, differenceInSeconds } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { auctionsService } from '@/services/auctions.service';
import { motion, AnimatePresence } from 'framer-motion';
/* 
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
*/
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

// ── Components ──

const StatusBadge = ({ isLive }: { isLive: boolean }) => (
    <div className={`flex items-center gap-2 pr-3 pl-1.5 py-0.5 rounded-full border ${isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`}></span>
        <span className="text-[8px] font-black uppercase tracking-widest">{isLive ? 'Live' : 'Off Air'}</span>
    </div>
);

const PriceCard = ({ amount }: { amount: number }) => {
    const formatPrice = (p: number | string | undefined | null) => {
        const value = Number(p);
        if (isNaN(value)) return { amount: '0', currency: 'đ' };
        const parts = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).formatToParts(value);
        const amountStr = parts.filter(p => p.type !== 'currency').map(p => p.value).join('').trim();
        return { amount: amountStr, currency: 'đ' };
    };
    const { amount: price, currency } = formatPrice(amount);

    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 via-amber-400/20 to-amber-500/50 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#1a1b23] border border-white/5 rounded-2xl p-5 flex flex-col shadow-2xl overflow-hidden">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/50 mb-3">Current Price</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-amber-500 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                        {price}
                    </span>
                    <span className="text-xl font-black text-amber-500/60 ">{currency}</span>
                </div>
            </div>
        </div>
    );
};

const StatTile = ({ label, value, icon: Icon }: { label: string, value: any, icon: any }) => (
    <div className="bg-[#111218] border border-white/5 rounded-xl p-4 flex flex-col gap-1 transition-all hover:bg-white/5">
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
            <Icon className="w-3 h-3" />
            {label}
        </div>
        <span className="text-xl font-bold text-neutral-200 font-mono">{value}</span>
    </div>
);

const TimelineSection = ({ auction }: { auction: any }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const status = auction?.status_code;

    useEffect(() => {
        const targetTime = status === 'UPCOMING' ? auction?.start_time : auction?.end_time;
        if (!targetTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const targetDate = new Date(targetTime);
            const diff = differenceInSeconds(targetDate, now);
            
            if (diff <= 0) {
                setTimeLeft('00:00:00');
            } else {
                const h = Math.floor(diff / 3600).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                const s = (diff % 60).toString().padStart(2, '0');
                setTimeLeft(`${h}:${m}:${s}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [auction?.end_time, auction?.start_time, status]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
                    <Clock className="w-3 h-3" />
                    {status === 'UPCOMING' ? 'Starts In' : 'Remaining'}
                </div>
                <span className={`text-3xl font-black font-mono tracking-tight tabular-nums ${status === 'UPCOMING' ? 'text-amber-500' : 'text-white'}`}>
                    {timeLeft || '00:00:00'}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-neutral-600">
                    <span>Timeline</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <span className="text-[7px] text-neutral-600 font-black uppercase tracking-tighter">Start</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{auction?.start_time ? format(new Date(auction.start_time), 'HH:mm dd-MM') : '--:--'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] text-neutral-600 font-black uppercase tracking-tighter">End</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{auction?.end_time ? format(new Date(auction.end_time), 'HH:mm dd-MM') : '--:--'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SystemHealth = () => {
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
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-emerald-500">
                <Activity className="w-3 h-3" />
                System Health
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter">Connection</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(connectionState)}`}>
                        <span className={`w-1 h-1 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
                        {connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
                    </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="text-neutral-600 uppercase">Quality</span>
                    <span className={`uppercase ${connectionState === 'connected' ? 'text-emerald-500/70' : 'text-neutral-400'}`}>
                        {connectionState === 'connected' ? 'Excellent' : '---'}
                    </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="text-neutral-600 uppercase">Protocol</span>
                    <span className="text-neutral-400 uppercase">WebRTC (Live)</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="text-neutral-600 uppercase">Audience</span>
                    <span className="text-neutral-400 uppercase">{remoteParticipants.length} active</span>
                </div>
            </div>
        </div>
    );
};

const QuickExtensions = ({ handleExtendTime }: { handleExtendTime: (s: number) => void }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
            <Zap className="w-3 h-3" />
            Quick Extensions
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleExtendTime(30)} className="h-7 px-3 bg-white/5 border border-white/5 text-[8px] font-black uppercase rounded-lg hover:bg-rose-500 hover:text-white transition-all">+30s</Button>
            <Button variant="ghost" size="sm" onClick={() => handleExtendTime(60)} className="h-7 px-3 bg-white/5 border border-white/5 text-[8px] font-black uppercase rounded-lg hover:bg-rose-500 hover:text-white transition-all">+1m</Button>
            <Button variant="ghost" size="sm" onClick={() => handleExtendTime(300)} className="h-7 px-3 bg-white/5 border border-white/5 text-[8px] font-black uppercase rounded-lg hover:bg-rose-500 hover:text-white transition-all">+5m</Button>
        </div>
    </div>
);

const DepositLog = ({ participants, maxParticipants }: { participants: any[], maxParticipants: number }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-amber-500">
            <Zap className="w-3 h-3" />
            Deposit
            <span className="ml-auto text-neutral-600 font-mono">{participants?.length || 0}/{maxParticipants || 0} verified</span>
        </div>
        <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-none">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#08090d] z-10">
                    <tr className="text-[7px] font-black uppercase text-neutral-700 tracking-tighter border-b border-white/5 pb-1">
                        <th className="py-1">User</th>
                        <th className="py-1">Vault</th>
                        <th className="py-1 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {participants?.map((p, idx) => (
                        <tr key={idx} className="group">
                            <td className="py-1.5">
                                <span className="text-[9px] font-bold text-neutral-400 truncate max-w-[80px] block group-hover:text-white transition-colors">{p.users?.full_name}</span>
                            </td>
                            <td className="py-1.5">
                                <span className="text-[8px] font-mono text-amber-500">10k</span>
                            </td>
                            <td className="py-1.5 text-right">
                                <span className="text-[8px] text-emerald-500/50">OK</span>
                            </td>
                        </tr>
                    ))}
                    {!participants?.length && [1, 2, 3].map(i => (
                        <tr key={i} className="opacity-20">
                            <td className="py-1.5"><div className="h-2 w-16 bg-neutral-800 rounded"></div></td>
                            <td className="py-1.5"><div className="h-2 w-8 bg-neutral-800 rounded"></div></td>
                            <td className="py-1.5 text-right"><div className="h-2 w-4 bg-neutral-800 rounded ml-auto"></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default function AdminAuctionLive() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toast } = useToast();

    const [token, setToken] = useState('');
    const [auction, setAuction] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStreaming, setIsStreaming] = useState(false);
    const [bids, setBids] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isForceEnding, setIsForceEnding] = useState(false);
    // const [isManagementOpen, setIsManagementOpen] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const roomName = `AUC-${id}`;
    const livekitUrl = import.meta.env.VITE_LIVEKIT_WS_URL;

    const formatPrice = (p: number | string | undefined | null) => {
        const value = Number(p);
        if (isNaN(value)) return '0 đ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const fetchAuction = async () => {
        try {
            const data = await auctionsService.getAuctionById(Number(id));
            
            // [Total Lockdown] If session is already closed/completed, redirect admin
            if (data.status_code === 'COMPLETED' || data.status_code === 'CANCELLED') {
                toast({
                    title: "🔒 Session Closed",
                    description: "This auction room has been permanently closed.",
                    variant: "destructive"
                });
                navigate('/admin/dashboard');
                return;
            }

            setAuction(data);
            if (data.auction_bids) setBids(data.auction_bids);
            if (data.auction_participants) setParticipants(data.auction_participants);
        } catch (error) {
            console.error("Failed to fetch auction:", error);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                await fetchAuction();

                const tokenRes = await api.get(`/livekit/token`, {
                    params: { room: roomName, username: user?.full_name || 'Admin', isHost: 'true' }
                });
                setToken(tokenRes.data.token);

                const socket = io(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.figicore.com'}/auction-live`);
                socketRef.current = socket;

                socket.on('connect', () => {
                    socket.emit('join_room', { auctionId: Number(id), userId: user?.user_id });
                });

                socket.on('chat_history', (history: any[]) => setChatMessages(history));
                socket.on('chat_message', (msg: any) => {
                    setChatMessages(prev => {
                        const msgId = msg.messageId || msg.id || msg.msg_id;
                        if (msgId && prev.some(m => (m.messageId || m.id || m.msg_id) === msgId)) return prev;
                        return [...prev, msg];
                    });
                });
                socket.on('new_bid', (data: any) => {
                    // Normalize data structure and handle variations
                    const normalizedBid = {
                        bid_id: data.bid_id || data.id || data.bidId,
                        user_id: data.user_id || data.userId,
                        bid_amount: Number(data.bid_amount || data.bidAmount || data.amount),
                        created_at: data.created_at || data.createdAt || new Date().toISOString(),
                        users: data.users || {
                            full_name: data.userName || data.user_name || data.bidderName || 'Anonymous'
                        }
                    };

                    if (isNaN(normalizedBid.bid_amount)) {
                        console.error("Admin: Received invalid bid amount:", data);
                        return;
                    }

                    setBids(prev => {
                        const bidId = normalizedBid.bid_id;
                        if (bidId && prev.some(b => (b.bid_id || b.id || b.bidId) === bidId)) return prev;
                        return [normalizedBid, ...prev];
                    });
                });
                socket.on('end_time_extended', (data: any) => {
                    setAuction((prev: any) => ({ ...prev, end_time: data.newEndTime }));
                    toast({ title: "Time Extended", description: data.message });
                });
                socket.on('room_state', (data: any) => {
                    if (data.status) {
                        setAuction((prev: any) => ({ ...prev, status_code: data.status }));
                    }
                });
                socket.on('participation_updated', (data: any) => {
                    setParticipants(prev => {
                        if (prev.some(p => p.user_id === data.participant.user_id)) return prev;
                        return [...prev, data.participant];
                    });
                });

                setIsLoading(false);
            } catch (error) {
                console.error("Init failed:", error);
                setIsLoading(false);
            }
        };

        if (user && id) init();

        return () => {
            socketRef.current?.disconnect();
        };
    }, [id, user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // const handleSendChat = () => { ... } // Admin doesn't need to chat as per user request
    const handleExtendTime = async (seconds: number) => {
        try {
            await auctionsService.extendTime(Number(id), seconds);
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message, variant: "destructive" });
        }
    };

    const handleForceEnd = async () => {
        if (!window.confirm("ARE YOU SURE? This will immediately terminate the auction and refund all deposits.")) return;
        setIsForceEnding(true);
        try {
            await auctionsService.forceEndAuction(Number(id));
            toast({ title: "Auction Terminated" });
            fetchAuction();
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.message, variant: "destructive" });
        } finally {
            setIsForceEnding(false);
        }
    };

    const handleCloseRoom = () => {
        if (!auction) return;
        
        const now = new Date();
        const endTime = new Date(auction.end_time);
        const status = auction.status_code;

        // If auction is still ACTIVE and time hasn't run out
        if (status === 'ACTIVE' && now < endTime) {
            toast({
                title: "⚠️ Action Prevented",
                description: "This auction is still in progress. You cannot close the room normally yet.",
                variant: "destructive"
            });
            return;
        }

        // Normally closing means just returning to the auction list
        if (socketRef.current) {
            socketRef.current.emit('close_auction_room', { auctionId: Number(id) });
        }

        toast({
            title: "Session Closed",
            description: "Returning to Broadcaster Dashboard..."
        });
        setTimeout(() => navigate('/admin/auctions'), 1500);
    };

    const handleKickUser = async (userId: number, userName: string) => {
        if (!window.confirm(`Are you sure you want to kick ${userName}? They will be banned from rejoining.`)) return;
        try {
            await auctionsService.kickParticipant(Number(id), userId);
            toast({ title: "User Kicked", description: `${userName} was removed.` });
            fetchAuction();
        } catch (error: any) {
            toast({ title: "Kick Failed", description: error.response?.data?.message, variant: "destructive" });
        }
    };

    /*
    const handleForfeit = async () => {
        if (!window.confirm("Forfeit current winner and transfer to standby?")) return;
        setIsForfeiting(true);
        try {
            await auctionsService.forfeitWinner(Number(id));
            toast({ title: "Winner Forfeited" });
            fetchAuction();
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.message, variant: "destructive" });
        } finally {
            setIsForfeiting(false);
        }
    };

    const handleCancelResult = async () => {
        if (!window.confirm("DANGER: Cancel auction result and refund all?")) return;
        setIsCanceling(true);
        try {
            await auctionsService.cancelResult(Number(id));
            toast({ title: "Auction Cancelled" });
            fetchAuction();
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.message, variant: "destructive" });
        } finally {
            setIsCanceling(false);
        }
    };
    */

    if (isLoading || !token) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                    <p className="font-mono text-sm tracking-widest uppercase">Initializing Studio VR...</p>
                </div>
            </div>
        );
    }

    const currentBid = bids[0]?.bid_amount || bids[0]?.bidAmount || auction?.start_price || 0;

    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            options={{
                publishDefaults: {
                    simulcast: true,
                    videoCodec: 'h264' as VideoCodec,
                    videoEncoding: VideoPresets.h1080.encoding,
                },
                videoCaptureDefaults: {
                    resolution: VideoPresets.h1080.resolution,
                }
            }}
            className="flex h-screen bg-[#08090d] text-white overflow-hidden font-outfit"
        >


            {/* ── COLUMN 1: ANALYTICS (20%) ── */}
            <aside className="w-[20%] shrink-0 flex flex-col bg-[#0a0b10] border-r border-white/5 p-6 space-y-8 overflow-y-auto scrollbar-none">
                <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => navigate('/admin/auctions')} className="text-neutral-600 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
                    <h1 className="text-[10px] font-black tracking-[0.2em] uppercase text-neutral-400">Broadcaster Studio</h1>
                </div>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
                        <Activity className="w-3 h-3 text-rose-500" />
                        Auction Analytics
                    </div>
                    <PriceCard amount={currentBid} />
                    <div className="grid grid-cols-2 gap-3">
                        <StatTile label="Participants" value={participants.length} icon={Users} />
                        <StatTile label="Total Bids" value={bids.length} icon={Gavel} />
                    </div>
                </section>

                <section className="pt-2">
                    <TimelineSection auction={auction} />
                </section>

                <section className="pt-2">
                    <SystemHealth />
                </section>

                <section className="pt-2">
                    <QuickExtensions handleExtendTime={handleExtendTime} />
                </section>

                <section className="pt-2">
                    <DepositLog participants={participants} maxParticipants={auction?.max_participants} />
                </section>

                <div className="mt-auto pt-8 space-y-3">
                    <Button onClick={handleCloseRoom} className="w-full h-11 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                         Close Room (Normal)
                    </Button>
                    <Button onClick={handleForceEnd} disabled={isForceEnding} variant="ghost" className="w-full h-11 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                        <Power className="w-3 h-3" /> Terminate Session
                    </Button>
                </div>
            </aside>

            {/* ── COLUMN 2: MAIN STAGE (60%) ── */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#08090d] p-6 gap-6 relative">
                {/* Stage Header */}
                <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600">Room #2</span>
                        <span className="text-neutral-800">|</span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{auction?.product_variants?.products?.name || 'Gundam RX78-2'}</span>
                    </div>

                </div>

                {/* Video Container */}
                <div className="flex-1 bg-[#111218] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {!isStreaming ? (
                            <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center px-12">
                                <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                                    <VideoOff className="w-8 h-8 text-neutral-700 opacity-20" />
                                </div>
                                <h2 className="text-xl font-black text-neutral-700 italic tracking-tighter uppercase mb-1">Stream Preview</h2>
                                <p className="text-neutral-800 font-mono text-[8px] tracking-[0.2em] uppercase">Start streaming to begin the auction</p>
                            </motion.div>
                        ) : (
                            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                                <AdminStreamPreview />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stage Floating Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                        <StudioTrackToggle />
                    </div>

                    {/* Screen Actions (Maximize etc) */}
                    <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-4">
                        <button className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-neutral-600 flex items-center justify-center transition-all"><Maximize2 className="w-3.5 h-3.5" /></button>
                        <button className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-neutral-600 flex items-center justify-center transition-all"><Volume2 className="w-3.5 h-3.5" /></button>
                    </div>
                </div>

                {/* Product Info Bar */}
                <div className="shrink-0 space-y-4">
                    <div className="bg-[#111218] rounded-2xl border border-white/5 p-4 flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center p-2">
                                <img src={auction?.product_variants?.products?.image_url || "/placeholder.png"} className="w-full h-full object-contain opacity-80" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-white uppercase italic">{auction?.product_variants?.products?.name || 'Gundam RX78-2'}</span>
                                <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-tighter">SKU: {auction?.product_variants?.sku || 'SKU-000000'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col items-end">
                                <span className="text-[6px] font-black uppercase text-neutral-600 tracking-tighter">Starting</span>
                                <span className="text-sm font-black text-white font-mono">{formatPrice(auction?.start_price || 0)}</span>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setIsStreaming(!isStreaming)} className={`w-full h-12 font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden relative group ${isStreaming ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            {isStreaming ? <Monitor className="w-5 h-5" /> : <MonitorPlay className="w-5 h-5 animate-pulse" />}
                            {isStreaming ? 'Terminate Session' : 'Start Livestream'}
                        </span>
                        {!isStreaming && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />}
                    </Button>
                </div>
            </main>

            {/* ── COLUMN 3: ACTIVITY (20%) ── */}
            <aside className="w-[20%] shrink-0 flex flex-col bg-[#0a0b10] border-l border-white/5 p-6 gap-6 overflow-hidden">
                <section className="shrink-0 space-y-3">
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-amber-500">
                        <Trophy className="w-3 h-3" />
                        Top Bidder
                    </div>
                    {bids.length > 0 ? (
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 shadow-lg shadow-amber-900/10">
                            <span className="text-[10px] font-black text-amber-500 uppercase italic truncate max-w-[100px]">{bids[0].users?.full_name}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-white font-mono">{formatPrice(bids[0].bid_amount)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                            <span className="text-[8px] font-black uppercase text-neutral-700">No bids yet</span>
                        </div>
                    )}
                </section>

                <section className="flex-1 flex flex-col min-h-0 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
                            <Signal className="w-3 h-3 text-amber-500" />
                            Bidding Log
                        </div>
                        <span className="text-[8px] font-mono text-neutral-700">{bids.length} bids</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                        {bids.map((bid, ix) => (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={ix} className="flex items-center gap-3 group relative">
                                <div className={`w-8 h-8 rounded-lg ${ix === 0 ? 'bg-amber-500/20 border border-amber-500/30 text-amber-500' : 'bg-white/5 border border-white/5 text-neutral-600'} flex items-center justify-center shrink-0`}>
                                    {ix === 0 ? <Trophy className="w-3.5 h-3.5" /> : <Gavel className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1 flex flex-col min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase truncate tracking-wider ${ix === 0 ? 'text-amber-500' : getUserColor(bid.users?.full_name || 'User')}`}>{bid.users?.full_name?.split(' ')[0]}</span>
                                        <span className="text-[12px] font-black text-white font-mono">{formatPrice(bid.bid_amount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[7px] font-mono text-neutral-700 mt-0.5 uppercase tracking-tighter">
                                        <span>Verified Active</span>
                                        <span>{format(new Date(bid.created_at || new Date()), 'HH:mm:ss')}</span>
                                    </div>
                                </div>
                                
                                <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 hover:text-rose-500 transition-colors"><MoreHorizontal className="w-3 h-3" /></button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-[#1a1b23] border-white/10 text-white">
                                            <DropdownMenuItem className="text-[8px] font-bold uppercase text-rose-500" onClick={() => handleKickUser(bid.user_id, bid.users?.full_name)}>
                                                Ban User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="h-[40%] flex flex-col pt-4 border-t border-white/5 min-h-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-neutral-500">
                            <Globe className="w-3 h-3 text-emerald-500" />
                            Live Chat
                        </div>
                        <span className="text-[8px] font-mono text-neutral-700">{chatMessages.length} msgs</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-4 hide-scrollbar-completely">
                        {chatMessages.map((msg, ix) => {
                            const isBidUpdate = msg.type === 'BID_AUTO';
                            return (
                                <div key={ix} className="flex gap-2 group animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="w-5 h-5 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-[8px] text-neutral-600">
                                        {msg.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={`text-[8px] font-black uppercase tracking-tight truncate ${isBidUpdate ? 'text-amber-500' : getUserColor(msg.name || 'User')}`}>{msg.name}</span>
                                            {isBidUpdate && <span className="text-[8px] font-black text-rose-500">🔥 NEW HIGHEST!</span>}
                                            <span className="text-[7px] font-mono text-neutral-700 ml-auto shrink-0 uppercase">{format(new Date(msg.timestamp || new Date()), 'HH:mm')}</span>
                                        </div>
                                        <p className={`text-[10px] leading-relaxed break-words font-medium ${isBidUpdate ? 'text-amber-500/70 italic' : 'text-neutral-400'}`}>{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="mt-4 shrink-0 px-4 py-2.5 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center">
                        <span className="text-[7px] font-black uppercase text-neutral-600 tracking-[0.2em]">Moderator Mode Active</span>
                    </div>
                </section>
            </aside>
        </LiveKitRoom>
    );
}

function AdminStreamPreview() {
    const cameraTracks = useTracks([Track.Source.Camera]);
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);

    // Prioritize screen share if available
    const activeTrack = screenShareTracks.length > 0 ? screenShareTracks[0] : cameraTracks[0];

    if (!activeTrack) return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-neutral-500 relative">
            <div className="w-32 h-32 rounded-full bg-neutral-900 flex items-center justify-center border border-white/5 shadow-inner">
                <VideoOff className="w-10 h-10 opacity-10 animate-pulse" />
            </div>
            <div className="text-center">
                <p className="text-[10px] font-black tracking-[0.4em] uppercase opacity-20">Transmission Standby</p>
                <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-rose-500/5 rounded-full border border-rose-500/10">
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
    const [isScreenShareOn, setIsScreenShareOn] = useState(false);

    const { devices: audioDevices, activeDeviceId: activeAudioId, setActiveMediaDevice: setActiveAudioDevice } = useMediaDeviceSelect({ kind: 'audioinput' });
    const { devices: videoDevices, activeDeviceId: activeVideoId, setActiveMediaDevice: setActiveVideoDevice } = useMediaDeviceSelect({ kind: 'videoinput' });

    const toggleCamera = async () => { const next = !isCameraOn; await localParticipant.setCameraEnabled(next); setIsCameraOn(next); };
    const toggleMic = async () => { const next = !isMicOn; await localParticipant.setMicrophoneEnabled(next); setIsMicOn(next); };
    const toggleScreenShare = async () => {
        const next = !isScreenShareOn;
        await localParticipant.setScreenShareEnabled(next);
        setIsScreenShareOn(next);
    };

    const selectDevice = async (kind: MediaDeviceKind, deviceId: string) => {
        try {
            console.log(`Switching ${kind} to ${deviceId}`);
            if (kind === 'audioinput') {
                await setActiveAudioDevice(deviceId);
                setIsMicOn(true);
            } else if (kind === 'videoinput') {
                await setActiveVideoDevice(deviceId);
                setIsCameraOn(true);
            }
        } catch (error) {
            console.error('Failed to switch device:', error);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center">
                <button onClick={toggleMic} className={`w-10 h-10 rounded-l-xl flex items-center justify-center transition-all ${isMicOn ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-900/20'}`}>
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-10 px-1 bg-white/5 border border-l-0 border-white/10 rounded-r-xl hover:bg-white/10 text-neutral-500 transition-colors">
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1b23] border-white/10 text-white min-w-[200px]">
                        {audioDevices.map((device) => (
                            <DropdownMenuItem key={device.deviceId} onClick={() => selectDevice('audioinput', device.deviceId)} className={`text-[10px] uppercase font-bold focus:bg-white/10 cursor-pointer ${device.deviceId === activeAudioId ? 'text-emerald-500' : ''}`}>
                                {device.label || `Mic ${device.deviceId.slice(0, 5)}`}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex items-center">
                <button onClick={toggleCamera} className={`w-10 h-10 rounded-l-xl flex items-center justify-center transition-all ${isCameraOn ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-900/20'}`}>
                    {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-10 px-1 bg-white/5 border border-l-0 border-white/10 rounded-r-xl hover:bg-white/10 text-neutral-500 transition-colors">
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1b23] border-white/10 text-white min-w-[200px]">
                        {videoDevices.map((device) => (
                            <DropdownMenuItem key={device.deviceId} onClick={() => selectDevice('videoinput', device.deviceId)} className={`text-[10px] uppercase font-bold focus:bg-white/10 cursor-pointer ${device.deviceId === activeVideoId ? 'text-emerald-500' : ''}`}>
                                {device.label || `Cam ${device.deviceId.slice(0, 5)}`}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <button onClick={toggleScreenShare} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isScreenShareOn ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-neutral-500 border border-white/10 hover:bg-white/10'}`}>
                <MonitorPlay className="w-4 h-4" />
            </button>
        </div>
    );
}

