import CustomerLayout from '@/layouts/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Wallet,
    Package,
    Gift,
    ArrowRight,
    Ticket,
    Gavel,
    Sparkles,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect } from 'react';
import { productsService } from '@/services/products.service';
import { customersService } from '@/services/customers.service';
import { motion } from 'framer-motion';

export default function CustomerHome() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Separate Data States
    const [retailProducts, setRetailProducts] = useState<any[]>([]);
    const [preorderProducts, setPreorderProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState<any>({ walletBalance: 0, loyaltyPoints: 0, activeOrders: 0, rankCode: 'MEMBER' });


    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                // Parallel Fetch
                const [retailData, preorderData, statsData] = await Promise.all([
                    productsService.getProducts({ type_code: 'RETAIL', limit: 3 }),
                    productsService.getProducts({ type_code: 'PREORDER', limit: 4 }),
                    customersService.getDashboardStats()
                ]);

                // Helper to extract list
                const getList = (res: any) => Array.isArray(res) ? res : (res as any)?.data || [];

                setRetailProducts(getList(retailData));
                setPreorderProducts(getList(preorderData));

                // Handle Stats
                if (statsData) setStats(statsData);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Price Helper Logic (Robust)
    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const getDisplayPrice = (product: any) => {
        const p = Number(product.product_variants?.[0]?.price || 0);
        return isNaN(p) ? '0 đ' : formatPrice(p);
    };

    const getPreorderDeposit = (product: any) => {
        const dep = Number(product.product_preorders?.deposit_amount || 0);
        return isNaN(dep) ? '0 đ' : formatPrice(dep);
    };

    // Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // --- ANIMATION VARIANTS ---
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const ProductCard = ({ product, dark = false }: { product: any, dark?: boolean }) => (
        <Card
            className={`group border-0 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col ${dark ? 'bg-neutral-800' : 'bg-white'}`}
            onClick={() => navigate(`/customer/product/${product.product_id}`)}
        >
            <div className="aspect-[3/3.5] relative bg-neutral-100 overflow-hidden">
                {product.media_urls?.[0] ? (
                    <img
                        src={product.media_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package className="w-10 h-10" /></div>
                )}
                {product.type_code === 'PREORDER' && (
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-orange-600 text-white border-0 text-[10px] tracking-wider uppercase">Pre-Order</Badge>
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1 ${dark ? 'text-neutral-400' : 'text-neutral-400'}`}>
                    {product.brands?.name || "FigiCore"}
                </div>
                <h3 className={`font-medium mb-2 truncate group-hover:text-amber-500 transition-colors ${dark ? 'text-white' : 'text-neutral-900'}`} title={product.name}>
                    {product.name}
                </h3>
                <div className="mt-auto pt-3 border-t border-dashed border-neutral-200/20 flex items-center justify-between">
                    {product.type_code === 'PREORDER' ? (
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold ${dark ? 'text-amber-500' : 'text-orange-600'}`}>
                                {getPreorderDeposit(product)} <span className="text-[10px] font-normal text-neutral-500">Deposit</span>
                            </span>
                        </div>
                    ) : (
                        <span className={`font-bold ${dark ? 'text-white' : 'text-neutral-900'}`}>
                            {getDisplayPrice(product)}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );

    return (
        <CustomerLayout activePage="home">
            <div className="bg-[#fcfcfc] min-h-screen pb-20 font-sans text-neutral-800">

                {/* --- HERO SECTION --- */}
                <div className="relative bg-white pt-12 pb-16 border-b border-neutral-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 relative z-10">
                        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-4">
                            <motion.div variants={itemVariants} className="flex items-center gap-3">
                                <Badge variant="secondary" className="bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 border-amber-200 px-3 py-1 text-xs font-semibold tracking-wider uppercase shadow-sm">
                                    {stats.rankCode}
                                </Badge>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <h1 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-900">
                                    {getGreeting()}, <span className="font-medium text-neutral-900">{user?.full_name?.split(' ')[0] || 'Collector'}</span>
                                </h1>
                                <p className="text-neutral-500 mt-2 text-lg font-light">Your sanctuary awaits. What will you discover today?</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-10 relative z-20">

                    {/* STATS DASHBOARD */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-2xl p-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-100"
                    >
                        {/* Use original stats markup here for consistency, omitted for brevity but keeping structure */}
                        <div className="p-6 flex items-center justify-between group hover:bg-white/50 transition-colors rounded-xl cursor-pointer" onClick={() => navigate('/customer/wallet')}>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                                <div className="text-2xl font-semibold text-neutral-900">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.walletBalance)}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
                        </div>
                        <div className="p-6 flex items-center justify-between group hover:bg-white/50 transition-colors rounded-xl cursor-pointer" onClick={() => navigate('/customer/wallet')}>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Loyalty Points</p>
                                <div className="text-2xl font-semibold text-neutral-900">{stats.loyaltyPoints} <span className="text-sm text-neutral-400">pts</span></div>
                            </div>
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><Gift className="w-5 h-5" /></div>
                        </div>
                        <div className="p-6 flex items-center justify-between group hover:bg-white/50 transition-colors rounded-xl cursor-pointer" onClick={() => navigate('/customer/orders')}>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Active Orders</p>
                                <div className="text-2xl font-semibold text-neutral-900">{stats.activeOrders}</div>
                            </div>
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Package className="w-5 h-5" /></div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">

                        {/* --- LEFT SIDEBAR --- */}
                        <div className="lg:col-span-1 space-y-6 sticky top-24 self-start">
                            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-4">Quick Access</h3>
                                <div className="space-y-1">
                                    {[
                                        { label: "My Collection", icon: Package, path: "/customer/orders" },
                                        { label: "Top Up Wallet", icon: Wallet, path: "/customer/wallet" },
                                        { label: "Redeem Rewards", icon: Ticket, path: "/customer/wallet" },
                                        { label: "Live Auctions", icon: Gavel, path: "/customer/auctions" },
                                    ].map((action, i) => (
                                        <button key={i} onClick={() => navigate(action.path)} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group">
                                            <action.icon className="w-4 h-4 text-neutral-400 group-hover:text-blue-500" />
                                            {action.label}
                                            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* --- MAIN CONTENT --- */}
                        <div className="lg:col-span-3 space-y-16">

                            {/* 1. NEW ARRIVALS (RETAIL) */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-light text-neutral-900">New Arrivals</h2>
                                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">Fresh from the studio</p>
                                    </div>
                                    <Button variant="ghost" className="text-neutral-500 hover:text-neutral-900" onClick={() => navigate('/customer/shop?type=RETAIL')}>
                                        View All <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                                {loading ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map(i => <div key={i} className="aspect-square bg-neutral-100 rounded-2xl animate-pulse" />)}</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {retailProducts.map(p => <ProductCard key={p.product_id} product={p} />)}
                                    </div>
                                )}
                            </div>

                            {/* 2. PRE-ORDER CENTER (DARK MODE BLOCK) */}
                            <div className="bg-neutral-900 rounded-3xl p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <Badge className="bg-amber-600 text-white border-0 mb-3">Priority Access</Badge>
                                            <h2 className="text-2xl font-serif">Pre-order Center</h2>
                                            <p className="text-neutral-400 text-sm mt-1">Secure future releases before anyone else.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {preorderProducts.map(p => <ProductCard key={p.product_id} product={p} dark={true} />)}
                                    </div>
                                </div>
                            </div>

                            {/* 3. MYSTERY / BLINDBOX DISCOVERY (Hidden Gem) */}
                            <div
                                className="relative rounded-3xl overflow-hidden cursor-pointer group"
                                onClick={() => navigate('/customer/shop?type=BLINDBOX')}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-900 to-fuchsia-900"></div>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>

                                <div className="relative z-10 px-8 py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <Sparkles className="w-8 h-8 text-fuchsia-300" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">Feeling Lucky?</h2>
                                    <p className="text-fuchsia-200 max-w-lg mx-auto text-lg mb-8">
                                        Some treasures are hidden for a reason. Unlock the mystery collection and see what specifically awaits you.
                                    </p>
                                    <Button className="bg-white text-fuchsia-900 hover:bg-fuchsia-50 rounded-full px-8 h-12 text-base font-bold shadow-lg group-hover:shadow-fuchsia-500/50 transition-all">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Reveal The Secret
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
