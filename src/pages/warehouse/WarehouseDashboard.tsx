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
import { WarehouseAnalyticsContent } from "@/components/warehouse/WarehouseAnalyticsContent";

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
    const [timeRange, setTimeRange] = useState("week");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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
    };

    useEffect(() => {
        fetchData();
    }, [timeRange]);

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

                    <Select value={timeRange} onValueChange={setTimeRange}>
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
                                <Truck className="w-12 h-12" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Packed & Shipping</CardTitle>
                                <div className="text-3xl font-black text-amber-600">{stats?.packedCount || 0}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px]">On Transit</Badge>
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

                        <Card className="border-0 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-rose-500">
                                <AlertTriangle className="w-12 h-12" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Restock Alerts</CardTitle>
                                <div className="text-3xl font-black text-rose-600">{stats?.lowStockAlerts || 0}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-100 text-[10px]">Low Stock</Badge>
                                    <span className="text-[10px] text-neutral-400">inventory needed</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

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
