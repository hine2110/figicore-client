import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2, ChevronLeft, ChevronRight, Truck, RotateCcw, ArrowLeftCircle, AlertTriangle, Info } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { useNavigate } from 'react-router-dom';

// New Tab Configuration
const TABS = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'To Pay' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'SHIPPED', label: 'Shipping' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
];

// Status Mapping Logic
const STATUS_GROUPS: Record<string, string[]> = {
    'ALL': [], // Special case: All
    'PENDING': ['PENDING_PAYMENT', 'WAITING_DEPOSIT', 'READY_FOR_PAYMENT'],
    'PROCESSING': ['PROCESSING', 'PACKED', 'DEPOSITED', 'CONFIRMED'],
    'SHIPPED': ['SHIPPING', 'AWAITING_PICKUP', 'RETURN_REQUESTED', 'RETURNING', 'RETURN_APPROVED'], // Grouping shipping-related here
    'COMPLETED': ['COMPLETED', 'REFUNDED', 'RETURNED'],
    'CANCELLED': ['CANCELLED', 'EXPIRED', 'DELIVERY_FAILED', 'RETURN_REJECTED']
};

const ITEMS_PER_PAGE = 5;

const STATUS_CONFIG: Record<string, { label: string, className: string, icon: any }> = {
    'PENDING_PAYMENT': { label: 'Pending Payment', className: 'bg-orange-100 text-orange-700', icon: Clock },
    'WAITING_DEPOSIT': { label: 'Waiting for Deposit', className: 'bg-orange-100 text-orange-850 border-orange-200', icon: AlertCircle }, // Updated Label
    'DEPOSITED': { label: 'Deposit Paid - Waiting for Stock', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Info }, // New Badge
    'PROCESSING': { label: 'Processing', className: 'bg-blue-100 text-blue-700', icon: Package },
    'PACKED': { label: 'Packed', className: 'bg-indigo-100 text-indigo-700', icon: Package },
    'CONFIRMED': { label: 'Confirmed', className: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
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
    const [activeTab, setActiveTab] = useState("ALL");
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
            // SINGLE SOURCE OF TRUTH: Just fetch Orders. 
            // Backend now includes 'contract_deposit' info to drive distinct UI states.
            const ordersRes = await orderService.getMyOrders({ page: 1, limit: 100 });
            const ordersData = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any).data || [];

            setOrders(ordersData);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic: Purely based on Status Tabs + Enriched Order Status
    const getFilteredOrders = () => {
        const allowedStatuses = STATUS_GROUPS[activeTab] || [];

        return orders.filter(o => {
            // 1. Determine "Effective Status" for filtering
            let effectiveStatus = o.status_code;

            // Check if this is a Deposit Order with a linked Contract
            if (o.contract_deposit && o.contract_deposit.length > 0) {
                // Use the first contract's status to drive visibility
                const contract = o.contract_deposit[0];

                if (contract.status_code === 'READY_FOR_PAYMENT') effectiveStatus = 'PENDING_PAYMENT'; // Show in 'To Pay'
                else if (contract.status_code === 'DEPOSITED') effectiveStatus = 'PROCESSING'; // Show in 'Processing'
                else if (contract.status_code === 'COMPLETED') effectiveStatus = 'COMPLETED';
            }

            if (activeTab === 'ALL') return true;

            return STATUS_GROUPS[activeTab]?.includes(effectiveStatus) || allowedStatuses.includes(o.status_code);
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    };

    const filteredOrders = getFilteredOrders();
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const displayedOrders = filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const RenderOrderCard = ({ order }: { order: any }) => {
        let status = STATUS_CONFIG[order.status_code] || { label: order.status_code, className: 'bg-gray-100 text-gray-700', icon: Package };
        let showPayBalance = false;
        let contractId = null;

        // CHECK IF IS DEPOSIT ORDER
        if (order.contract_deposit && order.contract_deposit.length > 0) {
            const contract = order.contract_deposit[0];

            if (contract.status_code === 'READY_FOR_PAYMENT') {
                status = {
                    label: "Action Required: Pay Balance",
                    className: "bg-orange-100 text-orange-800 border-orange-200 animate-pulse border",
                    icon: AlertCircle
                };
                showPayBalance = true;
                contractId = contract.contract_id;
            } else if (contract.status_code === 'DEPOSITED') {
                status = {
                    label: "Deposited (Waiting for Stock)",
                    className: "bg-blue-50 text-blue-700 border-blue-200 border",
                    icon: Info
                };
            } else if (contract.status_code === 'COMPLETED') {
                status = {
                    label: "Pre-order Completed",
                    className: "bg-green-50 text-green-700 border-green-200 border",
                    icon: CheckCircle2
                };
            }
        }

        const StatusIcon = status.icon;

        return (
            <div key={order.order_id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow relative overflow-hidden">

                {/* Pre-order Tag Overlay */}
                {(order.contract_deposit?.length > 0) && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-bl-lg z-10">
                        Pre-order Deposit
                    </div>
                )}

                {/* Header: ID, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">{order.order_code || `ORD-${order.order_id}`}</span>
                        <span className="text-xs text-slate-400">|</span>
                        <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="mr-16 md:mr-0">
                        <Badge variant="secondary" className={`${status.className} border flex items-center gap-1.5 py-1 px-2.5 opacity-100 text-[11px] font-semibold tracking-wide`}>
                            <StatusIcon className="w-3.5 h-3.5" />
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
                        <div className="flex gap-2 flex-col md:flex-row items-end">

                            {/* Standard Pay Button */}
                            {['PENDING_PAYMENT', 'WAITING_DEPOSIT'].includes(order.status_code) && !showPayBalance && (
                                <Button
                                    size="sm"
                                    className="h-8 text-xs bg-slate-900 text-white hover:bg-black"
                                    onClick={() => navigate('/customer/checkout', { state: { orderId: order.order_id } })}
                                >
                                    Pay Now
                                </Button>
                            )}

                            {/* Pre-order Final Payment Button */}
                            {showPayBalance && contractId && (
                                <Button
                                    size="sm"
                                    className="h-8 text-xs bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200 animate-pulse"
                                    onClick={() => navigate(`/customer/preorders/${contractId}/pay`)}
                                >
                                    Pay Balance
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
            {activeTab === 'ALL' &&
                <Button variant="link" onClick={() => navigate('/customer/retail')} className="mt-2 text-blue-600">Start Shopping</Button>
            }
        </div>
    );

    return (
        <div className="animate-in fade-in duration-300">
            <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-6 bg-slate-100 p-1 rounded-xl">
                    {TABS.map(tab => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="rounded-lg text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Content Area */}
                <div className="space-y-4">
                    {displayedOrders.length === 0 ? (
                        <EmptyState message={`No orders found in ${TABS.find(t => t.id === activeTab)?.label}.`} />
                    ) : (
                        displayedOrders.map((item: any) => (
                            <RenderOrderCard key={item.order_id} order={item} />
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
