import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Package, Clock, CheckCircle2, XCircle, AlertCircle,
    ArrowLeft, MapPin, CreditCard, Truck, Upload
} from 'lucide-react';
import { orderService } from '@/services/order.service';
import { cartService } from '@/services/cart.service';
import CustomerLayout from '@/layouts/CustomerLayout';
import { useToast } from '@/components/ui/use-toast';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/constants/order-status';

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isBuyAgainLoading, setIsBuyAgainLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchOrderDetail(id);
        }
    }, [id]);

    const fetchOrderDetail = async (orderId: string) => {
        try {
            const data = await orderService.getOrderById(orderId);
            setOrder(data);
        } catch (error) {
            console.error("Failed to fetch order details", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load order details.",
            });
            navigate('/customer/profile'); // Fallback
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const getStatusInfo = (status: string) => {
        // Fallback for icons if not in main config (could also be moved to constants if we export icons)
        // For now, keep icon mapping simple here
        const icon = {
            'PENDING_PAYMENT': Clock,
            'PROCESSING': Package,
            'PACKED': Package,
            'AWAITING_PICKUP': Truck,
            'SHIPPING': Truck,
            'COMPLETED': CheckCircle2,
            'CANCELLED': XCircle,
            'EXPIRED': AlertCircle,
            'DELIVERY_FAILED': AlertCircle,
        }[status] || Package;

        // Use imported constants or defaults
        // Note: We need to import constants in the file header
        const label = (ORDER_STATUS_LABELS as any)[status] || status;
        const color = (ORDER_STATUS_COLORS as any)[status] || 'text-gray-600 bg-gray-50';

        return { label, color, icon };
    };

    if (loading) {
        return (
            <CustomerLayout>
                <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </CustomerLayout>
        );
    }

    if (!order) return null;

    const statusInfo = getStatusInfo(order.status_code);
    const StatusIcon = statusInfo.icon;

    // Determine Logic for Timeline
    // Simplified Linear Flow: PENDING -> PROCESSING -> PACKED -> AWAITING -> SHIPPING -> COMPLETED
    const TIMELINE_STEPS = [
        { label: 'Order Placed', code: 'PENDING_PAYMENT', date: order.created_at },
        { label: 'Payment Confirmed', code: 'PROCESSING', date: order.updated_at },
        { label: 'Packed', code: 'PACKED', date: null },
        { label: 'Awaiting Pickup', code: 'AWAITING_PICKUP', date: null },
        { label: 'Shipping', code: 'SHIPPING', date: null },
        { label: 'Completed', code: 'COMPLETED', date: null },
    ];

    const getCurrentStepIndex = (status: string) => {
        // Map status to step index logic
        const statusMap: Record<string, number> = {
            'PENDING_PAYMENT': 0,
            'PROCESSING': 1,
            'PACKED': 2,
            'AWAITING_PICKUP': 3,
            'SHIPPING': 4,
            'COMPLETED': 5,
            'DELIVERY_FAILED': 4, // Show as stuck at shipping
            // Cancelled/Returned/Etc could be handled separately or show no active step
        };
        return statusMap[status] ?? -1;
    };

    const currentStepIndex = getCurrentStepIndex(order.status_code);

    const handleBuyAgain = async () => {
        setIsBuyAgainLoading(true);
        let successCount = 0;
        let failCount = 0;

        // Process items sequentially to prevent race conditions
        for (const item of order.order_items) {
            try {
                // Attempt to add to cart
                await cartService.addToCart({
                    productId: item.product_variants.product_id,
                    variantId: item.variant_id,
                    quantity: 1 // Default to 1 as requested for safe re-ordering
                });
                successCount++;
            } catch (error) {
                console.warn(`Item ${item.variant_id} OOS`, error);
                failCount++;
            }
        }

        setIsBuyAgainLoading(false);

        // DECISION MATRIX
        if (successCount > 0 && failCount === 0) {
            toast({
                title: "Added to Cart",
                description: "All items have been added to your cart!",
                className: "bg-green-50 border-green-200 text-green-800"
            });
            navigate('/customer/cart');
        } else if (successCount > 0 && failCount > 0) {
            toast({
                title: "Partially Successful",
                description: `Added ${successCount} items. ${failCount} items are out of stock.`,
                className: "bg-yellow-50 border-yellow-200 text-yellow-800"
            });
            navigate('/customer/cart'); // Redirect to checkout available items
        } else {
            // All failed
            toast({
                variant: "destructive",
                title: "Out of Stock",
                description: "These products are currently unavailable.",
            });
            // DO NOT REDIRECT
        }
    };

    return (
        <CustomerLayout>
            <div className="bg-neutral-50/50 min-h-screen py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => navigate('/customer/profile?tab=orders')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Orders
                    </Button>

                    <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 font-mono">{order.order_code || `ORD-${order.order_id}`}</h1>
                                <p className="text-slate-500 text-sm mt-1">Placed on {formatDate(order.created_at)}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${statusInfo.color}`}>
                                <StatusIcon className="w-4 h-4" />
                                <span className="font-medium text-sm">{statusInfo.label}</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Section A: Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Receiver Info
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 space-y-1">
                                        <p className="font-bold text-slate-900">{order.addresses?.recipient_name || order.users?.full_name || 'N/A'}</p>
                                        <p>{order.addresses?.recipient_phone || order.users?.phone || 'N/A'}</p>
                                        <p className="text-slate-500 mt-2">
                                            {[
                                                order.addresses?.detail_address,
                                                order.addresses?.ward_name,
                                                order.addresses?.district_name,
                                                order.addresses?.province_name
                                            ].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> Payment & Delivery
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Payment Method</span>
                                            <span className="font-medium text-slate-900 uppercase">{order.payment_method_code}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Delivery Method</span>
                                            <span className="font-medium text-slate-900">Standard Shipping</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section B: Timeline (Visual) */}
                            {currentStepIndex !== -1 && (
                                <div className="py-6 border-y border-slate-100">
                                    <div className="flex justify-between items-center relative">
                                        {/* Line */}
                                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10"></div>

                                        {TIMELINE_STEPS.map((step, idx) => {
                                            const isActive = idx <= currentStepIndex;

                                            return (
                                                <div key={idx} className="flex flex-col items-center bg-white px-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${isActive ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                                        {isActive ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                                                    </div>
                                                    <span className={`text-xs font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Section C: Items Table */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Order Items</h3>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Product</th>
                                                <th className="px-4 py-3 font-medium text-right">Price</th>
                                                <th className="px-4 py-3 font-medium text-center">Qty</th>
                                                <th className="px-4 py-3 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {order.order_items.map((item: any) => {
                                                const config = item.product_variants?.product_preorder_configs;
                                                const isPreOrder = !!config;
                                                // Check if finalized: Pre-order item AND Order is past Deposit stage
                                                // (i.e., PROCESSING, COMPLETED, PACKED, SHIPPING)
                                                // NOT WAITING_DEPOSIT, CANCELLED, EXPIRED, PENDING_PAYMENT (Retail)
                                                const isFinalized = isPreOrder && ['PROCESSING', 'PACKED', 'SHIPPING', 'AWAITING_PICKUP', 'COMPLETED'].includes(order.status_code);

                                                // Price Logic
                                                const displayUnitPrice = isFinalized ? Number(config.full_price) : Number(item.unit_price);
                                                const displayTotal = displayUnitPrice * item.quantity;
                                                const depositAmount = Number(config?.deposit_amount || 0);

                                                return (
                                                    <tr key={item.item_id}>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                                                                    {item.product_variants?.products?.media_urls?.[0] && (
                                                                        <img src={item.product_variants.products.media_urls[0]} alt="" className="w-full h-full object-cover" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{item.product_variants?.products?.name}</p>
                                                                    <p className="text-xs text-slate-500">{item.product_variants?.option_name}</p>

                                                                    {/* Pre-order Breakdown Note */}
                                                                    {isFinalized && (
                                                                        <div className="mt-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                                            Deposit: {formatPrice(depositAmount)} • Remaining: {formatPrice(displayUnitPrice - depositAmount)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right text-slate-600">
                                                            {formatPrice(displayUnitPrice)}
                                                        </td>
                                                        <td className="px-4 py-4 text-center text-slate-600">x{item.quantity}</td>
                                                        <td className="px-4 py-4 text-right font-medium text-slate-900">
                                                            {formatPrice(displayTotal)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50/50">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-2 text-right text-slate-500">Subtotal</td>
                                                <td className="px-4 py-2 text-right text-slate-900 font-medium">{formatPrice(Number(order.total_amount) - Number(order.shipping_fee))}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="px-4 py-2 text-right text-slate-500">Shipping Fee</td>
                                                <td className="px-4 py-2 text-right text-slate-900 font-medium">{formatPrice(Number(order.shipping_fee))}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="px-4 py-4 text-right items-center">
                                                    <span className="font-bold text-lg text-slate-900 mr-2">Total Amount</span>
                                                    <span className="text-xs text-slate-400 font-normal">(VAT included)</span>
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-xl text-slate-900">{formatPrice(Number(order.total_amount))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Section E: Package Info (Tracking & Evidence) */}
                            {order.shipments?.tracking_code ? (
                                <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                            <Package className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Package Information</h3>
                                            <p className="text-xs text-slate-500 mt-1">Tracking Code: <span className="font-mono bg-white px-2 py-0.5 rounded border ml-1 text-slate-900">{order.shipments.tracking_code}</span></p>

                                            {order.packing_video_urls ? (
                                                <div className="mt-4">
                                                    <p className="text-xs font-semibold text-slate-900 mb-2">Packing Evidence:</p>
                                                    {(() => {
                                                        try {
                                                            let urls = typeof order.packing_video_urls === 'string'
                                                                ? JSON.parse(order.packing_video_urls)
                                                                : order.packing_video_urls;

                                                            // Ensure it's an array
                                                            if (!Array.isArray(urls)) urls = [urls];

                                                            return (
                                                                <div className="space-y-4">
                                                                    {urls.map((url: string, index: number) => (
                                                                        <video
                                                                            key={index}
                                                                            controls
                                                                            className="w-full rounded-lg bg-black aspect-video"
                                                                            src={url}
                                                                        >
                                                                            Your browser does not support the video tag.
                                                                        </video>
                                                                    ))}
                                                                </div>
                                                            );
                                                        } catch (e) {
                                                            return <p className="text-xs text-red-500">Error loading packing video.</p>;
                                                        }
                                                    })()}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 mt-2 italic">No packing video available yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 text-center">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <Upload className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-900">Packing Evidence</h3>
                                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Tracking code and evidence will be available once the order is packed.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0">
                            {order.status_code === 'PENDING_PAYMENT' && (
                                <>
                                    <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Cancel Order</Button>
                                    <Button className="bg-slate-900 text-white hover:bg-black" onClick={() => navigate('/customer/checkout', { state: { orderId: order.order_id } })}>Pay Now via Checkout</Button>
                                </>
                            )}
                            {['COMPLETED', 'CANCELLED'].includes(order.status_code) && (
                                <Button
                                    variant="outline"
                                    onClick={handleBuyAgain}
                                    disabled={isBuyAgainLoading}
                                >
                                    {isBuyAgainLoading ? <span className="animate-spin mr-2">⏳</span> : null}
                                    Buy Again
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </CustomerLayout>
    );
}
