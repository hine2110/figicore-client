import { useState, useEffect } from "react";
import CustomerLayout from '@/layouts/CustomerLayout';
import { Gavel, Clock, Flame, ShieldAlert, AlertCircle, CalendarOff, ArrowRight, CalendarDays, ChevronRight, Loader2, Wallet, Info, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { auctionsService } from "@/services/auctions.service";
import { walletService } from "@/services/wallet.service";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function CustomerAuctions() {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState<any[]>([]);
    const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isJoining, setIsJoining] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const initData = async () => {
            await fetchAuctions();
            await fetchWallet();
        };
        initData();
    }, []);

    const fetchWallet = async () => {
        try {
            const res = await walletService.getMyWallet();
            if (res.success && res.data) {
                setWalletBalance(Number(res.data.balance_available));
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
            if (publicAuctions.length > 0) {
                setSelectedAuctionId(publicAuctions[0].auction_id);
            }
        } catch (error) {
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

        // Use variant's media_assets if available (parsed from JSON string if needed), otherwise fallback
        if (variant?.media_assets) {
            mediaAssets = typeof variant.media_assets === 'string' ? JSON.parse(variant.media_assets) : variant.media_assets;
        } else if (mainProduct?.media_urls) {
            mediaAssets = (typeof mainProduct.media_urls === 'string' ? JSON.parse(mainProduct.media_urls) : mainProduct.media_urls).map((u: string) => ({ url: u }));
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
                            <span className="group-hover:text-white transition-colors">Deposit Required</span>
                        </span>
                        <span className="flex items-center gap-2 group cursor-default">
                            <Flame className="w-3 h-3 text-amber-500 group-hover:scale-125 transition-transform" />
                            <span className="group-hover:text-white transition-colors">Anti-Snipe Protected (+60s)</span>
                        </span>
                        <span className="items-center gap-2 group cursor-default hidden md:flex">
                            <Gavel className="w-3 h-3 text-neutral-500 group-hover:scale-125 transition-transform" />
                            <span className="group-hover:text-white transition-colors">24H Clearing Window</span>
                        </span>
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
                                    <img
                                        src={currentImageUrl}
                                        alt={mainProduct?.name}
                                        className="w-[90%] md:w-[80%] h-auto max-h-[750px] object-contain filter drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)] xl:drop-shadow-[0_40px_50px_rgba(0,0,0,0.9)] scale-100 group-hover:scale-105 group-hover:-translate-y-4 transition-all duration-[2s] ease-in-out relative z-10"
                                    />
                                ) : (
                                    <Gavel className="w-32 h-32 text-white/5 relative z-10" />
                                )}

                                {/* Floating Thumbnail Gallery */}
                                {mediaAssets.length > 1 && (
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-30 opacity-0 group-hover:opacity-100 group-hover:bottom-4 transition-all duration-500">
                                        <div className="bg-black/60 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 flex gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                                            {mediaAssets.map((asset: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden relative transition-all duration-300 ${activeImageIndex === idx ? 'scale-105 z-10 border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border border-transparent opacity-40 hover:opacity-100 hover:scale-100'}`}
                                                >
                                                    {/* Brighten the active thumbnail */}
                                                    <div className={`absolute inset-0 bg-black transition-opacity ${activeImageIndex === idx ? 'opacity-0' : 'opacity-40'}`}></div>
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
                                        onClick={(e) => {
                                            if (spotlightRoom.status_code === 'UPCOMING' ||
                                                ((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants && spotlightRoom.status_code !== 'COMPLETED')) {
                                                e.preventDefault();
                                            } else {
                                                setShowJoinModal(true);
                                            }
                                        }}
                                        disabled={
                                            spotlightRoom.status_code === 'UPCOMING' ||
                                            (((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants) && spotlightRoom.status_code !== 'COMPLETED')
                                        }
                                        size="lg"
                                        className={`w-full h-20 rounded-[1.5rem] text-xl font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-4 group relative overflow-hidden ${spotlightRoom.status_code === 'UPCOMING' || ((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants && spotlightRoom.status_code !== 'COMPLETED')
                                            ? 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'
                                            : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-[1.01]'
                                            }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-0"></div>

                                        <span className="relative z-10 flex items-center gap-4">
                                            {spotlightRoom.status_code === 'UPCOMING' ? (
                                                <>Vault Locked <Clock className="w-6 h-6" /></>
                                            ) : (
                                                <>
                                                    {((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants) ? 'Vault At Capacity' : 'Access The Vault'} <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </Button>

                                    <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
                                        <DialogContent className="bg-white/10 backdrop-blur-[60px] border-white/20 text-white max-w-xl p-0 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:rounded-[2.5rem]">
                                            {/* Header */}
                                            <div className="bg-white/10 px-8 py-8 border-b border-white/20 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md">
                                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-[60px] rounded-full pointer-events-none mix-blend-overlay"></div>
                                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 blur-[60px] rounded-full pointer-events-none"></div>

                                                <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(255,255,255,0.1)]">
                                                    <Gavel className="w-8 h-8 text-white drop-shadow-md" />
                                                </div>
                                                <DialogTitle className="text-3xl font-black mb-2 tracking-tighter drop-shadow-lg">Vault Protocol</DialogTitle>
                                                <DialogDescription className="text-white/80 text-base max-w-sm mx-auto drop-shadow-md">
                                                    To grant entry and bidding rights for <strong className="text-white">{mainProduct?.name}</strong>, please complete authorization.
                                                </DialogDescription>
                                            </div>

                                            <div className="p-8 space-y-8 bg-black/20">
                                                {/* Rules List */}
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-md">
                                                        <FileText className="w-3.5 h-3.5" /> Terms of Entry
                                                    </h4>
                                                    <div className="bg-white/10 border border-white/20 p-5 rounded-3xl space-y-4 backdrop-blur-xl shadow-inner text-shadow-sm">
                                                        <div className="text-sm text-white/90 flex items-start gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(255,255,255,1)]"></div>
                                                            <span className="leading-relaxed">Security deposit will be transferred from your <strong className="text-white font-black">FigiWallet</strong> to a locked state.</span>
                                                        </div>
                                                        <div className="text-sm text-white/90 flex items-start gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(255,255,255,1)]"></div>
                                                            <span className="leading-relaxed">Deposit is <strong className="text-white font-black">100% instantly refunded</strong> if you do not place the winning bid at closure.</span>
                                                        </div>
                                                        <div className="text-sm text-white/90 flex items-start gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,1)]"></div>
                                                            <span className="leading-relaxed">Winning bidders who fail to clear the final payment within 24 hours will <strong className="text-rose-300 font-black">forfeit</strong> their deposit.</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Financial Overview */}
                                                <div className="bg-white/10 border border-white/20 rounded-3xl p-6 relative overflow-hidden shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-xl">
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${walletBalance >= Number(spotlightRoom.deposit_fee) ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,1)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)]'}`}></div>

                                                    <div className="flex justify-between items-center mb-5">
                                                        <span className="text-xs font-mono text-white/70 uppercase tracking-widest drop-shadow-md">Calculated Deposit</span>
                                                        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">{formatPrice(Number(spotlightRoom.deposit_fee))}</span>
                                                    </div>

                                                    <div className="h-px w-full bg-white/20 my-5"></div>

                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3 text-xs font-mono text-white/80 uppercase tracking-widest relative drop-shadow-md">
                                                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,1)]"></span>
                                                            <Wallet className="w-4 h-4 ml-1" /> FigiWallet
                                                        </div>
                                                        <span className={`text-xl font-bold tracking-tight drop-shadow-lg ${walletBalance >= Number(spotlightRoom.deposit_fee) ? 'text-white' : 'text-rose-300'}`}>
                                                            {formatPrice(walletBalance)}
                                                        </span>
                                                    </div>

                                                    {walletBalance < Number(spotlightRoom.deposit_fee) && (
                                                        <div className="mt-5 bg-rose-500/20 border border-rose-500/30 p-4 rounded-2xl flex gap-3 text-rose-200 text-xs leading-relaxed backdrop-blur-md">
                                                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                            <p>Insufficient balance. Please add funds to your FigiWallet to authorize this transaction.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="p-8 bg-black/60 backdrop-blur-xl border-t border-white/5 flex gap-4">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowJoinModal(false)}
                                                    className="flex-1 text-neutral-400 hover:text-white hover:bg-white/10 h-14 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs"
                                                >
                                                    Abort
                                                </Button>

                                                {walletBalance >= Number(spotlightRoom.deposit_fee) ? (
                                                    <Button
                                                        onClick={handleJoinConfirm}
                                                        disabled={isJoining}
                                                        className="flex-[2] bg-white text-black hover:bg-neutral-200 h-14 rounded-xl font-black tracking-[0.15em] uppercase text-xs shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                                                    >
                                                        {isJoining ? <><Loader2 className="w-4 h-4 mr-3 animate-spin" /> Authorizing...</> : 'Confirm & Lock'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => navigate('/customer/wallet?mode=topup')}
                                                        className="flex-[2] bg-red-600 text-white hover:bg-red-700 h-14 rounded-xl font-black tracking-[0.15em] uppercase text-xs shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                                                    >
                                                        Top Up Wallet
                                                    </Button>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {((spotlightRoom._count?.auction_participants || 0) >= spotlightRoom.max_participants) && spotlightRoom.status_code !== 'COMPLETED' && (
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
                                const img = p?.media_assets?.[0]?.url || prod?.media_urls?.[0];

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

                                        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-8 z-0 bg-black">
                                            {img ? (
                                                <img src={img} alt={prod?.name} className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-700 ease-out" />
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
            </div>
        </CustomerLayout>
    );
}
