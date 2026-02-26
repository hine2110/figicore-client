import { useEffect, useState } from 'react';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    ArrowRight,
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    Sparkles,
    ShieldCheck,
    History,
    ShoppingBag
} from 'lucide-react';
import { walletService } from '@/services/wallet.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/use-toast';
import { TopUpModal } from '@/components/customer/TopUpModal';

export default function CustomerWallet() {
    const { user } = useAuthStore();
    const { toast } = useToast();

    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);

    const fetchWallet = async () => {
        try {
            const data = await walletService.getMyWallet();
            setWallet(data);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to fetch wallet',
                description: error.response?.data?.message || 'Unknown error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [toast]);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const transactions = wallet?.wallet_transactions || [];
    const availableBalance = Number(wallet?.balance_available || 0);

    const loyaltyPoints = user?.customers?.loyalty_points || 0;
    const pointsValue = loyaltyPoints * 10;

    // Helper for transaction UI
    const getTxnVisuals = (type: string, amount: number) => {
        const t = type.toUpperCase();
        if (t === 'REFUND') return { icon: <RefreshCcw className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50 border-blue-100", label: "Refund" };
        if (t === 'TOPUP' || t === 'TOP_UP') return { icon: <ArrowDownLeft className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100", label: "Top Up" };
        if (amount < 0) return { icon: <ShoppingBag className="w-5 h-5 text-rose-500" />, bg: "bg-rose-50 border-rose-100", label: "Purchase" };
        return { icon: <ArrowDownLeft className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100", label: "Income" };
    };

    if (loading) {
        return (
            <CustomerLayout activePage="home">
                <div className="flex items-center justify-center min-h-screen bg-slate-50">
                    <div className="animate-spin w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full" />
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout activePage="home">
            <div className="bg-[#FAFAFA] min-h-screen pb-24 font-sans selection:bg-slate-900 selection:text-white">

                {/* Premium Header */}
                <div className="bg-white border-b border-slate-200/60 pt-12 pb-24 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-slate-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                                <WalletIcon className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Figi<span className="text-slate-400 font-light">Wallet</span></h1>
                        </div>
                        <p className="text-slate-500 text-lg max-w-md mt-2">Your digital sanctuary for easy payments, rewards, and seamless refunds.</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-16 sticky z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">

                        {/* THE PREMIUM WALLET CARD  */}
                        <Card className="lg:col-span-5 p-8 bg-gradient-to-br from-slate-900 via-[#1e2433] to-slate-900 text-white shadow-2xl shadow-slate-900/20 border-0 relative overflow-hidden rounded-3xl group">
                            {/* Card Glows */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            Active Balance
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-5xl font-light tracking-tight">{formatPrice(availableBalance)}</p>
                                        </div>
                                    </div>
                                    <div className="w-12 h-8 rounded-md border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center">
                                        <WalletIcon className="w-5 h-5 text-slate-300" />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => setShowTopUp(true)}
                                        className="flex-1 bg-white text-slate-900 hover:bg-slate-100 border-0 rounded-2xl h-12 font-bold shadow-lg shadow-white/10 transition-transform active:scale-95">
                                        <Plus className="w-5 h-5 mr-2" /> Top Up
                                    </Button>
                                    <Button className="flex-1 bg-white/10 text-white hover:bg-white/20 border-0 rounded-2xl h-12 font-medium backdrop-blur-md transition-transform active:scale-95">
                                        Withdraw
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* LOYALTY POINTS & REWARDS */}
                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Card className="p-8 border-slate-200/60 bg-white shadow-lg shadow-slate-200/20 flex flex-col justify-between rounded-3xl hover:border-amber-200 transition-colors group">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
                                        <Sparkles className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Figi Rewards</p>
                                    <p className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{loyaltyPoints.toLocaleString('vi-VN')} <span className="text-lg text-slate-400 font-medium">pts</span></p>
                                    <p className="text-sm text-slate-500 font-medium">≈ {formatPrice(pointsValue)} in value</p>
                                </div>
                                <Button variant="outline" className="w-full mt-8 rounded-2xl h-12 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold group-hover:border-amber-200">
                                    Redeem Points
                                </Button>
                            </Card>

                            <Card className="p-8 border-slate-200/60 bg-white shadow-lg shadow-slate-200/20 flex flex-col justify-between rounded-3xl hover:border-slate-300 transition-colors group">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-slate-100 transition-colors">
                                        <ArrowRight className="w-6 h-6 text-slate-700 -rotate-45" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">This Month Expenses</p>
                                    <p className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{formatPrice(0)}</p>
                                    <p className="text-sm text-slate-500 font-medium">Coming soon</p>
                                </div>
                                <Button variant="outline" className="w-full mt-8 rounded-2xl h-12 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold group-hover:border-slate-300">
                                    View Analytics
                                </Button>
                            </Card>
                        </div>
                    </div>

                    {/* REDESIGNED TRANSACTION HISTORY (List View) */}
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-400" />
                            Recent Transactions
                        </h2>
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 font-medium">
                            View All
                        </Button>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
                        {transactions.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                    <WalletIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">No transactions yet</h3>
                                <p className="text-slate-500 max-w-sm">Your wallet history is empty. Top up your balance or make a purchase to see activity here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {transactions.map((txn: any) => {
                                    const amount = Number(txn.amount);
                                    const isPositive = amount > 0;
                                    const visual = getTxnVisuals(txn.type_code, amount);

                                    return (
                                        <div key={txn.transaction_id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center gap-4 sm:gap-6">

                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${visual.bg}`}>
                                                {visual.icon}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-bold text-slate-900 truncate pr-4">{visual.label}</p>
                                                    <p className={`font-bold whitespace-nowrap ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {isPositive ? '+' : ''}{formatPrice(amount)}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <p className="text-slate-500 truncate pr-4">{txn.description || 'System transaction'}</p>
                                                    <p className="text-slate-400 whitespace-nowrap text-xs font-mono">{new Date(txn.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                                                        Completed
                                                    </Badge>
                                                    {txn.reference_code && (
                                                        <span className="text-[10px] font-mono text-slate-400">REF: {txn.reference_code}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TopUpModal
                open={showTopUp}
                onOpenChange={setShowTopUp}
                onSuccess={fetchWallet}
            />
        </CustomerLayout>
    );
}
