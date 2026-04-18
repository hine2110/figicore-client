import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    DollarSign,
    ArrowUpRight,
    ShieldAlert,
    Activity,
    Radio,
    Gavel,
    Video,
    TrendingUp,
    PieChart as PieIcon,
    History,
    ShieldCheck,
    AlertCircle,
    Calendar,
    Search,
    RefreshCw,
    ChevronRight,
    Loader2
} from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { motion, Variants } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- API FETCHERS ---
const fetchSummaryStats = async () => {
    const res = await api.get('/dashboard/summary-stats');
    return res.data;
};

const fetchRevenueChart = async () => {
    const res = await api.get('/dashboard/revenue-chart');
    return res.data;
};

const fetchRecentActivity = async () => {
    const res = await api.get('/dashboard/recent-activity');
    return res.data;
};

// --- CONSTANTS ---
const CHART_SERIES = [
    { key: 'retail',     label: 'Bán Lẻ',      color: '#10b981' }, // emerald
    { key: 'livestream', label: 'Livestream',   color: '#f97316' }, // orange
    { key: 'preorder',   label: 'Pre-order',    color: '#6366f1' }, // indigo
    { key: 'blindbox',   label: 'Blind Box',    color: '#a855f7' }, // purple
    { key: 'auction',    label: 'Đấu Giá',      color: '#f43f5e' }, // rose
];

// --- HELPERS ---
const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(val);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
    return (
        <div className="bg-white/90 border border-neutral-100 rounded-2xl p-4 shadow-xl backdrop-blur-md min-w-[200px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex justify-between items-center gap-6 mb-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                        <span className="text-xs font-medium text-neutral-600">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-900">{formatVND(p.value)}</span>
                </div>
            ))}
            <div className="border-t border-neutral-100 mt-2 pt-2 flex justify-between">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Tổng cộng</span>
                <span className="text-xs font-bold text-neutral-900">{formatVND(total)}</span>
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({ 
        queryKey: ['admin_dashboard_summary'], 
        queryFn: fetchSummaryStats, 
        refetchInterval: 15 * 60 * 1000 // 15 mins for heavy stats
    });
    
    const { data: chartData, isLoading: loadingChart } = useQuery({ 
        queryKey: ['admin_dashboard_chart'], 
        queryFn: fetchRevenueChart 
    });

    const { data: activity, isLoading: loadingActivity } = useQuery({
        queryKey: ['admin_dashboard_activity'],
        queryFn: fetchRecentActivity,
        refetchInterval: 60 * 1000 // 1 min for activity logs
    });

    // Filter activity based on search query
    const filteredActivity = useMemo(() => {
        if (!activity) return [];
        if (!searchQuery) return activity;
        const lowQuery = searchQuery.toLowerCase();
        return activity.filter((log: any) => 
            log.user.toLowerCase().includes(lowQuery) || 
            log.email.toLowerCase().includes(lowQuery) ||
            log.ip.toLowerCase().includes(lowQuery)
        );
    }, [activity, searchQuery]);

    const handlePrint = () => {
        window.print();
    };

    const pieData = CHART_SERIES.map(series => ({
        name: series.label,
        value: chartData?.reduce((acc: number, cur: any) => acc + (cur[series.key] || 0), 0) || 0,
        color: series.color
    })).filter(d => d.value > 0);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 15, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
    };

    return (
        <div className="min-h-full bg-neutral-50/50 p-8 space-y-8 animate-in fade-in duration-500 font-outfit">
            {/* Header section - Style identical to POS/Manager */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 print:hidden">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Activity className="w-3 h-3 mr-1.5" /> System Live
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-neutral-500 font-medium">Toàn cảnh vận hành và hiệu suất hệ thống</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => refetchSummary()} className="bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600 gap-2 h-11 px-5 rounded-xl shadow-sm italic transition-all active:scale-95">
                        <RefreshCw className={cn("w-4 h-4", loadingSummary && "animate-spin")} /> Refresh
                    </Button>
                    <Button onClick={handlePrint} className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/10 h-11 px-6 rounded-xl font-bold transition-all active:scale-95">
                        Download Report
                    </Button>
                </div>
            </header>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    <KpiCard
                        label="Lưu Lượng (VND)"
                        value={loadingSummary ? '---' : formatVND(summary?.totalRevenue || 0)}
                        icon={DollarSign}
                        trend={summary?.totalRevenue > 0 ? "Tổng tích lũy" : "Chưa có phát sinh"}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                        border="border-emerald-100"
                    />
                    <KpiCard
                        label="Users Online"
                        value={loadingSummary ? '---' : summary?.activeUsers || 0}
                        icon={Users}
                        trend="Hoạt động thực tế"
                        color="text-blue-600"
                        bg="bg-blue-50"
                        border="border-blue-100"
                    />
                    <KpiCard
                        label="Đấu Giá Live"
                        value={loadingSummary ? '---' : summary?.activeAuctions || 0}
                        icon={Gavel}
                        active={summary?.activeAuctions > 0}
                        color="text-rose-600"
                        bg="bg-rose-50"
                        border="border-rose-100"
                    />
                    <KpiCard
                        label="Livestream Live"
                        value={loadingSummary ? '---' : summary?.activeLivestreams || 0}
                        icon={Video}
                        active={summary?.activeLivestreams > 0}
                        color="text-orange-600"
                        bg="bg-orange-50"
                        border="border-orange-100"
                    />
                    <KpiCard
                        label="Yêu Cầu Chờ"
                        value={loadingSummary ? '---' : summary?.pendingIssues || 0}
                        icon={AlertCircle}
                        trend={summary?.pendingIssues > 0 ? "Cần xử lý" : "Đã hoàn thành"}
                        color="text-amber-600"
                        bg="bg-amber-50"
                        border="border-amber-100"
                    />
                    <KpiCard
                        label="Status Hệ Thống"
                        value={loadingSummary ? '---' : `${summary?.systemHealth || 99.9}%`}
                        icon={Activity}
                        color="text-cyan-600"
                        bg="bg-cyan-50"
                        border="border-cyan-100"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-white border-neutral-200 shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    Revenue Trajectory
                                </CardTitle>
                                <CardDescription className="text-neutral-500 font-medium">Biến động doanh thu 7 ngày qua</CardDescription>
                            </div>
                            <Button variant="ghost" onClick={() => navigate('/admin/orders')} className="text-xs font-bold text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl group/btn transition-all">
                                View Detail <ChevronRight className="w-3 h-3 ml-1 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="h-[360px] p-8 pt-4">
                            {loadingChart ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-widest italic">Syncing metrics...</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart 
                                        data={(chartData || []).map((d: any) => ({
                                            ...d,
                                            total: d.retail + d.livestream + d.preorder + d.blindbox + d.auction
                                        }))} 
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373', fontWeight: 500 }} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a3a3a3', fontWeight: 500 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                        <Tooltip 
                                            content={({ active, payload, label }: any) => {
                                                if (!active || !payload?.length) return null;
                                                return (
                                                    <div className="bg-white/90 border border-neutral-100 rounded-2xl p-3 shadow-xl backdrop-blur-md">
                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">{label}</p>
                                                        <p className="text-sm font-black text-emerald-600">{formatVND(payload[0].value)}</p>
                                                        <p className="text-[10px] text-neutral-400 font-medium">Tổng doanh thu</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="total" 
                                            stroke="#10b981" 
                                            strokeWidth={4}
                                            fillOpacity={1} 
                                            fill="url(#colorTotal)"
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Segment Pie Chart */}
                    <Card className="bg-white border-neutral-200 shadow-sm rounded-[2rem] overflow-hidden flex flex-col hover:shadow-md transition-all">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                <PieIcon className="w-5 h-5 text-indigo-500" />
                                Marketplace Distribution
                            </CardTitle>
                            <CardDescription className="text-neutral-500 font-medium">Tỷ trọng doanh thu hiện tại</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-8 pt-4">
                            <div className="flex-1 h-[260px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={70} outerRadius={95} paddingAngle={6} dataKey="value" stroke="none">
                                            {pieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => formatVND(v)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Revenue</p>
                                        <p className="text-xl font-black text-neutral-900 leading-none mt-1">100%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 mt-6">
                                {pieData.map((d: any) => (
                                    <div key={d.name} className="flex items-center justify-between text-xs font-bold p-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="text-neutral-500 font-medium">{d.name}</span>
                                        </div>
                                        <span className="text-neutral-900">{((d.value / pieData.reduce((a: number, b: any) => a + b.value, 0)) * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lower Row: Activity & Clearances */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Activity Table - Professional White Table */}
                    <Card className="xl:col-span-3 bg-white border-neutral-200 shadow-sm rounded-[2rem] overflow-hidden group">
                        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-neutral-400" />
                                    Security & Access Logs
                                </CardTitle>
                                <CardDescription className="text-neutral-500 font-medium">Nhật ký truy cập hệ thống thời gian thực</CardDescription>
                            </div>
                            <div className="relative hidden sm:block">
                                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search telemetry logs..." 
                                    className="bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 w-64 transition-all" 
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto px-8 pb-8">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                                            <th className="px-4 py-6 text-left">Người dùng</th>
                                            <th className="px-4 py-6 text-left text-center">Vai trò</th>
                                            <th className="px-4 py-6 text-left">IP Address</th>
                                            <th className="px-4 py-6 text-left">Timestamp</th>
                                            <th className="px-4 py-6 text-right">Integrity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-50">
                                        {loadingActivity ? (
                                            <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-200" /></td></tr>
                                        ) : filteredActivity.length > 0 ? (
                                            filteredActivity.map((log: any, idx: number) => (
                                                <tr key={idx} className="group hover:bg-neutral-50/50 transition-all">
                                                    <td className="px-4 py-5 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-400 group-hover:bg-neutral-200 transition-colors">
                                                            {log.user.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-neutral-900 group-hover:text-neutral-900">{log.user}</div>
                                                            <div className="text-[11px] text-neutral-400 font-medium">{log.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-center">
                                                        <Badge variant="outline" className="bg-white border-neutral-200 text-neutral-500 rounded-lg font-bold text-[10px] uppercase h-6 px-2">{log.role}</Badge>
                                                    </td>
                                                    <td className="px-4 py-5 font-mono text-[11px] text-neutral-400 font-medium">{log.ip}</td>
                                                    <td className="px-4 py-5 text-[11px] text-neutral-500 font-medium italic">{log.login_time}</td>
                                                    <td className="px-4 py-5 text-right">
                                                        <Badge className={cn("rounded-full px-3 text-[10px] font-bold border-none", log.is_suspicious ? "bg-rose-50 text-rose-600 shadow-sm" : "bg-emerald-50 text-emerald-600 shadow-sm ")}>
                                                            <ArrowUpRight className={cn("w-3 h-3 mr-1", log.is_suspicious && "rotate-90")} />
                                                            {log.is_suspicious ? 'RISK' : 'SECURE'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={5} className="py-20 text-center font-bold text-neutral-300 text-sm">No records found matching your query.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Actions & System Health */}
                    <div className="space-y-6">
                        <Card className="bg-white border-neutral-200 shadow-sm rounded-[2rem] overflow-hidden p-8 relative group border-t-8 border-t-rose-500/80">
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-rose-50 rounded-2xl">
                                        <AlertCircle className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <Badge className="bg-rose-500 text-white border-none font-bold rounded-full animate-pulse shadow-lg shadow-rose-200">Attention</Badge>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-neutral-900">Pending Clearances</h4>
                                    <p className="text-sm text-neutral-500 font-medium mt-1">Yêu cầu xác thực & hoàn tiền</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3.5 bg-neutral-50/80 border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-colors">
                                        <span className="text-sm font-bold text-neutral-600">KYC Verification</span>
                                        <span className="text-sm font-black text-rose-600">{summary?.pendingIssues || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3.5 bg-neutral-50/80 border border-neutral-100 rounded-2xl">
                                        <span className="text-sm font-bold text-neutral-600">Hàng Hoàn (Pending)</span>
                                        <span className="text-sm font-black text-neutral-400">---</span>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => navigate('/admin/approvals')}
                                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl h-12 text-sm font-bold shadow-xl shadow-neutral-200 transition-all active:scale-95"
                                >
                                    Review All Requests <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </Card>

                        <Card className="bg-white border-neutral-200 shadow-sm rounded-[2rem] p-8 hover:shadow-md transition-all">
                            <div className="flex flex-col items-center text-center gap-5">
                                <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center relative hover:scale-105 transition-transform">
                                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-20" />
                                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-neutral-900">Core Consistency</h4>
                                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1">Operational Diagnostics</p>
                                </div>
                                <div className="w-full space-y-3 print:hidden">
                                    <SystemLine label="Prisma DB Engine" value="Healthy" color="emerald" />
                                    <SystemLine label="Storage Cluster" value="Healthy" color="emerald" />
                                    <SystemLine label="Auth Gateway" value="Safe" color="blue" />
                                </div>
                                <Button variant="link" onClick={() => navigate('/admin/logs')} className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-900 p-0 h-auto">
                                    View Detailed Logs
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function KpiCard({ label, value, icon: Icon, trend, active, color, bg, border }: any) {
    return (
        <Card className={cn(
            "bg-white border relative overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 rounded-[2.2rem]",
            border
        )}>
            <CardContent className="p-6 relative">
                {/* Background soft glow */}
                <div className={cn("absolute right-[-10px] top-[-10px] w-24 h-24 blur-3xl opacity-10 rounded-full", bg)} />
                
                <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className={cn("p-3 rounded-2xl shadow-sm border border-white transition-transform group-hover:scale-110 group-hover:rotate-3", bg)}>
                        <Icon className={cn("w-5 h-5", color)} />
                    </div>
                    {active && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-tighter shadow-sm flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Now
                        </Badge>
                    )}
                </div>

                <div className="space-y-1 relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
                    <div className="flex flex-col gap-1">
                        <h4 className="text-2xl font-black text-neutral-900 tracking-tight">{value}</h4>
                        {trend && (
                            <span className="text-[10px] font-bold text-neutral-400 italic">
                                {trend}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SystemLine({ label, value, color }: { label: string; value: string; color: string }) {
    const colorMap: Record<string, string> = {
        emerald: "bg-emerald-500 text-emerald-600",
        blue: "bg-blue-500 text-blue-600",
        zinc: "bg-zinc-400 text-zinc-500",
    };

    return (
        <div className="flex items-center justify-between p-3.5 bg-neutral-50/50 border border-neutral-100 rounded-2xl group hover:bg-neutral-50 transition-colors">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.1em]">{label}</span>
            <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", colorMap[color].split(' ')[0])} />
                <span className={cn("text-[10px] font-black tracking-widest uppercase", colorMap[color].split(' ')[1])}>
                    {value}
                </span>
            </div>
        </div>
    );
}
