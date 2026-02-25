import { useState, useEffect } from "react";
import {
    ClipboardList,
    Box,
    AlertCircle,
    CheckCircle2,
    Clock,
    PackageCheck,
    ChevronRight,
    Loader2,
    TrendingUp,
    PieChart as PieChartIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts";

import { STAFF_TASKS } from "@/lib/staffMockData";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { orderService } from "@/services/order.service";
import { inventoryService } from "@/services/inventory.service";
import { productsService } from "@/services/products.service";
import { shipmentService } from "@/services/shipment.service";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function StaffDashboard() {
    const [stats, setStats] = useState({
        readyToPack: 0, // Was "pendingOrders", now matched to Processing/Packing
        restockAlerts: 0,
        priorityIssues: 0,
        tasksDone: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
                const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

                // 1. Ready to Pack (Processing Orders) - Matches Packing Queue
                // Using shipmentService to be consistent with Packing page
                const processingOrdersRes = await shipmentService.getProcessingOrders();
                const readyToPackCount = Array.isArray(processingOrdersRes) ? processingOrdersRes.length : 0;

                // 2. Today's Inbound Receipts
                const inboundReq = inventoryService.getHistory({
                    page: 1,
                    limit: 100,
                    startDate: startOfDay,
                    endDate: endOfDay
                });

                // 3. Restock Alerts (Client-side approximation)
                const productsReq = productsService.getProducts({ limit: 100 });

                // 4. Completed Orders (Today - Approximation or Total)
                const completedOrdersReq = orderService.getAllOrders({
                    page: 1,
                    limit: 1,
                    status: 'delivered' // Delivered/Completed
                });

                // 5. Chart Data: Fetch distribution (simulate with recent orders)
                const recentOrdersReq = orderService.getAllOrders({ limit: 50 });

                const [inboundRes, productsRes, completedOrdersRes, recentOrdersRes] = await Promise.all([
                    inboundReq,
                    productsReq,
                    completedOrdersReq,
                    recentOrdersReq
                ]);

                // --- Process Stats ---

                // Inbound Count
                const inboundData = (inboundRes as any).data || [];
                const inboundCount = (inboundRes as any).meta?.total_items || inboundData.length || 0;

                // Restock Count (Quantity <= 10)
                const productList = productsRes.data || [];
                const lowStockCount = productList.filter((p: any) => p.quantity <= 10).length;

                // Priority Issues: Low Stock + Error States
                const issuesCount = lowStockCount;

                // Tasks Done: Inbound items + items packed (approximated by delivered for now, or just inbound)
                const completedCount = (completedOrdersRes.total || 0) + inboundCount;

                setStats({
                    readyToPack: readyToPackCount,
                    restockAlerts: lowStockCount,
                    priorityIssues: issuesCount,
                    tasksDone: completedCount
                });

                // --- Process Chart Data ---
                const recentOrders = recentOrdersRes.items || [];
                const statusCounts: Record<string, number> = {};

                recentOrders.forEach(order => {
                    const status = order.status || 'unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });

                // Format for Recharts
                const formattedChartData = Object.keys(statusCounts).map(status => ({
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                    value: statusCounts[status]
                }));

                // Ensure we have some data even if empty to show the chart
                if (formattedChartData.length === 0) {
                    setChartData([
                        { name: 'Processing', value: readyToPackCount },
                        { name: 'Completed', value: 0 },
                        { name: 'Cancelled', value: 0 }
                    ]);
                } else {
                    setChartData(formattedChartData);
                }


            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-neutral-400 text-sm">Loading dashboard metrics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Staff Dashboard</h1>
                    <p className="text-neutral-500">Overview of your current shift performance.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-neutral-500">Current Shift</p>
                    <p className="font-mono font-bold text-lg text-neutral-900">
                        {format(new Date(), "HH:mm")} - {format(new Date(new Date().setHours(new Date().getHours() + 8)), "HH:mm")}
                    </p>
                </div>
            </div>

            {/* Shift Status Banner */}
            <div className="bg-neutral-900 text-white rounded-xl p-6 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Shift in Progress</h3>
                        <div className="flex items-center gap-2 text-neutral-400 text-sm">
                            <span>Started just now</span>
                            <span className="w-1 h-1 rounded-full bg-neutral-600" />
                            <span>Ends in 8h</span>
                        </div>
                    </div>
                </div>
                <div className="w-1/3 space-y-2 hidden md:block">
                    <div className="flex justify-between text-xs font-medium text-neutral-400">
                        <span>Performance Goal ({stats.tasksDone} tasks)</span>
                        <span className="text-emerald-400">On Track</span>
                    </div>
                    <Progress value={Math.min(100, (stats.tasksDone / 20) * 100)} className="h-2 bg-neutral-800" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                            Ready
                        </Badge>
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.readyToPack}</h3>
                    <p className="text-sm text-neutral-500">Orders to Pack</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-orange-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Box className="w-5 h-5" />
                        </div>
                        {stats.restockAlerts > 0 && (
                            <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
                                Warning
                            </Badge>
                        )}
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.restockAlerts}</h3>
                    <p className="text-sm text-neutral-500">Restock Alerts</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-red-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        {stats.priorityIssues > 0 && (
                            <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">
                                Action Needed
                            </Badge>
                        )}
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.priorityIssues}</h3>
                    <p className="text-sm text-neutral-500">Priority Issues</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-green-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                            Today
                        </Badge>
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stats.tasksDone}</h3>
                    <p className="text-sm text-neutral-500">Tasks Completed</p>
                </div>
            </div>

            {/* Main Content Grid: Charts & Tasks */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: Charts & Quick Actions */}
                <div className="xl:col-span-2 space-y-8">
                    {/* CHART SECTION */}
                    <Card className="shadow-sm border-neutral-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <PieChartIcon className="w-5 h-5 text-blue-600" />
                                Order Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Task Board */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                                <div className="p-1.5 bg-neutral-100 rounded-lg">
                                    <ClipboardList className="w-4 h-4" />
                                </div>
                                Urgent Tasks
                            </h2>
                            <Button variant="link" size="sm" className="text-blue-600">View All Tasks</Button>
                        </div>

                        <div className="space-y-3">
                            {STAFF_TASKS.map(task => (
                                <div key={task.id} className="group bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-1.5 h-12 rounded-full ${task.priority === 'High' ? 'bg-red-500' :
                                            task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}></div>
                                        <div>
                                            <h4 className="font-semibold text-neutral-900 text-sm mb-1">{task.description}</h4>
                                            <div className="flex items-center gap-3 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Due: {task.dueTime}
                                                </span>
                                                <Badge variant="outline" className={`border-0 font-medium ${task.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                                    task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                                        'bg-neutral-100 text-neutral-700'
                                                    }`}>
                                                    {task.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        Start Task <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Mini Stats */}
                <div className="space-y-6">
                    <div>
                        <h2 className="font-bold text-lg text-neutral-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-neutral-500" />
                            Quick Actions
                        </h2>
                        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 space-y-3">
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Operational</p>

                            <Link to="/staff/pos" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 hover:border-blue-300 hover:bg-blue-50 group">
                                    <ClipboardList className="w-4 h-4 mr-3 text-blue-600 group-hover:text-blue-700" />
                                    <span className="text-neutral-700 group-hover:text-neutral-900">New POS Order</span>
                                </Button>
                            </Link>

                            <Link to="/staff/packing" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 hover:border-blue-300 hover:bg-blue-50 group">
                                    <PackageCheck className="w-4 h-4 mr-3 text-blue-600 group-hover:text-blue-700" />
                                    <span className="text-neutral-700 group-hover:text-neutral-900">Start Packing</span>
                                </Button>
                            </Link>

                            <div className="h-px bg-neutral-100 my-2" />

                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Inventory</p>

                            <Link to="/staff/inventory" className="block">
                                <Button variant="outline" className="w-full justify-start h-10 text-sm">
                                    <Box className="w-4 h-4 mr-3" />
                                    Check Inventory
                                </Button>
                            </Link>
                            <Link to="/staff/receipt" className="block">
                                <Button variant="outline" className="w-full justify-start h-10 text-sm">
                                    <CheckCircle2 className="w-4 h-4 mr-3" />
                                    Receive Goods
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
