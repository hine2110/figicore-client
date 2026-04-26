import { useRef, useState, useEffect } from "react";
import { CheckSquare, Camera, FileVideo, Printer, Loader2, AlertTriangle, EyeOff, PackageCheck, ScanLine, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PackingOrder, OrderItem } from "@/types/packing";

interface PackingStationProps {
    order: PackingOrder;
    onConfirm: (videoUrl: string) => Promise<void>;
    onUpload: (file: File) => Promise<string>;
    isUploading: boolean;
    uploadProgress: number;
    uploadSpeed: string | null;
    isPacking: boolean;
    videoUrl: string | null;
}

const getMediaAssets = (assets: any): any[] => {
    if (!assets) return [];
    if (Array.isArray(assets)) return assets;
    try {
        return typeof assets === 'string' ? JSON.parse(assets) : [];
    } catch (e) {
        return [];
    }
};

export function PackingStation({ order, onConfirm, onUpload, isUploading, uploadProgress, uploadSpeed, isPacking, videoUrl }: PackingStationProps) {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    // Auto-focus Input Ref for Scanner
    const scannerInputRef = useRef<HTMLInputElement>(null);

    // Reset state when order changes
    useEffect(() => {
        setCheckedItems({});
        // Focus scanner on mount
        scannerInputRef.current?.focus();
    }, [order.order_id]);

    const handleToggleItem = (itemId: number) => {
        setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const handleScannerInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value.trim();
            // Simulate scanning logic here: find item with matching SKU and check it
            const matchedItem = order.order_items.find(i =>
                (i.allocated_variant?.sku === val) || (i.product_variants.sku === val)
            );

            if (matchedItem) {
                setCheckedItems(prev => ({ ...prev, [matchedItem.item_id]: true }));
                toast({ title: "Item Scanned", description: `${matchedItem.product_variants.sku} verified.` });
                e.currentTarget.value = ""; // Clear for next scan
            } else {
                toast({ variant: "destructive", title: "Scan Failed", description: "SKU not found in this order." });
            }
        }
    };

    const allChecked = order.order_items.every(i => checkedItems[i.item_id]);

    const renderItemInfo = (item: OrderItem) => {
        const isBlindbox = !!item.allocated_variant;
        const displayVariant = isBlindbox ? item.allocated_variant! : item.product_variants;
        const displayName = displayVariant.products.name;
        const displaySku = displayVariant.sku;
        const displayOption = displayVariant.option_name;

        // Image Logic
        const vImg = getMediaAssets(displayVariant.media_assets)[0]?.url;
        const pImg = displayVariant.products.media_urls;
        let parsedPImg = null;
        if (Array.isArray(pImg)) parsedPImg = pImg[0];
        else if (typeof pImg === 'string') try { parsedPImg = JSON.parse(pImg)[0]; } catch (e) { }
        const imgUrl = vImg || parsedPImg || "https://placehold.co/100";

        const isChecked = !!checkedItems[item.item_id];

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleToggleItem(item.item_id)}
                className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isChecked
                    ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                    : 'bg-white border-neutral-100 hover:border-blue-200 hover:shadow-md'
                    }`}
            >
                {/* Background Progress Bar Effect */}
                <div className={`absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500 ${isChecked ? 'w-full' : 'w-0'}`} />

                <div className="flex items-center gap-5 relative z-10">
                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isChecked ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-neutral-100 text-neutral-300'
                        }`}>
                        {isChecked ? <PackageCheck className="w-6 h-6" /> : <div className="w-4 h-4 rounded-sm border-2 border-neutral-300" />}
                    </div>

                    {/* Image */}
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-neutral-100 relative shadow-sm shrink-0">
                        <img src={imgUrl} alt="Prod" className="w-full h-full object-cover" />
                        {isBlindbox && (
                            <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-[2px] flex items-center justify-center">
                                <EyeOff className="w-8 h-8 text-white drop-shadow-lg animate-pulse" />
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold text-lg leading-tight truncate transition-colors ${isChecked ? 'text-blue-900' : 'text-neutral-900'}`}>
                                {displayName}
                            </h3>
                            {isBlindbox && <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] uppercase font-bold tracking-wider">Blind Box</Badge>}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                            <Badge variant="outline" className="font-mono bg-neutral-50 text-neutral-500 border-neutral-200">
                                {displaySku}
                            </Badge>
                            <span>{displayOption}</span>
                        </div>

                        {isBlindbox && (
                            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Specific Item to Pack: <strong>{displayVariant.option_name}</strong></span>
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="text-right pl-4 border-l border-neutral-100">
                        <span className="block text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">Qty</span>
                        <span className="text-3xl font-light text-neutral-900">x{item.quantity}</span>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none" />

            {/* Header / StatusBar */}
            <div className="h-20 px-8 flex items-center justify-between bg-white border-b border-neutral-200 shadow-sm z-20">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        Scanning Order #{order.order_id}
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            ref={scannerInputRef}
                            className="pl-12 w-80 h-12 rounded-full border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm shadow-inner"
                            placeholder="Scan Item Barcode / SKU..."
                            onKeyDown={handleScannerInput}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                {/* CENTER: Checklist (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-700">Items to Pack ({order.order_items.length})</h2>
                            <div className="text-sm text-slate-400">
                                Verified: <strong className="text-slate-900">{Object.keys(checkedItems).length}</strong> / {order.order_items.length}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <AnimatePresence>
                                {order.order_items.map(item => (
                                    <div key={item.item_id}>
                                        {renderItemInfo(item)}
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Actions Panel (Fixed Sidebar) */}
                <div className="w-[400px] bg-white border-l border-neutral-200 p-8 flex flex-col justify-between shadow-[-10px_0_40px_rgba(0,0,0,0.02)] z-10 transition-all">

                    {/* Customer Info Card */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Shipping Details</h3>
                            <div className="space-y-2">
                                <p className="font-semibold text-lg text-slate-800">{order.addresses?.recipient_name || "Unknown Recipient"}</p>
                                <p className="text-slate-500 text-sm leading-relaxed">{order.addresses?.detail_address}</p>
                            </div>
                        </div>

                        {/* Evidence Upload */}
                        <div className="relative group rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 overflow-hidden">
                            <input
                                type="file"
                                accept="video/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) onUpload(e.target.files[0]);
                                }}
                                disabled={isUploading}
                            />

                            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                                {videoUrl ? (
                                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 shadow-sm">
                                            <FileVideo className="w-8 h-8" />
                                        </div>
                                        <p className="font-medium text-green-700">Evidence Uploaded</p>
                                        <p className="text-xs text-green-600/70 mt-1">Ready to ship</p>
                                    </motion.div>
                                ) : isUploading ? (
                                    <div className="flex flex-col items-center w-full px-6">
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                                        <p className="text-sm text-blue-600 font-bold">Uploading: {uploadProgress}%</p>
                                        {uploadSpeed && <p className="text-[10px] text-slate-500 font-mono mt-1">{uploadSpeed}</p>}
                                        <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200">
                                            <motion.div 
                                                className="h-full bg-blue-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tighter">Do not close this tab</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                            <Camera className="w-7 h-7" />
                                        </div>
                                        <h4 className="font-medium text-slate-700 mb-1">Upload Packing Video</h4>
                                        <p className="text-xs text-slate-400 px-4">Drag & drop or click to record. Ensure label is visible.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="space-y-3 pt-6 border-t border-slate-100">
                        <Button
                            className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 ${allChecked && videoUrl
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200 shadow-none'
                                }`}
                            disabled={!allChecked || !videoUrl || isPacking}
                            onClick={() => videoUrl && onConfirm(videoUrl)}
                        >
                            {isPacking ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" /> Processing...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    Print Label <ArrowRight className="w-5 h-5" />
                                </div>
                            )}
                        </Button>
                        <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest">
                            Review all items before confirming
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
