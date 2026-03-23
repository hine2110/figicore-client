import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomerLayout from "@/layouts/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, MapPin, CreditCard, ShieldCheck, QrCode, Wallet, Clock, Package, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import AddressDialog from "@/components/customer/AddressDialog";
import AddressSelectorDialog from "@/components/customer/AddressSelectorDialog";
import { TicketPercent } from "lucide-react";
import { TopUpModal } from "@/components/customer/TopUpModal";
import { io } from 'socket.io-client';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // Support both new Ref and legacy ID
    const paymentRef = location.state?.paymentRef;
    const legacyOrderId = location.state?.orderId;

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [appliedDiscountPromo, setAppliedDiscountPromo] = useState<any>(null);
    const [appliedShippingPromo, setAppliedShippingPromo] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Wallet State
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    // Selected Payment Method (Global for Group)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('QR_BANK');

    // Detect if this is an Auction order group
    const isAuctionOrder = orders.length > 0 && orders[0]?.order_code?.startsWith('AUC-');

    // Generate VietQR URL dynamically based on current orders
    const qrUrl = useMemo(() => {
        if (orders.length === 0) return '';
        const bankName = import.meta.env.VITE_SEPAY_BANK_NAME || 'MB';
        const accountNo = import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0935655266';
        const amount = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

        // Use paymentRef if available (group checkout), else fallback to single order_id
        const paymentCode = paymentRef || orders[0].order_id;
        const content = `FIGI ${paymentCode}`;

        return `https://img.vietqr.io/image/${bankName}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=FIGICORE`;
    }, [orders, paymentRef]);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    // 3. Fetch Orders Data
    const fetchOrders = async () => {
        if (!paymentRef && !legacyOrderId) {
            navigate('/customer/cart');
            return;
        }
        try {
            let fetchedOrders = [];
            const isLegacyAuction = location.state?.legacyAuctionFlag;

            if (isLegacyAuction) {
                const res = await api.get(`/orders/by-code/${legacyOrderId}`);
                fetchedOrders = res.data;
            } else if (paymentRef) {
                const res = await api.get(`/orders/by-ref/${paymentRef}`);
                fetchedOrders = res.data;
            } else {
                // Legacy Fallback ID
                const res = await api.get(`/orders/${legacyOrderId}`);
                fetchedOrders = [res.data];
            }

            if (!fetchedOrders || fetchedOrders.length === 0) throw new Error("No orders found");
            setOrders(fetchedOrders);

            // Set initial payment method from first order
            if (fetchedOrders[0].payment_method_code) {
                setSelectedPaymentMethod(fetchedOrders[0].payment_method_code);
            }

            // Setup Timer (Use Earliest Deadline)
            // Filter deadlines that exist (ignore nulls if any, though schema implies deadline exists)
            const deadlines = fetchedOrders
                .map((o: any) => o.payment_deadline ? new Date(o.payment_deadline).getTime() : null)
                .filter((d: any) => d !== null) as number[];

            if (deadlines.length > 0) {
                const earliest = Math.min(...deadlines);
                const now = new Date().getTime();
                const diff = Math.floor((earliest - now) / 1000);
                setTimeLeft(diff > 0 ? diff : 0);
            }

            // Fetch promotion details if promotion_id or shipping_promotion_id exists on any of the orders
            const discountPromoId = fetchedOrders.find((o: any) => o.promotion_id)?.promotion_id;
            const shippingPromoId = fetchedOrders.find((o: any) => o.shipping_promotion_id)?.shipping_promotion_id;

            try {
                const promoPromises = [];
                if (discountPromoId) {
                    promoPromises.push(api.get(`/promotions/${discountPromoId}`).then(res => setAppliedDiscountPromo(res.data)));
                }
                if (shippingPromoId) {
                    promoPromises.push(api.get(`/promotions/${shippingPromoId}`).then(res => setAppliedShippingPromo(res.data)));
                }

                if (promoPromises.length > 0) {
                    await Promise.all(promoPromises);
                }
            } catch (promoErr) {
                console.error("Failed to fetch applied promotion details:", promoErr);
            }
            // Fetch Wallet Balance
            try {
                const walletRes = await api.get('/wallet');
                setWalletBalance(Number(walletRes.data.balance_available) || 0);
            } catch (walletErr) {
                console.warn("Could not fetch wallet", walletErr);
                setWalletBalance(0);
            }

        } catch (error) {
            console.error("Orders Load Failed", error);
            navigate('/customer/cart');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [paymentRef, legacyOrderId]);

    // 4. Timer Logic
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            // TIME EXPIRED HANDLER (Auto-cancel logic would trigger on backend/cron mostly, forcing user out)
            // handleExpireOrders(); // Optional: Call specific endpoint
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

    // 4.5. Socket Listener for Payment Update
    useEffect(() => {
        if (!showQRModal || orders.length === 0) return;

        // Use VITE_API_BASE_URL (e.g. http://localhost:3000) and append /events namespace
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const socketUrl = `${baseUrl}/events`;
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('✅ Connected to Payment Events Namespace');
        });

        const paymentCode = paymentRef || orders[0].order_id;
        const eventName = `payment:success:${paymentCode}`;

        socket.on(eventName, () => {
            console.log(`🔔 Received ${eventName}. Redirecting to Success...`);
            toast({
                title: "Payment Successful!",
                description: "We have received your payment and confirmed your order(s).",
                className: "bg-emerald-600 text-white border-emerald-700"
            });
            setShowQRModal(false);
            navigate('/customer/order-success');
        });

        return () => {
            socket.disconnect();
        };
    }, [showQRModal, orders]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast({ title: "Copied to clipboard", duration: 2000 });
        setTimeout(() => setCopiedField(null), 2000);
    };

    // 5. Actions
    // Group Address Update (Update ALL orders in group)
    const handleAddressChange = async (newAddressId: number) => {
        setIsProcessing(true);
        try {
            await Promise.all(orders.map(o =>
                api.patch(`/orders/${o.order_id}`, { shipping_address_id: newAddressId })
            ));
            await fetchOrders(); // Refresh to get recalculated fees
            setShowAddressSelector(false);
            setShowAddressForm(false);
            toast({ title: "Address Updated", description: "Shipping fees recalculated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update address." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentMethodChange = async (method: string) => {
        setSelectedPaymentMethod(method);
        // Optimistically update UI, sync to backend on confirm or debounce?
        // Let's just state update for now, we send it on Confirm usually, 
        // OR update backend to persist choice.
        // For Group Checkout, persisting implies looping updates.
        setOrders(prev => prev.map(o => ({ ...o, payment_method_code: method })));
    };

    const handleConfirmPayment = async () => {
        if (timeLeft === 0) {
            toast({ variant: "destructive", title: "Order Expired", description: "Please recreate your order." });
            return;
        }

        // --- NEW: Bypass Validation ---
        if (!address || !address.address_id) {
            toast({
                variant: 'destructive',
                title: 'Missing Shipping Information',
                description: 'Please select a delivery address to complete your order.'
            });
            setShowAddressSelector(true);
            return;
        }

        if (selectedPaymentMethod === 'QR_BANK') {
            setShowQRModal(true);
            // TODO: Start polling or socket listener here
            return;
        }

        setIsProcessing(true);
        try {
            if (selectedPaymentMethod === 'WALLET') {
                if (paymentRef) {
                    await api.post('/orders/pay-with-wallet', { payment_ref_code: paymentRef });
                } else if (legacyOrderId) {
                    // Keep mock compatibility if legacy
                    await api.post(`/orders/${legacyOrderId}/confirm-payment`);
                }
            } else {
                if (paymentRef) {
                    await api.post('/orders/mock-pay-group', { payment_ref_code: paymentRef });
                } else if (legacyOrderId) {
                    await api.post(`/orders/${legacyOrderId}/confirm-payment`);
                }
            }
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

    const handleCancelGroup = async () => {
        setIsProcessing(true);
        try {
            await Promise.all(orders.map(o => api.post(`/orders/${o.order_id}/cancel`)));
            toast({ 
                title: isAuctionOrder ? "Auction Forfeited" : "Order Cancelled", 
                description: isAuctionOrder ? "Tiền cọc của bạn đã bị tịch thu theo quy định" : "Items returned to cart/stock." 
            });
            // Navigate to auctions list if this was an auction order, else go to retail
            navigate(isAuctionOrder ? '/customer/auctions' : '/customer/retail');
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to cancel orders." });
        } finally {
            setIsProcessing(false);
            setShowCancelDialog(false);
        }
    };

    // --- DERIVED DATA ---
    const retailOrders = orders.filter(o => o.status_code === 'PENDING_PAYMENT');
    const preOrders = orders.filter(o => o.status_code === 'WAITING_DEPOSIT');

    const rawTotalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount), 0); // Note: total_amount in DB is already discounted or full
    const totalShipping = orders.reduce((sum, o) => sum + Number(o.shipping_fee || 0), 0);
    const totalDeposit = orders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);

    // Calculate subtotal before any discounts from the order items
    const subtotal = orders.reduce((sum, o) => {
        return sum + o.order_items.reduce((itemSum: number, item: any) => itemSum + Number(item.total_price), 0);
    }, 0);

    let calculatedDiscount = orders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
    
    // Fallback display if discount_amount is 0 but promo exists (legacy fallback)
    if (calculatedDiscount === 0 && appliedDiscountPromo) {
        if (appliedDiscountPromo.discount_type === 'PERCENTAGE') {
            calculatedDiscount = (subtotal * (appliedDiscountPromo.discount_value || 0)) / 100;
        } else {
            calculatedDiscount = appliedDiscountPromo.discount_value || 0;
        }
    }

    let calculatedFreeShip = 0;
    if (appliedShippingPromo && appliedShippingPromo.discount_type === 'FREE_SHIP') {
        const totalOriginalShipping = orders.reduce((sum, o) => sum + Number(o.original_shipping_fee || 30000), 0);
        calculatedFreeShip = totalOriginalShipping - totalShipping;
    }

    // BUG FIXED: Backend authoritative checkout already subtracted vouchers from 'total_amount'.
    // grandTotal should simply be rawTotalAmount (the sum of order.total_amount)
    const grandTotal = Math.max(0, rawTotalAmount);

    // Address Info (From first order - assuming uniform address for group)
    const address = orders.length > 0 ? orders[0].addresses : null;

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
    if (orders.length === 0) return null;

    return (
        <CustomerLayout activePage="cart">
            <div className="min-h-screen bg-[#F8F9FA] py-10 font-sans text-slate-900">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/customer/cart')} className="rounded-full bg-white/50 border border-slate-200">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Checkout</h1>
                            <p className="text-slate-500 text-sm">Review your shipments</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* ADDRESS CARD */}
                            <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                                            <MapPin className="w-5 h-5 text-blue-600" /> Shipping Address
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setShowAddressSelector(true)} className="text-blue-600 font-semibold">Change</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {address ? (
                                        <div className="flex gap-4">
                                            <div className="mt-1"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><MapPin className="w-5 h-5" /></div></div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-lg">{address.recipient_name || address.full_name}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-slate-600">{address.recipient_phone}</span>
                                                    {address.is_default && <Badge variant="secondary" className="bg-blue-50 text-blue-700">Default</Badge>}
                                                </div>
                                                <p className="text-slate-600">{address.detail_address}, {address.ward_name}, {address.district_name}, {address.province_name}</p>
                                            </div>
                                        </div>
                                    ) : <div className="text-slate-500">No Address Found</div>}
                                </CardContent>
                            </Card>

                            {/* SHIPMENT 1: RETAIL */}
                            {retailOrders.length > 0 && (
                                <Card className="border border-emerald-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                                    <div className="bg-emerald-50/50 px-6 py-3 border-b border-emerald-100 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-emerald-600" />
                                        <span className="font-bold text-emerald-800">Shipment 1: Ready to Ship</span>
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 ml-auto">Immediate Delivery</Badge>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {retailOrders.map(order => order.order_items.map((item: any) => (
                                            <div key={item.item_id} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                    <img src={item.product_variants?.products?.media_urls?.[0] || ""} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900">{item.product_variants?.products?.name}</h4>
                                                    <p className="text-sm text-slate-500">{item.product_variants?.option_name} x{item.quantity}</p>
                                                    <div className="mt-2 text-emerald-600 font-bold text-sm">{formatPrice(Number(item.total_price))}</div>
                                                </div>
                                            </div>
                                        )))}
                                    </div>
                                </Card>
                            )}

                            {/* SHIPMENT 2..N: PRE-ORDER ITEMS */}
                            {preOrders.map((po, idx) => {
                                const item = po.order_items[0]; // Pre-orders are 1 item per order
                                const releaseDate = item?.product_variants?.product_preorder_configs?.release_date;
                                return (
                                    <Card key={po.order_id} className="border border-amber-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                                        <div className="bg-amber-50/50 px-6 py-3 border-b border-amber-100 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                            <span className="font-bold text-amber-800">Shipment {retailOrders.length > 0 ? idx + 2 : idx + 1}: Pre-order</span>
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 ml-auto">
                                                Release: {releaseDate ? new Date(releaseDate).toLocaleDateString('vi-VN') : 'TBA'}
                                            </Badge>
                                        </div>
                                        <div className="p-4 flex gap-4">
                                            <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative">
                                                <img src={item.product_variants?.products?.media_urls?.[0] || ""} alt="" className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                    <Badge className="bg-black/60 text-white text-[10px] backdrop-blur-sm">PRE-ORDER</Badge>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900">{item.product_variants?.products?.name}</h4>
                                                <p className="text-sm text-slate-500">{item.product_variants?.option_name} x{item.quantity}</p>
                                                <div className="mt-2 text-amber-600 font-bold text-sm">
                                                    Deposit: {formatPrice(Number(po.total_amount))}
                                                    <span className="text-slate-400 text-xs font-normal ml-2">(Full Price: {formatPrice(Number(item.product_variants?.product_preorder_configs?.full_price || item.unit_price))})</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}

                            {/* PAYMENT METHOD */}
                            <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                                        <CreditCard className="w-5 h-5 text-purple-600" /> Payment Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* FIGI WALLET OPTION */}
                                        <Label htmlFor="WALLET" className={`cursor-pointer group relative`}>
                                            <div className={`p-5 rounded-xl border-2 transition-all h-full flex flex-col ${selectedPaymentMethod === 'WALLET' ? 'border-purple-600 bg-purple-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                        <Wallet className="w-5 h-5" />
                                                    </div>
                                                    <RadioGroupItem value="WALLET" id="WALLET" className="text-purple-600" disabled={walletBalance !== null && walletBalance < grandTotal} />
                                                </div>
                                                <div className="font-bold text-slate-900">FigiWallet</div>
                                                <div className="text-xs text-slate-500 mt-1 mb-2">
                                                    Available: {walletBalance !== null ? formatPrice(walletBalance) : '...'}
                                                </div>
                                                {/* CONDITIONAL TOP UP OR WARNING */}
                                                <div className="mt-auto pt-2 disabled-content-exempt">
                                                    {walletBalance !== null && walletBalance < grandTotal && (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="text-xs text-red-500 font-semibold bg-red-50 p-2 rounded-md flex items-center gap-1">
                                                                <AlertCircle className="w-3.5 h-3.5" /> Insufficient balance
                                                            </div>
                                                            <Button type="button" size="sm" variant="outline" className="w-full relative z-10 text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700 pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTopUpModal(true); }}>
                                                                Top Up Now
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Label>
                                        <Label htmlFor="QR_BANK" className="cursor-pointer group">
                                            <div className={`relative p-5 rounded-xl border-2 transition-all ${selectedPaymentMethod === 'QR_BANK' ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><QrCode className="w-5 h-5" /></div>
                                                    <RadioGroupItem value="QR_BANK" id="QR_BANK" className="text-blue-600" />
                                                </div>
                                                <div className="font-bold text-slate-900">QR Banking</div>
                                                <div className="text-xs text-slate-500 mt-1">Scan VietQR</div>
                                            </div>
                                        </Label>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN - SUMMARY */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 space-y-4">
                                <Alert className="bg-orange-50 border-orange-100 text-orange-800">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <AlertTitle className="font-bold text-orange-700">Payment Reserved</AlertTitle>
                                    <AlertDescription className="text-orange-600/90 text-xs mt-1">
                                        Time remaining: <span className="font-mono font-bold text-lg ml-1">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                                    </AlertDescription>
                                </Alert>

                                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                                    <CardHeader className="pb-4 pt-6 px-6">
                                        <CardTitle className="text-xl font-bold">Total Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 space-y-6">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Subtotal (All Shipments)</span>
                                                <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Total Shipping</span>
                                                <span className="font-medium text-slate-900">{formatPrice(totalShipping)}</span>
                                            </div>

                                            {totalDeposit > 0 && (
                                                <div className="flex justify-between text-emerald-600 font-medium">
                                                    <span>Deposit Deduction</span>
                                                    <span>-{formatPrice(totalDeposit)}</span>
                                                </div>
                                            )}

                                            {/* Voucher Details */}
                                            {(appliedDiscountPromo || appliedShippingPromo) && (
                                                <>
                                                    <div className="w-full h-px bg-slate-100 my-2" />

                                                    {appliedDiscountPromo && (
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-orange-600 font-medium flex items-center gap-1.5">
                                                                    <TicketPercent className="w-4 h-4" /> Shop Discount Applied
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-mono mt-0.5 ml-5">
                                                                    Code: {appliedDiscountPromo.code}
                                                                </span>
                                                            </div>
                                                            <span className="font-bold text-orange-600">
                                                                -{formatPrice(calculatedDiscount)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {appliedShippingPromo && (
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex flex-col">
                                                                <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                                                                    <TicketPercent className="w-4 h-4" /> Free Shipping Applied
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-mono mt-0.5 ml-5">
                                                                    Code: {appliedShippingPromo.code}
                                                                </span>
                                                            </div>
                                                            <span className="font-bold text-emerald-600">
                                                                -{formatPrice(calculatedFreeShip)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <Separator className="bg-slate-100" />
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-lg text-slate-900">Total</span>
                                            <span className="font-extrabold text-2xl text-slate-900">{formatPrice(grandTotal)}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <Button onClick={handleConfirmPayment} disabled={isProcessing || timeLeft === 0} className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg">
                                                {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm All Payments"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setShowCancelDialog(true)} disabled={isProcessing} className="w-full text-slate-500 hover:text-red-600">Cancel</Button>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                                            <ShieldCheck className="w-3.5 h-3.5" /> <span>Secure Payment via {orders.length} Order{orders.length > 1 ? 's' : ''}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

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
                                                <span className="font-extrabold text-blue-600 text-lg tracking-tight">{formatPrice(grandTotal)}</span>
                                                <button onClick={() => handleCopy(grandTotal.toString(), 'amount')} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md">
                                                    {copiedField === 'amount' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <Separator className="bg-slate-100" />

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Content</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-sm tracking-wide">
                                                    {orders.length > 0 ? `FIGI ${paymentRef || orders[0].order_id}` : ''}
                                                </span>
                                                <button onClick={() => handleCopy(orders.length > 0 ? `FIGI ${paymentRef || orders[0].order_id}` : '', 'content')} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 p-1.5 rounded-md">
                                                    {copiedField === 'content' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-center gap-3 bg-blue-50/50 px-5 py-3 rounded-full border border-blue-100/50 max-w-[280px]">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </div>
                                        <p className="text-blue-700 text-[13px] font-semibold tracking-tight">Awaiting Auto-Confirmation...</p>
                                    </div>
                                </div>

                                <div className="p-4 w-full border-t border-slate-100 bg-white">
                                    <Button variant="ghost" className="w-full font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl h-11" onClick={() => setShowQRModal(false)}>
                                        Pay Later & Close
                                    </Button>
                                    <p className="text-[11px] text-center mt-3 text-slate-400 font-medium">
                                        Ref: {paymentRef || legacyOrderId} • Secured by SePay
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Standard Cancel Dialog (Existing) */}
                    {showCancelDialog && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
                                <h3 className="text-lg font-bold">Cancel Checkout?</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    {isAuctionOrder ? "Tiền cọc của bạn đã bị tịch thu theo quy định" : "This will cancel all created orders and release stock."}
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <Button variant="outline" onClick={() => setShowCancelDialog(false)}>No</Button>
                                    <Button variant="destructive" onClick={handleCancelGroup}>Yes, Cancel</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <AddressSelectorDialog open={showAddressSelector} onOpenChange={setShowAddressSelector} onSelect={handleAddressChange} currentAddressId={address?.address_id} onAddNew={() => { setShowAddressSelector(false); setShowAddressForm(true); }} />
                    <AddressDialog open={showAddressForm} onOpenChange={setShowAddressForm} onSelect={handleAddressChange} />
                </div>
            </div>
            {/* TOP UP MODAL (Inside Checkout) */}
            <TopUpModal
                open={showTopUpModal}
                onOpenChange={setShowTopUpModal}
                onSuccess={() => {
                    fetchOrders(); // Re-fetch wallet balance
                }}
            />

        </CustomerLayout>
    );
}
