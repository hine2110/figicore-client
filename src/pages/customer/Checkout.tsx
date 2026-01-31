import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomerLayout from "@/layouts/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, MapPin, CreditCard, ShieldCheck, QrCode, Wallet, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api"; // Ensure this path is correct
import AddressDialog from "@/components/customer/AddressDialog";
import AddressSelectorDialog from "@/components/customer/AddressSelectorDialog";

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const orderId = location.state?.orderId;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    // 1. Helper: Format Currency
    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);



    // 3. Fetch Order Data
    const fetchOrder = async () => {
        if (!orderId) {
            navigate('/customer/cart');
            return;
        }
        try {
            const res = await api.get(`/orders/${orderId}`);
            setOrder(res.data);

            // Setup Timer
            const deadline = new Date(res.data.payment_deadline).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((deadline - now) / 1000);
            setTimeLeft(diff > 0 ? diff : 0);
        } catch (error) {
            console.error("Order Load Failed", error);
            navigate('/customer/cart');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrder(); }, [orderId]);

    // 4. Timer Logic
    // 4. Timer Logic
    useEffect(() => {
        if (timeLeft === null) return; // Wait for init

        if (timeLeft <= 0) {
            // TIME EXPIRED HANDLER
            handleExpireOrder();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleExpireOrder = async () => {
        if (!orderId) return;
        try {
            // Only call if we haven't already processed it (prevent loop)
            // But here we rely on the fact that we will navigate away.
            // Check status first? No, server ensures idempotency.

            await api.post(`/orders/${orderId}/expire`);
            toast({
                variant: "destructive",
                title: "Order Expired",
                description: "Payment time ran out. The order has been cancelled and stock released."
            });
        } catch (error) {
            console.error("Auto-Expire Failed", error);
        }
    };

    // Format MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // 5. Actions
    const handleAddressChange = async (newAddressId: number) => {
        try {
            await api.patch(`/orders/${orderId}`, { shipping_address_id: newAddressId });
            await fetchOrder(); // Refresh
            setShowAddressSelector(false);
            setShowAddressForm(false);
            toast({ title: "Address Updated", description: "Shipping fee recalculated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update address." });
        }
    };

    const handlePaymentChange = async (method: string) => {
        setOrder((prev: any) => ({ ...prev, payment_method_code: method }));
        try {
            await api.patch(`/orders/${orderId}`, { payment_method_code: method });
        } catch (e) { /* Silent fail or revert */ }
    };

    const handleConfirmPayment = async () => {
        if (timeLeft === 0) {
            toast({ variant: "destructive", title: "Order Expired", description: "Please recreate your order." });
            return;
        }
        setIsProcessing(true);
        try {
            await api.post(`/orders/${orderId}/confirm-payment`);
            navigate('/customer/order-success');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Payment Failed",
                description: error.response?.data?.message || "Transaction rejected."
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualCancel = async () => {
        setIsProcessing(true);
        try {
            await api.post(`/orders/${orderId}/cancel`);
            toast({
                title: "Order Cancelled",
                description: "The order has been cancelled and items returned to stock."
            });
            navigate('/customer/retail'); // Redirect to Shop
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Could not cancel order."
            });
        } finally {
            setIsProcessing(false);
            setShowCancelDialog(false);
        }
    };

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
    if (!order) return null;

    return (
        <CustomerLayout activePage="cart">
            <div className="min-h-screen bg-[#F8F9FA] py-10 font-sans text-slate-900">
                <div className="container mx-auto px-4 max-w-6xl">

                    {/* Header with Back Button */}
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/customer/cart')} className="rounded-full hover:bg-white bg-white/50 border border-transparent hover:border-slate-200">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Checkout</h1>
                            <p className="text-slate-500 text-sm">Secure Payment Gateway</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT COLUMN (8/12) */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* 1. SHIPPING ADDRESS */}
                            <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                                            <MapPin className="w-5 h-5 text-blue-600" /> Shipping Address
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setShowAddressSelector(true)} className="text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50">
                                            Change Address
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {order.addresses ? (
                                        <div className="flex gap-4">
                                            <div className="mt-1">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-lg text-slate-900">
                                                        {order.addresses.recipient_name || order.addresses.full_name}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-slate-600 font-medium">{order.addresses.recipient_phone}</span>
                                                    {order.addresses.is_default && <Badge variant="secondary" className="bg-blue-50 text-blue-700">Default</Badge>}
                                                </div>
                                                <p className="text-slate-600 leading-relaxed">
                                                    {order.addresses.detail_address}
                                                    <br />
                                                    <span className="text-slate-500 text-sm">
                                                        {[
                                                            order.addresses.ward_name,
                                                            order.addresses.district_name,
                                                            order.addresses.province_name
                                                        ].filter(Boolean).join(", ")}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-slate-500">No address selected</div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 2. PAYMENT METHOD (Wallet & QR Only) */}
                            <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                                        <CreditCard className="w-5 h-5 text-purple-600" /> Payment Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <RadioGroup value={order.payment_method_code} onValueChange={handlePaymentChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* FigiWallet */}
                                        <Label htmlFor="WALLET" className="cursor-pointer group">
                                            <div className={`relative p-5 rounded-xl border-2 transition-all ${order.payment_method_code === 'WALLET' ? 'border-purple-600 bg-purple-50/30 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                        <Wallet className="w-5 h-5" />
                                                    </div>
                                                    <RadioGroupItem value="WALLET" id="WALLET" className="text-purple-600" />
                                                </div>
                                                <div className="font-bold text-slate-900">FigiWallet</div>
                                                <div className="text-xs text-slate-500 mt-1">Pay instantly with your balance</div>
                                                {/* Placeholder for Balance - Connect to User Context later */}
                                                <div className="mt-2 text-xs font-medium text-purple-700 bg-purple-100 inline-block px-2 py-1 rounded-md">
                                                    Balance: (Check Profile)
                                                </div>
                                            </div>
                                        </Label>

                                        {/* QR Banking */}
                                        <Label htmlFor="QR_BANK" className="cursor-pointer group">
                                            <div className={`relative p-5 rounded-xl border-2 transition-all ${order.payment_method_code === 'QR_BANK' ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <QrCode className="w-5 h-5" />
                                                    </div>
                                                    <RadioGroupItem value="QR_BANK" id="QR_BANK" className="text-blue-600" />
                                                </div>
                                                <div className="font-bold text-slate-900">QR Banking</div>
                                                <div className="text-xs text-slate-500 mt-1">Scan VietQR via Banking App</div>
                                                <div className="mt-2 flex gap-1">
                                                    {/* Simple visual cues for banks */}
                                                    <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
                                                    <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
                                                    <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
                                                </div>
                                            </div>
                                        </Label>

                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN (4/12) - STICKY SUMMARY */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 space-y-4">

                                {/* TIMER ALERT */}
                                <Alert className="bg-orange-50 border-orange-100 text-orange-800">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <AlertTitle className="font-bold text-orange-700">Payment Reserved</AlertTitle>
                                    <AlertDescription className="text-orange-600/90 text-xs mt-1">
                                        Items held for <span className="font-mono font-bold text-lg ml-1">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                                    </AlertDescription>
                                </Alert>

                                <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                                    <CardHeader className="pb-4 pt-6 px-6">
                                        <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 space-y-6">

                                        {/* Items List */}
                                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                            {order.order_items.map((item: any) => {
                                                const product = item.product_variants?.products;
                                                const variant = item.product_variants;
                                                return (
                                                    <div key={item.item_id} className="flex gap-3 group">
                                                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                            {(() => {
                                                                // Extract first image from JSON array safely
                                                                const imageUrl = Array.isArray(product?.media_urls) && product.media_urls.length > 0
                                                                    ? product.media_urls[0]
                                                                    : null;

                                                                return imageUrl ? (
                                                                    <img src={imageUrl} alt={product?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">IMG</div>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm text-slate-900 truncate">{product?.name || "Unknown Product"}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{variant?.option_name} x{item.quantity}</p>
                                                        </div>
                                                        <div className="font-bold text-sm text-slate-900">
                                                            {formatPrice(Number(item.total_price))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        {/* Price Breakdown */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Subtotal</span>
                                                <span className="font-medium text-slate-900">{formatPrice(Number(order.total_amount) - Number(order.shipping_fee))}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Shipping Fee</span>
                                                <span className="font-medium text-slate-900">{formatPrice(Number(order.shipping_fee))}</span>
                                            </div>
                                            {Number(order.discount_amount) > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Discount</span>
                                                    <span>-{formatPrice(Number(order.discount_amount))}</span>
                                                </div>
                                            )}
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        {/* Total */}
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-lg text-slate-900">Total</span>
                                            <div className="text-right">
                                                <span className="block font-extrabold text-2xl text-slate-900">{formatPrice(Number(order.total_amount))}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">VAT Included</span>
                                            </div>
                                        </div>

                                        {/* Button */}
                                        <div className="space-y-3">
                                            <Button
                                                onClick={handleConfirmPayment}
                                                disabled={isProcessing || timeLeft === 0}
                                                className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-black text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all rounded-xl"
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Payment"}
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                onClick={() => setShowCancelDialog(true)}
                                                disabled={isProcessing}
                                                className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                Cancel Order / Shop More
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span>Secure SSL Encryption</span>
                                        </div>

                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Custom Centered Popup (Modal) for Cancellation */}
                {showCancelDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel this order?</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                This action will cancel the current order and release reserved items. Are you sure?
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCancelDialog(false)}
                                >
                                    No
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleManualCancel}
                                >
                                    Yes, Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Address Selector */}
                <AddressSelectorDialog
                    open={showAddressSelector}
                    onOpenChange={setShowAddressSelector}
                    onSelect={handleAddressChange}
                    currentAddressId={order.shipping_address_id}
                    onAddNew={() => {
                        setShowAddressSelector(false);
                        setShowAddressForm(true);
                    }}
                />

                {/* Address Form (Add New) */}
                <AddressDialog
                    open={showAddressForm}
                    onOpenChange={setShowAddressForm}
                    onSelect={handleAddressChange}
                // No explicit onSuccess needed as onSelect handles the update flow
                />
            </div>
        </CustomerLayout>
    );
}
