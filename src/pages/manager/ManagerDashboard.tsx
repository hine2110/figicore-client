import React, { useState, useEffect } from "react";
import { 
    LayoutDashboard, DollarSign, ShoppingCart, Users, AlertTriangle,
    ArrowUpRight, ArrowDownRight, RefreshCcw, Search, Calendar,
    Globe, Store, PieChart, TrendingUp, Package, Zap, Gavel, Gift, Layout, 
    ShoppingBag, ChevronRight, Activity, Wallet, Award, CreditCard, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, Pie as RePie, Cell
} from "recharts";
import { dashboardService, ManagerStats, AnalyticsData } from "@/services/dashboard.service";
import { motion, AnimatePresence } from "framer-motion";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

// ── Components ────────────────────────────────────────────────────────────────

function GlassCard({ children, className, delay = 0 }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "relative overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-6 transition-all duration-500 hover:shadow-[0_24px_64px_rgba(0,0,0,0.06)] hover:-translate-y-1",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

function MainKpiCard({ title, value, growth, icon: Icon, gradient }: any) {
    return (
        <GlassCard className="group">
            <div className={cn("absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-10 blur-2xl transition-all duration-700 group-hover:scale-150", gradient)} />
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-4 rounded-2xl shadow-lg shadow-black/5", gradient)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {growth !== undefined && (
                    <Badge className={cn("rounded-full px-3 py-1 border-0", growth >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
                        {growth >= 0 ? "+" : "-"}{Math.abs(growth)}%
                    </Badge>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            </div>
        </GlassCard>
    );
}

function ChannelSummary({ title, data, isOffline = false }: { title: string, data: AnalyticsData, isOffline?: boolean }) {
    const stats = [
        { label: "Retail", val: data.revenue.retail, count: data.counts.retail, icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Live", val: data.revenue.livestream, count: data.counts.livestream, icon: Zap, color: "text-purple-500", bg: "bg-purple-50" },
        { label: "Pre-order", val: data.revenue.preorder, count: data.counts.preorder, icon: Package, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "Blindbox", val: data.revenue.blindbox, count: data.counts.blindbox, icon: Layout, color: "text-indigo-500", bg: "bg-indigo-50" },
    ];

    // Filter out 0 value stats if POS
    const filteredStats = isOffline ? stats.filter(s => s.label === 'Retail') : stats;

    return (
        <GlassCard className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", isOffline ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600")}>
                        {isOffline ? <Store className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </div>
                <Badge variant="outline" className="font-mono">{data.totalOrders} Transactions</Badge>
            </div>

            <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Total Cash Flow</span>
                        <span className="text-3xl font-black text-slate-900">{formatVND(data.totalRevenue)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-rose-400 font-bold uppercase tracking-tighter">Total Refunds</span>
                        <span className="text-lg font-bold text-rose-500">-{formatVND(data.totalRefunds || 0)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {filteredStats.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", s.bg, s.color)}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{s.label}</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{s.count} orders</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900">{formatVND(s.val)}</p>
                                <div className="h-1 w-24 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: data.totalRevenue > 0 ? `${(s.val / data.totalRevenue) * 100}%` : '0%' }}
                                        className={cn("h-full", s.color.replace('text', 'bg'))}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
}

export default function ManagerDashboard() {
    const { toast } = useToast();
    const [stats, setStats] = useState<ManagerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("week");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await dashboardService.getManagerStats(timeRange, startDate, endDate);
            setStats(data);
        } catch (error) {
            toast({ title: "System Error", description: "Deep engine analytics failed to synchronize", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const growth = stats ? Math.round(((stats.totalRevenue - stats.prevTotalRevenue) / (stats.prevTotalRevenue || 1)) * 100) : 0;

    const pieData = stats ? [
        { name: 'Online', value: stats.online.totalRevenue },
        { name: 'POS Store', value: stats.offline.totalRevenue }
    ] : [];

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] gap-6">
                <div className="relative">
                    <RefreshCcw className="w-12 h-12 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Synchronizing Reality...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FC] pb-20 space-y-10 animate-in fade-in duration-1000">
            {/* Header Area */}
            <div className="relative pt-8 px-4">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white shadow-xl shadow-indigo-500/10 rounded-2xl border border-indigo-50">
                                <Activity className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Real-time Business Intelligence • <span className="text-indigo-600">FigiCore HQ</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-white/80 shadow-sm">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-inner border border-slate-100">
                            <Input type="date" className="h-6 border-0 focus-visible:ring-0 w-28 text-[11px] p-0 font-bold text-slate-600" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span className="text-slate-300 text-xs">—</span>
                            <Input type="date" className="h-6 border-0 focus-visible:ring-0 w-28 text-[11px] p-0 font-bold text-slate-600" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-xl" onClick={fetchData}>
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />

                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px] h-10 bg-white border-0 shadow-sm rounded-2xl font-bold text-slate-600">
                                <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={fetchData} className="rounded-2xl h-10 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 gap-2 px-6">
                            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Sync
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 px-4">
                <MainKpiCard title="Total Cash Flow" value={formatVND(stats?.totalRevenue || 0)} growth={growth} icon={Wallet} gradient="bg-gradient-to-br from-indigo-500 to-blue-600" />
                <MainKpiCard title="Total Refunds" value={formatVND(stats?.totalRefunds || 0)} icon={RotateCcw} gradient="bg-gradient-to-br from-rose-500 to-red-600" />
                <MainKpiCard title="Delivered Volume" value={stats?.totalOrders} icon={ShoppingBag} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <MainKpiCard title="Staff On-Shift" value={stats?.activeStaff} icon={Users} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
                <MainKpiCard title="Inventory Alerts" value={stats?.lowStockAlerts} icon={AlertTriangle} gradient="bg-gradient-to-br from-orange-500 to-rose-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                {/* Revenue Streams Chart */}
                <GlassCard className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Stream Analysis</h3>
                            <p className="text-sm text-slate-400 font-medium italic">Cash inflow comparison: Online vs Physical POS</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">POS</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenueTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="chartOnline" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="chartOffline" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dx={-10} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: "none", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}
                                    formatter={(val: any) => [formatVND(val), ""]}
                                />
                                <Area type="monotone" dataKey="online" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#chartOnline)" animationDuration={1500} />
                                <Area type="monotone" dataKey="offline" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#chartOffline)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Performance Mix */}
                <GlassCard className="flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Channel Mix</h3>
                        <p className="text-sm text-slate-400 font-medium italic">Strategic contribution</p>
                    </div>

                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </RePie>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-800">{Math.round((stats?.online.totalRevenue || 0) / ((stats?.totalRevenue || 1)) * 100)}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online Share</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pieData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{formatVND(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Channel Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
                {stats && (
                    <>
                        <ChannelSummary title="Digital Ecosystem (Warehouse)" data={stats.online} />
                        <ChannelSummary title="Physical POS (Store)" data={stats.offline} isOffline={true} />
                    </>
                )}
            </div>

            {/* Quick Insights */}
            <div className="px-4">
                <GlassCard className="bg-slate-900 text-white border-0 shadow-2xl shadow-indigo-500/20 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32 transition-all duration-700 group-hover:scale-150" />
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                                <Award className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white tracking-tight">Business Intelligence Insight</h4>
                                <p className="text-indigo-200/70 font-medium">Your digital channels are currently generating <span className="text-white font-black underline decoration-indigo-500 underline-offset-4">{(stats?.online.totalRevenue || 0) > (stats?.offline.totalRevenue || 0) ? "more" : "less"}</span> revenue than physical store operations.</p>
                            </div>
                        </div>
                        <Button className="rounded-2xl px-8 h-14 bg-white text-slate-900 hover:bg-slate-100 font-black text-lg transition-transform hover:scale-105">
                            Export Strategy PDF
                        </Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
