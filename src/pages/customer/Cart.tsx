import { useState, useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import CustomerLayout from "@/layouts/CustomerLayout";
import { useCartStore } from "@/store/useCartStore";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

export default function Cart() {
    const navigate = useNavigate();
    const { items, updateQuantity, removeFromCart } = useCartStore();
    const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

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
        const types = new Set(selectedItems.map(i => i.type_code));
        const hasPreorder = types.has('PREORDER');

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
                payment_method_code: 'QR_BANK', // Valid default
                shipping_fee: 0, // Placeholder, calculated by backend/checkout later if needed, but required by DTO
                order_type: hasPreorder ? 'PREORDER' : 'RETAIL',
                items: selectedItems.map(item => ({
                    variant_id: Number(item.variantId || item.id), // Ensure it maps to variant_id
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    paymentOption: item.payment_option
                }))
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

            toast({
                variant: "destructive",
                title: "Order Creation Failed",
                description: errorMsg
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- UI HELPERS ---
    const selectedItemsList = items.filter(i => selectedItemIds.includes(i.id));

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

    const totalAmount = useMemo(() => {
        return items
            .filter(item => selectedItemIds.includes(item.id))
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [items, selectedItemIds]);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    // --- GROUPING LOGIC ---
    const groupA = items.filter(i => i.type_code === 'RETAIL' || i.type_code === 'BLINDBOX'); // Ready to Ship
    const groupB = items.filter(i => i.type_code === 'PREORDER'); // Pre-order

    const renderCartItem = (item: any) => (
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
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-8 h-8 opacity-50" />
                    </div>
                )}
                {/* Type & Payment Badge */}
                {item.type_code === 'PREORDER' && (
                    <div className="absolute top-0 left-0 flex flex-col items-start gap-0.5 pt-1 pl-1">
                        <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                            PRE-ORDER
                        </div>
                        {/* Normalize Payment Option key (Legacy Support for 'FULL') */}
                        {((item.payment_option === 'FULL_PAYMENT' || item.payment_option === 'FULL') ||
                            ((item as any).paymentOption === 'FULL_PAYMENT' || (item as any).paymentOption === 'FULL')) ? (
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
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg truncate pr-4 leading-tight">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.sku || 'Standard Edition'}</p>
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
                                (item.type_code === 'PREORDER' && item.max_qty_per_user && item.quantity >= item.max_qty_per_user) ||
                                (item.type_code === 'RETAIL' && item.quantity >= (item.maxStock || 999))
                            }
                            className="text-slate-500 hover:text-slate-900 disabled:opacity-30 px-1"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-slate-900 text-lg">
                            {formatPrice(
                                (item.type_code === 'PREORDER' &&
                                    ((item.payment_option === 'FULL_PAYMENT' || item.payment_option === 'FULL') ||
                                        ((item as any).paymentOption === 'FULL_PAYMENT' || (item as any).paymentOption === 'FULL'))
                                )
                                    ? (item.full_price || item.price)
                                    : (item.deposit_amount || item.price)
                            )}
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

                <div className="container mx-auto px-4 relative z-10 max-w-6xl">
                    <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight font-serif">Your Collection ({items.length})</h1>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                        {/* LEFT COLUMN: ITEMS */}
                        <div className="flex-1 space-y-8">

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
                                    <div className="space-y-4 p-4 rounded-[2rem] border border-white/60 bg-white/30 shadow-sm">
                                        {groupA.map(renderCartItem)}
                                    </div>
                                </div>
                            )}

                            {/* GROUP 2: PRE-ORDER (Preorder) */}
                            {groupB.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-4 mt-8">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        <h3 className="font-bold text-lg text-slate-900 uppercase tracking-wide">
                                            ⏳ Pre-order Items
                                        </h3>
                                        <span className="text-xs text-slate-500 italic ml-2">- Ships upon release</span>
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
                        <div className="w-full lg:w-[380px]">
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
                                    <div className="w-full h-px bg-slate-200/50 my-2" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-lg font-bold text-slate-900">Total</span>
                                        <span className="text-3xl font-serif font-bold text-slate-900">{formatPrice(totalAmount)}</span>
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