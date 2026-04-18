import { useState, useEffect } from "react";
import axios from "axios";
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

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.figicore.com';

export default function OrderOversight() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/orders`, {
                params: statusFilter !== 'all' ? { status: statusFilter.toUpperCase() } : {},
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'DELIVERED':
                return { label: 'Delivered', variant: 'default', color: 'bg-green-100 text-green-700 border-green-200' };
            case 'PROCESSING':
            case 'PACKED':
            case 'SHIPPED':
                return { label: status, variant: 'secondary', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            case 'PENDING_PAYMENT':
            case 'WAITING_DEPOSIT':
                return { label: 'Pending', variant: 'outline', color: 'bg-amber-100 text-amber-700 border-amber-200' };
            case 'CANCELLED':
                return { label: 'Cancelled', variant: 'destructive', color: 'bg-red-100 text-red-700 border-red-200' };
            default:
                return { label: status, variant: 'outline', color: '' };
        }
    };

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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-neutral-400">
                                    Loading orders...
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-neutral-400">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : orders.map((order) => {
                            const badge = getStatusBadge(order.status_code);
                            return (
                                <TableRow key={order.order_id}>
                                    <TableCell className="font-mono font-medium">{order.order_code}</TableCell>
                                    <TableCell>{order.users?.full_name || 'Guest'}</TableCell>
                                    <TableCell className="text-neutral-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{order.order_items?.length || 0}</TableCell>
                                    <TableCell className="font-bold">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={badge.variant as any} className={badge.color}>
                                            {badge.label}
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
                                                <DropdownMenuItem onClick={() => window.location.href = `/admin/orders/${order.order_id}`}>
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
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
