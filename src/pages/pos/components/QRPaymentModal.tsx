import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle2, X, QrCode, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cancelOrder } from '@/services/posService';

interface QRPaymentModalProps {
    open: boolean;
    onClose: () => void;
    totalAmount: number;
    orderId: number;
    paymentRef: string; // e.g. "POS-20260305-1234"
    onSuccess: () => void;
}

export default function QRPaymentModal({
    open,
    onClose,
    totalAmount,
    orderId,
    paymentRef,
    onSuccess,
}: QRPaymentModalProps) {
    const { toast } = useToast();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPaid, setIsPaid] = useState(false);

    const bankName = import.meta.env.VITE_SEPAY_BANK_NAME || 'MB';
    const accountNo = import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266';
    const transferContent = `FIGI ${paymentRef}`;

    const qrUrl = `https://img.vietqr.io/image/${bankName}-${accountNo}-compact2.jpg?amount=${totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=FIGICORE`;

    // Listen for payment success via Socket.IO
    useEffect(() => {
        if (!open || !paymentRef) return;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const socket = io(`${baseUrl}/events`);

        socket.on('connect', () => {
            console.log('✅ [POS QR] Connected to Payment Events Namespace');
        });

        const eventName = `payment:success:${paymentRef}`;
        socket.on(eventName, () => {
            console.log(`🔔 [POS QR] ${eventName} received. Payment confirmed!`);
            setIsPaid(true);
            toast({
                title: '✅ Thanh toán thành công!',
                description: `Đơn hàng QR đã được xác nhận.`,
                className: 'bg-emerald-600 text-white border-emerald-700',
            });

            // Short delay so user sees the success state before closing
            setTimeout(() => {
                setIsPaid(false);
                onSuccess();
            }, 1500);
        });

        return () => {
            socket.disconnect();
        };
    }, [open, paymentRef]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await cancelOrder(orderId);
            toast({ title: 'Đã hủy đơn hàng', description: 'Kho hàng đã được hoàn trả.' });
            onClose();
        } catch (e) {
            toast({ title: 'Lỗi', description: 'Không thể hủy đơn hàng.', variant: 'destructive' });
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { /* prevent accidental close */ }}>
            <DialogContent className="max-w-sm bg-white/95 backdrop-blur-2xl border-none shadow-2xl rounded-[32px] p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-xl font-black flex items-center gap-3 tracking-tight text-white">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <QrCode className="w-6 h-6 text-white" />
                            </div>
                            THANH TOÁN QR
                        </DialogTitle>
                        <p className="text-blue-100/80 text-xs mt-1 font-medium">
                            Mở app ngân hàng và quét mã QR bên dưới
                        </p>
                    </DialogHeader>
                </div>

                <div className="p-6 flex flex-col items-center bg-slate-50">
                    {/* QR Code */}
                    <div className="bg-white p-3 rounded-[20px] border border-slate-200 shadow-xl mb-5 relative z-10 -mt-14 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-[20px] blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                        {isPaid ? (
                            <div className="w-52 h-52 flex flex-col items-center justify-center bg-emerald-50 rounded-xl">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 animate-in zoom-in duration-500" />
                                <p className="font-bold text-emerald-700 text-sm">Đã thanh toán!</p>
                            </div>
                        ) : (
                            <img
                                src={qrUrl}
                                alt="VietQR"
                                className="w-52 h-52 object-contain relative z-10 rounded-xl"
                            />
                        )}
                    </div>

                    {/* Payment Info */}
                    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                        {/* Account */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Số tài khoản</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{accountNo}</span>
                                <button
                                    onClick={() => handleCopy(accountNo, 'account')}
                                    className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md"
                                >
                                    {copiedField === 'account' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                        <Separator className="bg-slate-100" />

                        {/* Amount */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Số tiền</span>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-blue-600 text-base tracking-tight">
                                    {totalAmount.toLocaleString('vi-VN')}₫
                                </span>
                                <button
                                    onClick={() => handleCopy(totalAmount.toString(), 'amount')}
                                    className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md"
                                >
                                    {copiedField === 'amount' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                        <Separator className="bg-slate-100" />

                        {/* Transfer content */}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Nội dung CK</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-xs tracking-wide">
                                    {transferContent}
                                </span>
                                <button
                                    onClick={() => handleCopy(transferContent, 'content')}
                                    className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md"
                                >
                                    {copiedField === 'content' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Waiting indicator */}
                    {!isPaid && (
                        <div className="mt-5 flex items-center justify-center gap-3 bg-blue-50/50 px-5 py-2.5 rounded-full border border-blue-100/50 w-full max-w-[260px]">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                            </div>
                            <p className="text-blue-700 text-[12px] font-semibold">Đang chờ xác nhận...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 w-full border-t border-slate-100 bg-white">
                    <Button
                        variant="ghost"
                        className="w-full font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl h-11"
                        onClick={handleCancel}
                        disabled={isCancelling || isPaid}
                    >
                        {isCancelling ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang hủy...</>
                        ) : (
                            <><X className="w-4 h-4 mr-2" /> Hủy đơn hàng</>
                        )}
                    </Button>
                    <p className="text-[11px] text-center mt-2 text-slate-400 font-medium">
                        Ref: {paymentRef} • Powered by SePay
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
