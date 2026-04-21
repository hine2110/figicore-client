import { 
    BarChart3, ShoppingBag, ShoppingCart, Zap, PackageCheck, 
    DollarSign, Activity, Archive, Users, Truck, ArrowUpRight, ArrowDownRight,
    Gavel, Gift, Layout, ShoppingBasket
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
    return `${value.toLocaleString('vi-VN')}₫`;
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
    growth?: number;
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
                        {growth !== undefined && <GrowthBadge value={growth} />}
                        <span className="text-xs text-neutral-400">online stats</span>
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

export interface WarehouseAnalyticsContentProps {
    kpi: any;
    currentMonthLabel: string;
    previousMonthLabel: string;
}

export function WarehouseAnalyticsContent({ kpi, currentMonthLabel, previousMonthLabel }: WarehouseAnalyticsContentProps) {
    if (!kpi) return null;

    const { current: curr, previous: prev, growth, activePreorderContracts } = kpi;

    // Chart data — Revenue comparison (All 6 types)
    const revenueComparisonData = [
        { name: "Retail", current: curr.onlineRevenue, previous: prev?.onlineRevenue ?? 0 },
        { name: "Live", current: curr.livestreamRevenue, previous: prev?.livestreamRevenue ?? 0 },
        { name: "Pre-order", current: curr.preorderRevenue, previous: prev?.preorderRevenue ?? 0 },
        { name: "Blindbox", current: curr.blindboxRevenue, previous: prev?.blindboxRevenue ?? 0 },
        { name: "Auction", current: curr.auctionRevenue, previous: prev?.auctionRevenue ?? 0 },
        { name: "Giveaway", current: curr.giveawayRevenue, previous: prev?.giveawayRevenue ?? 0 },
    ];

    // Orders breakdown chart (All 6 types)
    const ordersComparisonData = [
        { name: "Retail", current: curr.totalOnlineOrders, previous: prev?.totalOnlineOrders ?? 0 },
        { name: "Live", current: curr.totalLivestreamOrders, previous: prev?.totalLivestreamOrders ?? 0 },
        { name: "Pre-order", current: curr.preorderCount, previous: prev?.preorderCount ?? 0 },
        { name: "Blindbox", current: curr.blindboxCount, previous: prev?.blindboxCount ?? 0 },
        { name: "Auction", current: curr.auctionCount, previous: prev?.auctionCount ?? 0 },
        { name: "Giveaway", current: curr.giveawayCount, previous: prev?.giveawayCount ?? 0 },
    ];

    // Shipping breakdown
    const shippingPieData = [
        { name: "Collected (Customer)", value: curr.shippingCollected },
        { name: "Paid (GHN)", value: curr.shippingPaid },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── SECTION 1: Online Orders Summary ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5" /> Online Order Volume (Delivered)
                    </h2>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Total: {curr.totalOrders}</Badge>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <KpiCard
                        title="Retail Orders"
                        value={curr.totalOnlineOrders.toLocaleString()}
                        icon={ShoppingCart}
                        color="text-emerald-600" bgColor="bg-emerald-50"
                        previousValue={prev?.totalOnlineOrders.toLocaleString()}
                    />
                    <KpiCard
                        title="Livestream Orders"
                        value={curr.totalLivestreamOrders.toLocaleString()}
                        icon={Zap}
                        color="text-purple-600" bgColor="bg-purple-50"
                        previousValue={prev?.totalLivestreamOrders.toLocaleString()}
                    />
                    <KpiCard
                        title="Pre-order Contracts"
                        value={curr.preorderCount.toLocaleString()}
                        icon={Archive}
                        color="text-amber-600" bgColor="bg-amber-50"
                        previousValue={prev?.preorderCount.toLocaleString()}
                    />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <KpiCard
                        title="Blindbox Orders"
                        value={curr.blindboxCount.toLocaleString()}
                        icon={Layout}
                        color="text-blue-600" bgColor="bg-blue-50"
                        previousValue={prev?.blindboxCount.toLocaleString()}
                    />
                    <KpiCard
                        title="Auction Wins"
                        value={curr.auctionCount.toLocaleString()}
                        icon={Gavel}
                        color="text-pink-600" bgColor="bg-pink-50"
                        previousValue={prev?.auctionCount.toLocaleString()}
                    />
                    <KpiCard
                        title="Giveaway Claims"
                        value={curr.giveawayCount.toLocaleString()}
                        icon={Gift}
                        color="text-indigo-600" bgColor="bg-indigo-50"
                        previousValue={prev?.giveawayCount.toLocaleString()}
                    />
                </div>
            </section>

            {/* ── SECTION 2: Revenue ── */}
            <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" /> Online Revenue Breakdown
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <KpiCard
                        title="Retail Revenue"
                        value={formatVND(curr.onlineRevenue)}
                        subValue={`${curr.totalOnlineOrders} items`}
                        icon={DollarSign}
                        color="text-emerald-600" bgColor="bg-emerald-50"
                        previousValue={formatVND(prev?.onlineRevenue ?? 0)}
                    />
                    <KpiCard
                        title="Livestream Revenue"
                        value={formatVND(curr.livestreamRevenue)}
                        subValue={`${curr.totalLivestreamOrders} items`}
                        icon={Activity}
                        color="text-purple-600" bgColor="bg-purple-50"
                        previousValue={formatVND(prev?.livestreamRevenue ?? 0)}
                    />
                    <KpiCard
                        title="Pre-order Revenue"
                        value={formatVND(curr.preorderRevenue)}
                        subValue={`${curr.preorderCount} contracts`}
                        icon={Archive}
                        color="text-amber-600" bgColor="bg-amber-50"
                        previousValue={formatVND(prev?.preorderRevenue ?? 0)}
                    />
                    <KpiCard
                        title="Blindbox Revenue"
                        value={formatVND(curr.blindboxRevenue)}
                        subValue={`${curr.blindboxCount} units`}
                        icon={Layout}
                        color="text-blue-600" bgColor="bg-blue-50"
                        previousValue={formatVND(prev?.blindboxRevenue ?? 0)}
                    />
                    <KpiCard
                        title="Auction Revenue"
                        value={formatVND(curr.auctionRevenue)}
                        subValue={`${curr.auctionCount} items`}
                        icon={Gavel}
                        color="text-pink-600" bgColor="bg-pink-50"
                        previousValue={formatVND(prev?.auctionRevenue ?? 0)}
                    />
                    <KpiCard
                        title="Giveaway (Cost/Tax)"
                        value={formatVND(curr.giveawayRevenue)}
                        subValue={`${curr.giveawayCount} gifts`}
                        icon={Gift}
                        color="text-indigo-600" bgColor="bg-indigo-50"
                        previousValue={formatVND(prev?.giveawayRevenue ?? 0)}
                    />
                </div>

                {/* Revenue Bar Chart */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-neutral-400" />
                            Revenue by Product Category — {currentMonthLabel} vs {previousMonthLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueComparisonData} barCategoryGap="20%" barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v} tick={{ fontSize: 10 }} width={60} />
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

            {/* ── SECTION 3: Shipping Audit ── */}
            <div className="grid grid-cols-1 gap-6">
                <Card className="border-0 shadow-sm bg-emerald-50/50">
                    <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
                         <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">Shipping Audit (Online)</p>
                                <div className="text-2xl font-bold text-neutral-900">{formatVND(curr.shippingCollected)}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Collected from Customer</span>
                                    <div className="font-bold text-neutral-700 text-sm">{formatVND(curr.shippingCollected)}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Paid to Courier</span>
                                    <div className="font-bold text-rose-600 text-sm">- {formatVND(curr.shippingPaid)}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-orange-600 uppercase font-bold">Shipping Discounts</span>
                                    <div className="font-bold text-orange-600 text-sm">{formatVND(curr.shippingDiscount)}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold">Coverage</span>
                                    <div className="text-[10px] text-neutral-400 italic">Applied to {curr.freeshipOrders} orders</div>
                                </div>
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── SECTION 4: Volume Comparison ── */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-neutral-700">
                        Orders by Category — {currentMonthLabel} vs {previousMonthLabel}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={ordersComparisonData} barCategoryGap="30%" barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
            variant === 'outline' ? "border-neutral-200" : "bg-neutral-100",
            className
        )}>
            {children}
        </span>
    );
}
