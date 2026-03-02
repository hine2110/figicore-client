import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomerLayout from '@/layouts/CustomerLayout';
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Clock, ShieldAlert, BadgeInfo, Zap, TrendingUp, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerAuctionRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Skeleton State Setup for Phase 2
    const [auction, setAuction] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false); // Change to true when API is ready
    const [incomingBid, setIncomingBid] = useState(false);

    // Simulate Fetch Data
    useEffect(() => {
        // Simulated initial load
        setTimeout(() => {
            setIsLoading(false);
        }, 500);

        // Simulating a random bid coming in for visual testing
        const interval = setInterval(() => {
            setIncomingBid(true);
            setTimeout(() => setIncomingBid(false), 500); // 500ms haptic flash
        }, 8000);

        return () => clearInterval(interval);
    }, [id]);

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
        <div className="bg-black min-h-screen font-sans text-white flex flex-col overflow-hidden relative selection:bg-red-500/30">

            {/* Immersive Background Lighting */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 z-0 ${incomingBid ? 'opacity-100' : 'opacity-40'}`}>
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] bg-red-600/10 blur-[200px] rounded-full mix-blend-screen"></div>
                {incomingBid && (
                    <div className="absolute inset-0 bg-red-600/5 mix-blend-screen animate-in fade-in duration-100"></div>
                )}
            </div>

            {/* Header / Navbar - Sleeker, completely transparent */}
            <header className="h-20 border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 lg:px-10 absolute top-0 left-0 w-full z-50">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/customer/auctions')} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] leading-none mb-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                            Live Terminal
                        </span>
                        <h1 className="text-xl font-black text-white leading-none tracking-tight">VAULT #{id}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-black/40 backdrop-blur-md text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                        <ShieldAlert className="w-3.5 h-3.5" /> SECURE CONNECTION
                    </div>
                </div>
            </header>

            {/* Main Content Spli - Fill screen, flex */}
            <main className="flex-1 flex flex-col lg:flex-row w-full h-screen pt-20 relative z-10">

                {/* Left side: Immersive Product Theater (65%) */}
                <div className="flex-[1.5] relative flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden group">

                    {/* Blurred Product Image Background for Depth */}
                    {/* Since this is a placeholder without actual image data yet, we use a glowing div that mimics a blurred image */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
                        <div className="w-[150%] h-[150%] bg-gradient-to-tr from-neutral-800 to-neutral-900 rounded-full blur-[100px] scale-150 saturate-150 mix-blend-screen transition-all duration-[2s]"></div>
                    </div>

                    {/* Floating Product Image - No Box */}
                    <div className="relative w-full max-w-2xl xl:max-w-4xl max-h-[80vh] flex items-center justify-center z-10">
                        {/* Shadow Base for perspective */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-12 bg-black blur-2xl rounded-full opacity-80"></div>

                        {/* Placeholder 3D-feeling Image Representation */}
                        <div className={`w-full aspect-square md:aspect-auto md:h-[60vh] xl:h-[70vh] flex items-center justify-center flex-col gap-6 text-white/5 relative z-10 transition-transform duration-[2s] ${incomingBid ? 'scale-105 drop-shadow-[0_0_40px_rgba(220,38,38,0.2)]' : 'hover:scale-[1.02] drop-shadow-[0_40px_50px_rgba(0,0,0,0.9)]'}`}>
                            {/* Insert Real Img tag here when integrated */}
                            <Anchor className="w-48 h-48 drop-shadow-2xl" />
                            <span className="text-sm font-mono tracking-[0.3em] uppercase opacity-50">Awaiting Product Feed</span>
                        </div>
                    </div>

                    {/* Minimalist Floating Overlay Data (Bottom Left) */}
                    <div className="absolute bottom-8 lg:bottom-12 left-6 lg:left-12 z-20 pointer-events-none opacity-0 md:opacity-100 transition-opacity">
                        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] max-w-sm">
                            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Placeholder Product Name</h2>
                            <div className="flex flex-col gap-2">
                                <span className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest"><BadgeInfo className="w-3.5 h-3.5 text-neutral-500" /> Standard Edition</span>
                                <span className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Authenticity Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: The Glassmorphic Terminal (35%) */}
                <div className="w-full lg:w-[450px] xl:w-[500px] h-full flex flex-col p-4 lg:p-6 lg:pl-0 z-20">

                    <div className="flex-1 bg-white/10 border border-white/20 rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[40px] flex flex-col relative overflow-hidden">

                        {/* Terminal Background Glow */}
                        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent pointer-events-none mix-blend-overlay"></div>

                        {/* Top: Current Highest Bid Focus Area */}
                        <div className={`p-8 lg:p-10 border-b border-white/20 flex flex-col items-center justify-center text-center transition-all duration-300 relative ${incomingBid ? 'bg-rose-500/20' : ''}`}>

                            {/* Pulse burst on new bid */}
                            {incomingBid && <div className="absolute inset-0 border-2 border-rose-500/60 rounded-t-[2rem] lg:rounded-t-[2.5rem] animate-out fade-out zoom-out-150 duration-700 pointer-events-none"></div>}

                            <div className="flex items-center justify-center gap-3 bg-rose-500/20 border border-rose-400/30 px-4 py-1.5 rounded-full mb-6 relative shadow-inner">
                                <span className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping shadow-[0_0_8px_rgba(244,63,94,1)]"></span>
                                <Clock className="w-4 h-4 text-rose-300 drop-shadow-md" />
                                <span className="text-sm font-bold text-rose-200 font-mono tracking-widest drop-shadow-md">00:05:30</span>
                            </div>

                            <p className="text-[10px] xl:text-xs font-mono text-white/70 uppercase tracking-[0.3em] mb-3 drop-shadow-sm">Target Price</p>

                            {/* Make the price massive */}
                            <div className={`text-5xl xl:text-6xl font-black tracking-tighter mb-4 transition-all duration-300 ${incomingBid ? 'text-rose-300 scale-110 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]' : 'text-white drop-shadow-lg'}`}>
                                800.000 ₫
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                <span className="text-neutral-500 uppercase tracking-widest">Highest Bid:</span>
                                <span className="text-white font-bold">User***89</span>
                            </div>
                        </div>

                        {/* Middle: Data Stream (Log) */}
                        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-end relative overflow-hidden inner-shadow-top">
                            {/* Gradient mask to fade out the top logs */}
                            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white/[0.05] to-transparent z-10 pointer-events-none mix-blend-overlay"></div>

                            <div className="space-y-4 relative z-0 flex flex-col">
                                {/* Simulated Old Bid */}
                                <div className="flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity drop-shadow-sm">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-[10px] font-mono text-white/50 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div> -00:04:20
                                        </div>
                                        <div className="text-sm font-bold text-white/80">You</div>
                                    </div>
                                    <div className="text-sm font-mono text-white/70 border border-white/20 px-3 py-1 rounded-xl bg-white/5 backdrop-blur-sm">
                                        700.000 ₫
                                    </div>
                                </div>

                                {/* Simulated New Bid */}
                                <div className={`flex justify-between items-center bg-white/10 p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${incomingBid ? 'border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105 -translate-y-2' : 'border-white/20'}`}>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-[10px] font-mono text-rose-300 uppercase tracking-wider flex items-center gap-2 drop-shadow-md">
                                            <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> -00:05:00
                                        </div>
                                        <div className="text-base font-bold text-white flex items-center gap-2 drop-shadow-md">
                                            User***89 <BadgeInfo className="w-4 h-4 text-blue-300 drop-shadow-md" />
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-rose-100 px-3 py-1.5 bg-rose-500/20 border border-rose-400/30 rounded-xl shadow-inner">
                                        800.000 ₫
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Action Command Panel */}
                        <div className="p-6 lg:p-8 border-t border-white/20 bg-white/5 backdrop-blur-xl relative z-20">
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <Button variant="outline" className="h-12 bg-white/10 border-white/20 hover:bg-white/30 hover:border-white/40 text-white font-mono text-xs xl:text-sm font-bold tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md">
                                    +100K
                                </Button>
                                <Button variant="outline" className="h-12 bg-white/10 border-white/20 hover:bg-white/30 hover:border-white/40 text-white font-mono text-xs xl:text-sm font-bold tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md">
                                    +200K
                                </Button>
                                <Button variant="outline" className="h-12 bg-white/10 border-white/20 hover:bg-white/30 hover:border-white/40 text-white font-mono text-xs xl:text-sm font-bold tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md">
                                    +500K
                                </Button>
                            </div>

                            <Button size="lg" className="w-full h-20 rounded-[1.5rem] bg-white text-black hover:bg-neutral-100 hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)] font-black uppercase tracking-[0.3em] text-lg xl:text-xl transition-all duration-300 relative group overflow-hidden">
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out mix-blend-overlay z-0"></span>
                                <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                                    <Zap className="w-6 h-6 fill-current" /> Initialize Bid
                                </span>
                            </Button>
                        </div>

                    </div>
                </div>

            </main>

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
            `}</style>
        </div>
    );
}
