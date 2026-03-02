import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { productsService } from "@/services/products.service";
import { auctionsService } from "@/services/auctions.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, Clock, Banknote, ShieldAlert, Sparkles, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateAuctionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateAuctionModal({ isOpen, onClose, onSuccess }: CreateAuctionModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [auctionProducts, setAuctionProducts] = useState<any[]>([]);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    // Form State
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [startPrice, setStartPrice] = useState<string>('');
    const [stepPrice, setStepPrice] = useState<string>('');
    const [depositFee, setDepositFee] = useState<string>('50000'); // Default 50k
    const [maxParticipants, setMaxParticipants] = useState<string>('50'); // Default 50
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');

    // Derived selected product
    const selectedProduct = useMemo(() => {
        if (!selectedVariantId) return null;
        return auctionProducts.find(p => p.variant_id.toString() === selectedVariantId);
    }, [selectedVariantId, auctionProducts]);

    useEffect(() => {
        if (isOpen) {
            fetchAuctionProducts();
        }
    }, [isOpen]);

    const fetchAuctionProducts = async () => {
        try {
            const response = await productsService.getProducts();
            const productList = Array.isArray(response) ? response : (response as any).data?.data || (response as any).data || [];
            const filtered = productList.filter((p: any) => p.type_code === 'AUCTION');

            const variants: any[] = [];
            filtered.forEach((p: any) => {
                p.product_variants.forEach((v: any) => {
                    variants.push({
                        ...v,
                        productName: p.name,
                        productDescription: p.description,
                        productMedia: p.media_urls?.[0] || v.media_assets?.[0]?.url
                    });
                });
            });
            setAuctionProducts(variants);
        } catch (error) {
            console.error("Failed to load auction products", error);
        }
    };

    const handleSubmit = async () => {
        if (!selectedVariantId || !startPrice || !stepPrice || !depositFee || !maxParticipants || !startTime || !endTime) {
            toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            toast({ title: "Invalid Times", description: "End time must be strictly after the start time.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            await auctionsService.createAuction({
                variant_id: parseInt(selectedVariantId),
                start_price: parseFloat(startPrice),
                step_price: parseFloat(stepPrice),
                deposit_fee: parseFloat(depositFee),
                max_participants: parseInt(maxParticipants),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString()
            });

            toast({ title: "Auction Created", description: "The VIP Auction Room has been successfully scheduled." });

            setSelectedVariantId(''); setStartPrice(''); setStepPrice(''); setDepositFee('50000'); setStartTime(''); setEndTime('');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: "Failed to create auction", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-900 p-6 text-white flex items-start justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Gavel className="w-6 h-6" />
                            Launch VIP Auction Room
                        </DialogTitle>
                        <DialogDescription className="text-red-100/90 mt-2 text-sm max-w-[85%]">
                            Configure a high-stakes bidding event. Set up anti-spam measures and time limits to ensure a premium collector experience.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: ITEM SELECTION & PREVIEW */}
                        <div className="md:col-span-5 flex flex-col space-y-4">
                            <div className="space-y-2 flex-shrink-0">
                                <Label className="text-neutral-700 font-bold uppercase text-[10px] tracking-wider">Target Item</Label>
                                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                    <SelectTrigger className="border-neutral-300 focus:ring-red-500 rounded-xl h-11 bg-neutral-50">
                                        <SelectValue placeholder="Browse inventory..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {auctionProducts.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-neutral-500">No Auction Products found.</div>
                                        ) : (
                                            auctionProducts.map((v) => (
                                                <SelectItem key={v.variant_id} value={v.variant_id.toString()} className="cursor-pointer">
                                                    {v.productName} ({v.option_name})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                {selectedProduct ? (
                                    <>
                                        <div className="absolute top-3 left-3">
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 shadow-sm flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> VIP
                                            </Badge>
                                        </div>
                                        <div className="w-36 h-36 rounded-xl overflow-hidden shadow-md border bg-white mb-4 relative">
                                            {selectedProduct.productMedia ? (
                                                <img src={selectedProduct.productMedia} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-neutral-300" />
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-neutral-800 line-clamp-2 w-full px-2 text-sm">{selectedProduct.productName}</h4>
                                        <div className="mt-2 text-xs font-mono text-neutral-500 bg-white px-2 py-1 rounded border">SKU: {selectedProduct.sku}</div>
                                    </>
                                ) : (
                                    <div className="opacity-40 flex flex-col items-center">
                                        <ImageIcon className="w-14 h-14 text-neutral-400 mb-3" />
                                        <p className="text-sm font-medium text-neutral-500">No item selected</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: CONFIGURATION */}
                        <div className="md:col-span-7 space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-neutral-700 font-semibold flex items-center gap-1.5 h-6"><Banknote className="w-4 h-4 text-emerald-600" /> Starting Price</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="Ex: 5,000,000"
                                            value={startPrice}
                                            onChange={(e) => setStartPrice(e.target.value)}
                                            className="pl-8 rounded-xl border-neutral-200 focus-visible:ring-emerald-500 h-11 shadow-sm font-medium"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₫</span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-emerald-600 h-4">{startPrice ? formatPrice(Number(startPrice)) : ''}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-neutral-700 font-semibold flex items-center h-6 text-sm">Step Price</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="Ex: 100,000"
                                            value={stepPrice}
                                            onChange={(e) => setStepPrice(e.target.value)}
                                            className="pl-8 rounded-xl border-neutral-200 focus-visible:ring-emerald-500 h-11 shadow-sm font-medium"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₫</span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-emerald-600 h-4">{stepPrice ? formatPrice(Number(stepPrice)) : ''}</p>
                                </div>
                            </div>

                            <div className="p-5 rounded-xl border-2 border-rose-100 bg-gradient-to-br from-rose-50 to-white space-y-3 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-16 h-16 bg-rose-100 rounded-bl-[100px] opacity-50"></div>
                                <Label className="text-rose-800 font-bold flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-rose-600" /> Security Deposit
                                </Label>
                                <div className="flex gap-4 items-center relative z-10">
                                    <div className="relative w-[180px] flex-shrink-0">
                                        <Input
                                            type="number"
                                            value={depositFee}
                                            onChange={(e) => setDepositFee(e.target.value)}
                                            className="pl-8 rounded-xl border-rose-200 bg-white focus-visible:ring-rose-500 focus-visible:border-rose-500 h-11 font-bold text-rose-700 shadow-sm"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold">₫</span>
                                    </div>
                                    <div className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                                        <span className="text-rose-600 font-semibold block mb-0.5">Anti-hit-and-run Protection</span>
                                        This fee is instantly locked in the participant's FigiWallet.
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-neutral-700 font-semibold flex items-center h-6 text-sm">Max Participants</Label>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 50"
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(e.target.value)}
                                        className="rounded-xl border-neutral-200 focus-visible:ring-blue-500 h-11 shadow-sm font-medium"
                                    />
                                    <p className="text-[11px] text-neutral-500 mt-1 h-4">Limit room capacity</p>
                                </div>
                                <div className="space-y-2">
                                    {/* Empty div for grid alignment if needed, or something else. We will leave empty for now */}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-neutral-700 font-semibold flex items-center gap-1.5 h-6"><Clock className="w-4 h-4 text-amber-500" /> Start Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="rounded-xl border-neutral-200 focus-visible:ring-amber-500 h-11 shadow-sm text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-neutral-700 font-semibold flex items-center h-6 text-sm">End Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="rounded-xl border-neutral-200 focus-visible:ring-amber-500 h-11 shadow-sm text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-50 p-4 px-6 flex justify-end gap-3 border-t">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl hover:bg-neutral-200 font-medium">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedProduct}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 shadow-lg shadow-red-200/50 transition-all font-bold tracking-wide"
                    >
                        {isLoading ? 'Processing...' : 'Launch Room'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
