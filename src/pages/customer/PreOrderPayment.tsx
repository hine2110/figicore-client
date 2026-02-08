import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { orderService } from '@/services/order.service';
import { walletService } from '@/services/wallet.service';
import AddressDialog from '@/components/customer/AddressDialog';
import { Loader2, ArrowLeft, ShieldCheck, MapPin, Truck } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function PreOrderPayment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [contract, setContract] = useState<any>(null);
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [addressOpen, setAddressOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('BANKING');

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
                setWallet(walletRes.data || walletRes); // Handle potential ApiResponse wrapper

                // Pre-fill Address
                if (contractRes.deposit_order?.addresses) {
                    console.log("[PreOrderPayment] Auto-filling address from Deposit Order:", contractRes.deposit_order.addresses);
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

    const handleSubmit = async () => {
        if (!selectedAddress) {
            toast({ title: "Address Required", description: "Please select a shipping address.", variant: "destructive" });
            return;
        }

        const remainingAmount = Number(contract.remaining_amount);
        const shippingFee = 30000;
        const totalAmount = remainingAmount + shippingFee;

        if (paymentMethod === 'WALLET') {
            if (Number(wallet?.balance_available || 0) < totalAmount) {
                toast({ title: "Insufficient Balance", description: "Please top up your wallet or choose another method.", variant: "destructive" });
                return;
            }
        }

        try {
            setSubmitting(true);
            await orderService.createFinalPayment(Number(id), {
                shipping_address_id: selectedAddress.address_id,
                payment_method_code: paymentMethod
            });

            toast({ title: "Success", description: "Payment confirmed! Order is now processing.", className: "bg-green-600 text-white" });
            navigate('/customer/orders/all');
        } catch (error: any) {
            console.error(error);
            toast({ title: "Payment Failed", description: error.response?.data?.message || "Could not process payment", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>;
    if (!contract) return <div className="p-10 text-center">Contract not found</div>;

    const variant = contract.product_variants;
    const product = variant?.products;
    const remainingAmount = Number(contract.remaining_amount);
    const shippingFee = 30000; // Fixed fee for now as per backend logic
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
                        <Card className="p-6 rounded-3xl border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-white overflow-hidden relative">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-xl bg-neutral-100 flex-shrink-0 overflow-hidden border border-neutral-100">
                                    {product?.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-neutral-900 line-clamp-1">{product?.name}</h3>
                                    <p className="text-sm text-neutral-500 mt-1">{variant?.option_name} • SKU: {variant?.sku}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Qty: {contract.quantity}</span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded-md">Deposited: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(contract.deposit_amount_paid))}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 2. Shipping Address */}
                        <Card className="p-6 rounded-3xl border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-500" /> Shipping Address
                                </h3>
                                {/* Address Selector Component Reuse */}
                                <Button
                                    variant="outline" size="sm" className="rounded-xl h-8 text-xs font-medium"
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
                                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                    {contract?.deposit_order?.shipping_address_id === selectedAddress.address_id && (
                                        <div className="mb-2 text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Using address from Deposit Order
                                        </div>
                                    )}
                                    <div className="font-semibold text-sm">{selectedAddress.receiver_name} <span className="text-neutral-400 font-normal">| {selectedAddress.phone}</span></div>
                                    <div className="text-sm text-neutral-500 mt-1 leading-relaxed">{selectedAddress.detail_address}, {selectedAddress.ward_name}, {selectedAddress.district_name}, {selectedAddress.province_name}</div>
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-400 italic py-2">Please select a shipping address to estimate delivery.</div>
                            )}
                        </Card>

                        {/* 3. Payment Method */}
                        <Card className="p-6 rounded-3xl border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] bg-white">
                            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-green-500" /> Payment Method
                            </h3>
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">

                                {/* Wallet Option */}
                                <div className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${paymentMethod === 'WALLET' ? 'border-black bg-neutral-50 ring-1 ring-black/5' : 'border-neutral-100 hover:border-neutral-200'} ${!canPayViaWallet ? 'opacity-60 grayscale' : ''}`}>
                                    <RadioGroupItem value="WALLET" id="wallet" disabled={!canPayViaWallet} />
                                    <div className="flex-1">
                                        <Label htmlFor="wallet" className="cursor-pointer font-medium flex items-center justify-between">
                                            <span>Internal Wallet</span>
                                            <span className="text-xs font-normal bg-neutral-200 px-2 py-0.5 rounded text-neutral-600">
                                                Bal: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(wallet?.balance_available || 0))}
                                            </span>
                                        </Label>
                                        {!canPayViaWallet && <p className="text-xs text-red-500 mt-1">Insufficient balance</p>}
                                    </div>
                                </div>

                                {/* Banking Option */}
                                <div className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${paymentMethod === 'BANKING' ? 'border-black bg-neutral-50 ring-1 ring-black/5' : 'border-neutral-100 hover:border-neutral-200'}`}>
                                    <RadioGroupItem value="BANKING" id="banking" />
                                    <Label htmlFor="banking" className="flex-1 cursor-pointer font-medium">Bank Transfer (VietQR)</Label>
                                </div>

                            </RadioGroup>
                        </Card>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="space-y-6">
                        <Card className="p-6 rounded-3xl border-none shadow-[0_4px_20px_rgb(0,0,0,0.05)] bg-white sticky top-6">
                            <h3 className="font-bold text-lg text-neutral-900 mb-6">Payment Summary</h3>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between text-neutral-500">
                                    <span>Remaining Balance</span>
                                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingAmount)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-500">
                                    <span>Shipping Fee</span>
                                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}</span>
                                </div>
                                {paymentMethod === 'COD' && (
                                    <div className="flex justify-between text-blue-600 bg-blue-50 p-2 rounded-lg text-xs font-medium">
                                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Pay upon delivery</span>
                                    </div>
                                )}
                                <div className="h-px bg-neutral-100 my-4" />
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-neutral-900 text-base">Total to Pay</span>
                                    <span className="font-bold text-xl text-neutral-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-8 h-12 rounded-full bg-black hover:bg-neutral-800 text-white font-bold shadow-lg shadow-neutral-900/20"
                                onClick={handleSubmit}
                                disabled={submitting || !selectedAddress || (paymentMethod === 'WALLET' && !canPayViaWallet)}
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : (paymentMethod === 'WALLET' ? 'Pay with Wallet' : 'Confirm & Get QR')}
                            </Button>

                            {/* DEV ZONE: Mock Payment */}
                            <div className="mt-8 pt-4 border-t border-dashed border-red-200">
                                <p className="text-[10px] text-red-500 mb-2 font-bold uppercase tracking-wider">⚠️ DEV ZONE (Test Only)</p>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 h-8 text-xs"
                                    onClick={async () => {
                                        try {
                                            await orderService.mockPreorderPayment(Number(id));
                                            toast({ title: "Mock Payment Success", description: "Order moved to Processing (Bypassed Gateway)", className: "bg-green-600 text-white" });
                                            navigate('/customer/orders?tab=PROCESSING');
                                        } catch (e) {
                                            console.error(e);
                                            toast({ title: "Mock Payment Failed", description: "Check console", variant: "destructive" });
                                        }
                                    }}
                                >
                                    ⚡ DEV: Mock Pay Success (Skip Gateway)
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    );
}
