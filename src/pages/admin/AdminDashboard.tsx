import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users, DollarSign, ArrowUpRight, ShieldAlert, Activity, Radio, Gavel, Video,
    TrendingUp, PieChart as PieIcon, History, ShieldCheck, AlertCircle, Calendar,
    Search, RefreshCw, ChevronRight, Loader2, Store, ShoppingBag, Truck, PackageOpen
} from "lucide-react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Legend
} from "recharts";
import { motion, Variants } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// --- API FETCHERS ---
const fetchManagerStats = async (range: string, start?: string, end?: string) => {
    let url = `/dashboard/manager-stats?range=${range}`;
    if (start && end) url += `&startDate=${start}&endDate=${end}`;
    const res = await api.get(url);
    return res.data;
};


// --- HELPERS ---
const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(val);

export default function AdminDashboard() {
    const navigate = useNavigate();
    
    // --- STATE ---
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const defaultStart = new Date(y, m, 1).toLocaleDateString('en-CA');
    const defaultEnd = new Date(y, m + 1, 1).toLocaleDateString('en-CA');

    const [timeRange, setTimeRange] = useState("month");
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    // --- QUERIES ---
    const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({ 
        queryKey: ['admin_manager_stats', timeRange, startDate, endDate], 
        queryFn: () => fetchManagerStats(timeRange, startDate, endDate), 
        refetchInterval: 15 * 60 * 1000 
    });


    // --- HANDLERS ---
    const handleTimeRangeChange = (value: string) => {
        setTimeRange(value);
        setStartDate("");
        setEndDate("");
    };

    const handleSearchDates = () => {
        if (startDate && endDate) {
            refetchStats();
        }
    };

    const handlePrint = () => window.print();


    const globalRevenue = (stats?.online?.totalRevenue || 0) + (stats?.offline?.totalRevenue || 0);
    const prevGlobalRevenue = (stats?.previous?.online?.totalRevenue || 0) + (stats?.previous?.offline?.totalRevenue || 0);
    
    const globalOrders = (stats?.online?.totalOrders || 0) + (stats?.offline?.totalOrders || 0);
    const prevGlobalOrders = (stats?.previous?.online?.totalOrders || 0) + (stats?.previous?.offline?.totalOrders || 0);

    const netShipping = (stats?.online?.shippingCollected || 0) - (stats?.online?.shippingPaid || 0);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    if (loadingStats && !stats) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-neutral-50/50 p-8 space-y-8 animate-in fade-in duration-500 font-outfit">
            {/* ── HEADER ── */}
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2 print:hidden">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Activity className="w-3 h-3 mr-1.5" /> System Live
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-neutral-500 font-medium">System operations and performance overview</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        <Input type="date" className="h-9 border-0 focus-visible:ring-0 w-36 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <span className="text-neutral-300">-</span>
                        <Input type="date" className="h-9 border-0 focus-visible:ring-0 w-36 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600" onClick={handleSearchDates}>
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>
                    <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                        <SelectTrigger className="w-[140px] h-11 bg-white border-neutral-200 shadow-sm">
                            <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetchStats()} className="bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600 h-11 px-5 rounded-xl shadow-sm transition-all active:scale-95">
                        <RefreshCw className={cn("w-4 h-4 mr-2", loadingStats && "animate-spin")} /> Refresh
                    </Button>
                </div>
            </header>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                {/* ── GLOBAL KPI ROW ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        label="Total System Revenue"
                        value={formatVND(globalRevenue)}
                        icon={DollarSign}
                        trend={prevGlobalRevenue > 0 ? `${((globalRevenue - prevGlobalRevenue)/prevGlobalRevenue * 100).toFixed(1)}% vs prev` : "Accumulated"}
                        color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100"
                    />
                    <KpiCard
                        label="Total System Orders"
                        value={globalOrders.toLocaleString()}
                        icon={PackageOpen}
                        trend={prevGlobalOrders > 0 ? `${((globalOrders - prevGlobalOrders)/prevGlobalOrders * 100).toFixed(1)}% vs prev` : "Processed"}
                        color="text-blue-600" bg="bg-blue-50" border="border-blue-100"
                    />
                    <KpiCard
                        label="Active Staff / POS"
                        value={stats?.system?.activeStaff || 0}
                        icon={Users}
                        trend="Active personnel"
                        color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100"
                    />
                    <KpiCard
                        label="Low Stock Alerts"
                        value={stats?.system?.lowStockAlerts || 0}
                        icon={AlertCircle}
                        trend="Restock needed immediately"
                        color="text-rose-600" bg="bg-rose-50" border="border-rose-100" active={stats?.system?.lowStockAlerts > 0}
                    />
                </div>

                {/* ── SPLIT VIEW: OFFLINE VS ONLINE ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* OFFLINE (POS) */}
                    <Card className="border-0 shadow-md rounded-[2rem] bg-gradient-to-br from-white to-neutral-50/50 overflow-hidden relative">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none -translate-y-1/2 translate-x-1/2" />
                        <CardHeader className="p-8 pb-4 relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="bg-amber-100 text-amber-700 border-none mb-3 pointer-events-none uppercase font-black tracking-widest text-[10px]">In-Store</Badge>
                                    <CardTitle className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                                        <Store className="w-6 h-6 text-amber-500" /> POS Operations
                                    </CardTitle>
                                    <CardDescription className="text-neutral-500 font-medium mt-1">Direct in-store sales revenue</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 relative z-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">POS Revenue</p>
                                    <p className="text-2xl font-black text-amber-600">{formatVND(stats?.offline?.totalRevenue || 0)}</p>
                                </div>
                                <div className="p-5 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">POS Orders</p>
                                    <p className="text-2xl font-black text-neutral-900">{(stats?.offline?.totalOrders || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
                                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">Retail Breakdown</h4>
                                <div className="flex justify-between items-center text-sm font-bold text-neutral-700">
                                    <span>Standard Retail</span>
                                    <span>{formatVND(stats?.offline?.revenue?.retail || 0)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ONLINE (WAREHOUSE) */}
                    <Card className="border-0 shadow-md rounded-[2rem] bg-gradient-to-bl from-white to-neutral-50/50 overflow-hidden relative">
                        <div className="absolute left-0 top-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none -translate-y-1/2 -translate-x-1/2" />
                        <CardHeader className="p-8 pb-4 relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="bg-indigo-100 text-indigo-700 border-none mb-3 pointer-events-none uppercase font-black tracking-widest text-[10px]">E-Commerce</Badge>
                                    <CardTitle className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                                        <ShoppingBag className="w-6 h-6 text-indigo-500" /> Online Operations
                                    </CardTitle>
                                    <CardDescription className="text-neutral-500 font-medium mt-1">Multi-platform online sales revenue</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 relative z-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Online Revenue</p>
                                    <p className="text-2xl font-black text-indigo-600">{formatVND(stats?.online?.totalRevenue || 0)}</p>
                                </div>
                                <div className="p-5 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Online Orders</p>
                                    <p className="text-2xl font-black text-neutral-900">{(stats?.online?.totalOrders || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            {/* Shipping Mini Audit */}
                            <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5" /> Shipping Economics
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase">Collected</p>
                                        <p className="text-sm font-black text-neutral-700">{formatVND(stats?.online?.shippingCollected || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-rose-500 uppercase">Paid to GHN</p>
                                        <p className="text-sm font-black text-rose-600">- {formatVND(stats?.online?.shippingPaid || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase">Net Profit/Loss</p>
                                        <p className={cn("text-sm font-black", netShipping >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {netShipping >= 0 ? '+' : '-'} {formatVND(Math.abs(netShipping))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── REVENUE TREND CHART ── */}
                <Card className="bg-white border-neutral-200 shadow-sm rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Revenue Trajectory (Online vs Offline)
                        </CardTitle>
                        <CardDescription className="text-neutral-500 font-medium">Revenue comparison across sales channels</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[360px] p-8 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenueTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373', fontWeight: 500 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a3a3a3', fontWeight: 500 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                <Tooltip 
                                    formatter={(val: any) => formatVND(val)}
                                    contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Area type="monotone" name="Online Revenue" dataKey="online" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOnline)" activeDot={{ r: 6 }} />
                                <Area type="monotone" name="POS Revenue" dataKey="offline" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorOffline)" activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>


            </motion.div>
        </div>
    );
}

function KpiCard({ label, value, icon: Icon, trend, active, color, bg, border }: any) {
    return (
        <Card className={cn("bg-white border relative overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 rounded-[2.2rem]", border)}>
            <CardContent className="p-6 relative">
                <div className={cn("absolute right-[-10px] top-[-10px] w-24 h-24 blur-3xl opacity-10 rounded-full", bg)} />
                <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className={cn("p-3 rounded-2xl shadow-sm border border-white transition-transform group-hover:scale-110 group-hover:rotate-3", bg)}>
                        <Icon className={cn("w-5 h-5", color)} />
                    </div>
                    {active && (
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase tracking-tighter shadow-sm flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Action Needed
                        </Badge>
                    )}
                </div>
                <div className="space-y-1 relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
                    <div className="flex flex-col gap-1">
                        <h4 className="text-2xl font-black text-neutral-900 tracking-tight">{value}</h4>
                        {trend && <span className="text-[10px] font-bold text-neutral-400 italic">{trend}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
