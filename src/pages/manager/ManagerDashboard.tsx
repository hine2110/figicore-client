import {
    Users,
    DollarSign,
    ShoppingBag,
    ArrowUpRight,
    Calendar,
    AlertCircle
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock Data for Charts
const REVENUE_DATA = [
    { name: "Mon", revenue: 4200, orders: 42 },
    { name: "Tue", revenue: 5100, orders: 51 },
    { name: "Wed", revenue: 4800, orders: 48 },
    { name: "Thu", revenue: 6200, orders: 62 },
    { name: "Fri", revenue: 7100, orders: 71 },
    { name: "Sat", revenue: 8500, orders: 85 },
    { name: "Sun", revenue: 6800, orders: 68 },
];

const CATEGORY_DATA = [
    { name: "Molly", value: 35 },
    { name: "Skullpanda", value: 25 },
    { name: "Dimoo", value: 20 },
    { name: "Pucky", value: 15 },
    { name: "Others", value: 5 },
];

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'];

export default function ManagerDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Business Overview</h1>
                    <p className="text-neutral-500">Real-time performance metrics and insights.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" /> Today
                    </Button>
                    <Button size="sm">Download Report</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Total Revenue</CardTitle>
                        <DollarSign className="w-4 h-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">$42,580</div>
                        <p className="text-xs text-green-600 flex items-center mt-1 font-medium">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5% from last week
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Orders Today</CardTitle>
                        <ShoppingBag className="w-4 h-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">89</div>
                        <p className="text-xs text-green-600 flex items-center mt-1 font-medium">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> +8% from yesterday
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Active Staff</CardTitle>
                        <Users className="w-4 h-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">12</div>
                        <p className="text-xs text-neutral-500 mt-1">
                            8 on duty, 4 on break
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Low Stock Alerts</CardTitle>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">7</div>
                        <p className="text-xs text-amber-600 flex items-center mt-1 font-medium">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>7-Day Revenue Trend</CardTitle>
                        <CardDescription>Revenue performance for the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} />
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Bar Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Sales by Category</CardTitle>
                        <CardDescription>Distribution of sales across product lines</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CATEGORY_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} unit="%" />
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value}%`, 'Market Share']}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {CATEGORY_DATA.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers List & Target */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Top Performers</CardTitle>
                        <CardDescription>Best selling products this week</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { name: "Molly Mystery Box", sales: "$4,950", trend: "+15%" },
                            { name: "Skullpanda Series 3", sales: "$3,520", trend: "+12%" },
                            { name: "Limited Edition Set", sales: "$6,750", trend: "+24%" },
                            { name: "Pop Mart Blind Box", sales: "$2,610", trend: "+8%" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs shadow-sm">
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-neutral-900">{item.name}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-green-200 text-green-700 bg-green-50">High Demand</Badge>
                                            <p className="text-xs text-green-600 font-medium">{item.trend}</p>
                                        </div>
                                    </div>
                                </div>
                                <span className="font-bold text-sm text-neutral-900">{item.sales}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="shadow-sm flex flex-col justify-center">
                    <CardContent className="pt-6">
                        <div className="text-center mb-6">
                            <h4 className="text-sm font-medium text-neutral-500 mb-2">Weekly Revenue Target</h4>
                            <span className="text-4xl font-bold text-neutral-900">$42,580</span>
                            <p className="text-sm text-neutral-500 mt-1">Goal: $50,000</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium">Progress</span>
                                <span className="font-bold text-indigo-600">85.2%</span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '85.2%' }}></div>
                            </div>
                            <p className="text-xs text-neutral-400 text-center mt-2">
                                $7,420 remaining to reach target
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-amber-900">Attention Required</h3>
                        <div className="text-sm text-amber-800 space-y-1 mt-1">
                            <p>• 12 pending orders require manager review</p>
                            <p>• 3 employees approaching overtime limits</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white border-amber-200 text-amber-900 hover:bg-amber-100 h-8 text-xs">Review Orders</Button>
                    <Button variant="outline" className="bg-white border-amber-200 text-amber-900 hover:bg-amber-100 h-8 text-xs">View Schedule</Button>
                </div>
            </div>
        </div>
    );
}
