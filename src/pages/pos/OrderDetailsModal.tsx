import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    CreditCard, User,
    Printer, CheckCircle2, Clock, XCircle, ShoppingBag,
    Receipt, Calendar
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
import { cn } from '@/lib/utils';

interface OrderDetailsModalProps {
    order: PosOrder | null;
    open: boolean;
    onClose: () => void;
    onOrderCancelled?: (orderId: number) => void;
}

export default function OrderDetailsModal({ order, open, onClose, onOrderCancelled }: OrderDetailsModalProps) {
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
            case 'COMPLETED': return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Completed' };
            case 'PENDING_PAYMENT':
            case 'PENDING': return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' };
            case 'CANCELLED': return { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' };
            default: return { color: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Clock, label: status };
        }
    };

    const StatusInfo = getStatusStyles(order.status_code);
    const StatusIcon = StatusInfo.icon;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-neutral-50/95 backdrop-blur-xl p-0 gap-0 overflow-hidden border-white/20 shadow-2xl rounded-[1.5rem]">

                {/* Header - Glassmorphism */}
                <div className="px-6 py-5 border-b border-neutral-200/60 flex justify-between items-start bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <DialogTitle className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                            <Receipt className="w-6 h-6 text-indigo-600" />
                            Order Receipt
                            <Badge variant="secondary" className={cn("font-bold border px-2.5 py-0.5 h-6 text-[10px] uppercase tracking-wide rounded-full flex items-center gap-1.5", StatusInfo.color)}>
                                <StatusIcon className="w-3 h-3" />
                                {StatusInfo.label}
                            </Badge>
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="bg-white/50 font-mono text-neutral-500 border-neutral-200 text-xs px-2 py-0.5 rounded-md">
                                #{order.order_code}
                            </Badge>
                            <span className="text-neutral-300">•</span>
                            <span className="text-sm text-neutral-500 font-medium flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(order.created_at), "MMM dd, yyyy • HH:mm", { locale: enUS })}
                            </span>
                        </div>
                    </div>
                    {/* Official Stamp Effect (Optional decorative element) */}
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200/50 flex items-center justify-center -rotate-12 opacity-50">
                        <span className="text-[10px] font-bold text-neutral-300 uppercase text-center leading-tight">Official<br />Receipt</span>
                    </div>
                </div>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-6 space-y-6">

                        {/* 1. Customer & Payment Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Customer Card */}
                            <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-bl-full -mr-2 -mt-2 opacity-50"></div>
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Customer Info
                                </h4>
                                {order.users ? (
                                    <div className="space-y-1 relative z-10">
                                        <p className="font-bold text-neutral-900 text-base">{order.users.full_name}</p>
                                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                                            <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono text-xs">{order.users.phone || 'No phone'}</span>
                                        </div>
                                        {order.users.email && <p className="text-xs text-neutral-400 truncate">{order.users.email}</p>}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="font-bold text-neutral-900 text-base italic">Guest / Walk-in</p>
                                        <p className="text-xs text-neutral-400">No profile attached</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Card */}
                            <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-50 to-green-50 rounded-bl-full -mr-2 -mt-2 opacity-50"></div>
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5" /> Payment Info
                                </h4>
                                <div className="space-y-2 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-neutral-600">Method</span>
                                        <Badge variant="outline" className="bg-white font-bold text-neutral-800 border-neutral-200">
                                            {getPaymentMethodLabel(order.payment_method_code)}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-neutral-600">Status</span>
                                        <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3" /> Paid
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Order Items (Receipt Style) */}
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-neutral-50/50 border-b border-neutral-100 flex justify-between items-center">
                                <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-indigo-600" /> Items Purchased
                                </h4>
                                <span className="text-xs font-medium text-neutral-400 bg-white px-2 py-1 rounded border border-neutral-100">
                                    {order.order_items?.length || 0} items
                                </span>
                            </div>
                            <div className="overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white border-b border-neutral-100">
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-6 h-10">Product Details</TableHead>
                                            <TableHead className="text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider h-10 w-20">Qty</TableHead>
                                            <TableHead className="text-right text-[10px] font-bold text-neutral-400 uppercase tracking-wider h-10 w-28">Price</TableHead>
                                            <TableHead className="text-right text-[10px] font-bold text-neutral-400 uppercase tracking-wider h-10 w-28 pr-6">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.order_items && order.order_items.length > 0 ? (
                                            order.order_items.map((item, index) => (
                                                <TableRow key={item.order_item_id || index} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                                                    <TableCell className="pl-6 py-3">
                                                        <div className="font-medium text-neutral-900 text-sm">
                                                            {item.product_variants?.products?.name || 'Unknown Product'}
                                                        </div>
                                                        {item.product_variants?.option_name && (
                                                            <div className="text-xs text-neutral-500 mt-0.5 font-medium">
                                                                {item.product_variants.option_name}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-neutral-400 mt-0.5 font-mono">
                                                            SKU: {item.product_variants?.sku || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium text-neutral-700">
                                                        x{item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-right text-neutral-500 text-sm">
                                                        {Number(item.unit_price).toLocaleString('vi-VN')}₫
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-neutral-900 text-sm pr-6">
                                                        {Number(item.total_price).toLocaleString('vi-VN')}₫
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-neutral-500 py-8 italic">
                                                    No items found in this order
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-neutral-50/30 p-4 sm:p-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span className="font-medium text-neutral-900">{Number(order.total_amount).toLocaleString('vi-VN')}₫</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Tax / VAT</span>
                                    <span className="font-medium text-neutral-900">Included</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Discount</span>
                                    <span className="font-medium text-green-600">-0₫</span>
                                </div>
                                <Separator className="bg-neutral-200 dash-array" />
                                <div className="flex justify-between items-end pt-1">
                                    <span className="font-bold text-neutral-900 text-lg">Grand Total</span>
                                    <span className="font-bold text-indigo-600 text-2xl tracking-tight">
                                        {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sold By Footer Info */}
                        {order.employees?.users?.full_name && (
                            <div className="flex justify-center">
                                <p className="text-xs text-neutral-400 font-medium flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-neutral-100 shadow-sm">
                                    <User className="w-3 h-3" />
                                    Processed by <span className="text-neutral-600 font-bold">{order.employees.users.full_name}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Actions Footer */}
                <div className="p-5 border-t border-neutral-200 bg-white flex justify-between items-center gap-3">
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 rounded-xl" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        {(order.status_code === 'PARKED' || order.status_code === 'PENDING_PAYMENT') && (
                            <Button
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                                onClick={() => onOrderCancelled?.(order.order_id)}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        )}
                    </div>
                    <Button className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/20 rounded-xl px-6" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
