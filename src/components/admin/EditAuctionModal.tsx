import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { auctionsService } from "@/services/auctions.service";
import { Gavel, Clock, Banknote, ShieldAlert, Sparkles, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EditAuctionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    auctionId: number | null;
}

export function EditAuctionModal({ isOpen, onClose, onSuccess, auctionId }: EditAuctionModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const [auctionData, setAuctionData] = useState<any>(null);

    // Form State
    const [startPrice, setStartPrice] = useState<string>('');
    const [stepPrice, setStepPrice] = useState<string>('');
    const [depositFee, setDepositFee] = useState<string>('50000');
    const [maxParticipants, setMaxParticipants] = useState<string>('50');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    useEffect(() => {
        if (isOpen && auctionId) {
            fetchAuctionDetails(auctionId);
        }
    }, [isOpen, auctionId]);

    const fetchAuctionDetails = async (id: number) => {
        setIsFetching(true);
        try {
            const data = await auctionsService.getAuctionById(id);
            setAuctionData(data);

            // Pre-fill form
            setStartPrice(data.start_price.toString());
            setStepPrice(data.step_price.toString());
            setDepositFee(data.deposit_fee.toString());
            setMaxParticipants(data.max_participants.toString());
            setStartTime(format(new Date(data.start_time), "yyyy-MM-dd'T'HH:mm"));
            setEndTime(format(new Date(data.end_time), "yyyy-MM-dd'T'HH:mm"));

        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch auction details", variant: "destructive" });
            onClose();
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async () => {
        if (!auctionId) return;
        if (!startPrice || !stepPrice || !depositFee || !maxParticipants || !startTime || !endTime) {
            toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            toast({ title: "Invalid Times", description: "End time must be strictly after the start time.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            await auctionsService.updateAuction(auctionId, {
                start_price: parseFloat(startPrice),
                step_price: parseFloat(stepPrice),
                deposit_fee: parseFloat(depositFee),
                max_participants: parseInt(maxParticipants),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString()
            });

            toast({ title: "Auction Updated", description: "The VIP Auction Room has been successfully updated." });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: "Failed to update auction", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedProduct = auctionData?.product_variants ? {
        productName: auctionData.product_variants.products?.name,
        sku: auctionData.product_variants.sku,
        productMedia: auctionData.product_variants.products?.media_urls?.[0] || auctionData.product_variants.media_assets?.[0]?.url
    } : null;


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                <div className="bg-gradient-to-r from-slate-700 via-neutral-700 to-slate-900 p-6 text-white flex items-start justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Gavel className="w-6 h-6" />
                            Edit VIP Auction Room
                        </DialogTitle>
                        <DialogDescription className="text-slate-200 mt-2 text-sm max-w-[85%]">
                            Update configuration for an upcoming auction. Active or completed auctions cannot be edited.
                        </DialogDescription>
                    </div>
                </div>

                {isFetching ? (
                    <div className="p-12 text-center text-neutral-500">Loading auction configuration...</div>
                ) : (
                    <>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* LEFT COLUMN: ITEM PREVIEW */}
                                <div className="md:col-span-5 flex flex-col space-y-4">
                                    <div className="space-y-2 flex-shrink-0">
                                        <Label className="text-neutral-700 font-bold uppercase text-[10px] tracking-wider">Target Item (Locked)</Label>
                                        <Input disabled value={selectedProduct?.productName || 'Loading...'} className="bg-neutral-50 text-neutral-500" />
                                    </div>

                                    <div className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                        {selectedProduct ? (
                                            <>
                                                <div className="absolute top-3 left-3">
                                                    <Badge className="bg-slate-100 text-slate-700 shadow-sm flex items-center gap-1 border-0">
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
                                                <p className="text-sm font-medium text-neutral-500">Loading...</p>
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
                                                    value={stepPrice}
                                                    onChange={(e) => setStepPrice(e.target.value)}
                                                    className="pl-8 rounded-xl border-neutral-200 focus-visible:ring-emerald-500 h-11 shadow-sm font-medium"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₫</span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-emerald-600 h-4">{stepPrice ? formatPrice(Number(stepPrice)) : ''}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-neutral-700 font-semibold flex items-center gap-2 h-6 text-sm"><ShieldAlert className="w-4 h-4 text-rose-600" /> Security Deposit</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={depositFee}
                                                    onChange={(e) => setDepositFee(e.target.value)}
                                                    className="pl-8 rounded-xl border-rose-200 bg-white focus-visible:ring-rose-500 focus-visible:border-rose-500 h-11 font-bold text-rose-700 shadow-sm"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold">₫</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-neutral-700 font-semibold flex items-center h-6 text-sm">Max Participants</Label>
                                            <Input
                                                type="number"
                                                value={maxParticipants}
                                                onChange={(e) => setMaxParticipants(e.target.value)}
                                                className="rounded-xl border-neutral-200 focus-visible:ring-blue-500 h-11 shadow-sm font-medium"
                                            />
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
                                disabled={isLoading || !auctionData}
                                className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-8 shadow-lg shadow-slate-200/50 transition-all font-bold tracking-wide"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
