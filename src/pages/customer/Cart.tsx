import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerLayout from "@/layouts/CustomerLayout";
import { useCartStore } from "@/store/useCartStore";

export default function Cart() {
    const { items, total, updateQuantity, removeFromCart } = useCartStore();


    if (items.length === 0) {
        return (
            <CustomerLayout activePage="cart">
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag className="w-10 h-10 text-neutral-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
                    <p className="text-neutral-500 mb-8 max-w-sm">
                        Looks like you haven't added anything to your cart yet.
                    </p>
                    <Link to="/customer/shop">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                            Start Shopping
                        </Button>
                    </Link>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout activePage="cart">
            <div className="bg-neutral-50 min-h-screen py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-8">Shopping Cart</h1>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items */}
                        <div className="flex-1 space-y-4">
                            {items.map((item) => (
                                <div key={item.productId} className="bg-white p-4 rounded-xl border border-neutral-200 flex gap-6 items-center">
                                    <div className="w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-neutral-900 truncate mb-1">{item.name}</h3>
                                        <p className="text-blue-600 font-bold">${item.price.toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center border border-neutral-200 rounded-lg h-9">
                                            <button
                                                className="px-3 hover:bg-neutral-50 text-neutral-600 h-full disabled:opacity-50"
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                className="px-3 hover:bg-neutral-50 text-neutral-600 h-full"
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="text-neutral-400 hover:text-red-500 transition-colors p-2"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="w-full lg:w-96">
                            <div className="bg-white p-6 rounded-xl border border-neutral-200 sticky top-24">
                                <h3 className="font-bold text-lg text-neutral-900 mb-6">Order Summary</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Subtotal</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Shipping</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Tax (Estimate)</span>
                                        <span>${(total * 0.08).toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-neutral-100 my-4 pt-4 flex justify-between font-bold text-lg text-neutral-900">
                                        <span>Total</span>
                                        <span>${(total * 1.08).toFixed(2)}</span>
                                    </div>
                                </div>

                                <Link to="/customer/checkout">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg">
                                        Checkout <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>

                                <p className="text-xs text-neutral-400 text-center mt-4">
                                    Secure checkout powered by FigiCore.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
