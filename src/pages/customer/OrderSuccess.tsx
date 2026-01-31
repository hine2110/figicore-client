import { useNavigate } from "react-router-dom";
import CustomerLayout from "@/layouts/CustomerLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag } from "lucide-react";

export default function OrderSuccess() {
    const navigate = useNavigate();

    return (
        <CustomerLayout activePage="home">
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-600" />

                    <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle className="w-12 h-12" />
                    </div>

                    <h1 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">Payment Successful!</h1>
                    <p className="text-neutral-500 mb-6 leading-relaxed">
                        Your order has been confirmed and is being processed.
                    </p>

                    <div className="bg-neutral-50 rounded-xl p-4 mb-8">
                        <p className="text-sm text-neutral-500">Thank you for shopping with FigiCore.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            className="w-full bg-neutral-900 hover:bg-black text-white h-12 rounded-xl text-md font-medium shadow-lg"
                            onClick={() => navigate('/customer/orders')}
                        >
                            View My Orders
                        </Button>
                        <Button variant="ghost" onClick={() => navigate('/customer/home')} className="w-full h-12 rounded-xl text-neutral-600 hover:bg-neutral-50 flex items-center justify-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> Continue Shopping
                        </Button>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
