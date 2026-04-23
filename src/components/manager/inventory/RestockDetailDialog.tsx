import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Info, TrendingUp, Package, BarChart3, Clock } from "lucide-react";
import { useApplyRecommendation } from "@/hooks/useInventoryAnalytics";

interface RestockDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
}

export function RestockDetailDialog({ open, onOpenChange, item }: RestockDetailDialogProps) {
    const applyRec = useApplyRecommendation();

    if (!item) return null;

    const handleApply = async () => {
        await applyRec.mutateAsync(item.id);
        onOpenChange(false);
    };

    const variant = item.product_variants;
    const currentStock = Number(variant.stock_available || 0);
    const priority = item.suggested_action_value || 'MEDIUM';
    
    // Tính toán doanh số từ order_items trả về
    const sales30d = variant.order_items?.reduce((sum: number, oi: any) => sum + oi.quantity, 0) || 5; 
    const velocity = (sales30d / 30).toFixed(2); // Units per day
    const daysRemaining = Number(velocity) > 0 ? Math.floor(currentStock / Number(velocity)) : 999;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] md:max-w-2xl rounded-3xl p-0 border-none shadow-2xl overflow-hidden bg-white max-h-[95vh] flex flex-col">
                <div className="overflow-y-auto flex-1 scrollbar-none">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 md:p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
                            <Package className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <DialogHeader>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
                                            <TrendingUp className="w-4 h-4 text-white" />
                                        </div>
                                        <Badge className="bg-white/10 text-blue-100 border-white/20 uppercase text-[10px] tracking-widest font-black px-2">Demand Forecasting</Badge>
                                    </div>
                                    <DialogTitle className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                                        {variant.products.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-blue-100 font-mono text-[10px] md:text-xs flex flex-wrap items-center gap-2 md:gap-3">
                                        <span>SKU: <span className="text-white font-bold">{variant.sku}</span></span>
                                        <span className="hidden md:inline w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                        <span>Priority: <Badge className="h-5 text-[9px] bg-white text-blue-700 font-black border-none uppercase">{priority}</Badge></span>
                                    </DialogDescription>
                                </div>
                            </DialogHeader>
                        </div>
                    </div>

                    <div className="p-5 md:p-8 space-y-6 md:space-y-8">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                            <Card className="p-3 md:p-5 bg-blue-50/50 border-blue-100/50 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-100 flex items-center justify-center mb-2 md:mb-3">
                                    <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                </div>
                                <span className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Inventory Level</span>
                                <div className="text-lg md:text-2xl font-black text-neutral-900 leading-none">{currentStock}</div>
                            </Card>
                            <Card className="p-3 md:p-5 bg-orange-50/50 border-orange-100/50 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-orange-100 flex items-center justify-center mb-2 md:mb-3">
                                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                                </div>
                                <span className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Daily Velocity</span>
                                <div className="text-lg md:text-2xl font-black text-neutral-900 leading-none">{velocity}</div>
                            </Card>
                            <Card className="p-3 md:p-5 bg-purple-50/50 border-purple-100/50 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-purple-100 flex items-center justify-center mb-2 md:mb-3">
                                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                                </div>
                                <span className="text-[8px] md:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Stockout Projection</span>
                                <div className="text-lg md:text-2xl font-black text-neutral-900 leading-none">{daysRemaining}d</div>
                            </Card>
                        </div>

                        {/* AI Reasoning Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                                <h4 className="text-[10px] md:text-xs font-black text-neutral-800 uppercase tracking-[2px]">AI Market Analysis</h4>
                            </div>
                            
                            <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-neutral-950 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/20"></div>
                                
                                <div className="relative z-10 space-y-4 md:space-y-5">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4">
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] md:text-xs text-neutral-500 uppercase font-bold tracking-wider">Demand Factor</div>
                                            <div className="text-neutral-400 text-[9px] md:text-[10px]">Based on recent volume</div>
                                        </div>
                                        <Badge className="bg-blue-600 text-white font-black border-none uppercase text-[10px]">High Intensity</Badge>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4">
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] md:text-xs text-neutral-500 uppercase font-bold tracking-wider">Replenishment Logic</div>
                                            <div className="text-neutral-400 text-[9px] md:text-[10px]">Standard lead time buffer</div>
                                        </div>
                                        <div className="text-lg md:text-xl font-bold text-neutral-200">+14 Days Security</div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1 md:pt-2">
                                        <div className="text-[10px] md:text-xs font-black text-neutral-500 uppercase tracking-widest">Recommended Order</div>
                                        <div className="text-2xl md:text-3xl font-black text-blue-400">
                                            {priority === 'URGENT' ? '100' : priority === 'HIGH' ? '50' : '20'} Units
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Rationale Summary */}
                        <div className="bg-blue-50/50 border border-blue-100/50 p-4 md:p-6 rounded-2xl flex gap-3 md:gap-4 transition-all hover:bg-blue-50">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                                <Info className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-black text-blue-600 uppercase text-[9px] md:text-[10px] tracking-widest">AI Analytical Rationale:</span>
                                <div className="text-xs md:text-sm text-neutral-600 italic leading-relaxed">
                                    "{item.reason}"
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 md:px-8 py-4 md:py-5 bg-neutral-50 border-t border-neutral-100 flex flex-col-reverse sm:flex-row gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 md:h-11 px-6 font-semibold text-neutral-500 hover:text-neutral-900 w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button 
                        disabled={applyRec.isPending}
                        onClick={handleApply}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 md:h-11 px-8 font-black shadow-lg shadow-blue-900/20 transition-all active:scale-95 w-full sm:w-auto"
                    >
                        {applyRec.isPending ? "Processing..." : "Accept & Create Draft"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
