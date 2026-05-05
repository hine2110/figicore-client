interface FlashSaleProgressProps {
    sold: number;
    quota: number;
}

/**
 * FlashSaleProgress — animated progress bar showing sold / quota.
 * Shifts to deep red when > 80% sold to amplify urgency.
 */
export default function FlashSaleProgress({ sold, quota }: FlashSaleProgressProps) {
    const pct = quota > 0 ? Math.min((sold / quota) * 100, 100) : 0;
    const isCritical = pct >= 80;
    const isSoldOut = sold >= quota;

    return (
        <div className="space-y-1.5 select-none">
            {/* Bar */}
            <div className="relative h-2 w-full rounded-full bg-black/10 overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-[width] duration-700 ease-out ${
                        isSoldOut
                            ? 'bg-gray-400'
                            : isCritical
                            ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                            : 'bg-gradient-to-r from-orange-400 to-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Label */}
            <div className="flex items-center justify-between">
                <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                        isSoldOut
                            ? 'text-gray-500'
                            : isCritical
                            ? 'text-red-500 animate-pulse'
                            : 'text-orange-600'
                    }`}
                >
                    {isSoldOut
                        ? 'Sold Out'
                        : isCritical
                        ? '🔥 Almost sold out!'
                        : `Sold ${sold}/${quota}`}
                </span>
                <span className="text-[10px] text-white/60 font-semibold">
                    {Math.round(pct)}%
                </span>
            </div>
        </div>
    );
}
