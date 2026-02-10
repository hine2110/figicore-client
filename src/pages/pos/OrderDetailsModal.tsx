import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    CreditCard, User,
    Printer, CheckCircle2, Clock, XCircle, ShoppingBag
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PosOrder } from '@/types/pos.types';

interface OrderDetailsModalProps {
    order: PosOrder | null;
    open: boolean;
    onClose: () => void;
}

export default function OrderDetailsModal({ order, open, onClose }: OrderDetailsModalProps) {
    if (!order) return null;

    const getPaymentMethodLabel = (code: string) => {
        switch (code) {
            case 'CASH': return 'Cash';
            case 'QR_BANK': return 'QR Transfer';
            case 'WALLET': return 'E-Wallet';
            case 'CARD': return 'Card';
            default: return code;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Completed' };
            case 'PENDING': return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' };
            case 'CANCELLED': return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' };
            default: return { color: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Clock, label: status };
        }
    };

    const StatusInfo = getStatusStyles(order.status_code);
    const StatusIcon = StatusInfo.icon;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white p-0 gap-0 overflow-hidden border-neutral-200 shadow-2xl">

                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <div>
                        <DialogTitle className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                            Order Details
                            <Badge variant="secondary" className={`font-medium ${StatusInfo.color} border px-2.5 py-0.5 h-6 text-xs`}>
                                <StatusIcon className="w-3 h-3 mr-1.5" />
                                {StatusInfo.label}
                            </Badge>
                        </DialogTitle>
                        <p className="text-sm text-neutral-500 mt-1 font-mono">
                            #{order.order_code} • {format(new Date(order.created_at), "HH:mm, MMM dd yyyy", { locale: enUS })}
                        </p>
                        {order.employees?.users?.full_name && (
                            <p className="text-xs text-indigo-600 mt-1 font-medium flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Sold by: {order.employees.users.full_name}
                            </p>
                        )}
                    </div>

                </div>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-6 space-y-6">
                        {/* Customer & Payment Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Customer Info
                                </h4>
                                {order.users ? (
                                    <div className="text-sm space-y-1">
                                        <p className="font-bold text-neutral-900 text-base">{order.users.full_name}</p>
                                        <p className="text-neutral-500 font-mono">{order.users.phone || 'No phone'}</p>
                                        {order.users.email && <p className="text-neutral-500">{order.users.email}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 italic">Walk-in Customer</p>
                                )}
                            </div>
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5" /> Payment Details
                                </h4>
                                <div className="text-sm space-y-1">
                                    <p className="font-bold text-neutral-900 text-base">{getPaymentMethodLabel(order.payment_method_code)}</p>
                                    <p className="text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Payment Successful
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div>
                            <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-indigo-600" /> Purchased Items
                            </h4>
                            <div className="border border-neutral-200 rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-neutral-50">
                                        <TableRow>
                                            <TableHead className="text-xs font-semibold uppercase">Product</TableHead>
                                            <TableHead className="text-center text-xs font-semibold uppercase w-20">Qty</TableHead>
                                            <TableHead className="text-right text-xs font-semibold uppercase w-32">Price</TableHead>
                                            <TableHead className="text-right text-xs font-semibold uppercase w-32">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.order_items && order.order_items.length > 0 ? (
                                            order.order_items.map((item) => (
                                                <TableRow key={item.order_item_id || Math.random()}>
                                                    <TableCell className="font-medium text-neutral-900">
                                                        {item.product_variants?.products?.name || 'Unknown Product'}
                                                        <span className="text-neutral-400 font-normal ml-2 text-xs">
                                                            - {item.product_variants?.sku || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right text-neutral-600">
                                                        {Number(item.unit_price).toLocaleString('vi-VN')}₫
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-neutral-900">
                                                        {Number(item.total_price).toLocaleString('vi-VN')}₫
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-neutral-500 py-4">
                                                    No items found in this order
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex justify-end">
                            <div className="w-1/2 space-y-3 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span className="font-medium">{Number(order.total_amount).toLocaleString('vi-VN')}₫</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Tax (0%)</span>
                                    <span className="font-medium">0₫</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Discount</span>
                                    <span className="font-medium text-green-600">-0₫</span>
                                </div>
                                <Separator className="bg-neutral-200 my-2" />
                                <div className="flex justify-between text-base">
                                    <span className="font-bold text-neutral-900">Grand Total</span>
                                    <span className="font-bold text-indigo-600 text-xl">
                                        {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
                    <Button variant="outline" className="bg-white border-neutral-300 text-neutral-700 shadow-sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print Receipt
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
