import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Eye,
    RefreshCw,
    Search,
    ShoppingBag,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
} from 'lucide-react';
import { getOrders, cancelOrder } from '@/services/posService';
import { useToast } from '@/components/ui/use-toast';
import type { PosOrder } from '@/types/pos.types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import OrderDetailsModal from './OrderDetailsModal';
import { cn } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination-controls';

export default function OrderProcessing() {
    const [orders, setOrders] = useState<PosOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;

    const { toast } = useToast();

    useEffect(() => {
        loadOrders(currentPage);
    }, [currentPage]);

    const loadOrders = async (page: number) => {
        setLoading(true);
        try {
            const response = await getOrders(page, itemsPerPage);
            setOrders(response.data);
            setTotalItems(response.total || response.count); // Fallback if total missing (shouldn't happen)
            setTotalPages(Math.ceil((response.total || response.count) / itemsPerPage));
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm('Are you sure you want to cancel this order and restore its inventory?')) return;

        try {
            const response = await cancelOrder(orderId);
            toast({
                title: 'Order Cancelled',
                description: response.message,
            });
            setDetailsModalOpen(false);
            loadOrders(currentPage);
        } catch (error: any) {
            toast({
                title: 'Cancellation Failed',
                description: error.response?.data?.message || 'Failed to cancel order',
                variant: 'destructive',
            });
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || order.status_code === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return {
                    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    icon: CheckCircle2,
                    label: 'Completed'
                };
            case 'PENDING':
                return {
                    color: 'bg-amber-100 text-amber-700 border-amber-200',
                    icon: Clock,
                    label: 'Pending'
                };
            case 'PROCESSING':
                return {
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: RefreshCw,
                    label: 'Processing'
                };
            case 'CANCELLED':
                return {
                    color: 'bg-red-100 text-red-700 border-red-200',
                    icon: XCircle,
                    label: 'Cancelled'
                };
            default:
                return {
                    color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
                    icon: ShoppingBag,
                    label: status
                };
        }
    };

    const getPaymentMethodLabel = (code: string) => {
        switch (code) {
            case 'CASH': return 'Cash';
            case 'QR_BANK': return 'QR Transfer';
            case 'WALLET': return 'E-Wallet';
            case 'CARD': return 'Card';
            default: return code;
        }
    };

    return (
        <div className="h-full bg-neutral-50/50 p-6 flex flex-col gap-6 overflow-hidden animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Orders</h1>
                    <p className="text-neutral-500 font-medium mt-1">Manage and track daily transactions</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            placeholder="Search order # or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-white border-white shadow-sm ring-1 ring-neutral-200 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all hover:bg-neutral-50"
                        />
                    </div>
                    <Button
                        onClick={() => loadOrders(1)}
                        disabled={loading}
                        variant="outline"
                        className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 shadow-sm rounded-xl h-10 w-10 p-0"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
                {['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border",
                            statusFilter === status
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-md transform scale-105"
                                : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                        )}
                    >
                        {status === 'ALL' ? 'All Orders' : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Orders Table Container */}
            <div className="flex-1 bg-white rounded-[1.5rem] border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 backdrop-blur-sm sticky top-0 z-10 border-b border-neutral-100">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="font-bold text-neutral-500 text-xs uppercase tracking-wider pl-6">Order Code</TableHead>
                                <TableHead className="font-bold text-neutral-500 text-xs uppercase tracking-wider">Customer</TableHead>
                                <TableHead className="font-bold text-neutral-500 text-xs uppercase tracking-wider">Date</TableHead>
                                <TableHead className="font-bold text-neutral-500 text-xs uppercase tracking-wider">Payment</TableHead>
                                <TableHead className="font-bold text-neutral-500 text-xs uppercase tracking-wider text-right">Total</TableHead>
                                <TableHead className="font-bold text-neutral-500 text-xs uppercase tracking-wider text-center">Status</TableHead>
                                <TableHead className="font-bold text-neutral-500 text-xs uppercase tracking-wider text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 text-neutral-400">
                                            <RefreshCw className="w-8 h-8 animate-spin text-neutral-300" />
                                            <p className="font-medium">Loading orders...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 text-neutral-400">
                                            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-2">
                                                <ShoppingBag className="w-8 h-8 opacity-40" />
                                            </div>
                                            <p className="font-medium text-neutral-600">No orders found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => {
                                    const { color, icon: Icon, label } = getStatusInfo(order.status_code);
                                    return (
                                        <TableRow
                                            key={order.order_id}
                                            className="group hover:bg-neutral-50/80 transition-all border-neutral-100 cursor-pointer"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setDetailsModalOpen(true);
                                            }}
                                        >
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md inline-block text-xs">
                                                    {order.order_code}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {order.users ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                            {order.users.full_name.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-neutral-900">{order.users.full_name}</span>
                                                            <span className="text-xs text-neutral-500 font-medium">{order.users.phone}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                                            <ShoppingBag className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm text-neutral-500 font-medium italic">Walk-in Customer</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 text-neutral-600 font-medium text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                                    {format(new Date(order.created_at), 'dd MMM, HH:mm', { locale: enUS })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="bg-white font-medium text-neutral-600 border-neutral-200 shadow-sm rounded-lg px-2.5 py-1">
                                                    {getPaymentMethodLabel(order.payment_method_code)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <span className="font-bold text-neutral-900 text-[0.95rem]">
                                                    {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <Badge variant="secondary" className={`${color} border px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide shadow-sm inline-flex items-center gap-1.5`}>
                                                    <Icon className="w-3 h-3" />
                                                    {label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedOrder(order);
                                                        setDetailsModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer / Pagination placeholder if needed */}
                {/* Pagination Controls */}
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            <OrderDetailsModal
                order={selectedOrder}
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedOrder(null);
                }}
                onOrderCancelled={handleCancelOrder}
            />
        </div>
    );
}
