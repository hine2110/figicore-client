import {
    Users,
    DollarSign,
    ArrowUpRight,
    ShieldAlert,
    Activity,
    Radio,
    Zap,
    Gavel,
    Video
} from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Legend
} from "recharts";
import { motion, Variants } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from "@/components/ui/button";

// --- API FETCHERS ---
const fetchSummaryStats = async () => {
    const res = await api.get('/dashboard/summary-stats');
    return res.data;
};

const fetchRevenueChart = async () => {
    const res = await api.get('/dashboard/revenue-chart');
    return res.data;
};

// --- HELPER ---
const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(val);

const formatCurrency = formatVND;

const CHART_SERIES = [
    { key: 'retail',     label: 'Retail',      color: '#10b981' }, // emerald
    { key: 'livestream', label: 'Livestream',   color: '#f97316' }, // orange
    { key: 'preorder',   label: 'Pre-order',    color: '#6366f1' }, // indigo
    { key: 'blindbox',   label: 'Blind Box',    color: '#8b5cf6' }, // violet
    { key: 'auction',    label: 'Đấu Giá',      color: '#f43f5e' }, // rose
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
    return (
        <div className="bg-[#0d0e14]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl min-w-[220px]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-3">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex justify-between items-center gap-6 mb-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                        <span className="text-[10px] text-neutral-300">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-black" style={{ color: p.fill }}>{formatVND(p.value)}</span>
                </div>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
                <span className="text-[10px] text-neutral-500 uppercase">Tổng ngày</span>
                <span className="text-[10px] font-black font-mono text-white">{formatVND(total)}</span>
            </div>
        </div>
    );
};

export default function AdminDashboard() {

    const { data: summary, isLoading: loadingSummary } = useQuery({ queryKey: ['dashboard_summary'], queryFn: fetchSummaryStats, refetchInterval: 10000 });
    const { data: chartData, isLoading: loadingChart } = useQuery({ queryKey: ['dashboard_chart'], queryFn: fetchRevenueChart });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-full bg-[#0a0b10] text-white p-8 rounded-3xl -m-4 relative overflow-hidden font-outfit">
            {/* Background ambiant glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-indigo-500/5 rounded-[100%] blur-[100px] pointer-events-none" />

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10 space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div variants={itemVariants} className="flex justify-between items-end border-b border-white/5 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Command Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">System <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Pulse</span></h1>
                        <p className="text-neutral-500 text-sm mt-1 font-mono uppercase tracking-widest">Real-time telemetry & operational overview</p>
                    </div>
                </motion.div>

                {/* Critical Stats Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <StatCard
                        title="VND TỔNG LƯU LƯỢNG"
                        value={loadingSummary ? '---' : formatCurrency(summary?.totalRevenue || 0)}
                        subtitle="+12.5% from last week"
                        icon={DollarSign}
                        trend="up"
                        color="emerald"
                    />
                    <StatCard
                        title="TÀI KHOẢN ONLINE"
                        value={loadingSummary ? '---' : (summary?.activeUsers || 0).toLocaleString()}
                        subtitle="Trên toàn bộ nền tảng"
                        icon={Users}
                        trend="up"
                        color="blue"
                    />
                    <StatCard
                        title="PHIÊN ĐẤU GIÁ"
                        value={loadingSummary ? '---' : (summary?.activeAuctions || 0).toLocaleString()}
                        subtitle="Đang diễn ra"
                        icon={Gavel}
                        trend="up"
                        color="rose"
                    />
                    <StatCard
                        title="PHIÊN LIVESTREAM"
                        value={loadingSummary ? '---' : (summary?.activeLivestreams || 0).toLocaleString()}
                        subtitle="Đang phát sóng"
                        icon={Video}
                        trend="up"
                        color="indigo"
                    />
                    <StatCard
                        title="HÀNG CHỜ XỬ LÝ"
                        value={loadingSummary ? '---' : summary?.pendingIssues || 0}
                        subtitle="Hoàn tiền & KYC"
                        icon={ShieldAlert}
                        trend="down"
                        color="rose"
                    />
                    <StatCard
                        title="SỨC KHOẺ MÁY CHỦ"
                        value={loadingSummary ? '---' : `${summary?.systemHealth || 99.9}%`}
                        subtitle="Hoạt động ổn định"
                        icon={Activity}
                        trend="up"
                        color="emerald"
                    />
                </motion.div>

                {/* Charts Section - Full width now */}
                <motion.div variants={itemVariants} className="bg-[#111218]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative mb-6 flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-1">Commerce Pulse</h3>
                            <p className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">7-Day Revenue Trajectory — Retail • Livestream • Pre-order • Blind Box • Đấu Giá</p>
                        </div>
                        <Button variant="ghost" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] uppercase font-black tracking-widest rounded-xl">Full Report</Button>
                    </div>
                    <div className="h-[340px] w-full">
                        {loadingChart ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-neutral-600">
                                <Zap className="w-8 h-8 animate-pulse text-emerald-500/50" />
                                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Aggregating telemetry...</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} stackOffset="expand">
                                    <defs>
                                        {CHART_SERIES.map(s => (
                                            <linearGradient key={s.key} id={`grad_${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={s.color} stopOpacity={0.5} />
                                                <stop offset="95%" stopColor={s.color} stopOpacity={0.05} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'monospace' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#4b5563', fontFamily: 'monospace' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '12px' }}
                                        formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{value}</span>}
                                    />
                                    {CHART_SERIES.map(s => (
                                        <Area
                                            key={s.key}
                                            type="monotone"
                                            dataKey={s.key}
                                            name={s.label}
                                            stackId="revenue"
                                            stroke={s.color}
                                            strokeWidth={2}
                                            fill={`url(#grad_${s.key})`}
                                            style={{ filter: `drop-shadow(0 0 6px ${s.color}80)` }}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

// Subcomponent for Stat Cards
function StatCard({ title, value, subtitle, icon: Icon, trend, color }: any) {
    const colorClasses = {
        emerald: "from-emerald-500/20 to-emerald-500/0 border-emerald-500/20 text-emerald-500 bg-emerald-500/10",
        blue: "from-blue-500/20 to-blue-500/0 border-blue-500/20 text-blue-500 bg-blue-500/10",
        rose: "from-rose-500/20 to-rose-500/0 border-rose-500/20 text-rose-500 bg-rose-500/10",
        indigo: "from-indigo-500/20 to-indigo-500/0 border-indigo-500/20 text-indigo-400 bg-indigo-500/10",
    }[color as 'emerald' | 'blue' | 'rose' | 'indigo'];

    return (
        <div className="bg-[#111218]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:border-white/20 transition-all duration-300">
            {/* Subtle top gradient line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]}`} />
            
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{title}</h3>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-6 ${colorClasses}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            
            <div className="flex flex-col gap-1">
                <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{value}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <ArrowUpRight className={`w-3 h-3 ${trend === 'down' ? 'rotate-90' : ''}`} /> {subtitle}
                </span>
            </div>
        </div>
    );
}
