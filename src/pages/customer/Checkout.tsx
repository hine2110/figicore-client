import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, CreditCard, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerLayout from "@/layouts/CustomerLayout";
import { useCartStore } from "@/store/useCartStore";

export default function Checkout() {
    const { total, clearCart } = useCartStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'form' | 'success'>('form');

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            setStep('success');
            clearCart();
        }, 2000);
    };

    if (step === 'success') {
        return (
            <CustomerLayout activePage="checkout">
                <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Order Placed Successfully!</h1>
                        <p className="text-neutral-500 mb-8">
                            Thank you for your purchase. Your order #FC-{Math.floor(Math.random() * 10000)} has been confirmed.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => navigate('/customer/orders')} className="w-full bg-blue-600 text-white">
                                View My Orders
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/customer/home')} className="w-full">
                                Back to Home
                            </Button>
                        </div>
                    </div>
                </div>
            </CustomerLayout>
        )
    }

    return (
        <CustomerLayout activePage="checkout">
            <div className="bg-neutral-50 min-h-screen py-8">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="mb-6">
                        <Link to="/customer/cart" className="text-neutral-500 hover:text-neutral-900 flex items-center gap-2 text-sm font-medium">
                            <ArrowLeft className="w-4 h-4" /> Back to Cart
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <form onSubmit={handlePlaceOrder} className="space-y-8">

                                {/* Shipping Address */}
                                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                                        <h2 className="text-xl font-bold text-neutral-900">Shipping Address</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-700">First name</label>
                                            <input type="text" required className="w-full px-3 py-2 border rounded-lg" placeholder="John" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-700">Last name</label>
                                            <input type="text" required className="w-full px-3 py-2 border rounded-lg" placeholder="Doe" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-neutral-700">Address</label>
                                            <input type="text" required className="w-full px-3 py-2 border rounded-lg" placeholder="123 Main St" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-700">City</label>
                                            <input type="text" required className="w-full px-3 py-2 border rounded-lg" placeholder="New York" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-neutral-700">Postal Code</label>
                                            <input type="text" required className="w-full px-3 py-2 border rounded-lg" placeholder="10001" />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                                        <h2 className="text-xl font-bold text-neutral-900">Payment Method</h2>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-4 p-4 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer">
                                            <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-blue-600" />
                                            <div className="flex items-center justify-between flex-1">
                                                <span className="font-medium text-neutral-900 flex items-center gap-2">
                                                    <Wallet className="w-4 h-4" /> FigiWallet (Balance: $2,450.00)
                                                </span>
                                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">RECOMMENDED</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg cursor-pointer">
                                            <input type="radio" name="payment" className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-neutral-900 flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" /> Credit Card
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg cursor-pointer">
                                            <input type="radio" name="payment" className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-neutral-900 flex items-center gap-2">
                                                <Truck className="w-4 h-4" /> Cash on Delivery
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <Button type="submit" size="lg" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700" disabled={isProcessing}>
                                    {isProcessing ? "Processing Order..." : `Pay $${(total * 1.08).toFixed(2)}`}
                                </Button>
                            </form>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div>
                            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm sticky top-6">
                                <h3 className="font-bold text-lg text-neutral-900 mb-4">Order Summary</h3>
                                <div className="space-y-3 text-sm text-neutral-600 mb-6 pb-6 border-b border-neutral-100">
                                    <div className="flex justify-between">
                                        <span>Items Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span className="text-green-600">Free</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span>${(total * 0.08).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between font-bold text-xl text-neutral-900">
                                    <span>Total</span>
                                    <span>${(total * 1.08).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
