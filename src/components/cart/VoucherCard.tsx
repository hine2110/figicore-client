import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketPercent, Check, ChevronDown, ChevronUp } from 'lucide-react';

export const springConfig = {
    type: "spring",
    stiffness: 300,
    damping: 30,
} as const;

export const VoucherCard = ({ 
    mv, 
    type, 
    isSelected, 
    isAvailableForThisOrder, 
    onSelect, 
    formatPrice, 
    retailTotal, 
    isNotExpired, 
    startDate, 
    meetsMinOrder 
}: any) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
                opacity: isAvailableForThisOrder ? (isSelected ? 1 : 0.6) : 0.4, 
                scale: isSelected ? 1 : 0.98,
                filter: !isAvailableForThisOrder ? 'grayscale(100%)' : 'grayscale(0%)'
            }}
            transition={springConfig}
            className={`relative overflow-hidden rounded-xl border transition-colors ${isAvailableForThisOrder
                ? (isSelected ? (type === 'discount' ? 'border-orange-500' : 'border-emerald-500') : 'border-slate-200 bg-white hover:border-slate-300')
                : 'border-slate-100 bg-slate-50'}`}
        >
            {/* Shared Highlight Background */}
            {isSelected && (
                <motion.div
                    layoutId={`active-voucher-bg-${type}`}
                    className={`absolute inset-0 ${type === 'discount' ? 'bg-orange-50/50' : 'bg-emerald-50/50'}`}
                    initial={false}
                    transition={springConfig}
                />
            )}

            <div className="relative z-10 p-3">
                <div className="flex gap-3 items-start">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${type === 'discount' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <TicketPercent className="w-5 h-5" />
                    </div>

                    {/* Main Info */}
                    <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                            if (isAvailableForThisOrder) onSelect();
                        }}
                    >
                        <h4 className={`font-bold text-sm truncate ${type === 'discount' ? 'text-slate-900' : 'text-emerald-700 uppercase'}`}>
                            {type === 'discount' 
                                ? (mv.promotions.discount_type === 'PERCENTAGE' ? `Discount ${mv.promotions.discount_value}%` : `Discount ${formatPrice(Number(mv.promotions.discount_value))}`)
                                : 'FREE SHIPPING'}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                            Code: <span className="font-mono font-bold">{mv.promotions.code}</span>
                        </div>
                        
                        {/* Errors if not available */}
                        {!isAvailableForThisOrder && retailTotal > 0 && (
                            <div className="text-[10px] font-bold text-red-500 mt-1">
                                {!meetsMinOrder ? 'Min requirement not met' : (!isNotExpired ? 'Expired' : `Active from ${startDate?.toLocaleDateString()}`)}
                            </div>
                        )}
                        {!isAvailableForThisOrder && retailTotal === 0 && (
                            <div className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block uppercase">
                                Retail only
                            </div>
                        )}
                    </div>

                    {/* Checkbox Icon */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                        <div 
                            className="w-5 h-5 flex items-center justify-center cursor-pointer"
                            onClick={() => {
                                if (isAvailableForThisOrder) onSelect();
                            }}
                        >
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={springConfig}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm ${type === 'discount' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                    >
                                        <Check className="w-3 h-3 text-white" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {!isSelected && isAvailableForThisOrder && (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                            )}
                            {!isAvailableForThisOrder && (
                                <div className="w-4 h-4 rounded-full border border-slate-200 bg-slate-100" />
                            )}
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDetailsOpen(!isDetailsOpen);
                            }}
                            className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 uppercase tracking-wider font-semibold"
                        >
                            Details {isDetailsOpen ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                        </button>
                    </div>
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                    {isDetailsOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={springConfig}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 pt-3 border-t border-dashed border-slate-200/50 flex flex-col gap-1 text-[11px]">
                                {type === 'discount' && Number(mv.promotions.max_discount_amount || 0) > 0 && (
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Max discount:</span>
                                        <span className="font-semibold text-orange-600">{formatPrice(Number(mv.promotions.max_discount_amount))}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Min order:</span>
                                    <span className="font-semibold">{mv.promotions.min_order_value ? formatPrice(Number(mv.promotions.min_order_value)) : 'No limit'}</span>
                                </div>
                                {mv.promotions.end_date && (
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Expires:</span>
                                        <span>{new Date(mv.promotions.end_date).toLocaleDateString('en-US')}</span>
                                    </div>
                                )}
                                <div className="mt-1 text-slate-400 text-[10px] leading-relaxed italic text-justify">
                                    Automatically applied to eligible Retail items in cart. Voucher cannot be exchanged for cash.
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
