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
import { Eye, RefreshCw, Search, ShoppingBag, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getOrders } from '@/services/posService';
import type { PosOrder } from '@/types/pos.types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import OrderDetailsModal from './OrderDetailsModal';
import { Card, CardContent } from '@/components/ui/card';

export default function OrderProcessing() {
    const [orders, setOrders] = useState<PosOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200', icon: CheckCircle2, label: 'Completed' };
            case 'PENDING':
                return { color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200', icon: Clock, label: 'Pending' };
            case 'PROCESSING':
                return { color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200', icon: RefreshCw, label: 'Processing' };
            case 'CANCELLED':
                return { color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200', icon: XCircle, label: 'Cancelled' };
            default:
                return { color: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200', icon: ShoppingBag, label: status };
        }
    };

    const getPaymentMethodLabel = (code: string) => {
        switch (code) {
            case 'CASH':
                return 'Cash';
            case 'QR_BANK':
                return 'QR Transfer';
            case 'WALLET':
                return 'E-Wallet';
            case 'CARD':
                return 'Card';
            default:
                return code;
        }
    };

    return (
        <div className="h-full bg-neutral-50 p-6 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Order Management</h1>
                    <p className="text-neutral-500 mt-1">
                        {orders.length > 0
                            ? `Showing ${filteredOrders.length} orders from current session`
                            : 'No orders found in this session'}
                    </p>
                </div>
                <Button
                    onClick={loadOrders}
                    disabled={loading}
                    className="bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh List
                </Button>
            </div>

            {/* Filter Bar */}
            <Card className="mb-6 shadow-sm border-neutral-200 shrink-0">
                <CardContent className="p-4 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                            placeholder="Search by order code or customer name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-neutral-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <div className="flex-1 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <Table>
                        <TableHeader className="bg-neutral-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="font-semibold text-neutral-600">Order Code</TableHead>
                                <TableHead className="font-semibold text-neutral-600">Customer</TableHead>
                                <TableHead className="font-semibold text-neutral-600">Date</TableHead>
                                <TableHead className="font-semibold text-neutral-600">Payment</TableHead>
                                <TableHead className="font-semibold text-neutral-600 text-right">Total</TableHead>
                                <TableHead className="font-semibold text-neutral-600 text-center">Status</TableHead>
                                <TableHead className="font-semibold text-neutral-600 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-neutral-500">
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                            <p>Loading orders...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-neutral-400">
                                            <ShoppingBag className="w-10 h-10 opacity-20" />
                                            <p>No orders found matching your search</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => {
                                    const { color, icon: Icon, label } = getStatusInfo(order.status_code);
                                    return (
                                        <TableRow key={order.order_id} className="hover:bg-neutral-50 transition-colors cursor-pointer group" onClick={() => {
                                            setSelectedOrder(order);
                                            setDetailsModalOpen(true);
                                        }}>
                                            <TableCell className="font-mono font-medium text-neutral-900">
                                                {order.order_code}
                                            </TableCell>
                                            <TableCell>
                                                {order.users ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-neutral-900">{order.users.full_name}</span>
                                                        <span className="text-xs text-neutral-500">{order.users.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400 italic">Walk-in Customer</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-neutral-600">
                                                {format(new Date(order.created_at), 'HH:mm dd/MM/yyyy', { locale: enUS })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-neutral-50 font-normal text-neutral-600 border-neutral-200">
                                                    {getPaymentMethodLabel(order.payment_method_code)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-neutral-900">
                                                {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className={`${color} border px-2 py-0.5 whitespace-nowrap`}>
                                                    <Icon className="w-3 h-3 mr-1" />
                                                    {label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setSelectedOrder(order);
                                                        setDetailsModalOpen(true);
                                                    }}
                                                    title="View Details"
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
            </div>

            <OrderDetailsModal
                order={selectedOrder}
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedOrder(null);
                }}
            />
        </div>
    );
}
