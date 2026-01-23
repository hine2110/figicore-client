import { Download, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const MONTHLY_DATA = [
    { name: "Jan", revenue: 45000, orders: 420 },
    { name: "Feb", revenue: 52000, orders: 480 },
    { name: "Mar", revenue: 48000, orders: 445 },
    { name: "Apr", revenue: 61000, orders: 520 },
    { name: "May", revenue: 58000, orders: 495 },
    { name: "Jun", revenue: 67000, orders: 580 },
];

const SALES_REPORTS = [
    { id: "RPT-2024-001", date: "2024-06-01", type: "Monthly Summary", author: "System", status: "Generated" },
    { id: "RPT-2024-002", date: "2024-06-02", type: "Inventory Valuation", author: "Mike Chen", status: "Generated" },
    { id: "RPT-2024-003", date: "2024-06-05", type: "Performance Audit", author: "Sarah Johnson", status: "Pending Review" },
    { id: "RPT-2024-004", date: "2024-06-10", type: "Sales Forecast", author: "System", status: "Generated" },
];

export default function SalesReports() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Revenue & Sales Reports</h1>
                    <p className="text-neutral-500">Comprehensive business analytics and trends.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" /> Filters
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Calendar className="w-4 h-4" /> Last 6 Months
                    </Button>
                    <Button className="gap-2 bg-neutral-900">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly Revenue & Orders</CardTitle>
                        <CardDescription>6-month performance comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={MONTHLY_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#111827" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">Total Revenue (YTD)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-neutral-900">$331,000</div>
                            <p className="text-xs text-green-600 font-medium mt-1">+18.2% from previous year</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">Avg Order Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-neutral-900">$112.59</div>
                            <p className="text-xs text-green-600 font-medium mt-1">+5.1% increase</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">Items Sold</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-neutral-900">4,823</div>
                            <p className="text-xs text-neutral-500 mt-1">Across all categories</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Reports List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Generated financial and operational documents</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Report ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {SALES_REPORTS.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-mono text-xs font-medium">{report.id}</TableCell>
                                    <TableCell>{report.type}</TableCell>
                                    <TableCell>{report.date}</TableCell>
                                    <TableCell>{report.author}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${report.status === 'Generated' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {report.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
