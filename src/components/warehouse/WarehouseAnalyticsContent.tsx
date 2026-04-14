import { 
    BarChart3, ShoppingBag, ShoppingCart, Zap, PackageCheck, 
    DollarSign, Activity, Archive, Users, Truck, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { format } from "date-fns";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatVND(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B₫`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M₫`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K₫`;
    return `${value.toLocaleString()}₫`;
}

interface GrowthBadgeProps { value: number; suffix?: string; }
function GrowthBadge({ value, suffix = "%" }: GrowthBadgeProps) {
    const positive = value >= 0;
    return (
        <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-bold",
            positive ? "text-emerald-600" : "text-red-500"
        )}>
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(value)}{suffix}
        </span>
    );
}

interface KpiCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    growth: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    previousValue?: string;
}
function KpiCard({ title, value, subValue, growth, icon: Icon, color, bgColor, previousValue }: KpiCardProps) {
    return (
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className={cn("absolute inset-0 opacity-5", bgColor)} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium text-neutral-500">{title}</CardTitle>
                <div className={cn("p-2 rounded-lg", bgColor)}>
                    <Icon className={cn("w-4 h-4", color)} />
                </div>
            </CardHeader>
            <CardContent className="relative">
                <div className="text-2xl font-bold text-neutral-900 mb-1">{value}</div>
                {subValue && <div className="text-sm text-neutral-500 mb-2">{subValue}</div>}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <GrowthBadge value={growth} />
                        <span className="text-xs text-neutral-400">vs last month</span>
                    </div>
                    {previousValue && (
                        <span className="text-xs text-neutral-400 font-mono">
                            Prev: {previousValue}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

const PIE_COLORS = ["#10b981", "#8b5cf6", "#94a3b8"];

export interface WarehouseAnalyticsContentProps {
    kpi: any;
    currentMonthLabel: string;
    previousMonthLabel: string;
}

export function WarehouseAnalyticsContent({ kpi, currentMonthLabel, previousMonthLabel }: WarehouseAnalyticsContentProps) {
    if (!kpi) return null;

    const { currentMonth: curr, previousMonth: prev, growth, activePreorderContracts } = kpi;

    // Chart data — Revenue comparison
    const revenueComparisonData = [
        { name: "Retail", current: curr.onlineRevenue, previous: prev?.onlineRevenue ?? 0 },
        { name: "Livestream", current: curr.livestreamRevenue, previous: prev?.livestreamRevenue ?? 0 },
        { name: "Pre-order", current: curr.preorderRevenue, previous: prev?.preorderRevenue ?? 0 },
    ];

    // Shipping breakdown pie
    const transportMargin = curr.shippingCollected - curr.shippingPaid;
    const shippingPieData = [
        { name: "Collected (Customer)", value: curr.shippingCollected },
        { name: "Paid (GHN)", value: curr.shippingPaid },
    ];

    // Orders breakdown chart
    const ordersComparisonData = [
        { name: "Retail Orders", current: curr.totalOnlineOrders, previous: prev?.totalOnlineOrders ?? 0 },
        { name: "Live Orders", current: curr.totalLivestreamOrders, previous: prev?.totalLivestreamOrders ?? 0 },
        { name: "Preorder Contracts", current: curr.preorderCount, previous: prev?.preorderCount ?? 0 },
        { name: "Packed", current: curr.packedOrders, previous: prev?.packedOrders ?? 0 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── SECTION 1: Orders Summary ── */}
            <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" /> Order Volume
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Orders"
                        value={curr.totalOrders.toLocaleString()}
                        growth={growth.totalOrders}
                        icon={ShoppingBag}
                        color="text-blue-600" bgColor="bg-blue-50"
                        previousValue={prev?.totalOrders.toLocaleString()}
                    />
                    <KpiCard
                        title="Retail Orders"
                        value={curr.totalOnlineOrders.toLocaleString()}
                        growth={growth.onlineRevenue}
                        icon={ShoppingCart}
                        color="text-emerald-600" bgColor="bg-emerald-50"
                        previousValue={prev?.totalOnlineOrders.toLocaleString()}
                    />
                    <KpiCard
                        title="Livestream Orders"
                        value={curr.totalLivestreamOrders.toLocaleString()}
                        growth={growth.livestreamRevenue}
                        icon={Zap}
                        color="text-purple-600" bgColor="bg-purple-50"
                        previousValue={prev?.totalLivestreamOrders.toLocaleString()}
                    />
                    <KpiCard
                        title="Orders Packed"
                        value={curr.packedOrders.toLocaleString()}
                        growth={growth.packedOrders}
                        icon={PackageCheck}
                        color="text-orange-600" bgColor="bg-orange-50"
                        previousValue={prev?.packedOrders.toLocaleString()}
                    />
                </div>
            </section>

            {/* ── SECTION 2: Revenue ── */}
            <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" /> Revenue Breakdown
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <KpiCard
                        title="Retail Revenue (Online)"
                        value={formatVND(curr.onlineRevenue)}
                        subValue={`${curr.totalOnlineOrders} orders`}
                        growth={growth.onlineRevenue}
                        icon={DollarSign}
                        color="text-emerald-600" bgColor="bg-emerald-50"
                        previousValue={formatVND(prev?.onlineRevenue ?? 0)}
                    />
                    <KpiCard
                        title="Livestream Revenue"
                        value={formatVND(curr.livestreamRevenue)}
                        subValue={`${curr.totalLivestreamOrders} orders`}
                        growth={growth.livestreamRevenue}
                        icon={Activity}
                        color="text-purple-600" bgColor="bg-purple-50"
                        previousValue={formatVND(prev?.livestreamRevenue ?? 0)}
                    />
                    <KpiCard
                        title="Pre-order Deposits"
                        value={formatVND(curr.preorderRevenue)}
                        subValue={`${curr.preorderCount} contracts this month`}
                        growth={growth.preorderRevenue}
                        icon={Archive}
                        color="text-amber-600" bgColor="bg-amber-50"
                        previousValue={formatVND(prev?.preorderRevenue ?? 0)}
                    />
                </div>

                {/* Revenue Bar Chart */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-neutral-400" />
                            Revenue: {currentMonthLabel} vs {previousMonthLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={revenueComparisonData} barCategoryGap="30%" barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(v) => formatVND(v)} tick={{ fontSize: 11 }} width={70} />
                                <Tooltip
                                    formatter={(val: number | undefined) => val != null ? formatVND(val) : '0₫'}
                                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                                />
                                <Legend />
                                <Bar dataKey="current" name={currentMonthLabel} fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="previous" name={previousMonthLabel} fill="#d1fae5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* ── SECTION 3: Pre-order & Shipping ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pre-order Status */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Active Contracts (All-time)</p>
                                <div className="text-4xl font-bold text-neutral-900">{activePreorderContracts}</div>
                                <p className="text-sm text-neutral-500 mt-1">customers currently pre-ordering</p>
                            </div>
                            <div className="p-4 bg-amber-100 rounded-2xl">
                                <Users className="w-8 h-8 text-amber-600" />
                            </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (activePreorderContracts / 50) * 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-amber-600 mt-1 font-mono">{activePreorderContracts} / 50 max slots (aggregate)</p>
                    </CardContent>
                </Card>

                {/* Shipping summary */}
                <Card className={cn(
                    "border-0 shadow-sm",
                    transportMargin >= 0 ? "bg-emerald-50/50" : "bg-red-50/50"
                )}>
                    <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
                         <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">Net Shipping Margin</p>
                                <div className={cn("text-3xl font-bold", transportMargin >= 0 ? "text-emerald-600" : "text-red-500")}>
                                    {transportMargin >= 0 ? "+" : ""}{formatVND(transportMargin)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-neutral-500">Collected</span>
                                    <span className="font-bold text-neutral-700">{formatVND(curr.shippingCollected)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-neutral-500">Paid to GHN</span>
                                    <span className="font-bold text-red-500">- {formatVND(curr.shippingPaid)}</span>
                                </div>
                            </div>
                         </div>
                         <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                                <Pie
                                    data={shippingPieData}
                                    cx="50%" cy="50%"
                                    innerRadius={30} outerRadius={45}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#fca5a5" />
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ── SECTION 4: Volume Comparison ── */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-neutral-700">
                        Orders by Channel — {currentMonthLabel} vs {previousMonthLabel}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={ordersComparisonData} barCategoryGap="35%" barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                            <Legend />
                            <Bar dataKey="current" name={currentMonthLabel} fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="previous" name={previousMonthLabel} fill="#fed7aa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <p className="text-[10px] text-neutral-400 text-center">
                Data is month-to-date for <span className="font-semibold">{currentMonthLabel}</span>.
                Figures refresh on page load.
            </p>
        </div>
    );
}
