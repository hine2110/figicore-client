import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BlindBoxPromoSection() {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto px-6 max-w-7xl relative z-20 mb-20 mt-12">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=JetBrains+Mono:wght@400;500&display=swap');
                .font-luxury-serif { font-family: 'Playfair Display', serif; }
                .font-mono-tag { font-family: 'JetBrains Mono', monospace; }
            `}</style>

            <div 
                className="relative w-full overflow-hidden rounded-[3rem] bg-[#0A0A0B] border border-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.6)] group cursor-pointer" 
                onClick={() => navigate('/customer/blindbox')}
            >

                {/* 1. MINIMALIST BACKGROUND */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#0D0D0E] to-black" />
                    
                    {/* Atmospheric Glow */}
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] bg-amber-500/[0.03] blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[140%] bg-zinc-800/[0.05] blur-[120px] rounded-full" />
                    
                    {/* Subtle Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                {/* 2. CONTENT GRID */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center p-10 md:p-16 lg:p-20">

                    {/* LEFT: INFORMATION (7 Columns) */}
                    <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-xl"
                        >
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-mono-tag">
                                Archive Access Required
                            </span>
                        </motion.div>

                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-luxury-serif italic text-white tracking-tight leading-[1.1]">
                                The Secret <br className="hidden md:block" />
                                <span className="text-amber-500/80">Vault Collection</span>
                            </h2>
                            <p className="text-zinc-500 font-normal text-sm md:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed opacity-70">
                                A curated selection of high-value artifacts released in limited monthly drops. Discover the rare, the unique, and the classified.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2">
                            <Button
                                onClick={() => navigate('/customer/blindbox')}
                                className="bg-white text-black hover:bg-zinc-200 font-mono-tag text-[10px] tracking-[0.2em] uppercase px-10 h-14 rounded-full transition-all active:scale-95 shadow-xl"
                            >
                                Enter Vault
                            </Button>
                            
                            <div className="flex items-center gap-2 text-[10px] font-mono-tag text-zinc-600 uppercase tracking-widest italic group-hover:text-zinc-400 transition-colors">
                                Next Drop: June 15 <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: VISUAL (5 Columns) */}
                    <div className="lg:col-span-5 relative flex items-center justify-center h-64 lg:h-80">
                        {/* Pedestal Shadow */}
                        <div className="absolute bottom-10 w-48 h-6 bg-black/80 blur-xl rounded-full opacity-40" />
                        
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                            className="relative w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64"
                        >
                            {/* The "Box" Silhouette */}
                            <div className="absolute inset-0 bg-[#0F0F10] rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center justify-center backdrop-blur-3xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
                                
                                {/* Centered Icon */}
                                <Sparkles className="w-16 h-16 lg:w-20 lg:h-20 text-white/5 drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
                                
                                {/* Bottom Accent */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-amber-500/[0.02] to-transparent" />
                                
                                {/* Corner Accents */}
                                <div className="absolute top-8 left-8 w-1 h-1 rounded-full bg-white/10" />
                                <div className="absolute top-8 right-8 w-1 h-1 rounded-full bg-white/10" />
                                <div className="absolute bottom-8 left-8 w-1 h-1 rounded-full bg-white/10" />
                                <div className="absolute bottom-8 right-8 w-1 h-1 rounded-full bg-white/10" />
                            </div>

                            {/* Floating Rim Light */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 rounded-[3rem] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
}
