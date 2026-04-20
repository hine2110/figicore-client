import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auctionsService } from "@/services/auctions.service";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, History, Gavel, Clock, RefreshCcw, AlertTriangle, Send, UserX, RotateCcw, Video } from "lucide-react";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminAuctionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);

    const [auction, setAuction] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isForceEnding, setIsForceEnding] = useState(false);
    const [isForfeiting, setIsForfeiting] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isKickingId, setIsKickingId] = useState<number | null>(null);
    const [announcementMsg, setAnnouncementMsg] = useState("");

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const fetchDetail = async () => {
        setIsLoading(true);
        try {
            const data = await auctionsService.getAuctionById(Number(id));
            setAuction(data);
        } catch (error: any) {
            toast({ title: "Failed to load", description: error.response?.data?.message || "Cannot find this auction room", variant: "destructive" });
            navigate('/admin/auctions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceEnd = async () => {
        if (!window.confirm("ARE YOU SURE? This will immediately terminate the auction and refund all deposits. This action cannot be undone.")) return;

        setIsForceEnding(true);
        try {
            await auctionsService.forceEndAuction(Number(id));
            toast({ title: "Auction Terminated", description: "The auction was forcefully ended and deposits have been refunded." });
            fetchDetail();
        } catch (error: any) {
            toast({ title: "Termination Failed", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
        } finally {
            setIsForceEnding(false);
        }
    };

    const handleForfeit = async () => {
        if (!window.confirm("WARNING: Forfeiting the winner will slash their deposit and transfer the win to the next highest bidder. Ensure 24 hours have passed or they explicitly declined. Proceed?")) return;

        setIsForfeiting(true);
        try {
            await auctionsService.forfeitWinner(Number(id));
            toast({ title: "Winner Forfeited", description: "The deposit was seized and the win has been transferred to the standby participant if available." });
            fetchDetail();
        } catch (error: any) {
            toast({ title: "Forfeit Failed", description: error.response?.data?.message || "An error occurred during forfeiture", variant: "destructive" });
        } finally {
            setIsForfeiting(false);
        }
    };

    const handleCancelResult = async () => {
        if (!window.confirm("DANGER: This will CANCEL the auction, refund ALL deposits, reset the status to DRAFT, and revoke the winner's result. Proceed?")) return;

        setIsCanceling(true);
        try {
            await auctionsService.cancelResult(Number(id));
            toast({ title: "Auction Cancelled", description: "All active deposits refunded and auction reverted to DRAFT." });
            fetchDetail();
        } catch (error: any) {
            toast({ title: "Cancellation Failed", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
        } finally {
            setIsCanceling(false);
        }
    };

    const handleKickUser = async (userId: number, userName: string) => {
        if (!window.confirm(`Are you sure you want to kick ${userName} and refund their deposit? They will be BANNED from rejoining.`)) return;

        setIsKickingId(userId);
        try {
            await auctionsService.kickParticipant(Number(id), userId);
            toast({ title: "User Kicked", description: `${userName} was removed from the auction.` });
            fetchDetail();
        } catch (error: any) {
            toast({ title: "Kick Failed", description: error.response?.data?.message || "Could not kick user", variant: "destructive" });
        } finally {
            setIsKickingId(null);
        }
    };

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    useEffect(() => {
        if (!auction || auction.status_code !== 'ACTIVE' || !user || !id) return;

        const socket = io(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.figicore.com'}/auction-live`);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Admin connected to Live Terminal');
            socket.emit('join_room', { auctionId: Number(id), userId: user.user_id });
        });

        // Automatically sync bids when received
        socket.on('new_bid', () => {
            // Admin detail currently uses HTTP polling, but we can hook this later
            fetchDetail();
        });

        return () => {
            socket.disconnect();
        };
    }, [auction?.status_code, id, user]);

    const handleSendAnnouncement = () => {
        if (!announcementMsg.trim() || !socketRef.current) return;
        socketRef.current.emit('send_announcement', {
            auctionId: Number(id),
            message: announcementMsg,
            type: 'urgent'
        });
        toast({ title: "Broadcast Sent", description: "Message flashed to all participants." });
        setAnnouncementMsg("");
    };

    if (isLoading && !auction) {
        return <div className="p-10 text-center text-neutral-500 animate-pulse">Initializing Control Room...</div>;
    }

    if (!auction) return null;

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'DRAFT': return <div className="flex items-center gap-2 text-xs font-mono text-neutral-500"><span className="w-2 h-2 rounded-full bg-neutral-500"></span> DRAFT</div>;
            case 'UPCOMING': return <div className="flex items-center gap-2 text-xs font-mono text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span> UPCOMING</div>;
            case 'ACTIVE': return <div className="flex items-center gap-2 text-xs font-mono text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#e11d48] animate-pulse"></span> LIVE NOW</div>;
            case 'COMPLETED': return <div className="flex items-center gap-2 text-xs font-mono text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span> COMPLETED</div>;
            default: return <div className="flex items-center gap-2 text-xs font-mono text-neutral-500"><span className="w-2 h-2 rounded-full bg-neutral-500"></span> {status}</div>;
        }
    };

    const isLive = auction.status_code === 'ACTIVE';

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10 min-h-screen bg-[#050505] text-white p-6 rounded-3xl relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-900/20 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-5">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/auctions')} className="rounded-full hover:bg-white/10 text-neutral-300">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-4 mb-1">
                            <h1 className="text-2xl font-semibold tracking-tight">Room #{auction.auction_id} Management</h1>
                            {getStatusIndicator(auction.status_code)}
                        </div>
                        <p className="text-sm text-neutral-400 font-mono">
                            <span className="text-neutral-300">{auction.product_variants?.products?.name || 'Unknown Product'}</span> • SKU: {auction.product_variants?.sku}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isLive && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/auctions/${id}/live`)}
                                className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                            >
                                <Video className="w-4 h-4" />
                                START LIVESTREAM
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleForceEnd}
                                disabled={isForceEnding}
                                className="bg-rose-600 hover:bg-rose-700 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                            >
                                {isForceEnding ? 'TERMINATING...' : 'FORCE END AUCTION'}
                            </Button>
                        </>
                    )}
                    {auction.status_code === 'COMPLETED' && auction.auction_participants?.some((p: any) => p.status === 'WINNER') && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleForfeit}
                                disabled={isForfeiting || isCanceling}
                                className="bg-amber-600/20 text-amber-500 hover:bg-amber-600/40 border border-amber-600/50 shadow-none font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                {isForfeiting ? 'Processing...' : 'Forfeit Disputed Winner'}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleCancelResult}
                                disabled={isCanceling || isForfeiting}
                                className="bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 border border-rose-600/50 shadow-none font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                {isCanceling ? 'Cancelling...' : 'Cancel Result & Revert'}
                            </Button>
                        </>
                    )}
                    <Button variant="outline" size="sm" onClick={fetchDetail} disabled={isLoading} className="border-white/10 bg-transparent text-neutral-300 hover:bg-white/10 hover:text-white">
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Sync Real-time
                    </Button>
                </div>
            </div>

            {/* Live Interactive Control Panel */}
            {isLive && (
                <div className="relative z-10 bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-rose-500/20 shadow-[0_8px_32px_rgba(225,29,72,0.1)] flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1">
                        <h3 className="text-white font-bold tracking-tight mb-1 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                            Live Broadcast Override
                        </h3>
                        <p className="text-xs text-rose-200/50 font-mono">Send a Flash Announcement that triggers a full-screen alert on all connected clients.</p>
                    </div>
                    <div className="flex-1 w-full flex items-center gap-2">
                        <Input
                            value={announcementMsg}
                            onChange={(e) => setAnnouncementMsg(e.target.value)}
                            placeholder="e.g., 'Only 1 minute remaining!'"
                            className="bg-black/40 border-rose-500/30 text-white placeholder:text-neutral-500 h-11 rounded-xl focus-visible:ring-rose-500/50 flex-1"
                        />
                        <Button onClick={handleSendAnnouncement} disabled={!announcementMsg.trim()} className="bg-rose-600 hover:bg-rose-700 text-white h-11 rounded-xl px-6 font-bold shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                            <Send className="w-4 h-4 mr-2" /> SEND
                        </Button>
                    </div>
                </div>
            )}

            {/* Top Dashboard Setup */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><Gavel className="w-3.5 h-3.5 text-blue-400" /> Current Highest Bid</p>
                    <p className="text-3xl font-light text-white tracking-tighter">
                        {auction.auction_bids?.length > 0 ? formatPrice(Number(auction.auction_bids[0].bid_amount)) : formatPrice(Number(auction.start_price))}
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><Users className="w-3.5 h-3.5 text-emerald-400" /> Participants</p>
                    <p className="text-3xl font-light text-white tracking-tighter">
                        {auction.auction_participants?.length || 0} <span className="text-sm font-medium text-neutral-500">/ {auction.max_participants}</span>
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><History className="w-3.5 h-3.5 text-purple-400" /> Total Bids Placed</p>
                    <p className="text-3xl font-light text-white tracking-tighter">
                        {auction.auction_bids?.length || 0}
                    </p>
                </div>

                <div className={`p-5 rounded-2xl border shadow-lg flex flex-col justify-center relative overflow-hidden backdrop-blur-lg ${isLive ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 ${isLive ? 'bg-rose-500/20' : 'bg-amber-500/10'}`}></div>
                    <p className={`text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 mb-2 ${isLive ? 'text-rose-400' : 'text-neutral-400'}`}>
                        <Clock className="w-3.5 h-3.5" /> Timeline
                    </p>
                    <div className="text-sm font-mono flex flex-col gap-1.5">
                        <div className="flex justify-between items-center"><span className="text-neutral-500">Start:</span> <span className="text-neutral-300">{format(new Date(auction.start_time), 'dd/MM/yy HH:mm')}</span></div>
                        <div className="flex justify-between items-center"><span className="text-neutral-500">End:</span> <span className={isLive ? 'text-rose-400 font-bold' : 'text-neutral-300'}>{format(new Date(auction.end_time), 'dd/MM/yy HH:mm')}</span></div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Bidding Log (Priority for Admin) */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[550px]">
                    <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-white tracking-tight flex items-center gap-2">Live Bidding Matrix <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div></h3>
                            <p className="text-[11px] text-neutral-400 font-mono mt-1">Real-time chronicle of all placed bids.</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-black/40 p-2">
                        {auction.auction_bids?.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30">
                                <Gavel className="w-12 h-12 text-neutral-400 mb-4" />
                                <p className="font-mono text-sm uppercase tracking-widest text-neutral-400">Awaiting Initial Bid</p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-2 relative">
                                {/* Vertical connection line */}
                                <div className="absolute left-[39px] top-6 bottom-6 w-px bg-white/10 z-0"></div>

                                {auction.auction_bids?.map((bid: any, ix: number) => (
                                    <div key={bid.bid_id} className={`relative z-10 flex items-center justify-between p-4 rounded-xl border backdrop-blur-md transition-all ${ix === 0 ? 'bg-blue-900/20 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs ring-2 ${ix === 0 ? 'bg-blue-950 text-blue-400 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-neutral-900 text-neutral-500 ring-white/10'}`}>
                                                #{auction.auction_bids.length - ix}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-neutral-200">{bid.users?.full_name || `User ID ${bid.user_id}`}</div>
                                                <div className="text-[11px] font-mono text-neutral-500 mt-0.5">{format(new Date(bid.created_at || new Date()), 'HH:mm:ss.SSS')}</div>
                                            </div>
                                        </div>
                                        <div className={`font-light tracking-tighter ${ix === 0 ? 'text-blue-400 text-2xl drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-neutral-400 text-xl'}`}>
                                            {formatPrice(Number(bid.bid_amount))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Participants Table */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[550px]">
                    <div className="p-5 border-b border-white/10 bg-black/20">
                        <h3 className="font-semibold text-white tracking-tight flex items-center gap-2">Authorized Participants Secure Log</h3>
                        <p className="text-[11px] text-neutral-400 font-mono mt-1">Users with verified locked {formatPrice(Number(auction.deposit_fee))} deposits.</p>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-white/5 border-b border-white/10">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-neutral-400 uppercase text-[10px] tracking-wider">Identity / Address</TableHead>
                                    <TableHead className="text-center text-neutral-400 uppercase text-[10px] tracking-wider">Vault Status</TableHead>
                                    <TableHead className="text-right text-neutral-400 uppercase text-[10px] tracking-wider text-right pr-4">Actions / Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auction.auction_participants?.length === 0 ? (
                                    <TableRow className="border-0 hover:bg-transparent">
                                        <TableCell colSpan={3} className="text-center text-neutral-600 font-mono text-sm py-20 uppercase tracking-widest">Vault Empty</TableCell>
                                    </TableRow>
                                ) : (
                                    auction.auction_participants?.map((p: any) => (
                                        <TableRow key={`${p.auction_id}-${p.user_id}`} className="border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell>
                                                <div className="font-medium text-neutral-200">{p.users?.full_name || `User ID ${p.user_id}`}</div>
                                                <div className="text-xs text-neutral-500 font-mono mt-0.5">{p.users?.email}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={`font-mono text-[10px] tracking-widest uppercase border-0 ${p.status === 'JOINED' || p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]' : 'bg-neutral-800 text-neutral-400'}`}>
                                                    {p.status || 'Locked'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-3 pr-4">
                                                <div className="text-xs text-neutral-500 font-mono">
                                                    {format(new Date(p.created_at), 'dd/MM HH:mm:ss')}
                                                </div>
                                                {(p.status === 'JOINED' || p.status === 'ACTIVE') && (auction.status_code === 'ACTIVE' || auction.status_code === 'UPCOMING') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleKickUser(p.user_id, p.users?.full_name || `ID ${p.user_id}`)}
                                                        disabled={isKickingId === p.user_id}
                                                        className="w-8 h-8 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                                                        title="Kick User & Refund Deposit"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
