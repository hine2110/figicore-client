import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useGetOpexConfig } from "@/hooks/useOpexSettings";
import { Info, TrendingDown, Calculator, TrendingUp } from "lucide-react";

import { useApplyRecommendation } from "@/hooks/useInventoryAnalytics";

interface RecommendationDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any;
}

export function RecommendationDetailDialog({ open, onOpenChange, item }: RecommendationDetailDialogProps) {
    const { data: opexConfig } = useGetOpexConfig();
    const applyRec = useApplyRecommendation();

    if (!item) return null;

    const handleApply = async () => {
        await applyRec.mutateAsync(item.id);
        onOpenChange(false);
    };
    
    // ... rest of calculations ...

    const variant = item.product_variants;
    const costPrice = Number(variant.cost_price || 0);
    const currentPrice = Number(variant.price || 0);
    const discountPct = parseInt(item.suggested_action_value) || 0;
    
    // Calculations
    const reducedPrice = currentPrice * (1 - discountPct / 100);
    
    // OPEX Total
    const totalOpexPct = opexConfig ? (
        Number(opexConfig.marketing_pct) + 
        Number(opexConfig.staff_pct) + 
        Number(opexConfig.storage_pct) + 
        Number(opexConfig.risk_pct) + 
        Number(opexConfig.tax_pct)
    ) : 0;

    const breakEvenPrice = costPrice * (1 + totalOpexPct / 100);
    const profitPerUnit = reducedPrice - breakEvenPrice;
    const isLoss = profitPerUnit < 0;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[95vw] md:max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[95vh] flex flex-col">
                <div className="overflow-y-auto flex-1 scrollbar-none">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 md:p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
                            <TrendingDown className="w-24 h-24" />
                        </div>
                        <DialogHeader className="relative z-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-orange-500/20 rounded-lg backdrop-blur-sm border border-orange-500/30">
                                        <TrendingDown className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <Badge className="bg-white/10 text-orange-300 border-white/20">Clearance Logic Analysis</Badge>
                                </div>
                                <DialogTitle className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                    {variant.products.name}
                                </DialogTitle>
                                <DialogDescription className="text-neutral-400 font-mono text-[10px] md:text-xs flex flex-wrap items-center gap-2 md:gap-3">
                                    <span>SKU: <span className="text-neutral-200">{variant.sku}</span></span>
                                    <span className="hidden md:inline w-1 h-1 bg-neutral-700 rounded-full"></span>
                                    <span>Stock: <span className="text-neutral-200 font-bold">{variant.stock_available} units</span></span>
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-5 md:p-8 space-y-6 md:space-y-8 bg-white">
                        {/* Financial Snapshot */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 md:p-5 bg-neutral-50 border-none shadow-sm hover:bg-neutral-100/50 transition-colors">
                                <span className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[1px] md:tracking-[2px] block mb-1 md:mb-2">Cost Basis (Unit)</span>
                                <div className="text-lg md:text-xl font-bold text-neutral-900">{formatCurrency(costPrice)}</div>
                            </Card>
                            <Card className="p-4 md:p-5 bg-neutral-50 border-none shadow-sm hover:bg-neutral-100/50 transition-colors">
                                <span className="text-[9px] md:text-[10px] font-black text-neutral-400 uppercase tracking-[1px] md:tracking-[2px] block mb-1 md:mb-2">Retail Market Price</span>
                                <div className="text-lg md:text-xl font-bold text-neutral-900">{formatCurrency(currentPrice)}</div>
                            </Card>
                        </div>

                        {/* AI Calculation Logic */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-orange-600" />
                                    <h4 className="text-[10px] md:text-xs font-black text-neutral-800 uppercase tracking-[1px]">AI Financial Formula</h4>
                                </div>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 py-0.5 md:py-1 text-[10px]">
                                    {discountPct}% Discount Applied
                                </Badge>
                            </div>

                            <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-neutral-950 text-white space-y-4 md:space-y-5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-orange-500/10"></div>
                                
                                <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4">
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] md:text-xs text-neutral-500 uppercase font-bold tracking-wider">Reduced Price (P')</div>
                                        <div className="text-neutral-400 text-[9px] md:text-[10px]">Formula: Retail * (1 - {discountPct}%)</div>
                                    </div>
                                    <div className="text-xl md:text-2xl font-black text-orange-400">{formatCurrency(reducedPrice)}</div>
                                </div>

                                <div className="flex justify-between items-center border-b border-white/5 pb-3 md:pb-4">
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] md:text-xs text-neutral-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                                            Break-even Floor (B) 
                                            <Badge variant="outline" className="text-[8px] md:text-[9px] text-neutral-500 border-neutral-800 h-4 px-1 leading-none py-0">OPEX {totalOpexPct}%</Badge>
                                        </div>
                                        <div className="text-neutral-400 text-[9px] md:text-[10px]">Formula: Cost * (1 + {totalOpexPct}%)</div>
                                    </div>
                                    <div className="text-lg md:text-xl font-bold text-neutral-300">{formatCurrency(breakEvenPrice)}</div>
                                </div>

                                <div className="flex justify-between items-center pt-1 md:pt-2">
                                    <div className="text-[10px] md:text-xs font-black text-neutral-500 uppercase tracking-wider">Estimated Net Margin</div>
                                    <div className={`flex items-center gap-2 text-xl md:text-2xl font-black ${isLoss ? 'text-red-500' : 'text-green-500'}`}>
                                        {isLoss ? <TrendingDown className="w-5 h-5"/> : <TrendingUp className="w-5 h-5"/>}
                                        {formatCurrency(profitPerUnit)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Rationale */}
                        <div className="bg-blue-50/50 border border-blue-100/50 p-4 md:p-5 rounded-2xl flex gap-3 md:gap-4 transition-all hover:bg-blue-50">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                            </div>
                            <div className="text-xs md:text-sm text-blue-900 italic leading-relaxed py-1">
                                <span className="font-bold not-italic block mb-1 text-blue-600 uppercase text-[9px] md:text-[10px] tracking-wider">AI Decision Rationale:</span> 
                                "{item.financial_note}"
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 md:px-8 py-4 md:py-5 bg-neutral-50 border-t border-neutral-100 flex flex-col-reverse sm:flex-row gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 md:h-11 px-6 font-semibold w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button 
                        disabled={applyRec.isPending}
                        onClick={handleApply}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 md:h-11 px-8 font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95 w-full sm:w-auto"
                    >
                        {applyRec.isPending ? "Applying..." : "Accept & Apply Strategy"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


    );
}
