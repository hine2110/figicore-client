import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { productsService } from "@/services/products.service";
import { livestreamsService } from "@/services/livestreams.service";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Video, 
    Search, 
    X, 
    Plus, 
    Package, 
    Image as ImageIcon,
    Calendar,
    ChevronRight,
    Zap,
    Sparkles,
    LayoutGrid,
    Target
} from "lucide-react";

interface CreateLivestreamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateLivestreamModal({ isOpen, onClose, onSuccess }: CreateLivestreamModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<any[]>([]);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            setTitle("");
            setDescription("");
            setStartTime("");
            setSelectedVariants([]);
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        try {
            const response = await productsService.getProducts();
            const productList = Array.isArray(response) ? response : (response as any).data?.data || (response as any).data || [];
            
            const flattenedVariants: any[] = [];
            productList.forEach((p: any) => {
                if (p.product_variants && p.type_code === 'RETAIL') {
                    p.product_variants.forEach((v: any) => {
                        flattenedVariants.push({
                            ...v,
                            productName: p.name,
                            displayName: `${p.name} - ${v.option_name}`,
                            imageUrl: p.media_urls?.[0] || v.media_assets?.[0]?.url || ""
                        });
                    });
                }
            });
            setAllProducts(flattenedVariants);
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const filteredProducts = allProducts
        .filter(p => p.stock_available > 0)
        .filter(p => 
            p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(p => !selectedVariants.some(sv => sv.variant_id === p.variant_id));

    const toggleVariant = (variant: any) => {
        if (variant.stock_available <= 0) return;
        setSelectedVariants(prev => [...prev, variant]);
    };

    const removeVariant = (variantId: number) => {
        setSelectedVariants(prev => prev.filter(v => v.variant_id !== variantId));
    };

    const addAllVariants = () => {
        if (filteredProducts.length === 0) return;
        setSelectedVariants(prev => [...prev, ...filteredProducts]);
    };

    const handleSubmit = async () => {
        if (!title) {
            toast({ title: "Validation Error", description: "Set a catchy title for your session!", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            await livestreamsService.createLivestream({
                title,
                description,
                start_time: startTime ? new Date(startTime).toISOString() : undefined,
                product_ids: selectedVariants.map(v => v.variant_id)
            });

            toast({ title: "Session Broadcast Ready", description: "Launch the studio and start selling!" });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: "Launch Failed", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:max-w-[1200px] h-[90vh] lg:h-[85vh] max-h-[900px] p-0 bg-[#0a0a0a] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-3xl lg:rounded-[2.5rem] overflow-hidden text-neutral-300">
                <div className="flex flex-col md:flex-row h-full min-h-0 overflow-hidden">
                    {/* LEFT PANEL: BROADCAST SETUP */}
                    <div className="w-full md:w-[35%] h-auto md:h-full shrink-0 bg-gradient-to-br from-[#111] to-[#0a0a0a] p-5 lg:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative overflow-y-auto md:overflow-hidden min-h-[300px]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 min-h-0 space-y-6 lg:space-y-8 relative z-10 mb-6">
                            <div>
                                <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
                                    <Sparkles className="w-3 h-3 mr-2" /> Premiere Setup
                                </Badge>
                                <DialogTitle className="text-2xl lg:text-4xl font-black text-white leading-tight tracking-tighter">
                                    Broadcast <br className="hidden lg:block" /> Studio
                                </DialogTitle>
                                <DialogDescription className="text-neutral-500 mt-2 lg:mt-4 text-[10px] lg:text-xs font-medium leading-relaxed max-w-[90%]">
                                    Configure your high-stakes selling event. Set the stage, schedule your appearance, and prep your inventory.
                                </DialogDescription>
                            </div>

                            <div className="space-y-4 lg:space-y-5">
                                <div className="space-y-1.5 group">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600 group-focus-within:text-rose-500 transition-colors">Heading</Label>
                                    <Input 
                                        placeholder="Epic Unboxing Event..." 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="bg-white/5 border-white/10 focus:border-rose-500 focus:ring-rose-500/20 rounded-2xl h-12 text-base font-bold text-white shadow-inner transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600 group-focus-within:text-rose-500 transition-colors">Bio / Description</Label>
                                    <textarea 
                                        placeholder="Exclusive reveals, mystery boxes, and live giveaways..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full h-24 lg:h-28 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all text-neutral-300 shadow-inner resize-none"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600 group-focus-within:text-rose-500 transition-colors">Launch Time</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-rose-500 transition-colors" />
                                        <Input 
                                            type="datetime-local" 
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="bg-white/5 border-white/10 focus:border-rose-500 pl-12 rounded-2xl h-14 text-sm font-mono text-white transition-all shadow-inner"
                                        />
                                    </div>
                                    <p className="text-[9px] text-neutral-600 font-medium italic px-2 mt-1">Empty for immediate transmission</p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 relative z-10 pt-6 border-t border-white/5">
                            <div className="flex gap-4">
                                <Button variant="ghost" onClick={onClose} className="flex-1 rounded-2xl h-14 text-neutral-500 hover:text-white hover:bg-white/5 font-black text-xs uppercase tracking-widest transition-all">
                                    Abort
                                </Button>
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={isLoading}
                                    className="flex-1 bg-white text-black hover:bg-rose-500 hover:text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] group"
                                >
                                    {isLoading ? 'Processing...' : 'Go Live'} 
                                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>

                        {/* Background Deco */}
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px]"></div>
                    </div>

                    {/* RIGHT PANEL: INVENTORY MANAGEMENT */}
                    <div className="flex-1 h-full flex flex-col min-h-0 bg-[#0d0d0d] p-5 lg:p-8 relative overflow-hidden">
                        {/* 1. Header (fixed height row) */}
                        <div className="shrink-0 h-auto min-h-[50px] lg:h-[70px] flex items-center justify-between relative z-10 mb-2 lg:mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <LayoutGrid className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white tracking-tight uppercase">Product Selection</h3>
                                    <p className="text-[10px] text-neutral-600 font-bold tracking-widest uppercase">Stockpile for broadcast</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge className="bg-[#1a1a1a] text-neutral-400 border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2 font-mono text-xs">
                                    <Target className="w-3 h-3 text-rose-500" />
                                    {selectedVariants.length} Slots Filled
                                </Badge>
                                <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors ml-4">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* 2. Main Area (flexible height but constrained) */}
                        <div className="flex-1 min-h-0 flex flex-col relative z-10 pt-8">
                            {/* Search bar (fixed height row) */}
                            <div className="shrink-0 h-[60px] relative group mb-4">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-rose-500 transition-colors" />
                                <input 
                                    placeholder="Instant lookup: Search by SKU or Name..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/5 border border-white/10 focus:border-rose-500 h-12 pl-14 pr-12 rounded-[1rem] text-xs font-medium text-white shadow-inner transition-all w-full focus:outline-none"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Two-Column Grid (flexible height flexbox) */}
                            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pb-2">
                                {/* Search Results Column */}
                                <div className="bg-[#111] rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl h-full min-h-0">
                                    <div className="shrink-0 h-[70px] px-6 border-b border-white/5 bg-[#151515] flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Available</span>
                                            {searchQuery && (
                                                <span className="text-[9px] text-rose-500 font-bold uppercase">{filteredProducts.length} Results</span>
                                            )}
                                        </div>
                                        {filteredProducts.length > 0 && (
                                            <button onClick={addAllVariants} className="text-[10px] font-black uppercase text-rose-500 hover:text-white transition-colors">Add All ({filteredProducts.length})</button>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-0">
                                        <div className="space-y-4">
                                            <AnimatePresence initial={false}>
                                                {filteredProducts.map((p) => (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        key={p.variant_id} 
                                                        className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-center justify-between hover:bg-white/[0.08] hover:border-white/10 transition-all cursor-pointer group shrink-0"
                                                        onClick={() => toggleVariant(p)}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-lg bg-black border border-white/10 p-1.5 shrink-0 overflow-hidden">
                                                                {p.imageUrl ? (
                                                                    <img src={p.imageUrl} className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <ImageIcon className="w-full h-full text-neutral-800" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[11px] font-black text-white truncate w-32">{p.productName}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-tight">{p.option_name}</span>
                                                                    <span className="text-[9px] text-rose-500/50 font-mono">Stock: {p.stock_available}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Plus className="w-3.5 h-3.5 text-neutral-600 group-hover:text-rose-500 transition-colors" />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {filteredProducts.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                    <Package className="w-12 h-12 mb-2" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Empty Stock</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Column */}
                                <div className="bg-[#111] rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl h-full min-h-0">
                                    <div className="shrink-0 h-[70px] px-6 border-b border-white/5 bg-[#151515] flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Selected Broadcast</span>
                                        {selectedVariants.length > 0 && (
                                            <button onClick={() => setSelectedVariants([])} className="text-[10px] font-black uppercase text-neutral-600 hover:text-white transition-colors">Clear</button>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-0">
                                        <div className="space-y-4">
                                            <AnimatePresence initial={false}>
                                                {selectedVariants.map((v) => (
                                                    <motion.div 
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.8, opacity: 0 }}
                                                        key={v.variant_id} 
                                                        className="bg-[#1a1a1a] border border-white/10 rounded-xl p-2.5 flex items-center justify-between group shadow-xl shrink-0"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 p-1.5 shrink-0 overflow-hidden">
                                                                {v.imageUrl && <img src={v.imageUrl} className="w-full h-full object-contain" />}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[11px] font-black text-white truncate w-32">{v.displayName}</span>
                                                                <span className="text-[9px] font-mono text-neutral-600">{v.sku}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); removeVariant(v.variant_id); }} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-rose-500 transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {selectedVariants.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-10 space-y-4">
                                                    <Zap className="w-16 h-16" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Empty Stage</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background Deco */}
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
