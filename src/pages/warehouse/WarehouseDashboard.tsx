import React, { useState, useEffect } from "react";
import { 
    LayoutDashboard, Package, AlertTriangle, CheckCircle2, 
    ArrowUpRight, ArrowDownRight, RefreshCcw, 
    Calendar, Search, Filter, 
    Clock, PackageSearch, Truck, ShoppingBag, Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { dashboardService, WarehouseStats } from "@/services/dashboard.service";
import { productsService } from "@/services/products.service";
import { WarehouseAnalyticsContent } from "@/components/warehouse/WarehouseAnalyticsContent";
import { io } from "socket.io-client";

// ── Helpers ──────────────────────────────────────────────────────────────────
function GrowthBadge({ value }: { value: number }) {
    const pos = value >= 0;
    return (
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", pos ? "text-emerald-600" : "text-red-500")}>
            {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(value)}%
        </span>
    );
}

export default function StaffDashboard() {
    const { toast } = useToast();

    // ── Operational state ─────────────────────────────────────────────────────
    const [stats, setStats] = useState<WarehouseStats | null>(null);
    const [loading, setLoading] = useState(true);

    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const defaultStart = new Date(y, m, 1).toLocaleDateString('en-CA');
    const defaultEnd = new Date(y, m + 1, 1).toLocaleDateString('en-CA');

    const [timeRange, setTimeRange] = useState("month");
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [preorders, setPreorders] = useState<any[]>([]);

    // Countdown state for preorders
    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchPreorders = async () => {
        try {
            const res = await productsService.getProducts({ type_code: 'PREORDER' });
            setPreorders(Array.isArray(res) ? res : (res as any).data || []);
        } catch (error) {
            console.error("Failed to fetch preorders", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await dashboardService.getWarehouseStats(timeRange, startDate, endDate);
            setStats(data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch dashboard data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
        fetchPreorders();
    };

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000/events', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('warehouse:new_order', () => {
            fetchData();
        });

        socket.on('warehouse:order_status_update', () => {
            fetchData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSearch = () => {
        if (startDate && endDate) {
            fetchData();
        } else {
            toast({ title: "Validation", description: "Please select both start and end dates", variant: "default" });
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Warehouse Dashboard</h1>
                    </div>
                    <p className="text-sm text-neutral-500 ml-12 uppercase tracking-widest font-bold flex items-center gap-2">
                        Operations Overview <span className="text-indigo-600 font-black">{timeRange.toUpperCase()}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        <Input 
                            type="date" 
                            className="h-8 border-0 focus-visible:ring-0 w-32 text-xs" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-neutral-300">-</span>
                        <Input 
                            type="date" 
                            className="h-8 border-0 focus-visible:ring-0 w-32 text-xs" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={handleSearch}>
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>

                    <Select 
                        value={timeRange} 
                        onValueChange={(value) => {
                            setTimeRange(value);
                            setStartDate("");
                            setEndDate("");
                        }}
                    >
                        <SelectTrigger className="w-[140px] h-10 bg-white border-neutral-200 shadow-sm">
                            <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 gap-2 border-neutral-200 shadow-sm hover:bg-neutral-50"
                        onClick={fetchData}
                    >
                        <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="operations" className="w-full">
                <TabsList className="bg-neutral-100/50 p-1 mb-6">
                    <TabsTrigger value="operations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 gap-2">
                        <PackageSearch className="w-4 h-4" /> Operations
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 gap-2">
                        <BarChart className="w-4 h-4" /> Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="operations" className="space-y-6">
                    {/* Operational KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Package className="w-12 h-12" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ready to Pack</CardTitle>
                                <div className="text-3xl font-black text-indigo-600">{stats?.readyToPack || 0}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px]">Processing</Badge>
                                    <span className="text-[10px] text-neutral-400">awaiting pick-up</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-amber-500">
                                <PackageSearch className="w-12 h-12" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Packed</CardTitle>
                                <div className="text-3xl font-black text-amber-600">{stats?.packedCount || 0}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px]">Packed</Badge>
                                    <span className="text-[10px] text-neutral-400">awaiting shipper</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-blue-500">
                                <Truck className="w-12 h-12" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Shipping</CardTitle>
                                <div className="text-3xl font-black text-blue-600">{stats?.shippingCount || 0}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px]">On Transit</Badge>
                                    <span className="text-[10px] text-neutral-400">out of warehouse</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-emerald-500">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Delivered</CardTitle>
                                <div className="text-3xl font-black text-emerald-600">{stats?.deliveredCount || 0}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">Completed</Badge>
                                    <span className="text-[10px] text-neutral-400">received by client</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pre-order Management Section */}
                    <Card className="border-0 shadow-sm mt-8">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Archive className="w-4 h-4 text-amber-500" /> Active Pre-orders (Booking Phase)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {preorders.length === 0 ? (
                                <p className="text-sm text-neutral-500">No active pre-orders found.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {preorders.map(product => {
                                        const variant = product.product_variants?.[0];
                                        const config = variant?.product_preorder_configs;
                                        if (!config || !config.booking_end_date) return null;

                                        const deadline = new Date(config.booking_end_date).getTime();
                                        const now = Date.now();
                                        const diff = deadline - now;
                                        const isExpired = diff <= 0;
                                        
                                        const days = Math.max(0, Math.floor(diff / 86400000));
                                        const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000));
                                        const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
                                        
                                        const totalSlots = config.total_slots || 0;
                                        const soldSlots = config.sold_slots || 0;
                                        const isLowSlots = soldSlots < (totalSlots * 0.3); // Consider low if < 30% sold
                                        const isExtended = (config.extension_count || 0) >= 1;

                                        return (
                                            <div key={product.product_id} className={cn(
                                                "p-4 rounded-xl border flex flex-col justify-between gap-4",
                                                isExpired ? "bg-neutral-50 border-neutral-200" : "bg-white border-amber-100 shadow-sm"
                                            )}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-neutral-900 line-clamp-1">{product.name}</h4>
                                                        <p className="text-xs text-neutral-500">SKU: {variant?.sku}</p>
                                                    </div>
                                                    <Badge variant={isExpired ? 'secondary' : 'default'} className={cn(!isExpired && "bg-amber-500 hover:bg-amber-600")}>
                                                        {soldSlots} / {totalSlots} Sold
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className={cn("w-4 h-4", isExpired ? "text-neutral-400" : "text-amber-500")} />
                                                        <span className={cn(
                                                            "text-xs font-mono font-bold",
                                                            isExpired ? "text-neutral-400" : "text-amber-600"
                                                        )}>
                                                            {isExpired ? 'BOOKING CLOSED' : `${days}d ${hours}h ${mins}m left`}
                                                        </span>
                                                        {isExtended && <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-[9px] px-1 py-0">+2WK EXT</Badge>}
                                                    </div>
                                                    
                                                    {!isExpired && !isExtended && (
                                                        <Button 
                                                            size="sm" 
                                                            variant={isLowSlots ? 'default' : 'outline'}
                                                            className={cn(
                                                                "h-7 text-xs font-bold", 
                                                                isLowSlots && "bg-amber-500 hover:bg-amber-600 text-white"
                                                            )}
                                                            onClick={async () => {
                                                                try {
                                                                    await productsService.extendPreorderBooking(variant.variant_id);
                                                                    toast({ title: "Success", description: "Extended booking by 2 weeks." });
                                                                    fetchPreorders(); // Refresh list
                                                                } catch (error: any) {
                                                                    toast({ title: "Error", description: error.message || "Failed to extend", variant: "destructive" });
                                                                }
                                                            }}
                                                        >
                                                            Extend +2 Weeks
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </TabsContent>

                <TabsContent value="analytics">
                    <WarehouseAnalyticsContent 
                        kpi={stats?.analytics} 
                        currentMonthLabel={timeRange === 'week' ? 'WEEK' : timeRange.toUpperCase()}
                        previousMonthLabel="Previous Period"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
