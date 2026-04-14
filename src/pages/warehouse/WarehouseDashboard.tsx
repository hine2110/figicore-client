import { useState, useEffect } from "react";
import {
    ClipboardList, Box, AlertCircle, CheckCircle2, PackageCheck,
    ChevronRight, Loader2, Clock,
    CalendarClock, Users, 
    BarChart3, 
    ArrowUpRight, ArrowDownRight,
    RefreshCw, LayoutDashboard
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

import { STAFF_TASKS } from "@/lib/staffMockData";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { orderService } from "@/services/order.service";
import { WarehouseAnalyticsContent } from "@/components/warehouse/WarehouseAnalyticsContent";
import { inventoryService } from "@/services/inventory.service";
import { productsService } from "@/services/products.service";
import { shipmentService } from "@/services/shipment.service";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatVND(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B₫`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M₫`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K₫`;
    return `${value.toLocaleString()}₫`;
}
function GrowthBadge({ value }: { value: number }) {
    const pos = value >= 0;
    return (
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", pos ? "text-emerald-600" : "text-red-500")}>
            {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(value)}%
        </span>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────
interface KpiCardProps {
    title: string; value: string | number; subValue?: string;
    growth: number; icon: React.ElementType; accent: string;
    prev?: string;
}
function KpiCard({ title, value, subValue, growth, icon: Icon, accent, prev }: KpiCardProps) {
    return (
        <Card className="border border-neutral-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2 rounded-xl", `bg-${accent}-50`)}>
                        <Icon className={cn("w-4 h-4", `text-${accent}-600`)} />
                    </div>
                    <GrowthBadge value={growth} />
                </div>
                <div className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</div>
                {subValue && <div className="text-xs text-neutral-400 mt-0.5">{subValue}</div>}
                <div className="text-xs text-neutral-400 mt-2">{title}</div>
                {prev && <div className="text-[10px] text-neutral-300 font-mono mt-0.5">Prev: {prev}</div>}
            </CardContent>
        </Card>
    );
}

const PIE_COLORS = ["#10b981", "#8b5cf6", "#94a3b8"];
const CHART_COLORS = { current: "#f97316", previous: "#fed7aa" };

export default function StaffDashboard() {
    const { toast } = useToast();

    // ── Operational state ─────────────────────────────────────────────────────
    const [ops, setOps] = useState({ readyToPack: 0, restockAlerts: 0, priorityIssues: 0, tasksDone: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Analytics (KPI) state ─────────────────────────────────────────────────
    const [kpi, setKpi] = useState<any>(null);

    // ── Pre-order monitor state ───────────────────────────────────────────────
    const [preorders, setPreorders] = useState<any[]>([]);
    const [extendLoading, setExtendLoading] = useState<Record<number, boolean>>({});

    const now = new Date();
    const currentMonthLabel = format(now, "MMMM yyyy");
    const previousMonthLabel = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), "MMMM yyyy");

    // ── Helpers ───────────────────────────────────────────────────────────────
    const handleExtendBooking = async (variantId: number, sku: string) => {
        setExtendLoading(prev => ({ ...prev, [variantId]: true }));
        try {
            const result = await productsService.extendPreorderBooking(variantId);
            toast({ title: "✅ Extended", description: result?.message || `Extended booking for ${sku} by 2 weeks.`, className: "bg-orange-600 text-white border-none" });
            const res = await productsService.getProducts({ type_code: 'PREORDER', limit: 10 });
            const list = Array.isArray(res) ? res : (res as any).data || [];
            setPreorders(list.filter((p: any) => p.type_code === 'PREORDER').slice(0, 5));
        } catch (err: any) {
            toast({ title: "Failed to extend", description: err?.response?.data?.message || "Max extensions reached.", variant: "destructive" });
        } finally {
            setExtendLoading(prev => ({ ...prev, [variantId]: false }));
        }
    };

    const formatDeadline = (d: string | null | undefined) => {
        if (!d) return 'No limit';
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
        if (diff < 0) return 'Expired';
        if (diff === 0) return 'Expires today';
        return `${diff}d left`;
    };

    // ── Data fetch ────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            const [processingRes, inboundRes, productsRes, completedRes, recentRes, kpiRes] = await Promise.all([
                   shipmentService.getProcessingOrders(),
                   inventoryService.getHistory({ page: 1, limit: 100, startDate: startOfDay, endDate: endOfDay }),
                   productsService.getProducts({ limit: 100 }),
                   orderService.getAllOrders({ page: 1, limit: 1, status: 'delivered' }),
                   orderService.getAllOrders({ limit: 50 }),
                   orderService.getDashboardKPIs(),
            ]);

            const readyToPack = Array.isArray(processingRes) ? processingRes.length : 0;
            const inboundData = (inboundRes as any).data || [];
            const inboundCount = (inboundRes as any).meta?.total_items || inboundData.length || 0;
            const productList = (productsRes as any).data || (Array.isArray(productsRes) ? productsRes : []);
            const lowStock = productList.filter((p: any) => p.quantity <= 10).length;
            const tasksDone = ((completedRes as any).total || 0) + inboundCount;

            setOps({ readyToPack, restockAlerts: lowStock, priorityIssues: lowStock, tasksDone });

            const po = productList.filter((p: any) => p.type_code === 'PREORDER');
            setPreorders(po.slice(0, 5));

            const statusCounts: Record<string, number> = {};
            ((recentRes as any).items || []).forEach((o: any) => {
                statusCounts[o.status || 'unknown'] = (statusCounts[o.status || 'unknown'] || 0) + 1;
            });
            const chartArr = Object.keys(statusCounts).map(s => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: statusCounts[s] }));
            setChartData(chartArr.length ? chartArr : [{ name: 'Processing', value: readyToPack }, { name: 'Completed', value: 0 }]);

            setKpi(kpiRes);
        } catch (err) {
            console.error("Dashboard fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-neutral-400 text-sm">Loading dashboard…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-orange-500" />
                        Warehouse Dashboard
                    </h1>
                    <p className="text-neutral-400 text-sm mt-1">
                        Operations Overview
                        <span className="mx-2 text-neutral-200">|</span>
                        <span className="text-orange-500 font-semibold">{currentMonthLabel}</span> vs <span className="text-neutral-400">{previousMonthLabel}</span>
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 shrink-0">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────────── */}
            <Tabs defaultValue="operations">
                <TabsList className="bg-neutral-100 rounded-xl p-1 h-auto">
                    <TabsTrigger value="operations" className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ClipboardList className="w-4 h-4 mr-2" /> Operations
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-lg text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <BarChart3 className="w-4 h-4 mr-2" /> Analytics
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: OPERATIONS */}
                <TabsContent value="operations" className="space-y-6 mt-6">

                    {/* Operational KPI cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Ready to Pack", value: ops.readyToPack, icon: PackageCheck, color: "bg-blue-50 text-blue-600", badge: "Queue" },
                            { label: "Restock Alerts", value: ops.restockAlerts, icon: AlertCircle, color: "bg-amber-50 text-amber-600", badge: "Low Stock" },
                            { label: "Priority Issues", value: ops.priorityIssues, icon: Box, color: "bg-red-50 text-red-600", badge: "Action Needed" },
                            { label: "Tasks Done", value: ops.tasksDone, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", badge: "Completed" },
                        ].map(({ label, value, icon: Icon, color, badge }) => (
                            <Card key={label} className="border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn("p-2 rounded-xl", color.split(" ")[0])}>
                                            <Icon className={cn("w-4 h-4", color.split(" ")[1])} />
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] font-medium">{badge}</Badge>
                                    </div>
                                    <div className="text-3xl font-bold text-neutral-900">{value}</div>
                                    <div className="text-xs text-neutral-400 mt-1">{label}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pre-order Monitor */}
                    <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-neutral-800 flex items-center gap-2 text-sm">
                                    <CalendarClock className="w-4 h-4 text-orange-500" /> Pre-order Monitoring
                                </h2>
                                <Link to="/warehouse/inventory">
                                    <Button variant="link" size="sm" className="text-blue-500 h-auto p-0 text-xs">View all</Button>
                                </Link>
                            </div>

                            {preorders.length === 0 ? (
                                <div className="border border-dashed border-neutral-200 rounded-xl p-8 text-center text-neutral-400 text-sm">
                                    No active pre-order products.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {preorders.flatMap((product: any) =>
                                        (product.product_variants || []).slice(0, 1).map((v: any) => {
                                            const cfg = v.product_preorder_configs;
                                            if (!cfg) return null;
                                            const soldPct = cfg.total_slots > 0 ? Math.round((cfg.sold_slots / cfg.total_slots) * 100) : 0;
                                            const isExpired = cfg.booking_end_date && new Date() > new Date(cfg.booking_end_date);
                                            const canExtend = (cfg.extension_count ?? 0) < 1 && !isExpired;
                                            const alreadyExtended = (cfg.extension_count ?? 0) >= 1;
                                            return (
                                                <div key={v.variant_id} className={cn(
                                                    "rounded-xl border p-3.5 bg-white flex flex-col sm:flex-row sm:items-center gap-3 transition-all",
                                                    isExpired ? "border-red-200 bg-red-50/50" : "border-neutral-100 hover:border-orange-200 shadow-sm"
                                                )}>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">{product.name}</p>
                                                        <p className="font-semibold text-neutral-800 truncate text-sm">{v.option_name} <span className="font-mono text-xs text-neutral-400">({v.sku})</span></p>
                                                    </div>
                                                    <div className="sm:w-36">
                                                        <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Deposit</span>
                                                            <span className="font-mono font-bold">{cfg.sold_slots}/{cfg.total_slots}</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className={cn("h-full rounded-full transition-all", soldPct >= 80 ? "bg-red-500" : soldPct >= 50 ? "bg-orange-400" : "bg-emerald-500")} style={{ width: `${soldPct}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="text-right">
                                                            <p className={cn("text-xs font-bold font-mono", isExpired ? "text-red-600" : "text-neutral-700")}>{formatDeadline(cfg.booking_end_date)}</p>
                                                            {alreadyExtended && <Badge variant="outline" className="text-[9px] text-orange-500 border-orange-200 h-4 mt-0.5">Extended</Badge>}
                                                        </div>
                                                        <Button size="sm" disabled={!canExtend || extendLoading[v.variant_id]} onClick={() => handleExtendBooking(v.variant_id, v.sku)} className={cn("rounded-lg text-xs h-8 px-3 font-bold transition-all", canExtend ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-neutral-100 text-neutral-400")}>
                                                            {extendLoading[v.variant_id] ? <Loader2 className="w-3 h-3 animate-spin" /> : alreadyExtended ? "Extended" : isExpired ? "Expired" : "+2 Wks"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ).filter(Boolean)}
                                </div>
                            )}
                    </div>

                    {/* Task Board */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-neutral-800 text-sm flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-orange-500" /> Urgent Tasks
                            </h2>
                            <Button variant="link" size="sm" className="text-blue-500 h-auto p-0 text-xs">View All</Button>
                        </div>
                        <div className="space-y-2">
                            {STAFF_TASKS.map((task: any) => (
                                <div key={task.id} className="group bg-white p-4 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-1 h-10 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                        <div>
                                            <p className="font-semibold text-neutral-900 text-sm">{task.description}</p>
                                            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.dueTime}</span>
                                                <Badge variant="outline" className={cn("border-0 font-medium text-[10px]", task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-neutral-100 text-neutral-600')}>
                                                    {task.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        Start <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: ANALYTICS */}
                <TabsContent value="analytics" className="space-y-6 mt-6">
                    <WarehouseAnalyticsContent 
                        kpi={kpi} 
                        currentMonthLabel={currentMonthLabel} 
                        previousMonthLabel={previousMonthLabel} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
