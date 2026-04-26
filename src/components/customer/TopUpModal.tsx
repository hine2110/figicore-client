import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { walletService } from '@/services/wallet.service';
import { ArrowRight, Loader2, Sparkles, AlertCircle, Copy } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface TopUpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function TopUpModal({ open, onOpenChange, onSuccess }: TopUpModalProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<{ url: string; refCode: string; amount: number } | null>(null);

    // Reset state when modal is closed
    useEffect(() => {
        if (!open) {
            setAmount('');
            setQrData(null);
        }
    }, [open]);

    // Socket Listener for successful Top Up
    useEffect(() => {
        if (!qrData?.refCode) return;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com';
        const socketUrl = `${baseUrl}/events`;
        const socket: Socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('Connected to socket group in TopUpModal');
        });

        const handlePaymentSuccess = () => {
            toast({
                title: 'Top Up Successful!',
                description: `Successfully added ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(qrData.amount)} to your wallet.`,
            });
            onSuccess(); // Triggers wallet refresh
            onOpenChange(false);
        };

        socket.on(`payment:success:${qrData.refCode}`, handlePaymentSuccess);

        return () => {
            socket.disconnect();
        };
    }, [qrData?.refCode]);

    const handleGenerateQR = async () => {
        const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
        if (isNaN(numAmount) || numAmount < 10000) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: 'Minimum top up amount is 10,000 VND.',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await walletService.topUp(numAmount, 'SEPAY');

            // Build SePay QR URL
            const bankAccount = import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266'; // Match Checkout.tsx
            const bankName = import.meta.env.VITE_SEPAY_BANK_NAME || 'MBBank';

            // @ts-ignore
            const refCode = res.paymentRefCode || (res as any).data?.paymentRefCode;

            const qrUrl = `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${numAmount}&des=FIGI ${refCode}`;

            setQrData({
                url: qrUrl,
                refCode: refCode,
                amount: numAmount
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to generate QR',
                description: error.response?.data?.message || 'Unknown error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatInputAmount = (val: string) => {
        const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-0 bg-white shadow-2xl">
                <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                    <DialogHeader className="relative z-10 text-left">
                        <DialogTitle className="text-2xl font-extrabold flex items-center gap-2 tracking-tight">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            Top Up Wallet
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Add funds to your FigiWallet for quick checkout.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-8">
                    {!qrData ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                                    Amount to Add (VND)
                                </label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => setAmount(formatInputAmount(e.target.value))}
                                        placeholder="Min: 10,000"
                                        className="text-3xl font-light tracking-tight py-8 pl-4 pr-12 rounded-2xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 outline-none shadow-inner"
                                        autoFocus
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                        ₫
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-bold text-lg group shadow-lg shadow-slate-900/10 transition-transform active:scale-95 flex items-center justify-center"
                                onClick={handleGenerateQR}
                                disabled={loading || !amount}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Generate Dynamic QR
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                            <div className="flex items-center justify-between gap-3 text-sm bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 uppercase tracking-widest">Bank Name</span>
                                    <span className="font-bold text-slate-800 text-sm">{import.meta.env.VITE_SEPAY_BANK_NAME || 'MBBank'}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-slate-400 uppercase tracking-widest">Account Number</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266'}</span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266');
                                                toast({ title: "Copied account number", duration: 2000 });
                                            }}
                                            className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                            <div className="w-full bg-slate-50 border border-slate-100/60 rounded-3xl p-6 flex flex-col items-center shadow-inner">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Scan via Banking App</p>

                                <div className="bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative group">
                                    {/* Scan brackets overlay */}
                                    <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg transition-all group-hover:scale-110 group-hover:-translate-x-1 group-hover:-translate-y-1" />
                                    <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg transition-all group-hover:scale-110 group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg transition-all group-hover:scale-110 group-hover:-translate-x-1 group-hover:translate-y-1" />
                                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg transition-all group-hover:scale-110 group-hover:translate-x-1 group-hover:translate-y-1" />

                                    <img
                                        src={qrData.url}
                                        alt="VietQR Top Up"
                                        className="w-48 h-48 object-contain relative z-10 mx-auto rounded-xl"
                                    />
                                </div>

                                <div className="mt-6 w-full text-center">
                                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(qrData.amount)}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full bg-emerald-50/50 rounded-2xl p-4 mt-6 flex gap-3 text-emerald-800 text-sm border border-emerald-100">
                                <AlertCircle className="w-5 h-5 shrink-0 text-emerald-500" />
                                <p className="leading-relaxed">Keep this window open. Your balance will update automatically in <span className="font-bold">5-15 seconds</span> after payment completion.</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
