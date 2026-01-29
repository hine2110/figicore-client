import CustomerLayout from '@/layouts/CustomerLayout';
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
    Eye,
    ShoppingCart,
    ChevronRight
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

    // Data States
    const [retailProducts, setRetailProducts] = useState<any[]>([]);
    const [preorderProducts, setPreorderProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({ walletBalance: 0, loyaltyPoints: 0, activeOrders: 0, rankCode: 'MEMBER' });

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                const [retailData, preorderData, statsData] = await Promise.all([
                    productsService.getProducts({ type_code: 'RETAIL', limit: 50 }),
                    productsService.getProducts({ type_code: 'PREORDER', limit: 50 }),
                    customersService.getDashboardStats()
                ]);

                const getList = (res: any) => Array.isArray(res) ? res : (res as any)?.data || [];
                const shuffle = (array: any[]) => {
                    const arr = [...array];
                    for (let i = arr.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                    }
                    return arr;
                };

                setRetailProducts(shuffle(getList(retailData)).slice(0, 6));
                setPreorderProducts(shuffle(getList(preorderData)).slice(0, 4));
                if (statsData) setStats(statsData);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Helpers
    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const getDisplayPrice = (product: any) => {
        const p = Number(product.product_variants?.[0]?.price || 0);
        return isNaN(p) ? 'Contact' : formatPrice(p);
    };

    const getPreorderDeposit = (product: any) => {
        const dep = Number(product.product_preorders?.deposit_amount || 0);
        return isNaN(dep) ? 'Contact' : formatPrice(dep);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const ProductCard = ({ product, isPreorder = false }: { product: any, isPreorder?: boolean }) => (
        <div
            className="group relative flex flex-col gap-3 cursor-pointer"
            onClick={() => navigate(`/customer/product/${product.product_id}`)}
        >
            {/* Glass Card Image */}
            <div className="aspect-[4/5] relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white/30 transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group-hover:-translate-y-2 group-hover:bg-white/60">
                {product.media_urls?.[0] ? (
                    <img
                        src={product.media_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-10 h-10" />
                    </div>
                )}

                {/* Badge */}
                {isPreorder ? (
                    <div className="absolute top-3 left-3">
                        <div className="bg-orange-500/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20">
                            PRE-ORDER
                        </div>
                    </div>
                ) : product.status_code === 'IN_STOCK' && (
                    <div className="absolute top-3 left-3">
                        <div className="bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20">
                            IN STOCK
                        </div>
                    </div>
                )}

                {/* Hover Actions */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center text-slate-800 shadow-lg hover:bg-white hover:scale-110 transition-all border border-white/50">
                        <Eye className="w-5 h-5" />
                    </button>
                    {!isPreorder &&
                        <button className="h-10 w-10 rounded-full bg-slate-900/80 backdrop-blur-xl flex items-center justify-center text-white shadow-lg hover:bg-slate-900 hover:scale-110 transition-all border border-white/10">
                            <ShoppingCart className="w-5 h-5" />
                        </button>
                    }
                </div>
            </div>

            {/* Content */}
            <div className="px-2 space-y-1">
                <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                    {product.brands?.name || 'FigiCore'}
                </div>
                <h3 className={`text-base font-medium leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-amber-500 transition-colors ${isPreorder ? 'text-white' : 'text-slate-800'}`}>
                    {product.name}
                </h3>
                <div className="text-lg font-semibold pt-1">
                    {isPreorder ? (
                        <span className="text-orange-500">
                            {getPreorderDeposit(product)} <span className="text-xs text-slate-500 font-normal">Deposit</span>
                        </span>
                    ) : (
                        <span className="text-slate-900/90">{getDisplayPrice(product)}</span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <CustomerLayout activePage="home">
            <div className="min-h-screen bg-[#F2F2F7] pb-20 font-sans relative overflow-hidden transition-colors duration-500">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-400/20 blur-[120px] rounded-full mix-blend-multiply animate-breathe gpu-accelerated" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-400/20 blur-[120px] rounded-full mix-blend-multiply animate-breathe gpu-accelerated" style={{ animationDuration: '10s' }} />
                </div>
                <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url(/noise.png)' }} />

                <div className="container mx-auto px-4 relative z-10 pt-8 max-w-7xl">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3"
                            >
                                <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-slate-200 text-slate-600 px-3 py-1 text-xs tracking-widest uppercase font-bold shadow-sm">
                                    {stats.rankCode} MEMBER
                                </Badge>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                                    {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.full_name?.split(' ')[0] || 'Collector'}</span>
                                </h1>
                                <p className="text-slate-500 text-lg font-light">Welcome back to your sanctuary.</p>
                            </motion.div>
                        </div>
                    </div>

                    {/* Stats Dashboard (Glass) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {[
                            { label: "Wallet Balance", value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.walletBalance), icon: Wallet, color: "text-blue-600", bg: "bg-blue-50/50", link: "/customer/wallet" },
                            { label: "Loyalty Points", value: `${stats.loyaltyPoints}`, unit: "pts", icon: Gift, color: "text-amber-600", bg: "bg-amber-50/50", link: "/customer/wallet" },
                            { label: "Active Orders", value: stats.activeOrders, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50/50", link: "/customer/orders" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                onClick={() => navigate(stat.link)}
                                className="relative overflow-hidden cursor-pointer group rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 transition-all duration-500 hover:shadow-[0_24px_64px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:bg-white/80"
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">{stat.label}</p>
                                        <h3 className="text-3xl font-bold text-slate-800 tracking-tight flex items-baseline gap-1">
                                            {stat.value}
                                            {stat.unit && <span className="text-lg text-slate-400 font-medium">{stat.unit}</span>}
                                        </h3>
                                    </div>
                                    <div className={`w-14 h-14 rounded-[1.2rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                        <stat.icon className="w-7 h-7" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="sticky top-28 space-y-8">
                                {/* Quick Actions */}
                                <div className="rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
                                    <h3 className="text-slate-900 font-bold mb-6 px-2">Quick Access</h3>
                                    <div className="space-y-2">
                                        {[
                                            { label: "My Collection", path: "/customer/orders", icon: Package },
                                            { label: "Wallet & Points", path: "/customer/wallet", icon: Wallet },
                                            { label: "Vouchers", path: "/customer/wallet", icon: Ticket },
                                            { label: "Live Auctions", path: "/customer/auctions", icon: Gavel },
                                        ].map((item, i) => (
                                            <button key={i} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white text-slate-600 hover:text-blue-600 transition-all group font-medium text-sm hover:shadow-md border border-transparent hover:border-white/50">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                {item.label}
                                                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Blindbox Banner */}
                                <div onClick={() => navigate('/customer/blindbox')} className="relative rounded-[2.5rem] overflow-hidden cursor-pointer group aspect-[4/5] shadow-2xl transition-all hover:scale-[1.02]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-fuchsia-900 transition-all duration-500" />
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white z-10">
                                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-500">
                                            <Sparkles className="w-8 h-8 text-fuchsia-300" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Blind Box</h3>
                                        <p className="text-fuchsia-100/80 text-sm mb-8 leading-relaxed">Feeling lucky? Unlock a mystery collectible today.</p>
                                        <Button className="bg-white text-fuchsia-900 hover:bg-fuchsia-50 rounded-full font-bold px-8 h-12 border-0 shadow-lg hover:shadow-xl transition-all">
                                            Reveal Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Feed */}
                        <div className="lg:col-span-3 space-y-20">
                            {/* New Arrivals */}
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold text-slate-900">New Arrivals</h2>
                                        <p className="text-slate-500 text-sm font-medium">Fresh drops straight to the shop.</p>
                                    </div>
                                    <Button variant="ghost" onClick={() => navigate('/customer/retail')} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                                        View All <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loading ? [1, 2, 3].map(i => <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white/40 animate-pulse border border-white/30" />) : retailProducts.map(p => <ProductCard key={p.product_id} product={p} />)}
                                </div>
                            </section>

                            {/* Pre-Order Center */}
                            <section className="relative rounded-[3rem] bg-[#0F0F12] p-8 md:p-12 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.2)]">
                                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="space-y-2">
                                            <Badge className="bg-orange-500 text-white border-0 hover:bg-orange-600 px-3 py-1">PRE-ORDER</Badge>
                                            <h2 className="text-3xl font-bold text-white tracking-tight">Upcoming Releases</h2>
                                            <p className="text-slate-400 text-sm">Secure your figures before they hit the shelves.</p>
                                        </div>
                                        <Button onClick={() => navigate('/customer/preorder')} className="bg-white text-slate-900 hover:bg-slate-200 rounded-full font-bold px-6 h-12">
                                            View Schedule
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {loading ? [1, 2, 3, 4].map(i => <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />) : preorderProducts.map(p => <ProductCard key={p.product_id} product={p} isPreorder={true} />)}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
