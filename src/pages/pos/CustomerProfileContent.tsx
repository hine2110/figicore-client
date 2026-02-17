import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ShoppingBag, TrendingUp, Calendar, History, Award, DollarSign, Package
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PosOrder } from '@/types/pos.types';
import OrderDetailsModal from './OrderDetailsModal';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CustomerProfileContentProps {
    customer: any;
    profileData: any;
}

export default function CustomerProfileContent({ customer, profileData }: CustomerProfileContentProps) {
    const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    if (!customer || !profileData) return null;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50/50 animate-in fade-in duration-500">
            <ScrollArea className="flex-1">
                <div className="max-w-5xl mx-auto p-8 space-y-8">

                    {/* SECTION 1: STATISTICS */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Overview</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <StatsCard
                                icon={ShoppingBag}
                                label="Total Orders"
                                value={profileData?.statistics?.total_orders || 0}
                                color="text-blue-600"
                                bg="bg-blue-50"
                                border="border-blue-100"
                            />
                            <StatsCard
                                icon={DollarSign}
                                label="Total Spent"
                                value={`${Number(profileData?.statistics?.total_spent || 0).toLocaleString('vi-VN')}₫`}
                                color="text-emerald-600"
                                bg="bg-emerald-50"
                                border="border-emerald-100"
                            />
                            <StatsCard
                                icon={TrendingUp}
                                label="Avg. Order Value"
                                value={`${Number(profileData?.statistics?.avg_order_value || 0).toLocaleString('vi-VN')}₫`}
                                color="text-purple-600"
                                bg="bg-purple-50"
                                border="border-purple-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: ORDER HISTORY */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <History className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-bold text-neutral-900">Order History</h3>
                            </div>

                            <div className="space-y-3">
                                {profileData?.orders?.map((order: any) => (
                                    <div
                                        key={order.order_id}
                                        className="group bg-white rounded-2xl border border-neutral-200 p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setDetailsModalOpen(true);
                                        }}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>

                                        <div className="relative z-10 flex justify-between items-center sm:items-start flex-wrap gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-neutral-50 rounded-xl text-neutral-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                    <ShoppingBag className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-neutral-900 font-mono tracking-tight">{order.order_code}</h4>
                                                        <StatusBadge status={order.status_code} />
                                                    </div>
                                                    <div className="text-xs text-neutral-500 flex items-center gap-2 font-medium">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm', { locale: enUS })}
                                                        <span className="text-neutral-300">•</span>
                                                        <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: enUS })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-bold text-neutral-900 text-lg">
                                                    {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                                </div>
                                                <div className="text-xs text-neutral-500 mt-1 font-medium bg-neutral-100 rounded-md px-1.5 py-0.5 inline-block">
                                                    {order.order_items?.length || 0} items
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!profileData?.orders || profileData.orders.length === 0) && (
                                    <div className="text-center py-12 text-neutral-400 bg-white/50 rounded-2xl border border-neutral-200 border-dashed backdrop-blur-sm">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">No order history available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: TOP PRODUCTS */}
                        <div className="lg:col-span-1">
                            {profileData?.top_products && profileData.top_products.length > 0 && (
                                <div className="bg-white rounded-[1.5rem] border border-neutral-200 shadow-sm p-5 sticky top-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        <h3 className="text-lg font-bold text-neutral-900">Favorites</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {profileData.top_products.map((product: any, index: number) => (
                                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm shrink-0 transition-transform group-hover:scale-110",
                                                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-yellow-200" :
                                                        index === 1 ? "bg-gradient-to-br from-neutral-300 to-neutral-500 text-white" :
                                                            index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-200" :
                                                                "bg-neutral-100 text-neutral-600"
                                                )}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-neutral-900 line-clamp-1 group-hover:text-amber-700 transition-colors" title={product.product_name}>
                                                        {product.product_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-normal bg-neutral-100 text-neutral-500">
                                                            {product.quantity} bought
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="font-mono text-xs font-bold text-neutral-700">
                                                    {Number(product.total_spent).toLocaleString('vi-VN')}₫
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!profileData?.top_products || profileData.top_products.length === 0) && (
                                <div className="bg-neutral-50 rounded-2xl p-8 text-center border border-neutral-100">
                                    <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-400 font-medium">No favorite products yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </ScrollArea>

            {/* Order Details Modal Integration */}
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

function StatsCard({ icon: Icon, label, value, color, bg, border }: any) {
    return (
        <Card className={cn(
            "border shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 rounded-[1.25rem] group overflow-hidden relative",
            border
        )}>
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-0 group-hover:opacity-10 transition-opacity blur-xl", bg.replace('bg-', 'bg-text-'))}></div>
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
                <div className={cn("p-3.5 rounded-2xl transition-transform group-hover:scale-110 duration-300", bg, color)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-0.5">{label}</p>
                    <h3 className="text-2xl font-bold text-neutral-900 tracking-tight leading-none">
                        {value}
                    </h3>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
        PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
        CANCELLED: 'bg-red-50 text-red-700 border-red-200',
        DEFAULT: 'bg-neutral-100 text-neutral-600 border-neutral-200'
    };

    // safe access
    const styleClass = (styles as any)[status] || styles.DEFAULT;

    return (
        <Badge variant="outline" className={cn("text-[10px] font-bold border px-1.5 py-0 shadow-sm", styleClass)}>
            {status}
        </Badge>
    );
}
