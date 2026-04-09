import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import CustomerLayout from "@/layouts/CustomerLayout";
import { useCartStore } from "@/store/useCartStore";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import { calculateFinalPrice } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { VouchersService } from '@/services/vouchers.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TicketPercent } from 'lucide-react';

export default function Cart() {
    const navigate = useNavigate();
    const { items, updateQuantity, removeFromCart, fetchCart } = useCartStore();
    const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedDiscountCode, setSelectedDiscountCode] = useState<string | null>(null);
    const [selectedFreeShipCode, setSelectedFreeShipCode] = useState<string | null>(null);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const { toast } = useToast();

    // Fetch user's collected vouchers
    const { data: myVouchers } = useQuery({
        queryKey: ['my_vouchers'],
        queryFn: VouchersService.getMyVouchers,
    });

    const totalAmount = useMemo(() => {
        return items
            .filter(item => selectedItemIds.includes(item.id))
            .reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
    }, [items, selectedItemIds]);

    // ── RETAIL-ONLY VOUCHER CALCULATION ─────────────────────────────────────
    const getTypeCode = (item: any) => item.product_variants?.products?.type_code || item.type_code;

    const retailTotal = useMemo(() => {
        return items
            .filter(item => selectedItemIds.includes(item.id) && getTypeCode(item) === 'RETAIL')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [items, selectedItemIds]);

    // --- AUTO-SELECT BEST VOUCHERS ---
    useEffect(() => {
        if (!myVouchers || myVouchers.length === 0 || totalAmount === 0 || retailTotal === 0) {
            setSelectedDiscountCode(null);
            setSelectedFreeShipCode(null);
            return;
        }

        let bestDiscountVoucher = null;
        let bestFreeShipVoucher = null;
        let maxDiscountAmount = 0;
        let maxFreeShipAmount = 0;
        const DEFAULT_SHIPPING_FEE = 30000;

        for (const uv of myVouchers) {
            const promo = uv.promotions;
            const now = new Date();
            const startDate = promo.start_date ? new Date(promo.start_date) : null;
            const endDate = promo.end_date ? new Date(promo.end_date) : null;

            // Check if voucher is within valid dates
            const isStarted = !startDate || startDate <= now;
            const isNotExpired = !endDate || endDate > now;
            // Check if voucher is COLLECTED, valid dates AND retail condition
            const isAvailable = uv.status === 'COLLECTED';
            if (isAvailable && isStarted && isNotExpired && (!promo.min_order_value || retailTotal >= Number(promo.min_order_value))) {
                if (promo.discount_type === 'FREE_SHIP') {
                    if (DEFAULT_SHIPPING_FEE > maxFreeShipAmount) {
                        maxFreeShipAmount = DEFAULT_SHIPPING_FEE;
                        bestFreeShipVoucher = promo;
                    }
                } else {
                    // Discount Voucher
                    let currentDiscount = 0;
                    if (promo.discount_type === 'PERCENTAGE') {
                        currentDiscount = (retailTotal * (promo.discount_value || 0)) / 100;
                        const maxCap = Number(promo.max_discount_amount);
                        if (maxCap > 0) {
                            currentDiscount = Math.min(currentDiscount, maxCap);
                        }
                    } else {
                        currentDiscount = Number(promo.discount_value) || 0;
                    }

                    if (currentDiscount > maxDiscountAmount) {
                        maxDiscountAmount = currentDiscount;
                        bestDiscountVoucher = promo;
                    }
                }
            }
        }

        setSelectedDiscountCode(bestDiscountVoucher ? bestDiscountVoucher.code! : null);
        setSelectedFreeShipCode(bestFreeShipVoucher ? bestFreeShipVoucher.code! : null);
    }, [myVouchers, totalAmount, retailTotal]);

    // --- REAL-TIME PROMOTION WATCHER ---
    // Automatically re-fetch cart when any promotion window starts or ends
    useEffect(() => {
        if (items.length === 0) return;

        const calculateNextEvent = () => {
            const now = new Date();
            let minDelay = Infinity;

            items.forEach(item => {
                const promo = item.promotion;
                if (!promo || !promo.is_active) return;

                const startStr = promo.start_time || "00:00";
                const endStr = promo.end_time || "23:59";

                const parseTime = (timeStr: string, date: Date) => {
                    const [hh, mm] = timeStr.split(':').map(Number);
                    const d = new Date(date);
                    d.setHours(hh, mm, 0, 0);
                    return d;
                };

                const promoStart = parseTime(startStr, now);
                const promoEnd = parseTime(endStr, now);
                promoEnd.setSeconds(59, 999); // Inclusion margin

                // 1. If currently BEFORE start -> find delay to Start
                if (now < promoStart) {
                    minDelay = Math.min(minDelay, promoStart.getTime() - now.getTime());
                }
                // 2. If currently INSIDE window -> find delay to End
                else if (now >= promoStart && now <= promoEnd) {
                    minDelay = Math.min(minDelay, promoEnd.getTime() - now.getTime());
                }
                // 3. If AFTER end -> find delay to Start of TOMORROW (for recurring)
                else if (promo.is_recurring) {
                    const tomorrowStart = new Date(promoStart);
                    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
                    minDelay = Math.min(minDelay, tomorrowStart.getTime() - now.getTime());
                }
            });

            return minDelay;
        };

        // Precision Timer (based on next event)
        const delay = calculateNextEvent();
        let precisionTimer: NodeJS.Timeout | null = null;
        
        if (delay > 0 && delay < 24 * 3600 * 1000) {
            // Buffer with +1.5s to ensure server clock caught up
            precisionTimer = setTimeout(() => {
                console.log("🔔 [Real-time] Promotion window changed. Syncing cart...");
                fetchCart();
            }, delay + 1500);
        }

        // Fallback Polling (Sync every 60s just in case)
        const fallbackInterval = setInterval(() => fetchCart(), 60000);

        return () => {
            if (precisionTimer) clearTimeout(precisionTimer);
            clearInterval(fallbackInterval);
        };
    }, [items, fetchCart]);

    // --- CHECKOUT LOGIC ---
    const handleProceed = async () => {
        // 1. Filter selected items
        const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

        // Basic Validation
        if (selectedItems.length === 0) {
            toast({
                variant: "destructive",
                title: "No items selected",
                description: "Please select at least one item to proceed."
            });
            return;
        }



        // 2. Business Validation (Mixed Cart Check)
        // We allow mixed carts now, but we need to know if there's a pre-order to set the flag

        // 3. Create Order Flow
        setIsProcessing(true);
        try {
            // A. Fetch Default Address (Required by Backend)
            const addrRes = await api.get('/address');
            if (!addrRes.data || addrRes.data.length === 0) {
                toast({
                    variant: "destructive",
                    title: "Missing Address",
                    description: "Please add a shipping address in your profile first."
                });
                navigate('/customer/profile');
                return;
            }
            // Find default or first
            const defaultAddr = addrRes.data.find((a: any) => a.is_default) || addrRes.data[0];

            if (!defaultAddr || !defaultAddr.address_id) {
                toast({
                    variant: "destructive",
                    title: "Invalid Address",
                    description: "Please update your shipping address."
                });
                navigate('/customer/profile');
                return;
            }

            // B. Prepare payload for Backend
            // Validating DTO: shipping_address_id (Int), shipping_fee (Number), items (Array)
            const payload = {
                shipping_address_id: Number(defaultAddr.address_id),
                payment_method_code: 'QR_BANK', // Default
                shipping_fee: 30000,
                discountVoucherCode: selectedDiscountCode || undefined, // Send selected discount voucher
                freeShipVoucherCode: selectedFreeShipCode || undefined, // Send selected free ship voucher
                // original_shipping_fee removed, calculated in backend
                items: selectedItems.map(i => {
                    // RESOLVED: Handle both nested (local) and flat (server) structures
                    // Server returns 'variantId' at root. Local has it in 'product_variants.variant_id'.
                    const realVariantId = (i as any).variantId || i.product_variants?.variant_id || (i.product_variants ? undefined : i.id);

                    return {
                        variant_id: Number(realVariantId),
                        quantity: Number(i.quantity),
                        price: i.price, // Send discounted price
                        payment_option: (i as any).payment_option || (i as any).paymentOption || 'DEPOSIT', // Fix: Send explicit option
                        livestreamId: (i as any).livestream_id || undefined, // Live pricing context
                    };
                })
            };

            // 822 Call API to create draft order
            const response = await api.post('/orders', payload);
            console.log("Full Create Order Response:", response);

            const rawData = response.data;
            // Unwrap array if needed (Backend returns array for split orders) -- NO, Backend returns object now { payment_ref_code, ... }
            const orderData = Array.isArray(rawData) ? rawData[0] : rawData;

            // Extract Payment Ref
            const paymentRef = orderData?.payment_ref_code || orderData?.paymentRefCode;

            if (!paymentRef) {
                // Fallback to old ID Logic if Ref is missing (Backward Compat)
                const newOrderId = orderData?.id || orderData?.order_id || orderData?.data?.id;
                if (newOrderId) {
                    navigate('/customer/checkout', { state: { orderId: newOrderId } });
                    return;
                }
                const keys = orderData ? Object.keys(orderData).join(', ') : 'null';
                throw new Error(`Order created but Payment Ref missing. Response keys: ${keys}`);
            }

            // 4. Navigate to Checkout with Valid Ref
            navigate('/customer/checkout', {
                state: {
                    paymentRef: paymentRef
                }
            });

        } catch (error: any) {
            console.error("Proceed Error:", error);

            const errorMsg = error.response?.data?.message || error.message || "Failed to initiate order.";
            const isLimitError = errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('max_qty');
            const isPriceChanged = errorMsg.toLowerCase().includes('price') && errorMsg.toLowerCase().includes('changed');

            if (isPriceChanged) {
                // Auto refresh cart to get the new prices
                await fetchCart();
                toast({
                    variant: "destructive",
                    title: "Giỏ hàng đã cập nhật giá",
                    description: errorMsg,
                    duration: 6000,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: isLimitError ? "Limit Reached" : "Order Creation Failed",
                    description: errorMsg,
                    duration: isLimitError ? 5000 : 3000,
                });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // --- UI HELPERS ---

    const toggleItem = (productId: string | number) => {
        setSelectedItemIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const toggleAll = () => {
        if (selectedItemIds.length === items.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(items.map(i => i.id));
        }
    };

    const isAllSelected = useMemo(() => {
        return items.length > 0 && selectedItemIds.length === items.length;
    }, [items, selectedItemIds]);

    const voucherDiscountAmount = useMemo(() => {
        if (!myVouchers) return { discount: 0, freeship: 0 };

        let discount = 0;
        let freeship = 0;

        if (selectedDiscountCode) {
            const v = myVouchers.find(mv => mv.promotions.code === selectedDiscountCode)?.promotions;
            if (v) {
                if (v.discount_type === 'PERCENTAGE') {
                    discount = (retailTotal * (Number(v.discount_value) || 0)) / 100;
                    const maxCap = Number(v.max_discount_amount);
                    if (maxCap > 0) {
                        discount = Math.min(discount, maxCap);
                    }
                } else {
                    discount = Number(v.discount_value) || 0;
                }
            }
        }

        if (selectedFreeShipCode) {
            freeship = 30000; // Static freeship assumption for UI
        }

        return { discount, freeship };
    }, [selectedDiscountCode, selectedFreeShipCode, myVouchers, retailTotal]);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const groupA = items.filter(i => {
        const type = getTypeCode(i);
        return type === 'RETAIL' || type === 'BLINDBOX';
    });
    const groupB = items.filter(i => getTypeCode(i) === 'PREORDER');

    const renderCartItem = (item: any) => {
        const product = item.product_variants?.products || {};
        // Fallback for flat structure if any (though types say nested)
        const type_code = product.type_code || item.type_code;
        const name = product.name || item.name;
        const image = product.image || item.image;
        const sku = product.sku || item.sku || 'Standard Edition';

        return (
            <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`group bg-white/40 backdrop-blur-md p-4 rounded-[1.5rem] border border-white/40 shadow-sm transition-all duration-300 flex gap-4 items-center gpu-layer hover:shadow-md cursor-pointer`}
            >
                {/* Selection Checkbox */}
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={selectedItemIds.includes(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 border-slate-400 w-5 h-5 rounded-md flex-shrink-0"
                    />
                </div>

                {/* Image */}
                <div className="w-24 h-24 bg-white/50 rounded-xl overflow-hidden flex-shrink-0 border border-white/30 shadow-inner relative">
                    {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-8 h-8 opacity-50" />
                        </div>
                    )}
                    {/* Type & Payment Badge */}
                    {type_code === 'PREORDER' && (
                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0.5 pt-1 pl-1">
                            <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                                PRE-ORDER
                            </div>
                            {/* Normalize Payment Option key (Legacy Support for 'FULL') */}
                            {((item.payment_option === 'FULL_PAYMENT' || item.payment_option === 'FULL') ||
                                (item.paymentOption === 'FULL_PAYMENT' || item.paymentOption === 'FULL')) ? (
                                <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                                    FULL PAYMENT
                                </div>
                            ) : (
                                <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                                    DEPOSIT
                                </div>
                            )}
                        </div>
                    )}
                    {/* LIVE PRICE badge */}
                    {item.livestream_id && item.is_live && type_code !== 'PREORDER' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-600/80 to-transparent pb-1 pt-2 flex items-center justify-center">
                            <span className="text-white text-[9px] font-black uppercase tracking-wider">🔴 Live Price</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg truncate pr-4 leading-tight">{name}</h3>
                        <p className="text-sm text-slate-500">{sku}</p>
                    </div>

                    <div className="flex justify-between items-end">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-300/60 rounded-full px-3 py-1 bg-white/40 h-8" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="text-slate-500 hover:text-slate-900 disabled:opacity-30 px-1"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="mx-3 text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                // Disable if hitting Max User Limit (Preorder) OR Max Stock (Retail)
                                disabled={
                                    (type_code === 'PREORDER' && item.max_qty_per_user && item.quantity >= item.max_qty_per_user) ||
                                    (type_code === 'RETAIL' && item.quantity >= (item.maxStock || 999))
                                }
                                className="text-slate-500 hover:text-slate-900 disabled:opacity-30 px-1"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Price */}
                        <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-slate-900 text-lg">
                                {formatPrice(item.price)}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-xs text-slate-400 line-through decoration-slate-400/50">
                                    {formatPrice(item.originalPrice)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delete Action */}
                <button
                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-white/50 rounded-full self-start -mt-2 -mr-2"
                    title="Remove item"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        );
    };

    // --- RENDER ---
    if (items.length === 0) {
        return (
            <CustomerLayout activePage="cart">
                <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 text-center font-sans relative overflow-hidden">
                    <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] ambient-glow-blue rounded-full animate-breathe gpu-accelerated blob-optimized" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] ambient-glow-purple rounded-full animate-breathe gpu-accelerated blob-optimized" />
                    </div>

                    <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/40 p-12 rounded-[2.5rem] shadow-xl max-w-md w-full">
                        <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/50">
                            <ShoppingBag className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Your cart is empty</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Start adding exclusive collectibles to your portfolio.
                        </p>
                        <Link to="/customer/retail">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                Start Collecting
                            </Button>
                        </Link>
                    </div>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout activePage="cart">
            <div className="min-h-screen bg-[#F2F2F7] py-12 font-sans relative overflow-hidden">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                    <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] ambient-glow-blue rounded-full animate-breathe gpu-accelerated blob-optimized" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] ambient-glow-purple rounded-full animate-breathe gpu-accelerated blob-optimized" />
                </div>

                <div className="container mx-auto px-4 relative z-10 max-w-7xl">
                    <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight font-serif">Your Collection ({items.length})</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* LEFT COLUMN: ITEMS */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Select All Header with Alert */}
                            <div className="space-y-4 mb-4">
                                <div className="flex items-center gap-3 px-4 pb-4 border-b border-slate-200/60">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={toggleAll}
                                        className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 border-slate-400 w-5 h-5 rounded-md"
                                    />
                                    <span className="font-medium text-slate-700">
                                        Select All {items.length} items
                                    </span>
                                </div>
                            </div>

                            {/* GROUP 1: READY TO SHIP (Retail/Blindbox) */}
                            {groupA.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <h3 className="font-bold text-lg text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                            <span>📦 Ready to Ship</span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">In Stock</span>
                                        </h3>
                                    </div>
                                    {groupA.map(renderCartItem)}
                                </div>
                            )}

                            {/* GROUP 2: PRE-ORDER */}
                            {groupB.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 px-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        <h3 className="font-bold text-lg text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                            <span>⏳ Pre-order</span>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">Waitlist</span>
                                        </h3>
                                    </div>
                                    <div className="space-y-4 p-4 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 shadow-sm relative overflow-hidden">
                                        {/* Subtle Ambient for Preorder Group */}
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                                        {groupB.map(renderCartItem)}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* RIGHT COLUMN: SUMMARY */}
                        <div className="lg:col-span-4">
                            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] sticky top-24 gpu-layer">
                                <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2 font-serif">
                                    Finalize Order
                                </h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal ({selectedItemIds.length} items)</span>
                                        <span className="font-medium text-slate-900">{formatPrice(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span className="text-sm italic text-slate-400">Calculated at Payment</span>
                                    </div>

                                    {/* Voucher System */}
                                    <div className="w-full h-px bg-slate-200/50 my-2" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 flex items-center gap-2">
                                            <TicketPercent className="w-4 h-4" /> Store Voucher
                                        </span>

                                        <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-full border-dashed border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100 hover:text-orange-700 hover:border-orange-400">
                                                    {(selectedDiscountCode || selectedFreeShipCode) ?
                                                        `${[selectedDiscountCode, selectedFreeShipCode].filter(Boolean).length} Selected` :
                                                        'Select from Wallet'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden bg-[#F8F9FA] p-0">
                                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-orange-400 to-red-500 opacity-10"></div>
                                                <DialogHeader className="relative z-10 pt-6 px-6 pb-2">
                                                    <DialogTitle className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
                                                        <TicketPercent className="w-6 h-6 text-orange-500" />
                                                        Select Vouchers
                                                    </DialogTitle>
                                                </DialogHeader>

                                                <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto space-y-6 relative z-10">
                                                    {!myVouchers || myVouchers.length === 0 ? (
                                                        <div className="text-center py-8 text-slate-500">
                                                            You haven't collected any vouchers yet.
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* DISCOUNT VOUCHERS SECTION */}
                                                            {myVouchers.filter(mv => mv.promotions.discount_type !== 'FREE_SHIP').length > 0 && (
                                                                <div className="space-y-3">
                                                                    <h4 className="font-bold text-sm text-orange-600 uppercase tracking-wider flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-orange-500" /> Shop Discount (Select 1)
                                                                    </h4>
                                                                    {myVouchers.filter(mv => mv.status === 'COLLECTED' && mv.promotions.discount_type !== 'FREE_SHIP')
                                                                        .sort((a, b) => {
                                                                            const isASelected = selectedDiscountCode === a.promotions.code;
                                                                            const isBSelected = selectedDiscountCode === b.promotions.code;
                                                                            if (isASelected && !isBSelected) return -1;
                                                                            if (!isASelected && isBSelected) return 1;
                                                                            return 0;
                                                                        })
                                                                        .map(mv => {
                                                                            const now = new Date();
                                                                            const startDate = mv.promotions.start_date ? new Date(mv.promotions.start_date) : null;
                                                                            const endDate = mv.promotions.end_date ? new Date(mv.promotions.end_date) : null;

                                                                            const isStarted = !startDate || startDate <= now;
                                                                            const isNotExpired = !endDate || endDate > now;

                                                                            const meetsMinOrder = !mv.promotions.min_order_value || retailTotal >= Number(mv.promotions.min_order_value);
                                                                            const isAvailableForThisOrder = meetsMinOrder && isStarted && isNotExpired && retailTotal > 0;
                                                                            const isSelected = selectedDiscountCode === mv.promotions.code;

                                                                            return (
                                                                                <div
                                                                                    key={mv.id}
                                                                                    onClick={() => {
                                                                                        if (isAvailableForThisOrder) {
                                                                                            setSelectedDiscountCode(isSelected ? null : mv.promotions.code!);
                                                                                        }
                                                                                    }}
                                                                                    className={`ticket-container border-2 transition-all ${isAvailableForThisOrder
                                                                                        ? (isSelected ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-transparent hover:border-orange-200')
                                                                                        : 'opacity-50 grayscale cursor-not-allowed'}`}
                                                                                >
                                                                                    {/* Left Section */}
                                                                                    <div className="ticket-left !w-24 bg-orange-500">
                                                                                        <TicketPercent className="w-8 h-8 mb-1" />
                                                                                        <div className="ticket-brand-text">SHOP VOUCHER</div>
                                                                                    </div>

                                                                                    {/* Right Section */}
                                                                                    <div className="ticket-right">
                                                                                        <div className="flex justify-between items-start">
                                                                                            <div className="space-y-0.5">
                                                                                                <h4 className="font-bold text-slate-900 text-base md:text-lg">
                                                                                                    {mv.promotions.discount_type === 'PERCENTAGE'
                                                                                                        ? `Giảm ${mv.promotions.discount_value}%`
                                                                                                        : `Giảm ${formatPrice(Number(mv.promotions.discount_value))}`}
                                                                                                </h4>
                                                                                                <div className="flex flex-col gap-0.5">
                                                                                                    {Number(mv.promotions.max_discount_amount || 0) > 0 && (
                                                                                                        <p className="text-[11px] text-orange-600 font-bold">
                                                                                                            Giảm tối đa {formatPrice(Number(mv.promotions.max_discount_amount))}
                                                                                                        </p>
                                                                                                    )}
                                                                                                    <p className="text-xs text-slate-500">
                                                                                                        {mv.promotions.min_order_value 
                                                                                                           ? `Đơn tối thiểu ${formatPrice(Number(mv.promotions.min_order_value))}`
                                                                                                           : 'Không giới hạn đơn tối thiểu'}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                            {isSelected && (
                                                                                                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs shadow-sm">✓</div>
                                                                                            )}
                                                                                        </div>

                                                                                        <div className="mt-3 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between">
                                                                                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                                                                                                {mv.promotions.code}
                                                                                            </span>
                                                                                            {endDate && (
                                                                                                <span className="text-[10px] text-slate-400">
                                                                                                    HSD: {endDate.toLocaleDateString('vi-VN')}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            )}

                                                            {/* FREE SHIP VOUCHERS SECTION */}
                                                            {myVouchers.filter(mv => mv.promotions.discount_type === 'FREE_SHIP').length > 0 && (
                                                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                                                    <h4 className="font-bold text-sm text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Free Shipping (Select 1)
                                                                    </h4>
                                                                    {myVouchers.filter(mv => mv.status === 'COLLECTED' && mv.promotions.discount_type === 'FREE_SHIP')
                                                                        .sort((a, b) => {
                                                                            const isASelected = selectedFreeShipCode === a.promotions.code;
                                                                            const isBSelected = selectedFreeShipCode === b.promotions.code;
                                                                            if (isASelected && !isBSelected) return -1;
                                                                            if (!isASelected && isBSelected) return 1;
                                                                            return 0;
                                                                        })
                                                                        .map(mv => {
                                                                            const now = new Date();
                                                                            const startDate = mv.promotions.start_date ? new Date(mv.promotions.start_date) : null;
                                                                            const endDate = mv.promotions.end_date ? new Date(mv.promotions.end_date) : null;

                                                                            const isStarted = !startDate || startDate <= now;
                                                                            const isNotExpired = !endDate || endDate > now;

                                                                            const meetsMinOrder = !mv.promotions.min_order_value || retailTotal >= Number(mv.promotions.min_order_value);
                                                                            const isAvailableForThisOrder = meetsMinOrder && isStarted && isNotExpired && retailTotal > 0;
                                                                            const isSelected = selectedFreeShipCode === mv.promotions.code;

                                                                            return (
                                                                                <div
                                                                                    key={mv.id}
                                                                                    onClick={() => {
                                                                                        if (isAvailableForThisOrder) {
                                                                                            setSelectedFreeShipCode(isSelected ? null : mv.promotions.code!);
                                                                                        }
                                                                                    }}
                                                                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${isAvailableForThisOrder
                                                                                        ? (isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-white bg-white hover:border-emerald-200')
                                                                                        : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'}`}
                                                                                >
                                                                                    <div className="flex-1">
                                                                                        <div className="font-bold text-lg text-emerald-700 uppercase">
                                                                                            MIỄN PHÍ VẬN CHUYỂN
                                                                                        </div>
                                                                                        <div className="text-sm text-slate-500">
                                                                                            Code: <span className="font-mono font-bold">{mv.promotions.code}</span>
                                                                                        </div>
                                                                                        <div className="text-xs text-slate-400 mt-1">
                                                                                            {mv.promotions.min_order_value ? `Giá trị Retail tối thiểu: ${formatPrice(Number(mv.promotions.min_order_value))}` : 'Không giới hạn chi tiêu'}
                                                                                        </div>
                                                                                        {retailTotal === 0 && (
                                                                                            <div className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block uppercase">
                                                                                                Chỉ áp dụng cho hàng Retail
                                                                                            </div>
                                                                                        )}
                                                                                        {(!isStarted || !isNotExpired) && (
                                                                                            <div className="text-xs text-red-500 font-medium mt-1">
                                                                                                {!isNotExpired ? 'Đã hết hạn' : `Kích hoạt từ ngày ${startDate?.toLocaleDateString()}`}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="shrink-0 ml-4">
                                                                                        {isSelected && (
                                                                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                                                                                        )}
                                                                                        {!isAvailableForThisOrder && (
                                                                                            <span className="text-xs font-bold text-red-400">
                                                                                                {retailTotal === 0 ? 'Retail Only' : (!meetsMinOrder ? 'Không đủ điều kiện' : (!isNotExpired ? 'Hết hạn' : 'Sắp tới'))}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                                                    <Button onClick={() => setIsVoucherModalOpen(false)} className="bg-slate-900 text-white rounded-xl px-8 hover:bg-slate-800">
                                                        Done
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    {selectedDiscountCode && (
                                        <div className="flex justify-between text-orange-600 font-medium">
                                            <span>Shop Discount</span>
                                            <span>-{formatPrice(voucherDiscountAmount.discount)}</span>
                                        </div>
                                    )}
                                    {selectedFreeShipCode && (
                                        <div className="flex justify-between text-emerald-600 font-medium">
                                            <span>Free Shipping</span>
                                            <span>-{formatPrice(voucherDiscountAmount.freeship)}</span>
                                        </div>
                                    )}

                                    <div className="w-full h-px bg-slate-200/50 my-2" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-bold text-slate-900">Total</span>
                                        <span className="text-3xl font-serif font-bold text-slate-900">
                                            {formatPrice(Math.max(0, totalAmount - voucherDiscountAmount.discount))}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-slate-900 hover:bg-black text-white h-14 text-lg rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                                    disabled={totalAmount === 0 || isProcessing}
                                    onClick={handleProceed}
                                >
                                    {isProcessing ? 'Processing...' : 'Proceed to Payment'} <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>

                                <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Secure checkout powered by FigiCore
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}