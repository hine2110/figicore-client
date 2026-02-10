import { useState, useEffect } from 'react';
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Clock,
    AlertTriangle,
    Package,
    Award,
    ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
                    <div className="w-12 h-12 border-4 border-neutral-200 border-t-cyan-600 rounded-full animate-spin"></div>
                    <p className="text-neutral-500 font-medium">Loading data...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Session Analytics</h1>
                <Card className="p-16 text-center bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <Clock className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900">No Active Session</h3>
                        <p className="text-neutral-600">Please open a session to view real-time analytics</p>
                        <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 mt-4">
                            Open Session
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const stats = analytics.statistics;
    const hourlyData = analytics.sales_by_hour || [];
    const paymentData = [
        { name: 'Cash', value: Number(analytics.payment_breakdown?.CASH?.amount || 0), color: '#10b981' },
        { name: 'Bank Transfer', value: Number(analytics.payment_breakdown?.BANK_TRANSFER?.amount || 0), color: '#3b82f6' },
        { name: 'Card', value: Number(analytics.payment_breakdown?.CARD?.amount || 0), color: '#8b5cf6' },
        { name: 'Wallet', value: Number(analytics.payment_breakdown?.WALLET?.amount || 0), color: '#f59e0b' },
    ].filter(item => item.value > 0); // Only show methods with sales

    // Map top products to match chart expected keys
    const topProducts = (analytics.top_products || []).slice(0, 5).map((item: any) => ({
        product_name: item.name,
        quantity: item.quantity,
        total_spent: item.revenue
    }));

    // Map low stock to match UI expected keys
    const lowStockAlerts = (analytics.low_stock_alerts || []).map((item: any) => ({
        product_name: item.product,
        sku: 'Low Stock', // Backend doesn't send SKU yet, placeholder
        current_stock: item.stock
    }));

    // Calculate average order value
    const avgOrderValue = stats.order_count > 0 ? stats.total_sales / stats.order_count : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Session Analytics</h1>
                    <p className="text-neutral-500 mt-1">Real-time sales monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-3 py-1 rounded-md border border-neutral-200 text-sm text-neutral-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Last updated: {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <Card className="shadow-sm border-l-4 border-l-cyan-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">
                            {Number(stats.total_sales).toLocaleString('vi-VN')}₫
                        </div>
                        <p className="text-xs text-green-600 flex items-center mt-1 font-bold">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            Session active
                        </p>
                    </CardContent>
                </Card>

                {/* Orders Card */}
                <Card className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                            Total Orders
                        </CardTitle>
                        <ShoppingCart className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">{stats.order_count}</div>
                        <p className="text-xs text-blue-600 flex items-center mt-1 font-bold">
                            {stats.sales_per_hour.toFixed(1)} orders/hour
                        </p>
                    </CardContent>
                </Card>

                {/* Avg Order Value Card */}
                <Card className="shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                            Avg Order Value
                        </CardTitle>
                        <TrendingUp className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">
                            {avgOrderValue.toLocaleString('vi-VN')}₫
                        </div>
                        <p className="text-xs text-purple-600 flex items-center mt-1 font-bold">
                            Per transaction average
                        </p>
                    </CardContent>
                </Card>

                {/* Session Duration Card */}
                <Card className="shadow-sm border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                            Session Time
                        </CardTitle>
                        <Clock className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">
                            {analytics.duration.hours}h {analytics.duration.minutes}m
                        </div>
                        <p className="text-xs text-amber-600 flex items-center mt-1 font-bold">
                            Currently active
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Hour */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Revenue by Hour</CardTitle>
                        <CardDescription>Sales trend throughout the day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={hourlyData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="hour"
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickFormatter={(value) => `${value}h`}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')}₫`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Payment Methods Breakdown */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Payment Methods</CardTitle>
                        <CardDescription>Breakdown by payment type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')}₫`}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Top Revenue Products</CardTitle>
                        <CardDescription>Top 5 products this session</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {topProducts.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg transition-colors border border-transparent hover:border-neutral-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${i === 0 ? 'bg-yellow-200 text-yellow-900 border border-yellow-400' :
                                                i === 1 ? 'bg-neutral-200 text-neutral-700' :
                                                    i === 2 ? 'bg-orange-200 text-orange-900 border border-orange-400' :
                                                        'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                #{i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-neutral-900 truncate max-w-[180px]" title={item.product_name}>
                                                    {item.product_name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-indigo-50 text-indigo-700 border-indigo-100">
                                                        {item.quantity} sold
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-sm text-neutral-900 block">
                                                {Number(item.total_spent).toLocaleString('vi-VN')}₫
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-neutral-400">
                                <div className="text-center">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No data available</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Low Stock Alerts
                        </CardTitle>
                        <CardDescription>Products running low</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {lowStockAlerts.length > 0 ? (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto">
                                {lowStockAlerts.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-sm text-neutral-900 truncate">
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs text-neutral-500">{item.sku}</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="ml-2 border-amber-500 text-amber-700 font-bold"
                                        >
                                            {item.current_stock} left
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-neutral-400">
                                <div className="text-center">
                                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
                                    <p>All products in stock</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
