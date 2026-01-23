import {
    Users,
    DollarSign,
    ArrowUpRight,
    ShieldAlert,
    Activity
} from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock Data
const REVENUE_DATA = [
    { name: "Mon", revenue: 12400, activeUsers: 2400 },
    { name: "Tue", revenue: 14500, activeUsers: 1398 },
    { name: "Wed", revenue: 18200, activeUsers: 9800 },
    { name: "Thu", revenue: 21000, activeUsers: 3908 },
    { name: "Fri", revenue: 24500, activeUsers: 4800 },
    { name: "Sat", revenue: 28900, activeUsers: 3800 },
    { name: "Sun", revenue: 22400, activeUsers: 4300 },
];

export default function AdminDashboard() {

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">System Overview</h1>
                    <p className="text-neutral-500 mt-1">Real-time monitoring and administrative controls.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select defaultValue="7d">
                        <SelectTrigger className="w-[140px] bg-white">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Critical Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-sm border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Total Revenue</CardTitle>
                        <DollarSign className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">$142,384</div>
                        <p className="text-xs text-green-600 flex items-center mt-1 font-bold">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> +20.1% vs last period
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Active Users</CardTitle>
                        <Users className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">4,392</div>
                        <p className="text-xs text-green-600 flex items-center mt-1 font-bold">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> +12% new signups
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Pending Issues</CardTitle>
                        <ShieldAlert className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">23</div>
                        <p className="text-xs text-amber-600 flex items-center mt-1 font-bold">
                            Alerts require attention
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-zinc-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">System Health</CardTitle>
                        <Activity className="w-5 h-5 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900">99.9%</div>
                        <p className="text-xs text-green-600 flex items-center mt-1 font-bold">
                            All services operational
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Platform Traffic & Revenue</CardTitle>
                        <CardDescription>Correlated data for system load and financial performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Admin Actions</CardTitle>
                        <CardDescription>Log of recent system modifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-6">
                            {[
                                { user: "Admin User", action: "Updated System Settings", time: "2 mins ago", type: "system" },
                                { user: "Sarah Manager", action: "Approved Refund #RF-921", time: "15 mins ago", type: "finance" },
                                { user: "Admin User", action: "Created New Role: Editor", time: "1 hour ago", type: "security" },
                                { user: "Mike Staff", action: "Flagged Suspicious Login", time: "2 hours ago", type: "alert" },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.type === 'system' ? 'bg-blue-500' :
                                        log.type === 'finance' ? 'bg-green-500' :
                                            log.type === 'security' ? 'bg-purple-500' : 'bg-red-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900">{log.action}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-neutral-500">{log.user}</p>
                                            <span className="text-neutral-300">•</span>
                                            <p className="text-xs text-neutral-400">{log.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full text-xs">View All Audit Logs</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
