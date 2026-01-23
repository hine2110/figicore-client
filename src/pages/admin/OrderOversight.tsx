import { useState } from "react";
import { Download, Filter, Search, Eye, Edit2, Archive, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock Data
const ORDERS = [
    { id: "ORD-2024-001", customer: "Alice Freeman", items: 4, total: 320.50, status: "Processing", date: "2024-01-20" },
    { id: "ORD-2024-002", customer: "Bob Smith", items: 1, total: 45.00, status: "Delivered", date: "2024-01-19" },
    { id: "ORD-2024-003", customer: "Charlie Davis", items: 12, total: 1250.00, status: "Pending", date: "2024-01-19" },
    { id: "ORD-2024-004", customer: "Diana Prince", items: 2, total: 89.99, status: "Cancelled", date: "2024-01-18" },
    { id: "ORD-2024-005", customer: "Evan Wright", items: 3, total: 210.00, status: "Processing", date: "2024-01-18" },
];

export default function OrderOversight() {
    const [statusFilter, setStatusFilter] = useState("all");

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Order Oversight</h1>
                    <p className="text-neutral-500">Monitor and manage global order fulfillment.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input placeholder="Search by Order ID or Customer..." className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="secondary">
                    <Filter className="w-4 h-4 mr-2" /> More Filters
                </Button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                            <TableHead className="w-[150px]">Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ORDERS.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono font-medium">{order.id}</TableCell>
                                <TableCell>{order.customer}</TableCell>
                                <TableCell className="text-neutral-500">{order.date}</TableCell>
                                <TableCell>{order.items}</TableCell>
                                <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.status === 'Delivered' ? 'default' : // Greenish usually default or custom
                                            order.status === 'Processing' ? 'secondary' :
                                                order.status === 'Cancelled' ? 'destructive' : 'outline'
                                    } className={
                                        order.status === 'Delivered' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' :
                                            order.status === 'Processing' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' :
                                                order.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' : ''
                                    }>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Edit2 className="mr-2 h-4 w-4" /> Update Status
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                                <Archive className="mr-2 h-4 w-4" /> Cancel Order
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
