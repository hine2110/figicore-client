import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ShoppingBag, TrendingUp, Calendar, History, Award, DollarSign
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PosOrder } from '@/types/pos.types';
import OrderDetailsModal from './OrderDetailsModal';
import { useState } from 'react';

interface CustomerProfileContentProps {
    customer: any;
    profileData: any;
}

export default function CustomerProfileContent({ customer, profileData }: CustomerProfileContentProps) {
    const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    if (!customer || !profileData) return null;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50/50">
            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-8 space-y-8">

                    {/* SECTION 1: STATISTICS */}
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-4 px-1">Overview</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Total Orders</p>
                                        <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                                            {profileData?.statistics?.total_orders || 0}
                                        </h3>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Total Spent</p>
                                        <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                                            {Number(profileData?.statistics?.total_spent || 0).toLocaleString('vi-VN')}₫
                                        </h3>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Avg. Order Value</p>
                                        <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                                            {Number(profileData?.statistics?.avg_order_value || 0).toLocaleString('vi-VN')}₫
                                        </h3>
                                    </div>
                                </CardContent>
                            </Card>
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
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setDetailsModalOpen(true);
                                        }}
                                    >
                                        <div className="flex items-start gap-4 mb-3 sm:mb-0">
                                            <div className="p-3 bg-neutral-100 rounded-xl text-neutral-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-neutral-900 font-mono">{order.order_code}</h4>
                                                    <Badge variant="outline" className={`text-[10px] ${order.status_code === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        order.status_code === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-neutral-100'
                                                        }`}>
                                                        {order.status_code}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-neutral-500 mt-1 flex items-center gap-2">
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
                                            <div className="text-xs text-neutral-500 mt-1 font-medium">
                                                {order.order_items?.length || 0} items
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!profileData?.orders || profileData.orders.length === 0) && (
                                    <div className="text-center py-12 text-neutral-400 bg-white rounded-xl border border-neutral-200 border-dashed">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">No order history available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: TOP PRODUCTS */}
                        <div className="lg:col-span-1">
                            {profileData?.top_products && profileData.top_products.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        <h3 className="text-lg font-bold text-neutral-900">Top Favorite Products</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {profileData.top_products.map((product: any, index: number) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all group">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shadow-sm shrink-0 ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                                            'bg-neutral-100 text-neutral-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-neutral-900 group-hover:text-amber-700 transition-colors truncate">{product.product_name}</p>
                                                    <p className="text-[10px] text-neutral-500">{product.quantity} units</p>
                                                </div>
                                                <div className="font-mono text-xs font-semibold text-neutral-700">
                                                    {Number(product.total_spent).toLocaleString('vi-VN')}₫
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
