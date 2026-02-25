import { useState, useEffect } from 'react';
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Clock,
    AlertTriangle,
    Package,
    Award,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
// Card imports removed as they are not used
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import { getSessionAnalytics } from '@/services/posService';
import { cn } from '@/lib/utils'; // Ensure cn is imported

export default function PosDashboard() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
        const interval = setInterval(loadAnalytics, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadAnalytics = async () => {
        try {
            const response = await getSessionAnalytics();
            setAnalytics(response.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-neutral-400 animate-spin" />
                    <p className="text-neutral-500 font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="max-w-md w-full text-center space-y-6 p-8 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-neutral-200 shadow-xl">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full flex items-center justify-center border border-indigo-100">
                        <Clock className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-2">No Active Session</h3>
                        <p className="text-neutral-500">Please open a new session in the Overview tab to start tracking sales.</p>
                    </div>
                    <Button className="w-full h-12 rounded-xl text-lg font-bold bg-neutral-900 hover:bg-neutral-800 shadow-lg shadow-neutral-900/20">
                        Start Session
                    </Button>
                </div>
            </div>
        );
    }

    const stats = analytics.statistics;
    const hourlyData = analytics.sales_by_hour || [];
    const paymentData = [
        { name: 'Cash', value: Number(analytics.payment_breakdown?.CASH?.amount || 0), color: '#10b981' },
        { name: 'Transfer', value: Number(analytics.payment_breakdown?.QR_BANK?.amount || 0), color: '#3b82f6' },
        { name: 'Card', value: Number(analytics.payment_breakdown?.CARD?.amount || 0), color: '#8b5cf6' },
        { name: 'Wallet', value: Number(analytics.payment_breakdown?.WALLET?.amount || 0), color: '#f59e0b' },
    ].filter(item => item.value > 0);

    const topProducts = (analytics.top_products || []).slice(0, 5).map((item: any) => ({
        product_name: item.name,
        quantity: item.quantity,
        total_spent: item.revenue
    }));

    const lowStockAlerts = (analytics.low_stock_alerts || []).map((item: any) => ({
        product_name: item.product,
        sku: 'LOW STOCK',
        current_stock: item.stock
    }));

    const avgOrderValue = stats.order_count > 0 ? stats.total_sales / stats.order_count : 0;

    return (
        <div className="space-y-4">
            <div className="space-y-4 pb-4 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex justify-between items-end mb-1">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Dashboard</h1>
                        <p className="text-neutral-500 font-medium mt-1">Real-time session overview</p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1.5 bg-white/50 backdrop-blur-sm border-neutral-200 text-neutral-500 gap-2 font-normal rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        Updated: {new Date().toLocaleTimeString()}
                    </Badge>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Revenue"
                        value={`${Number(stats.total_sales).toLocaleString('vi-VN')}₫`}
                        icon={DollarSign}
                        trend="Active"
                        color="text-cyan-600"
                        bg="bg-cyan-50"
                        border="border-cyan-100"
                    />
                    <KpiCard
                        title="Total Orders"
                        value={stats.order_count}
                        icon={ShoppingCart}
                        trend={`${stats.sales_per_hour.toFixed(1)} / hr`}
                        color="text-blue-600"
                        bg="bg-blue-50"
                        border="border-blue-100"
                    />
                    <KpiCard
                        title="Avg Order Value"
                        value={`${avgOrderValue.toLocaleString('vi-VN')}₫`}
                        icon={TrendingUp}
                        trend="Per transaction"
                        color="text-purple-600"
                        bg="bg-purple-50"
                        border="border-purple-100"
                    />
                    <KpiCard
                        title="Session Time"
                        value={`${analytics.duration.hours}h ${analytics.duration.minutes}m`}
                        icon={Clock}
                        trend="Running"
                        color="text-amber-600"
                        bg="bg-amber-50"
                        border="border-amber-100"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart (2/3 width) */}
                    <div className="lg:col-span-2 bg-white rounded-[2rem] border border-neutral-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <TrendingUp className="w-32 h-32 text-neutral-900" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg text-neutral-900 mb-1">Revenue Trend</h3>
                            <p className="text-sm text-neutral-500 mb-3">Hourly sales performance</p>

                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                        <XAxis
                                            dataKey="hour"
                                            stroke="#a3a3a3"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}h`}
                                        />
                                        <YAxis
                                            stroke="#a3a3a3"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid #f5f5f5',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }}
                                            cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
                                            formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')}₫`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#0891b2"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#0891b2' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods (1/3 width) */}
                    <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300">
                        <h3 className="font-bold text-lg text-neutral-900 mb-1">Payment Methods</h3>
                        <p className="text-sm text-neutral-500 mb-2">Distribution by type</p>

                        <div className="flex-1 min-h-[180px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')}₫`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-sm font-medium text-neutral-600 ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Total */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                                <div className="text-center">
                                    <p className="text-xs text-neutral-400 font-medium uppercase">Total</p>
                                    <p className="text-lg font-bold text-neutral-900">{stats.order_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-neutral-900">Top Performers</h3>
                                <p className="text-sm text-neutral-500">Highest revenue products</p>
                            </div>
                            <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full">Top 5</Badge>
                        </div>

                        <div className="space-y-4">
                            {topProducts.length > 0 ? (
                                topProducts.map((item: any, i: number) => (
                                    <div key={i} className="group flex items-center justify-between p-3 hover:bg-neutral-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-neutral-100">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-110",
                                                i === 0 ? "bg-amber-100 text-amber-700" :
                                                    i === 1 ? "bg-neutral-200 text-neutral-600" :
                                                        i === 2 ? "bg-orange-100 text-orange-700" :
                                                            "bg-indigo-50 text-indigo-600"
                                            )}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-neutral-900 line-clamp-1 max-w-[200px]" title={item.product_name}>
                                                    {item.product_name}
                                                </p>
                                                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                                                    {item.quantity} units sold
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="font-bold text-neutral-900 border-neutral-200 bg-white shadow-sm">
                                                {Number(item.total_spent).toLocaleString('vi-VN')}₫
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-neutral-400 flex flex-col items-center">
                                    <Package className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No sales data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <AlertTriangle className="w-32 h-32 text-amber-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                                        Stock Alerts
                                    </h3>
                                    <p className="text-sm text-neutral-500">Inventory attention needed</p>
                                </div>
                                {lowStockAlerts.length > 0 && (
                                    <Badge variant="destructive" className="rounded-full px-3 animate-pulse">
                                        {lowStockAlerts.length} Issues
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {lowStockAlerts.length > 0 ? (
                                    lowStockAlerts.map((item: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-2xl hover:bg-amber-50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-neutral-900 truncate max-w-[180px]">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wide">
                                                        {item.sku}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-white text-amber-700 border border-amber-200 shadow-sm font-bold">
                                                {item.current_stock} Left
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-neutral-400 flex flex-col items-center">
                                        <Award className="w-12 h-12 mb-3 opacity-20 text-emerald-500" />
                                        <p className="text-emerald-600 font-medium">Inventory Healthy</p>
                                        <p className="text-xs">No low stock items detected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KpiCard({ title, value, icon: Icon, trend, color, bg, border }: any) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-[2rem] p-6 border transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
            "bg-white hover:bg-opacity-100", // Glass effect fallback
            border
        )}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 opacity-10 blur-2xl", bg)}></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-2xl", bg)}>
                        <Icon className={cn("w-6 h-6", color)} />
                    </div>
                    {trend && (
                        <Badge variant="outline" className={cn("bg-white/80 backdrop-blur-sm border-transparent shadow-sm font-medium", color)}>
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            {trend}
                        </Badge>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</h3>
                </div>
            </div>
        </div>
    );
}
