import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BlindBoxPromoSection() {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto px-4 max-w-7xl relative z-20 mb-12">
            <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-[#0A0A0A] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] group cursor-pointer" onClick={() => navigate('/customer/blindbox')}>

                {/* 1. ANIMATED BACKGROUND */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Dark Premium Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-[#1a1a1a] to-zinc-900" />

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out" />

                    {/* Subtle Glows */}
                    <div className="absolute top-[-50%] left-[-20%] w-[50%] h-[150%] bg-amber-500/10 blur-[100px] rounded-full opacity-60" />
                    <div className="absolute bottom-[-50%] right-[-20%] w-[50%] h-[150%] bg-purple-900/20 blur-[100px] rounded-full opacity-60" />
                </div>

                {/* 2. CONTENT GRID */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-12">

                    {/* LEFT: COPY & CTA */}
                    <div className="space-y-6 md:pl-8 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200 font-bold">
                                Members Only
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-500">
                                    The Secret Collection
                                </span>
                            </h2>
                            <p className="text-slate-400 font-light text-sm md:text-base max-w-md mx-auto md:mx-0">
                                A curated selection of high-value rarities. Hidden from the public eye. Are you feeling lucky?
                            </p>
                        </div>

                        <Button
                            onClick={() => navigate('/customer/blindbox')}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-serif tracking-widest uppercase px-8 py-6 rounded-xl backdrop-blur-md transition-all group-hover:border-amber-500/50 group-hover:text-amber-100"
                        >
                            Unlock Access <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {/* RIGHT: FLOATING MYSTERY BOX SILHOUETTE */}
                    <div className="relative flex items-center justify-center h-64 md:h-80">
                        {/* Levitation Container */}
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="relative w-48 h-48 md:w-64 md:h-64"
                        >
                            {/* The "Box" Silhouette */}
                            <div className="absolute inset-0 bg-black rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(251,191,36,0.1)] flex items-center justify-center backdrop-blur-xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

                                {/* Question Mark / Icon */}
                                <Sparkles className="w-20 h-20 text-amber-500/80 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />

                                {/* Inner Glow */}
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent" />
                            </div>

                            {/* Border Glow Animation */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 rounded-[2rem] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
}
