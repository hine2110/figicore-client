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

    // ... existing helpers ...

    const { toast } = useToast();

    const handleProceed = async () => {
        // 1. Explicitly filter selected items to ensure only checked items are processed
        const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

        if (selectedItems.length === 0) {
            toast({
                variant: "destructive",
                title: "No items selected",
                description: "Please select at least one item to proceed to checkout."
            });
            return;
        }

        setIsProcessing(true);

        try {
            // 2. Get Default Address
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

            // 3. Create Order
            // FIX: Map 'variant_id' from 'item.variantId' (if available) or fallback (but suspect 'id' is CartItemID)
            // The user snippet suggests 'item.variant_id'. Our store has 'variantId'.
            const payload = {
                shipping_address_id: Number(defaultAddr.address_id),
                payment_method_code: 'QR_BANK', // Default
                shipping_fee: 30000,
                // original_shipping_fee removed, calculated in backend
                items: selectedItems.map(i => ({
                    // VITAL FIX: Send the actual Product Variant ID, not the Cart Item ID
                    variant_id: i.variantId ? Number(i.variantId) : Number(i.id),
                    quantity: Number(i.quantity),
                    price: Number(i.price)
                }))
            };

            const orderRes = await api.post('/orders', payload);

            // 4. Clear Local Cart (Selected Items) & Navigate
            selectedItems.forEach(i => removeFromCart(i.id));

            navigate('/customer/checkout', { state: { orderId: orderRes.data.order_id } });

        } catch (error: any) {
            console.error("Failed to init order", error);
            toast({
                variant: "destructive",
                title: "Order Failed",
                description: error.response?.data?.message || "Failed to initiate order. Please try again."
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // ... render ...


    const toggleItem = (productId: string | number) => {
        setSelectedItemIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Helper: Toggle all items
    const toggleAll = () => {
        if (selectedItemIds.length === items.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(items.map(item => item.id));
        }
    };

    const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;

    // Calculate total only for SELECTED items
    const totalAmount = useMemo(() => {
        return items
            .filter(item => selectedItemIds.includes(item.id))
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [items, selectedItemIds]);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    if (items.length === 0) {
        return (
            <CustomerLayout activePage="cart">
                <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 text-center font-sans relative overflow-hidden">
                    {/* Ambient Background */}
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
                        <div className="flex-1 space-y-6">

                            {/* Select All Header */}
                            <div className="flex items-center gap-3 mb-4 px-4 pb-4 border-b border-slate-200/60">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={toggleAll}
                                    className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 border-slate-400 w-5 h-5 rounded-md"
                                />
                                <span className="font-medium text-slate-700">Select All ({items.length} items)</span>
                            </div>

                            {/* Cart Items */}
                            {items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="group bg-white/40 backdrop-blur-md p-4 rounded-[1.5rem] border border-white/40 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 items-center gpu-layer"
                                >
                                    {/* Selection Checkbox */}
                                    <Checkbox
                                        checked={selectedItemIds.includes(item.id)}
                                        onCheckedChange={() => toggleItem(item.id)}
                                        className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 border-slate-400 w-5 h-5 rounded-md flex-shrink-0"
                                    />

                                    {/* Image */}
                                    <div className="w-24 h-24 bg-white/50 rounded-xl overflow-hidden flex-shrink-0 border border-white/30 shadow-inner relative">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ShoppingBag className="w-8 h-8 opacity-50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg truncate pr-4 leading-tight">{item.name}</h3>
                                            {/* Assuming variant info might be part of name or separate field in future, for now using placeholder logic if needed, or derived from name */}
                                            <p className="text-sm text-slate-500">{item.name.includes('(') ? 'Model Selected' : 'Standard Edition'}</p>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            {/* Minimalist Quantity Stepper */}
                                            <div className="flex items-center border border-slate-300/60 rounded-full px-3 py-1 bg-white/40 h-8">
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
                                                    className="text-slate-500 hover:text-slate-900 px-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <span className="font-bold text-slate-900 text-lg">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete Action */}
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-white/50 rounded-full self-start -mt-2 -mr-2"
                                        title="Remove item"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
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
