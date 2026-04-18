import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { orderService } from '@/services/order.service';
import { walletService } from '@/services/wallet.service';
import AddressDialog from '@/components/customer/AddressDialog';
import { Loader2, ArrowLeft, ShieldCheck, MapPin, Copy, CheckCircle2, Wallet, QrCode } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { io } from 'socket.io-client';
import api from "@/services/api";

export default function PreOrderPayment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [contract, setContract] = useState<any>(null);
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyPaid, setAlreadyPaid] = useState(false);

    // Form State
    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [addressOpen, setAddressOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('BANKING');

    // QR & Socket State
    const [showQRModal, setShowQRModal] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [paymentRef, setPaymentRef] = useState<string | null>(null);
    const [shippingFee, setShippingFee] = useState(30000);
    const [calculatingFee, setCalculatingFee] = useState(false);

    // Generate VietQR URL dynamically
    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const qrUrl = useMemo(() => {
        if (!paymentRef || !contract) return '';
        const bankName = import.meta.env.VITE_SEPAY_BANK_NAME || 'MB';
        const accountNo = import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266';
        const amount = Number(contract.remaining_amount) + shippingFee; // Total with dynamic fee
        const content = `FIGI ${paymentRef}`;
        return `https://img.vietqr.io/image/${bankName}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=FIGICORE`;
    }, [paymentRef, contract, shippingFee]);

    // Socket Listener for Payment Update
    useEffect(() => {
        if (!showQRModal || !paymentRef) return;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com';
        const socketUrl = `${baseUrl}/events`;
        const socket = io(socketUrl);

        socket.on('connect', () => console.log('✅ Connected to Payment Events Namespace'));

        const eventName = `payment:success:${paymentRef}`;

        socket.on(eventName, () => {
            console.log(`🔔 Received ${eventName}. Redirecting to Success...`);
            toast({
                title: "Payment Successful!",
                description: "We have received your final payment and confirmed your order.",
                className: "bg-emerald-600 text-white border-emerald-700"
            });
            setShowQRModal(false);
            navigate('/customer/order-success');
        });

        return () => { socket.disconnect(); };
    }, [showQRModal, paymentRef]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast({ title: "Copied to clipboard", duration: 2000 });
        setTimeout(() => setCopiedField(null), 2000);
    };

    useEffect(() => {
        if (!id) return;
        const init = async () => {
            setLoading(true);
            try {
                const [contractRes, walletRes] = await Promise.all([
                    orderService.getContract(Number(id)),
                    walletService.getMyWallet()
                ]);
                setContract(contractRes);
                setWallet(walletRes.data || walletRes);

                // ✅ Guard: If contract already COMPLETED, show paid state
                if (contractRes.status_code === 'COMPLETED') {
                    setAlreadyPaid(true);
                    setLoading(false);
                    return;
                }

                // Pre-fill Address
                if (contractRes.deposit_order?.addresses) {
                    setSelectedAddress(contractRes.deposit_order.addresses);
                }
            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Failed to load details", variant: "destructive" });
                navigate('/customer/home');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);
 
    // Fetch Dynamic Shipping Fee when address changes
    useEffect(() => {
      if (!selectedAddress || !contract) return;
      
      const fetchFee = async () => {
        setCalculatingFee(true);
        try {
          // Pre-order items are usually 1 unique variant
          const totalAmount = Number(contract.remaining_amount);
          const res = await api.post('/address/calculate-fee', { 
            address_id: selectedAddress.address_id,
            total_amount: totalAmount
          });
          setShippingFee(res.data.fee);
        } catch (error) {
          console.error("Failed to calculate shipping fee:", error);
          // Fallback to 30k floor if API fails
          setShippingFee(30000);
        } finally {
          setCalculatingFee(false);
        }
      };
      
      fetchFee();
    }, [selectedAddress, contract]);

    const handleSubmit = async () => {
        if (!selectedAddress) {
            toast({ title: "Address Required", description: "Please select a shipping address.", variant: "destructive" });
            return;
        }

        const remainingAmount = Number(contract.remaining_amount);
        const totalAmount = remainingAmount + shippingFee;

        if (paymentMethod === 'WALLET') {
            if (Number(wallet?.balance_available || 0) < totalAmount) {
                toast({ title: "Insufficient Balance", description: "Please top up your wallet or choose another method.", variant: "destructive" });
                return;
            }
        }

        try {
            setSubmitting(true);
            const res = await orderService.createFinalPayment(Number(id), {
                shipping_address_id: selectedAddress.address_id,
                payment_method_code: paymentMethod
            });

            if (paymentMethod === 'BANKING') {
                setPaymentRef(res.payment_ref_code);
                setShowQRModal(true);
            } else {
                toast({ title: "Payment Successful! 🎉", description: "Your order is now being prepared for shipping.", className: "bg-green-600 text-white" });
                navigate('/customer/order-success');
            }
        } catch (error: any) {
            console.error(error);
            toast({ title: "Payment Failed", description: error.response?.data?.message || "Could not process payment", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>;
    if (!contract) return <div className="p-10 text-center">Contract not found</div>;

    // ✅ Already paid state — shown when customer reopens the Pay Now link after completing payment
    if (alreadyPaid) {
        const variant = contract.product_variants;
        const product = variant?.products;
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-[28px] shadow-[0_8px_40px_rgb(0,0,0,0.08)] p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Completed!</h2>
                        <p className="text-slate-500 text-sm mt-2">You have already paid in full for this pre-order. Our warehouse team will ship it shortly.</p>
                    </div>
                    {product && (
                        <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Item</p>
                            <p className="font-bold text-slate-900">{product.name}</p>
                            <p className="text-sm text-slate-500">{variant?.option_name} • Qty: {contract.quantity}</p>
                        </div>
                    )}
                    <div className="flex flex-col gap-3">
                        <Button
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold"
                            onClick={() => navigate('/customer/profile')}
                        >
                            View My Orders
                        </Button>
                        <Button variant="ghost" className="text-slate-400 text-sm" onClick={() => navigate('/customer/home')}>
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const variant = contract.product_variants;
    const product = variant?.products;
    const remainingAmount = Number(contract.remaining_amount);
    const totalAmount = remainingAmount + shippingFee;
    const canPayViaWallet = Number(wallet?.balance_available || 0) >= totalAmount;

    return (
        <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8 font-sans text-neutral-900">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-white/50">
                        <ArrowLeft className="w-5 h-5 text-neutral-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Final Payment</h1>
                        <p className="text-neutral-500 text-sm">Complete your pre-order to initiate shipping.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Details & Form */}
                    <div className="md:col-span-2 space-y-6">

                        {/* 1. Item Details */}
                        <Card className="p-6 rounded-[24px] border-none shadow-[0_4px_24px_rgb(0,0,0,0.04)] bg-white overflow-hidden relative group">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-2xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 p-2 shadow-sm group-hover:border-blue-100 transition-colors">
                                    {product?.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />}
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="font-extrabold text-slate-900 text-lg line-clamp-1 tracking-tight">{product?.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">{variant?.option_name} • <span className="text-slate-400">SKU: {variant?.sku}</span></p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 uppercase tracking-wider text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                                            Qty: {contract.quantity}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 uppercase tracking-wider text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-100">
                                            Deposited: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(contract.deposit_amount_paid))}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 2. Shipping Address */}
                        <Card className="p-6 rounded-[24px] border-none shadow-[0_4px_24px_rgb(0,0,0,0.04)] bg-white">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-3 tracking-tight">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    Shipping Address
                                </h3>
                                {/* Address Selector Component Reuse */}
                                <Button
                                    variant="outline" size="sm" className="rounded-xl h-8 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                                    onClick={() => setAddressOpen(true)}
                                >
                                    {selectedAddress ? 'Change' : 'Select Address'}
                                </Button>
                                <AddressDialog
                                    open={addressOpen}
                                    onOpenChange={setAddressOpen}
                                    onSelect={(addr: any) => setSelectedAddress(addr)}
                                />
                            </div>

                            {selectedAddress ? (
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                                    {contract?.deposit_order?.shipping_address_id === selectedAddress.address_id && (
                                        <div className="mb-3 text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 bg-amber-50 inline-flex px-2 py-1 rounded-md border border-amber-100">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Using address from Deposit Order
                                        </div>
                                    )}
                                    <div className="font-extrabold text-slate-900 text-base">{selectedAddress.receiver_name} <span className="text-slate-400 font-medium ml-1">| {selectedAddress.phone}</span></div>
                                    <div className="text-sm text-slate-500 mt-1.5 leading-relaxed">{selectedAddress.detail_address}, {selectedAddress.ward_name}, {selectedAddress.district_name}, {selectedAddress.province_name}</div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 hover:border-slate-300 transition-colors bg-slate-50/50 cursor-pointer" onClick={() => setAddressOpen(true)}>
                                    <MapPin className="w-6 h-6 mx-auto text-slate-400 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Please select a shipping address</p>
                                </div>
                            )}
                        </Card>

                        {/* 3. Payment Method */}
                        <Card className="p-6 rounded-[24px] border-none shadow-[0_4px_24px_rgb(0,0,0,0.04)] bg-white">
                            <h3 className="font-extrabold text-lg text-slate-900 mb-5 flex items-center gap-3 tracking-tight">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-indigo-600" />
                                </div>
                                Payment Method
                            </h3>
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* Wallet Option */}
                                <Label htmlFor="wallet" className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer hover:-translate-y-0.5 ${paymentMethod === 'WALLET' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 shadow-sm'} ${!canPayViaWallet ? 'opacity-50 grayscale hover:-translate-y-0 cursor-not-allowed' : ''}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Wallet className="w-5 h-5" /></div>
                                        <RadioGroupItem value="WALLET" id="wallet" disabled={!canPayViaWallet} className={paymentMethod === 'WALLET' ? 'text-indigo-600 border-indigo-600' : ''} />
                                    </div>
                                    <div className="font-extrabold text-slate-900">Internal Wallet</div>
                                    <div className="text-xs text-slate-500 mt-1 font-medium bg-white px-2 py-1 inline-flex rounded-md border border-slate-100 self-start mt-2">
                                        Bal: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(wallet?.balance_available || 0))}
                                    </div>
                                    {!canPayViaWallet && <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-wider">Insufficient balance</p>}
                                </Label>

                                {/* Banking Option */}
                                <Label htmlFor="banking" className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer hover:-translate-y-0.5 ${paymentMethod === 'BANKING' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><QrCode className="w-5 h-5" /></div>
                                        <RadioGroupItem value="BANKING" id="banking" className={paymentMethod === 'BANKING' ? 'text-blue-600 border-blue-600' : ''} />
                                    </div>
                                    <div className="font-extrabold text-slate-900">QR Banking</div>
                                    <div className="text-xs text-slate-500 mt-1 font-medium">Scan VietQR</div>
                                </Label>

                            </RadioGroup>
                        </Card>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card className="p-6 rounded-[24px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white sticky top-24 overflow-hidden">
                            <h3 className="font-extrabold text-xl text-slate-900 mb-6 tracking-tight">Payment Summary</h3>

                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex justify-between text-slate-500">
                                    <span>Remaining Balance</span>
                                    <span className="text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Shipping Fee</span>
                                    <span className="text-slate-900">
                                      {calculatingFee ? (
                                        <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                                      ) : (
                                        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)
                                      )}
                                    </span>
                                </div>
                                <Separator className="bg-slate-100 my-4" />
                                <div className="flex justify-between items-end">
                                    <span className="font-extrabold text-slate-900 text-lg tracking-tight">Total to Pay</span>
                                    <span className="font-extrabold text-2xl text-blue-600 tracking-tight">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-8 h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
                                onClick={handleSubmit}
                                disabled={submitting || !selectedAddress || (paymentMethod === 'WALLET' && !canPayViaWallet)}
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : (paymentMethod === 'WALLET' ? 'Pay with Wallet' : 'Confirm & Get QR')}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-5 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> <span>Secure Payment via Figicore</span>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* QR Code Modal Overlay */}
            {showQRModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col items-center animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 w-full p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl translate-x-1/2 translate-y-1/2"></div>

                            <h3 className="text-white font-extrabold text-xl relative z-10 tracking-tight">Scan QR to Pay</h3>
                            <p className="text-blue-100 text-sm mt-1 mb-2 relative z-10 font-medium">Open Banking App to Scan</p>
                        </div>

                        <div className="p-6 w-full flex flex-col items-center bg-slate-50 relative">
                            {/* QR Frame */}
                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xl mb-6 relative z-10 -mt-16 group hover:-translate-y-1 transition-transform">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <img
                                    src={qrUrl}
                                    alt="VietQR"
                                    className="w-56 h-56 object-contain relative z-10 rounded-xl"
                                />
                            </div>

                            <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Account</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266'}</span>
                                        <button onClick={() => handleCopy(import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266', 'account')} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md">
                                            {copiedField === 'account' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Separator className="bg-slate-100" />

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Amount</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-blue-600 text-lg tracking-tight">{formatPrice(totalAmount)}</span>
                                        <button onClick={() => handleCopy(totalAmount.toString(), 'amount')} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md">
                                            {copiedField === 'amount' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Separator className="bg-slate-100" />

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Content</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-sm tracking-wide">
                                            FIGI {paymentRef}
                                        </span>
                                        <button onClick={() => handleCopy(`FIGI ${paymentRef}`, 'content')} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md">
                                            {copiedField === 'content' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                <p className="text-slate-500 text-xs text-center font-medium">Awaiting payment...<br />System will automatically verify.</p>
                            </div>
                        </div>

                        <div className="p-4 w-full border-t border-slate-100 bg-slate-50">
                            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-100 font-bold transition-all" onClick={() => setShowQRModal(false)}>
                                Close & Pay Later
                            </Button>
                            <p className="text-[10px] text-center mt-3 text-slate-400 uppercase tracking-widest font-bold">
                                Please do not close this page
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
