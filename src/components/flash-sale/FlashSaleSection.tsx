import { Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import FlashSaleCard, { FlashSaleItem } from './FlashSaleCard';

interface FlashSaleSectionProps {
    items: FlashSaleItem[];
    endTime: string;  // ISO string — shared end_time for the flash sale event
    title?: string;
    onExpire?: () => void; // called when the countdown reaches 0 → parent can re-fetch
}

/**
 * FlashSaleSection — hero homepage block with:
 *   - Striking red/orange header + countdown
 *   - Responsive grid of FlashSaleCards
 * Designed to generate strong FOMO at a glance.
 */
export default function FlashSaleSection({
    items,
    endTime,
    title = 'FLASH SALE',
    onExpire,
}: FlashSaleSectionProps) {
    const navigate = useNavigate();

    if (!items || items.length === 0) return null;

    return (
        <section className="relative w-full overflow-hidden rounded-[2rem] shadow-[0_24px_80px_rgba(200,40,0,0.25)]">
            {/* ── Background flame gradient ── */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0200] via-[#0d0000] to-[#0a0a0a]" />
            {/* Glowing orbs */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-orange-500/15 rounded-full blur-[100px] pointer-events-none" />

            {/* ── Content ── */}
            <div className="relative z-10 p-5 md:p-8">

                {/* Header Row */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap items-center justify-between gap-4 mb-6"
                >
                    {/* Left: Icon + Title */}
                    <div className="flex items-center gap-3">
                        {/* Animated lightning icon */}
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/50">
                            <Zap className="w-7 h-7 text-white fill-white drop-shadow" />
                            {/* Pulse ring */}
                            <span className="absolute inset-0 rounded-xl bg-orange-400/40 animate-ping" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_2px_6px_rgba(255,100,0,0.4)]">
                                ⚡ {title}
                            </h2>
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mt-0.5">
                                Limited time · Limited stock
                            </p>
                        </div>
                    </div>

                    {/* Right: Countdown + View All */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                                Ends in
                            </span>
                            <CountdownTimer endTime={endTime} onExpire={onExpire} />
                        </div>
                        <button
                            onClick={() => navigate('/customer/retail?filter=flash_sale')}
                            className="hidden md:flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm font-bold transition-colors group"
                        >
                            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-orange-500/40 via-red-500/20 to-transparent mb-6" />

                {/* Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.variant_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.35 }}
                        >
                            <FlashSaleCard item={item} />
                        </motion.div>
                    ))}
                </div>

                {/* Mobile View All */}
                <div className="md:hidden flex justify-center mt-5">
                    <button
                        onClick={() => navigate('/customer/retail?filter=flash_sale')}
                        className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 text-sm font-bold px-6 py-2.5 rounded-full transition-all"
                    >
                        View All Flash Sales <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}
