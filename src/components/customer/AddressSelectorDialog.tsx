import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, CheckCircle2 } from 'lucide-react';
import { addressService, Address } from '@/services/address.service';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddressSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (addressId: number) => void;
    currentAddressId?: number;
    onAddNew: () => void;
}

export default function AddressSelectorDialog({ open, onOpenChange, onSelect, currentAddressId, onAddNew }: AddressSelectorDialogProps) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadAddresses();
        }
    }, [open]);

    const loadAddresses = async () => {
        setLoading(true);
        try {
            const res = await addressService.getMyAddresses();
            // Robustly handle both direct array and nested data wrapper responses
            const addressList = Array.isArray(res) ? res : (res as any).data || [];

            if (Array.isArray(addressList)) {
                setAddresses(addressList);
            } else {
                console.warn("Unexpected address response structure:", res);
                setAddresses([]);
            }
        } catch (error) {
            console.error("Failed to load addresses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (id: number) => {
        onSelect(id);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-white overflow-hidden flex flex-col max-h-[85vh]">
                <DialogHeader className="p-6 pb-4 border-b shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span>Select Delivery Address</span>
                        <Button variant="outline" size="sm" onClick={onAddNew} className="gap-2 text-primary border-primary/20 hover:bg-primary/5">
                            <Plus className="w-4 h-4" /> Add New
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Loading addresses...</div>
                    ) : addresses.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <MapPin className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 font-medium">No saved addresses found.</p>
                            <Button onClick={onAddNew}>Add Your First Address</Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {addresses.map((addr) => {
                                const isSelected = addr.address_id === currentAddressId;
                                return (
                                    <div
                                        key={addr.address_id}
                                        onClick={() => handleSelect(addr.address_id)}
                                        className={cn(
                                            "relative group p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md bg-white",
                                            isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{addr.recipient_name}</span>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-slate-600 font-mono text-sm">{addr.recipient_phone}</span>
                                                {addr.is_default && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold rounded-full ml-2">Default</span>
                                                )}
                                            </div>
                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </div>

                                        <p className="text-sm text-slate-600 leading-relaxed pr-8">
                                            {addr.detail_address}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {[addr.ward_name, addr.district_name, addr.province_name].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-white shrink-0 flex justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
