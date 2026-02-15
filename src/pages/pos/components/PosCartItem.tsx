import { Minus, Plus, Trash2, Package } from 'lucide-react';
import type { PosCartItem as PosCartItemType } from '@/types/pos.types';


interface PosCartItemProps {
    item: PosCartItemType;
    onUpdateQuantity: (id: number, delta: number) => void;
    onRemove: (id: number) => void;
}

export function PosCartItem({ item, onUpdateQuantity, onRemove }: PosCartItemProps) {
    return (
        <div className="group bg-white p-3 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex gap-3 relative overflow-hidden">
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-neutral-50 rounded-xl flex-shrink-0 overflow-hidden border border-neutral-100 relative shadow-inner">
                {item.thumbnail ? (
                    <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.product_name} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <Package className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-neutral-900 text-sm truncate leading-tight" title={item.product_name}>
                            {item.product_name}
                        </h3>
                        <span className="font-bold text-neutral-900 text-sm">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">{item.option_name}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    {/* Quantity Stepper - Customer Style */}
                    <div className="flex items-center bg-neutral-100/80 rounded-full h-7 border border-neutral-200/50">
                        <button
                            className="w-7 h-full flex items-center justify-center hover:bg-white rounded-l-full text-neutral-600 active:scale-90 transition-all disabled:opacity-50"
                            onClick={() => onUpdateQuantity(item.variant_id, -1)}
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center text-neutral-900 tabular-nums">{item.quantity}</span>
                        <button
                            className="w-7 h-full flex items-center justify-center hover:bg-white rounded-r-full text-neutral-600 active:scale-90 transition-all"
                            onClick={() => onUpdateQuantity(item.variant_id, 1)}
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Delete Button */}
                    <button
                        className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => onRemove(item.variant_id)}
                        title="Remove Item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
