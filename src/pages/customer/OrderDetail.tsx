import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Package, Clock, CheckCircle2, XCircle, AlertCircle,
    ArrowLeft, MapPin, CreditCard, Truck, Upload
} from 'lucide-react';
import { orderService } from '@/services/order.service';
import CustomerLayout from '@/layouts/CustomerLayout';
import { useToast } from '@/components/ui/use-toast';

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        const config: Record<string, any> = {
            'PENDING_PAYMENT': { label: 'Waiting for Payment', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Clock },
            'PROCESSING': { label: 'Processing', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Package },
            'SHIPPING': { label: 'Shipping', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Truck },
            'COMPLETED': { label: 'Completed', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 },
            'CANCELLED': { label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
            'EXPIRED': { label: 'Expired', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: AlertCircle },
        };
        return config[status] || { label: status, color: 'text-gray-600 bg-gray-50', icon: Package };
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
    // Simplify for now: PENDING -> PROCESSING -> SHIPPING -> COMPLETED
    const TIMELINE_STEPS = [
        { label: 'Order Placed', code: 'PENDING_PAYMENT', date: order.created_at },
        { label: 'Payment Confirmed', code: 'PROCESSING', date: order.updated_at }, // Approximation
        { label: 'Packed', code: 'PACKED', date: null },
        { label: 'Shipping', code: 'SHIPPING', date: null },
        { label: 'Delivered', code: 'COMPLETED', date: null },
    ];

    const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.code === order.status_code);
    // Simple logic: if status is beyond processing, assume confirmed.
    // This is rudimentary visualization.

    return (
        <CustomerLayout>
            <div className="bg-neutral-50/50 min-h-screen py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => navigate('/customer/profile')}>
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
                                        <p className="font-bold text-slate-900">{order.addresses?.recipient_name || 'N/A'}</p>
                                        <p>{order.addresses?.recipient_phone || 'N/A'}</p>
                                        <p className="text-slate-500 mt-2">{order.addresses?.detail_address}, {order.addresses?.ward_code}, {order.addresses?.district_id}</p>
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
                            {['PENDING_PAYMENT', 'PROCESSING', 'SHIPPING', 'COMPLETED'].includes(order.status_code) && (
                                <div className="py-6 border-y border-slate-100">
                                    <div className="flex justify-between items-center relative">
                                        {/* Line */}
                                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10"></div>

                                        {TIMELINE_STEPS.slice(0, 4).map((step, idx) => {
                                            // Hacky active check
                                            const isActive = idx <= (['PENDING_PAYMENT', 'PROCESSING', 'SHIPPING', 'COMPLETED'].indexOf(order.status_code));

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
                                            {order.order_items.map((item: any) => (
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
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-slate-600">{formatPrice(Number(item.unit_price))}</td>
                                                    <td className="px-4 py-4 text-center text-slate-600">x{item.quantity}</td>
                                                    <td className="px-4 py-4 text-right font-medium text-slate-900">{formatPrice(Number(item.total_price))}</td>
                                                </tr>
                                            ))}
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

                            {/* Section E: Evidence Placeholder */}
                            <div className="border border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Upload className="w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-900">Packing Evidence</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Video/Images will be available here once the warehouse updates the status.</p>
                            </div>
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
                                <Button variant="outline" onClick={() => navigate('/customer/retail')}>Buy Again</Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </CustomerLayout>
    );
}
