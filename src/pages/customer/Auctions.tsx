import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomerLayout from '@/layouts/CustomerLayout';
import { Gavel, Clock, Flame, ShieldAlert, AlertCircle, CalendarOff, ArrowRight, ChevronRight, Loader2, Wallet, Info, Archive } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { auctionsService } from "@/services/auctions.service";
import { walletService } from "@/services/wallet.service";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    // DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function CustomerAuctions() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState<any[]>([]);
    const [archiveAuctions, setArchiveAuctions] = useState<any[]>([]);
    const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isJoining, setIsJoining] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [joinedRooms, setJoinedRooms] = useState<Record<number, boolean>>({});
    const { toast } = useToast();
    // const [pendingPaymentAuctions, setPendingPaymentAuctions] = useState<any[]>([]);

    useEffect(() => {
        const initData = async () => {
            await fetchAuctions();
            await fetchWallet();
        };
        initData();
    }, []);

    const fetchWallet = async () => {
        try {
            const res: any = await walletService.getMyWallet();
            if (res && res.balance_available !== undefined) {
                setWalletBalance(Number(res.balance_available));
            }
        } catch (error) {
            console.error("Could not fetch wallet", error);
        }
    };

    const fetchAuctions = async () => {
        setIsLoading(true);
        try {
            const data = await auctionsService.getAuctions();
            // Show only the most relevant single active/upcoming auction
            const publicAuctions = data.filter((a: any) =>
                ['UPCOMING', 'ACTIVE'].includes(a.status_code)
            );
            // Sort to ensure ACTIVE is prioritized over UPCOMING if needed, though they shouldn't overlap usually
            publicAuctions.sort((a: any, b: any) => {
                if (a.status_code === 'ACTIVE' && b.status_code === 'UPCOMING') return -1;
                if (a.status_code === 'UPCOMING' && b.status_code === 'ACTIVE') return 1;
                return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
            });

            setAuctions(publicAuctions);

            // Vault Archives (COMPLETED, AWAITING_PAYMENT, FAILED_NO_BUYER)
            const completedAuctions = data.filter((a: any) => 
                ['COMPLETED', 'AWAITING_PAYMENT', 'FAILED_NO_BUYER'].includes(a.status_code)
            );
            completedAuctions.sort((a: any, b: any) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());
            setArchiveAuctions(completedAuctions);

            if (publicAuctions.length > 0) {
                // Determine spotlight strictly by top sorted result
                const spotlight = publicAuctions[0];
                setSelectedAuctionId(spotlight.auction_id);
            }

            // Fetch join status map for public auctions
            const joinedStatuses: Record<number, boolean> = {};
            for (const auction of publicAuctions) {
                try {
                    const status = await auctionsService.getMyStatus(auction.auction_id);
                    joinedStatuses[auction.auction_id] = status.is_joined;
                } catch (e) {
                    // Ignore, user might not be logged in or other error
                }
            }
            setJoinedRooms(joinedStatuses);

            // setPendingPaymentAuctions([]);

        } catch (error) {
            console.error("Could not fetch auctions", error);
            toast({ title: "Error", description: "Could not load auctions", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p) || "0 ₫";

    const handleJoinConfirm = async () => {
        if (!spotlightRoom) return;
        setIsJoining(true);
        try {
            const res = await auctionsService.joinAuction(spotlightRoom.auction_id);
            if (res.success) {
                toast({
                    title: "Room Access Granted",
                    description: res.message || "Deposit locked successfully.",
                    className: "bg-green-500 border-none text-white",
                });
                setShowJoinModal(false);
                // Redirect user to the active room immediately
                navigate(`/customer/auctions/${spotlightRoom.auction_id}`);
            }
        } catch (error: any) {
            const errMessage = error.response?.data?.message || 'Could not join the auction room';
            toast({
                title: "Access Denied",
                description: errMessage,
                variant: 'destructive'
            });
            setShowJoinModal(false);

            // Redirect to topup if insufficient funds
            if (errMessage.toLowerCase().includes('insufficient')) {
                navigate('/customer/wallet?mode=topup');
            }
        } finally {
            setIsJoining(false);
        }
    };

    if (isLoading) {
        return (
            <CustomerLayout activePage="auction">
                <div className="flex h-screen items-center justify-center bg-black">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-20 h-20 bg-red-600/20 blur-xl rounded-full animate-pulse z-0"></div>
                        <div className="animate-spin w-12 h-12 border-2 border-white/10 border-t-red-500 rounded-full z-10"></div>
                    </div>
                </div>
            </CustomerLayout>
        );
    }

    // Get the primary spotlight auction based on selection
    const spotlightRoom = auctions.find(a => a.auction_id === selectedAuctionId) || (auctions.length > 0 ? auctions[0] : null);

    // The schedule contains all other rooms except the spotlight one
    const scheduleRooms = auctions.filter(a => a.auction_id !== spotlightRoom?.auction_id);

    // Parse assets and details
    let mediaAssets: any[] = [];
    let mainProduct: any = null;
    let variant: any = null;
    let description = "";

    if (spotlightRoom) {
        variant = spotlightRoom.product_variants;
        mainProduct = variant?.products;

        const productImages = [];
        if (mainProduct?.media_urls) {
            const urls = typeof mainProduct.media_urls === 'string' ? JSON.parse(mainProduct.media_urls) : mainProduct.media_urls;
            productImages.push(...urls.map((u: string) => ({ url: u, type: 'IMAGE' })));
        }

        const variantImages = [];
        if (variant?.media_assets) {
            variantImages.push(...(typeof variant.media_assets === 'string' ? JSON.parse(variant.media_assets) : variant.media_assets));
        }

        // Combine product cover (priority) and variant assets
        mediaAssets = [...productImages, ...variantImages];

        // Ensure we have at least one fallback if empty
        if (mediaAssets.length === 0) {
            mediaAssets = [{ url: null }];
        }

        description = variant?.description || mainProduct?.description || "This extremely limited edition piece has been locked in the FigiCore Vault. It is now being released for a one-time exclusive bidding event. Secure your position before the timer runs out.";
    }

    // Ensure we have at least one valid image
    const currentImageUrl = mediaAssets[activeImageIndex]?.url || mediaAssets[0]?.url || null;

    return (
        <CustomerLayout activePage="auction">
            <div className="bg-black min-h-screen pb-32 font-sans selection:bg-red-500/30 text-white relative overflow-hidden">

                {/* Immersive Background Lighting & Blurred Product Depth */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 flex items-center justify-center">
                    {/* The blurred product image for depth */}
                    {currentImageUrl && (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-20 blur-[100px] scale-125 saturate-150 transition-all duration-[2s]"
                            style={{ backgroundImage: `url(${currentImageUrl})` }}
                        ></div>
                    )}
                    {/* The ambient lighting orbs */}
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-red-600/10 blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
                    <div className="absolute top-[30%] -right-[20%] w-[60%] h-[60%] bg-amber-600/10 blur-[200px] rounded-full mix-blend-screen opacity-30 animate-pulse duration-[10s]"></div>
                </div>

                {/* Rules Strip */}
                <div className="border-b border-white/5 bg-black/50 backdrop-blur-xl relative z-20">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-6 md:gap-16 text-[10px] md:text-xs font-mono tracking-[0.2em] uppercase text-neutral-400">
                        <span className="flex items-center gap-2 group cursor-default">
                            <ShieldAlert className="w-3 h-3 text-red-500 group-hover:scale-125 transition-transform" />
                            <span className="group-hover:text-white transition-colors text-rose-500/80">Participation Requires Deposit</span>
                        </span>
                        <span className="flex items-center gap-2 group cursor-default">
                            <Flame className="w-3 h-3 text-amber-500 group-hover:scale-125 transition-transform" />
                            <span className="group-hover:text-white transition-colors">Anti-Snipe Protected (+60s)</span>
                        </span>
                        <span className="flex items-center gap-2 group cursor-default">
                            <Gavel className="w-3 h-3 text-neutral-500 group-hover:scale-125 transition-transform" />
                            <span className="group-hover:text-white transition-colors">24H Clearing Window</span>
                        </span>
                        <div className="h-4 w-px bg-white/10 mx-2 hidden md:block"></div>
                        <button 
                            onClick={() => setShowRulesModal(true)}
                            className="flex items-center gap-2 group hover:text-white transition-colors text-amber-500/90 font-bold"
                        >
                            <Info className="w-3.5 h-3.5 animate-pulse" />
                            <span>Bidding Rules & FAQ</span>
                        </button>
                    </div>
                </div>



                <div className="container mx-auto px-4 max-w-[1400px] pt-12 lg:pt-24 relative z-10">
                    {/* Return to Live Action */}
                    {auctions.some(a => a.status_code === 'ACTIVE') && spotlightRoom?.status_code !== 'ACTIVE' && (
                        <div className="flex justify-end mb-8">
                            <Button
                                onClick={() => {
                                    const liveRoom = auctions.find(a => a.status_code === 'ACTIVE');
                                    if (liveRoom) {
                                        setSelectedAuctionId(liveRoom.auction_id);
                                        setActiveImageIndex(0);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all rounded-full font-bold tracking-[0.15em] uppercase text-xs px-8 py-6 backdrop-blur-md border border-red-500/20"
                            >
                                <Flame className="w-4 h-4 mr-3 animate-pulse" /> Return to Live Vault
                            </Button>
                        </div>
                    )}

                    {!spotlightRoom ? (
                        <div className="flex flex-col items-center justify-center text-center py-40">
                            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-10 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                                <CalendarOff className="w-12 h-12 text-neutral-500" />
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter mix-blend-difference">The Vault is Sealed.</h2>
                            <p className="text-neutral-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-light">
                                All legendary artifacts are currently locked. Our curators are preparing the next exclusive drop.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">

                            {/* Left View: Out-of-Box Immersive Product Imagery */}
                            <div className="relative group w-full h-full min-h-[500px] xl:min-h-[700px] flex items-center justify-center">
                                {/* Invisible Pedestal */}
                                <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[60%] h-8 bg-black blur-2xl rounded-[100%] opacity-80 group-hover:scale-110 transition-transform duration-[2s]"></div>

                                {currentImageUrl ? (
                                    <div className="relative w-[90%] md:w-[80%] aspect-square flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden group/img-container">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-20"></div>
                                        <AnimatePresence mode="wait">
                                            <motion.img
                                                key={currentImageUrl}
                                                src={currentImageUrl}
                                                alt={mainProduct?.name}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 1.05 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative z-10"
                                            />
                                        </AnimatePresence>
                                        
                                        {/* Simplified Edge Light */}
                                        <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none z-30"></div>
                                    </div>
                                ) : (
                                    <div className="w-[90%] md:w-[80%] aspect-square bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 flex items-center justify-center">
                                        <Gavel className="w-32 h-32 text-white/5" />
                                    </div>
                                )}

                                {/* Floating Thumbnail Gallery - Better UI */}
                                {mediaAssets.length > 1 && (
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-40 opacity-0 group-hover:opacity-100 group-hover:bottom-4 transition-all duration-700 ease-out">
                                        <div className="bg-black/80 backdrop-blur-[40px] p-2.5 rounded-[2rem] border border-white/10 flex gap-2.5 shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
                                            {mediaAssets.map((asset: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] overflow-hidden relative transition-all duration-500 hover:scale-105 active:scale-95 ${activeImageIndex === idx ? 'ring-2 ring-white ring-offset-4 ring-offset-black/50 border border-white/40' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                                                >
                                                    <img src={asset.url} alt="Thumbnail" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right View: Auction HUD Details */}
                            <div className="flex flex-col relative z-20">

                                {/* Status Header */}
                                <div className="flex flex-wrap items-center gap-5 mb-8">
                                    {spotlightRoom.status_code === 'ACTIVE' ? (
                                        <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 px-5 py-2 rounded-full backdrop-blur-sm shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(220,38,38,1)]"></div>
                                            <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Live Bidding</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/30 px-5 py-2 rounded-full backdrop-blur-sm">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="text-amber-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Awaiting</span>
                                        </div>
                                    )}
                                    <div className="bg-white/5 border border-white/5 px-5 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 text-neutral-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="font-mono text-[11px] md:text-xs tracking-wider">
                                            Ends: <strong className="text-white font-medium">{new Date(spotlightRoom.end_time).toLocaleDateString('vi-VN')} {new Date(spotlightRoom.end_time).toLocaleTimeString('vi-VN')}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Title Block */}
                                <h1 className="text-5xl md:text-6xl xl:text-[5rem] font-black text-white leading-[0.9] tracking-tighter mb-6 hover:text-red-50 transition-colors">
                                    {mainProduct?.name}
                                </h1>

                                <div className="inline-flex flex-wrap items-center gap-x-6 gap-y-3 mb-10 text-sm xl:text-base">
                                    <p className="text-neutral-400 font-medium">Edition <span className="text-white font-bold tracking-wide uppercase px-2">{variant?.option_name}</span></p>
                                    <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></span>
                                    <p className="text-neutral-400 font-medium">Brand <span className="text-white font-bold tracking-wide uppercase px-2">{mainProduct?.brands?.name || 'N/A'}</span></p>
                                    <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full hidden sm:block"></span>
                                    <p className="text-neutral-400 font-medium hidden sm:block">Scale <span className="text-white font-bold tracking-wide uppercase px-2">{variant?.scale || 'N/A'}</span></p>
                                </div>

                                {/* Description */}
                                <div className="prose prose-invert prose-p:text-neutral-400 prose-p:leading-[1.8] prose-p:text-lg mb-12 max-w-2xl font-light">
                                    <p dangerouslySetInnerHTML={{ __html: description?.replace(/\n/g, '<br />') }}></p>
                                </div>

                                {/* Holographic Pricing HUD */}
                                <div className="bg-white/10 border border-white/20 rounded-[2rem] p-8 md:p-10 mb-12 backdrop-blur-[40px] relative group overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700"></div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-10 mb-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] md:text-xs font-mono text-neutral-300 uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-md">
                                                Starting Block
                                            </p>
                                            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">{formatPrice(Number(spotlightRoom.start_price))}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] md:text-xs font-mono text-rose-300 uppercase tracking-[0.2em] font-bold flex items-center gap-2 drop-shadow-md">
                                                Locked Deposit <ShieldAlert className="w-3.5 h-3.5" />
                                            </p>
                                            <p className="text-4xl md:text-5xl font-black text-rose-400 tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">{formatPrice(Number(spotlightRoom.deposit_fee))}</p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/20 flex flex-wrap items-center justify-between gap-6 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-mono text-neutral-300 uppercase tracking-[0.2em] mb-2 drop-shadow-md">Increment Step</p>
                                            <p className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md">{formatPrice(Number(spotlightRoom.step_price))}</p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] font-mono text-neutral-300 uppercase tracking-[0.2em] mb-2 md:ml-auto drop-shadow-md">Capacity Level</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden shadow-inner backdrop-blur-md">
                                                    <div
                                                        className={`h-full shadow-[0_0_10px_rgba(255,255,255,0.8)] ${(spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants ? 'bg-rose-500' : 'bg-white'}`}
                                                        style={{ width: `${Math.min(((spotlightRoom._count?.auction_participants || 0) / spotlightRoom.max_participants) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`font-mono text-sm xl:text-base font-bold drop-shadow-md ${((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants) ? 'text-rose-400' : 'text-white'}`}>
                                                    {spotlightRoom._count?.auction_participants || 0}<span className="text-white/60">/{spotlightRoom.max_participants}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="space-y-4">
                                    <Button
                                        onClick={() => {
                                            navigate(`/customer/auctions/${spotlightRoom.auction_id}`);
                                        }}
                                        disabled={
                                            spotlightRoom.status_code === 'UPCOMING' ||
                                            (((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants) && spotlightRoom.status_code !== 'COMPLETED' && !joinedRooms[spotlightRoom.auction_id])
                                        }
                                        size="lg"
                                        className={`w-full h-20 rounded-[1.5rem] text-xl font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-4 group relative overflow-hidden ${spotlightRoom.status_code === 'UPCOMING' || (((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants) && spotlightRoom.status_code !== 'COMPLETED' && !joinedRooms[spotlightRoom.auction_id])
                                            ? 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'
                                            : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-[1.01]'
                                            }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-0"></div>

                                        <span className="relative z-10 flex items-center gap-4">
                                            {spotlightRoom.status_code === 'UPCOMING' ? (
                                                <>Upcoming <Clock className="w-6 h-6" /></>
                                            ) : (
                                                <>
                                                    {((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants && !joinedRooms[spotlightRoom.auction_id]) ? 'Watch Only - At Capacity' : 'Enter Live Vault'} <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </Button>

                                    <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
                                        <DialogContent className="bg-[#050505]/90 backdrop-blur-3xl border border-white/10 text-white max-w-[420px] p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:rounded-[2.5rem] outline-none">

                                            {/* Top Subtle Gradient Line */}
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></div>

                                            <div className="p-8 pb-0 flex flex-col items-center text-center relative z-10">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 shadow-inner relative">
                                                    {/* Inner glow */}
                                                    <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] pointer-events-none"></div>
                                                    <Gavel className="w-6 h-6 text-white" strokeWidth={1.5} />
                                                </div>
                                                <DialogTitle className="text-2xl font-semibold tracking-tight text-white mb-2">Authorization Required</DialogTitle>
                                                <DialogDescription className="text-neutral-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                                                    To bid on <span className="text-white font-medium">{mainProduct?.name}</span>, a refundable security deposit is required.
                                                </DialogDescription>
                                            </div>

                                            <div className="p-8 space-y-8 relative z-10">
                                                {/* Deposit Overview Card */}
                                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 flex flex-col items-center relative overflow-hidden backdrop-blur-md">
                                                    {/* Glow inside the card */}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

                                                    <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-neutral-500 mb-2">Required Deposit</span>
                                                    <div className="text-[2.5rem] font-light tracking-tighter text-white mb-6 drop-shadow-sm">
                                                        {formatPrice(Number(spotlightRoom.deposit_fee))}
                                                    </div>

                                                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>

                                                    <div className="w-full flex justify-between items-center px-1">
                                                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium tracking-wide">
                                                            <Wallet className="w-3.5 h-3.5" strokeWidth={2} />
                                                            <span>Available Balance</span>
                                                        </div>
                                                        <span className={`text-sm font-semibold tracking-tight ${walletBalance >= Number(spotlightRoom.deposit_fee) ? 'text-white' : 'text-rose-400'}`}>
                                                            {formatPrice(walletBalance)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Subtle terms */}
                                                <div className="space-y-3 px-2">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-1 h-1 rounded-full bg-neutral-600 mt-2 flex-shrink-0"></div>
                                                        <p className="text-[13px] text-neutral-400 leading-relaxed">Deposit is <span className="text-neutral-200 font-medium">100% refunded</span> immediately if you do not win the auction.</p>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-1 h-1 rounded-full bg-neutral-600 mt-2 flex-shrink-0"></div>
                                                        <p className="text-[13px] text-neutral-400 leading-relaxed">Winning bids must be fulfilled within 24 hours to prevent deposit forfeiture.</p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="pt-2 flex flex-col gap-3">
                                                    {walletBalance >= Number(spotlightRoom.deposit_fee) ? (
                                                        <Button
                                                            onClick={handleJoinConfirm}
                                                            disabled={isJoining}
                                                            className="w-full bg-white text-black hover:bg-neutral-200 h-14 rounded-2xl font-semibold tracking-wide text-[13px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                                        >
                                                            {isJoining ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Authorize & Lock Deposit'}
                                                        </Button>
                                                    ) : (
                                                        <div className="flex flex-col gap-3">
                                                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-xl flex items-center justify-center gap-2">
                                                                <Info className="w-3.5 h-3.5" /> Insufficient balance to authorize
                                                            </div>
                                                            <Button
                                                                onClick={() => navigate('/customer/wallet?mode=topup')}
                                                                className="w-full bg-white text-black hover:bg-neutral-200 h-14 rounded-2xl font-semibold tracking-wide text-[13px] transition-all"
                                                            >
                                                                Add Funds to Wallet
                                                            </Button>
                                                        </div>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setShowJoinModal(false)}
                                                        className="w-full text-neutral-400 hover:text-white hover:bg-white/5 h-12 rounded-2xl font-medium tracking-wide text-[13px] transition-all"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants) && spotlightRoom.status_code !== 'COMPLETED' && !joinedRooms[spotlightRoom.auction_id] && (
                                        <p className="text-center text-xs text-red-500 uppercase tracking-widest font-bold flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5">
                                            <AlertCircle className="w-4 h-4" /> Capacity Limit Reached
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* Auxiliary Vaults / Schedule Section */}
                {scheduleRooms.length > 0 && (
                    <div className="container mx-auto px-4 max-w-[1400px] pt-32 lg:pt-48 relative z-20">
                        <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">Auxiliary Vaults</h2>
                                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Scheduled & Upcoming Artifacts</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {scheduleRooms.map((room) => {
                                const p = room.product_variants;
                                const prod = p?.products;
                                
                                // Image Priority Logic
                                const prodImages = typeof prod?.media_urls === 'string' ? JSON.parse(prod.media_urls) : prod?.media_urls;
                                const variantImages = typeof p?.media_assets === 'string' ? JSON.parse(p.media_assets) : p?.media_assets;
                                const img = prodImages?.[0] || variantImages?.[0]?.url;

                                return (
                                    <div
                                        key={room.auction_id}
                                        onClick={() => {
                                            setSelectedAuctionId(room.auction_id);
                                            setActiveImageIndex(0);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`group cursor-pointer rounded-3xl overflow-hidden relative flex flex-col aspect-[4/5] bg-neutral-900 border transition-all duration-500 hover:-translate-y-2 ${room.status_code === 'ACTIVE' ? 'border-red-500/50 hover:shadow-[0_20px_40px_rgba(220,38,38,0.2)]' : 'border-white/5 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]'}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10 bottom-0 top-[30%]"></div>

                                        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6 z-0 bg-[#0a0a0a]">
                                            {img ? (
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    {/* Card Image Depth Glow */}
                                                    <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                    <img 
                                                        src={img} 
                                                        alt={prod?.name} 
                                                        className="w-[85%] h-[85%] object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-700 ease-out relative z-10 rounded-2xl" 
                                                    />
                                                </div>
                                            ) : (
                                                <Gavel className="w-16 h-16 text-white/5" />
                                            )}
                                        </div>

                                        <div className="relative z-20 mt-auto p-6 flex flex-col justify-end">
                                            {room.status_code === 'ACTIVE' ? (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live Now</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Scheduled</span>
                                            )}

                                            <h4 className="text-lg font-bold text-white leading-tight mb-2 line-clamp-2">{prod?.name}</h4>

                                            <div className="flex items-center justify-between mt-4">
                                                <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-neutral-500" /> {new Date(room.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} Ends
                                                </p>
                                                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Vault Archives Section */}
                {archiveAuctions.length > 0 && (
                    <div className="container mx-auto px-4 max-w-[1400px] pt-16 pb-20 relative z-20">
                        <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-6">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                    <Archive className="w-8 h-8 text-neutral-500" /> Vault Archives
                                </h2>
                                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Past biddings & Historic wins</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-70 hover:opacity-100 transition-opacity duration-500">
                            {archiveAuctions.map((room) => {
                                const p = room.product_variants;
                                const prod = p?.products;
                                
                                const prodImages = typeof prod?.media_urls === 'string' ? JSON.parse(prod.media_urls) : prod?.media_urls;
                                const variantImages = typeof p?.media_assets === 'string' ? JSON.parse(p.media_assets) : p?.media_assets;
                                const img = prodImages?.[0] || variantImages?.[0]?.url;

                                return (
                                    <div
                                        key={room.auction_id}
                                        onClick={() => navigate(`/customer/auctions/${room.auction_id}`)}
                                        className="group cursor-pointer rounded-2xl overflow-hidden relative flex flex-col aspect-square bg-neutral-950 border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 grayscale hover:grayscale-0"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent z-10 bottom-0 top-[40%]"></div>

                                        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-8 z-0">
                                            {img ? (
                                                <img src={img} alt={prod?.name} className="w-full h-full object-contain filter drop-shadow-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                                            ) : (
                                                <Gavel className="w-12 h-12 text-white/5" />
                                            )}
                                        </div>

                                        <div className="relative z-20 mt-auto p-5 flex flex-col justify-end">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border border-neutral-700 px-2 py-0.5 rounded-sm">Ended</span>
                                            </div>

                                            <h4 className="text-base font-bold text-neutral-300 leading-tight mb-2 line-clamp-2 group-hover:text-white transition-colors">{prod?.name}</h4>

                                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
                                                <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                                                    {new Date(room.end_time).toLocaleDateString('vi-VN')}
                                                </p>
                                                <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider flex items-center gap-1">
                                                    View Details <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Rules & Participation Guidelines Modal */}
                <Dialog open={showRulesModal} onOpenChange={setShowRulesModal}>
                    <DialogContent className="bg-[#050505]/95 backdrop-blur-3xl border border-white/10 text-white max-w-[600px] p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] sm:rounded-[2rem] outline-none">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none"></div>
                        
                        <div className="p-10 pb-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Gavel className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black tracking-tight uppercase">Bidding Protocol</DialogTitle>
                                    <DialogDescription className="text-neutral-500 font-mono text-[10px] tracking-widest uppercase mt-1">Participation Guidelines & Legal Terms</DialogDescription>
                                </div>
                            </div>

                            <div className="space-y-8 py-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 custom-scrollbar">
                                <section className="space-y-3">
                                    <h3 className="text-amber-500 font-bold text-sm tracking-wider uppercase">1. Mandatory Security Deposit</h3>
                                    <p className="text-neutral-400 text-[13px] leading-relaxed">
                                        Participation in any FigiCore Vault auction requires a security deposit. This amount is **fully refundable** immediately after the auction ends if you are not the winner. For the winner, it will be applied toward the final payment.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-amber-500 font-bold text-sm tracking-wider uppercase">2. Anti-Snipe Extension</h3>
                                    <p className="text-neutral-400 text-[13px] leading-relaxed">
                                        To ensure fairness, any bid placed within the **final 60 seconds** of an auction will automatically extend the timer by an additional 60 seconds. This continues until no new bids are placed for one full minute.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-amber-500 font-bold text-sm tracking-wider uppercase">3. Increment Rules</h3>
                                    <p className="text-neutral-400 text-[13px] leading-relaxed">
                                        Each bid must be higher than the current top bid by at least the **Increment Step** specified for each item. You can place a maximum bid, and the system will automatically bid on your behalf up to that amount.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-amber-500 font-bold text-sm tracking-wider uppercase">4. Win Fulfillment</h3>
                                    <p className="text-neutral-400 text-[13px] leading-relaxed">
                                        Auction winners are legally obligated to complete the payment for their item within **24 hours**. Failure to do so will result in the forfeiture of your security deposit and potential banning from the platform.
                                    </p>
                                </section>
                            </div>
                        </div>

                        <div className="p-8 pt-4 border-t border-white/5 bg-white/5">
                            <Button 
                                onClick={() => setShowRulesModal(false)}
                                className="w-full bg-white text-black hover:bg-neutral-200 h-14 rounded-2xl font-bold tracking-widest uppercase text-xs"
                            >
                                I Understand
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </CustomerLayout>
    );
}
