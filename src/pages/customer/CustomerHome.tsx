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
    Gavel
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
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [stats, setStats] = useState<any>({ walletBalance: 0, loyaltyPoints: 0, activeOrders: 0, rankCode: 'MEMBER' });
    const [loadingStats, setLoadingStats] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                // Parallel Fetch
                const [productData, statsData] = await Promise.all([
                    productsService.getProducts({}),
                    customersService.getDashboardStats()
                ]);

                // Handle Products
                const list = Array.isArray(productData) ? productData : (productData as any)?.data || [];
                setProducts(list.slice(0, 8));

                // Handle Stats
                if (statsData) setStats(statsData);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoadingProducts(false);
                setLoadingStats(false);
            }
        };
        loadData();
    }, []);

    // Price Helper Logic
    const getDisplayPrice = (product: any) => {
        let price = 0;
        let prefix = "";
        if (product.type_code === 'BLINDBOX') {
            price = product.product_blindboxes?.[0]?.price || product.product_variants?.[0]?.price || 0;
        } else if (product.type_code === 'PREORDER') {
            price = product.product_preorders?.[0]?.deposit_amount || product.product_variants?.[0]?.price || 0;
            prefix = "Deposit: ";
        } else {
            price = product.product_variants?.[0]?.price || 0;
        }
        return `${prefix}${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}`;
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
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" as const }
        }
    };

    return (
        <CustomerLayout activePage="home">
            <div className="bg-[#fcfcfc] min-h-screen pb-20 font-sans text-neutral-800">

                {/* --- HERO SECTION --- */}
                <div className="relative bg-white pt-12 pb-16 border-b border-neutral-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />

                    <div className="container mx-auto px-4 relative z-10">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={containerVariants}
                            className="space-y-4"
                        >
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

                    {/* --- GLASSMORPHISM STATS DASHBOARD --- */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-2xl p-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-100"
                    >
                        {/* WALLET */}
                        <div className="p-6 flex items-center justify-between group hover:bg-white/50 transition-colors rounded-xl cursor-pointer" onClick={() => navigate('/customer/wallet')}>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                                {loadingStats ? (
                                    <div className="h-8 w-32 bg-neutral-200 rounded-md animate-pulse mt-1" />
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-2xl font-semibold text-neutral-900"
                                    >
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.walletBalance)}
                                    </motion.div>
                                )}
                            </div>
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>

                        {/* POINTS */}
                        <div className="p-6 flex items-center justify-between group hover:bg-white/50 transition-colors rounded-xl cursor-pointer" onClick={() => navigate('/customer/wallet')}>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Loyalty Points</p>
                                {loadingStats ? (
                                    <div className="h-8 w-24 bg-neutral-200 rounded-md animate-pulse mt-1" />
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="text-2xl font-semibold text-neutral-900"
                                    >
                                        {stats.loyaltyPoints} <span className="text-sm font-normal text-neutral-400">pts</span>
                                    </motion.div>
                                )}
                            </div>
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Gift className="w-5 h-5" />
                            </div>
                        </div>

                        {/* ORDERS */}
                        <div className="p-6 flex items-center justify-between group hover:bg-white/50 transition-colors rounded-xl cursor-pointer" onClick={() => navigate('/customer/orders')}>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Active Orders</p>
                                {loadingStats ? (
                                    <div className="h-8 w-16 bg-neutral-200 rounded-md animate-pulse mt-1" />
                                ) : (
                                    <div className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
                                        {stats.activeOrders}
                                        {stats.activeOrders > 0 && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                                    </div>
                                )}
                            </div>
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.div>


                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">

                        {/* --- SIDEBAR / QUICK ACTIONS --- */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-4">Quick Access</h3>
                                <div className="space-y-1">
                                    {[
                                        { label: "My Collection", icon: Package, path: "/customer/orders" },
                                        { label: "Top Up Wallet", icon: Wallet, path: "/customer/wallet" },
                                        { label: "Redeem Rewards", icon: Ticket, path: "/customer/wallet" },
                                        { label: "Live Auctions", icon: Gavel, path: "/customer/auctions" },
                                    ].map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => navigate(action.path)}
                                            className="w-full flex items-center gap-3 p-3 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group"
                                        >
                                            <action.icon className="w-4 h-4 text-neutral-400 group-hover:text-blue-500" />
                                            {action.label}
                                            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* PROMO CARD (Placeholder) */}
                            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                <div className="relative z-10">
                                    <div className="text-amber-300 text-xs font-bold uppercase mb-2">Member Exclusive</div>
                                    <h3 className="font-serif text-xl mb-4 leading-tight">Join the next Blindbox Drop</h3>
                                    <Button size="sm" variant="secondary" className="w-full bg-white text-indigo-900 hover:bg-indigo-50 border-0">View Calendar</Button>
                                </div>
                            </div>
                        </div>

                        {/* --- CURATED PRODUCTS GRID --- */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-light text-neutral-900">Curated Collection</h2>
                                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">Handpicked for you</p>
                                </div>
                                <Button variant="ghost" className="text-neutral-500 hover:text-neutral-900" onClick={() => navigate('/customer/shop')}>
                                    View All <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>

                            {loadingProducts ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="aspect-square bg-neutral-100 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {products.map((product) => (
                                        <motion.div key={product.product_id} variants={itemVariants}>
                                            <Card className="group border border-neutral-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col" onClick={() => navigate(`/customer/product/${product.product_id}`)}>
                                                <div className="aspect-square relative bg-neutral-50 overflow-hidden">
                                                    {product.media_urls?.[0] ? (
                                                        <img
                                                            src={product.media_urls[0]}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                            onError={(e) => (e.currentTarget.src = "")}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                            <Package className="w-10 h-10 opacity-20" />
                                                        </div>
                                                    )}

                                                    {/* Floating Badge */}
                                                    <div className="absolute top-3 left-3">
                                                        <Badge className={`border-0 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 backdrop-blur-md shadow-sm
                                                            ${product.type_code === 'BLINDBOX' ? "bg-purple-900/90 text-white" :
                                                                product.type_code === 'PREORDER' ? "bg-orange-600/90 text-white" :
                                                                    "bg-neutral-900/90 text-white"}`}>
                                                            {product.type_code}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1 line-clamp-1">
                                                        {product.brands?.name || product.brand?.name || "Unknown Brand"}
                                                    </div>
                                                    <h3 className="font-medium text-neutral-900 mb-2 truncate group-hover:text-blue-600 transition-colors text-base" title={product.name}>
                                                        {product.name}
                                                    </h3>
                                                    <div className="mt-auto pt-3 border-t border-neutral-50 flex items-center justify-between">
                                                        <p className="font-bold text-neutral-900">
                                                            {getDisplayPrice(product)}
                                                        </p>
                                                        {product.type_code === 'PREORDER' && (
                                                            <span className="text-[10px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
                                                                Pre-order
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {!loadingProducts && products.length === 0 && (
                                <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Package className="w-6 h-6 text-neutral-300" />
                                    </div>
                                    <h3 className="text-neutral-900 font-medium">Collection is Quiet</h3>
                                    <p className="text-neutral-500 text-sm mt-1">Check back soon for new arrivals.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
