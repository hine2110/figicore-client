import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2, ChevronLeft, ChevronRight, Truck, RotateCcw, ArrowLeftCircle, AlertTriangle } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { useNavigate } from 'react-router-dom';

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'PROCESSING', 'PACKED', 'AWAITING_PICKUP', 'SHIPPING', 'RETURN_REQUESTED', 'RETURNING', 'RETURN_APPROVED'];
const COMPLETED_STATUSES = ['COMPLETED', 'REFUNDED', 'RETURNED'];
const CANCELLED_STATUSES = ['CANCELLED', 'EXPIRED', 'DELIVERY_FAILED', 'RETURN_REJECTED'];

const ITEMS_PER_PAGE = 5;

const STATUS_CONFIG: Record<string, { label: string, className: string, icon: any }> = {
    'PENDING_PAYMENT': { label: 'Pending Payment', className: 'bg-orange-100 text-orange-700', icon: Clock },
    'PROCESSING': { label: 'Processing', className: 'bg-blue-100 text-blue-700', icon: Package },
    'PACKED': { label: 'Packed', className: 'bg-indigo-100 text-indigo-700', icon: Package },
    'AWAITING_PICKUP': { label: 'Awaiting Pickup', className: 'bg-orange-100 text-orange-800', icon: Truck },
    'SHIPPING': { label: 'Shipping', className: 'bg-purple-100 text-purple-700', icon: Truck },
    'COMPLETED': { label: 'Completed', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    'CANCELLED': { label: 'Cancelled', className: 'bg-red-100 text-red-700', icon: XCircle },
    'EXPIRED': { label: 'Expired', className: 'bg-gray-100 text-gray-700', icon: AlertCircle },
    'DELIVERY_FAILED': { label: 'Delivery Failed', className: 'bg-red-100 text-red-700', icon: AlertCircle },
    'REFUNDED': { label: 'Refunded', className: 'bg-gray-100 text-gray-700', icon: RotateCcw },
    'RETURNED': { label: 'Returned', className: 'bg-gray-100 text-gray-700', icon: ArrowLeftCircle },
    'RETURN_REQUESTED': { label: 'Return Requested', className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
    'RETURNING': { label: 'Returning', className: 'bg-yellow-100 text-yellow-700', icon: Truck },
    'RETURN_APPROVED': { label: 'Return Approved', className: 'bg-blue-100 text-blue-700', icon: Clock },
    'RETURN_REJECTED': { label: 'Return Rejected', className: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function MyOrdersTab() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, []);

    // Reset page on tab change
    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const fetchOrders = async () => {
        try {
            const res = await orderService.getMyOrders({ page: 1, limit: 100 });
            const data = Array.isArray(res) ? res : (res as any).data || [];
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredOrders = () => {
        return orders.filter(o => {
            if (activeTab === 'active') return ACTIVE_STATUSES.includes(o.status_code);
            if (activeTab === 'completed') return COMPLETED_STATUSES.includes(o.status_code);
            if (activeTab === 'cancelled') return CANCELLED_STATUSES.includes(o.status_code);
            return true;
        });
    };

    const filteredOrders = getFilteredOrders();
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const displayedOrders = filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const RenderOrderCard = ({ order }: { order: any }) => {
        const status = STATUS_CONFIG[order.status_code] || { label: order.status_code, className: 'bg-gray-100 text-gray-700', icon: Package };
        const StatusIcon = status.icon;

        return (
            <div key={order.order_id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                {/* Header: ID, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">{order.order_code || `ORD-${order.order_id}`}</span>
                        <span className="text-xs text-slate-400">|</span>
                        <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                    </div>
                    <div>
                        <Badge variant="secondary" className={`${status.className} border-0 flex items-center gap-1 opacity-90 text-[10px] h-5`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                        </Badge>
                    </div>
                </div>

                {/* Body: Items Preview & Total */}
                <div className="flex items-start justify-between gap-4">
                    {/* Items List (Compact) */}
                    <div className="flex-1 space-y-2 min-w-0">
                        {order.order_items.map((item: any) => (
                            <div key={item.item_id} className="flex gap-3 items-center group">
                                <div className="w-9 h-9 rounded bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                                    {item.product_variants?.products?.media_urls?.[0] ? (
                                        <img src={item.product_variants.products.media_urls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-4 h-4" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate pr-2">{item.product_variants?.products?.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{item.product_variants?.option_name} x{item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Side: Total & Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</p>
                            <p className="font-bold text-base text-slate-900">{formatPrice(order.total_amount)}</p>
                        </div>
                        <div className="flex gap-2">
                            {order.status_code === 'PENDING_PAYMENT' && (
                                <Button
                                    size="sm"
                                    className="h-8 text-xs bg-slate-900 text-white hover:bg-black"
                                    onClick={() => navigate('/customer/checkout', { state: { orderId: order.order_id } })}
                                >
                                    Pay Now
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1"
                                onClick={() => navigate(`/customer/orders/${order.order_id}`)}
                            >
                                Details <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
        );
    }

    const EmptyState = ({ message }: { message: string }) => (
        <div className="p-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-center">
            <Package className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">{message}</p>
            {activeTab === 'active' &&
                <Button variant="link" onClick={() => navigate('/customer/retail')} className="mt-2 text-blue-600">Start Shopping</Button>
            }
        </div>
    );

    return (
        <div className="animate-in fade-in duration-300">
            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Active</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Cancelled</TabsTrigger>
                </TabsList>

                {/* Content Area */}
                <div className="space-y-4">
                    {displayedOrders.length === 0 ? (
                        <EmptyState message={`No ${activeTab} orders found.`} />
                    ) : (
                        displayedOrders.map(order => (
                            <RenderOrderCard key={order.order_id} order={order} />
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="w-8 h-8 rounded-full"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium text-slate-600">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="w-8 h-8 rounded-full"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </Tabs>
        </div>
    );
}
