import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Wallet, X, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatVNDInput, parseVNDInput } from '@/lib/formatUtils';

interface CashPaymentModalProps {
    open: boolean;
    onClose: () => void;
    totalAmount: number;
    onConfirm: (cashReceived: number, change: number) => void;
    hasCustomer?: boolean;
    onRegisterCustomer?: () => void;
}

export default function CashPaymentModal({
    open,
    onClose,
    totalAmount,
    onConfirm,
    hasCustomer = false,
    onRegisterCustomer
}: CashPaymentModalProps) {
    const [cashReceived, setCashReceived] = useState<string>('');
    const [change, setChange] = useState<number>(0);

    const QUICK_AMOUNTS = [
        { label: 'Exact', value: totalAmount },
        { label: '50k', value: 50000 },
        { label: '100k', value: 100000 },
        { label: '200k', value: 200000 },
        { label: '500k', value: 500000 },
    ];

    useEffect(() => {
        if (open) {
            setCashReceived('');
            setChange(0);
        }
    }, [open]);

    useEffect(() => {
        const received = parseVNDInput(cashReceived);
        if (received >= totalAmount) {
            setChange(received - totalAmount);
        } else {
            setChange(0);
        }
    }, [cashReceived, totalAmount]);

    const handleQuickAmount = (amount: number) => {
        setCashReceived(formatVNDInput(amount));
    };

    const handleConfirm = () => {
        const received = parseVNDInput(cashReceived);
        if (received < totalAmount) return;
        onConfirm(received, change);
    };

    const isAmountValid = parseVNDInput(cashReceived) >= totalAmount;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white/95 backdrop-blur-2xl border-white/20 shadow-2xl rounded-[32px] p-0 overflow-hidden border-none">
                {/* Header Gradient - Matches POS Header */}
                <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black flex items-center gap-4 tracking-tight">
                            <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-md">
                                <DollarSign className="w-8 h-8 text-white" />
                            </div>
                            CASH PAYMENT
                        </DialogTitle>
                        <p className="text-cyan-50/70 text-sm mt-2 font-medium">Station #01 • Enter amount received</p>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8 bg-white">
                    {/* Amount to Pay Display */}
                    <div className="flex justify-between items-center p-6 bg-neutral-50 rounded-3xl border border-neutral-100 shadow-inner">
                        <div className="space-y-1">
                            <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px] block">Total Payable</span>
                            <span className="text-3xl font-black text-neutral-900 tracking-tight">{totalAmount.toLocaleString('vi-VN')}₫</span>
                        </div>
                        {!hasCustomer && onRegisterCustomer && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRegisterCustomer}
                                className="h-10 px-4 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-xs"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Register Member
                            </Button>
                        )}
                    </div>

                    {/* Cash Input Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <Label className="text-xs font-black text-neutral-400 uppercase tracking-[2px]">Received Amount</Label>
                            {cashReceived && !isAmountValid && (
                                <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                                    <AlertCircle className="w-3.5 h-3.5" /> Need {(totalAmount - parseVNDInput(cashReceived)).toLocaleString()}₫ more
                                </span>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-cyan-600 transition-all duration-300">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <Input
                                id="cash-received"
                                type="text"
                                autoFocus
                                value={cashReceived}
                                onChange={(e) => setCashReceived(formatVNDInput(e.target.value))}
                                className={cn(
                                    "h-20 pl-16 pr-16 text-4xl font-black border-2 rounded-[24px] transition-all duration-300",
                                    isAmountValid
                                        ? "border-cyan-200 bg-cyan-50/30 text-cyan-700 focus:ring-cyan-500/20"
                                        : "border-neutral-100 bg-neutral-50/50 focus:border-indigo-500/30 focus:bg-white focus:ring-indigo-500/10"
                                )}
                                placeholder="0"
                            />
                            {cashReceived && (
                                <button
                                    onClick={() => setCashReceived('')}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-neutral-100 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Amounts Grid */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            {QUICK_AMOUNTS.map((amt) => (
                                <Button
                                    key={amt.label}
                                    variant="outline"
                                    onClick={() => handleQuickAmount(amt.value)}
                                    className={cn(
                                        "h-14 rounded-2xl font-black border-neutral-100 transition-all active:scale-95 shadow-sm",
                                        parseVNDInput(cashReceived) === amt.value
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-900/20"
                                            : "hover:bg-neutral-50 text-neutral-600 hover:border-neutral-200"
                                    )}
                                >
                                    {amt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Change Display Card */}
                    <div className={cn(
                        "rounded-[32px] p-8 transition-all duration-500 transform border-2",
                        isAmountValid
                            ? "bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl shadow-indigo-900/20 border-indigo-400/20 scale-100"
                            : "bg-neutral-50 text-neutral-300 border-neutral-100 scale-[0.98]"
                    )}>
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-[2px] opacity-70">Return to Customer</p>
                                <h3 className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                                    {change.toLocaleString('vi-VN')}
                                    <span className="text-xl font-bold opacity-60 ml-1">₫</span>
                                </h3>
                            </div>
                            {isAmountValid && (
                                <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center animate-in zoom-in spin-in-12 duration-500 border border-white/20">
                                    <CheckCircle2 className="w-9 h-9 text-cyan-300" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-neutral-50 border-t border-neutral-100 gap-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-16 rounded-[24px] font-bold text-neutral-500 hover:bg-neutral-200/50 transition-all"
                    >
                        CANCEL
                    </Button>
                    <Button
                        disabled={!isAmountValid}
                        onClick={handleConfirm}
                        className={cn(
                            "flex-[2.5] h-16 rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-[0.98] tracking-widest",
                            isAmountValid
                                ? "bg-neutral-900 text-white hover:bg-cyan-600 shadow-indigo-900/10"
                                : "bg-neutral-200 text-neutral-400"
                        )}
                    >
                        {isAmountValid ? 'COMPLETE ORDER' : 'ENTER CASH'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
