import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    CreditCard, User,
    Printer, CheckCircle2, Clock, XCircle, ShoppingBag,
    Receipt, Calendar, FileText, Download, Building, Mail
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
import { cn } from '@/lib/utils';

interface OrderDetailsModalProps {
    order: any; // Using any for flexibility with extended fields
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
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto;
                        }
                        body {
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        #root, .dialog-overlay, .screen-only {
                            display: none !important;
                        }
                        [role="dialog"] {
                            background: white !important;
                            border: none !important;
                            box-shadow: none !important;
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                            max-width: none !important;
                            border-radius: 0 !important;
                            transform: none !important;
                        }
                        .thermal-receipt-container {
                            display: block !important;
                            width: 80mm;
                            margin: 0 auto;
                            padding: 5mm;
                            background: white;
                            color: black;
                            font-family: 'Courier New', Courier, monospace;
                            visibility: visible !important;
                            position: static !important;
                        }
                        .thermal-receipt-container * {
                            visibility: visible !important;
                        }
                    }
                    .thermal-receipt-container {
                        display: none;
                    }
                `}} />

                {/* hidden thermal receipt for printing */}
                <div className="thermal-receipt-container text-black bg-white w-[80mm] p-4 text-[13px] leading-tight font-mono">
                    <div className="text-center mb-4">
                        <h2 className="text-lg font-bold uppercase">FIGI CORE POS</h2>
                        <p className="text-[11px]">76 Huynh Van Nghe, Ngu Hanh Son, DN</p>
                        <p className="text-[11px]">Phone: 0868884343</p>
                        <div className="border-b border-dashed border-black my-2"></div>
                        <h3 className="text-md font-bold uppercase">PAYMENT RECEIPT</h3>
                        <p className="text-[11px]">No: {order.order_code}</p>
                    </div>



                    <div className="space-y-1 mb-3 text-[11px]">
                        <div className="flex justify-between">
                            <span>In Time: {format(new Date(order.created_at), "HH:mm dd/MM/yyyy")}</span>
                            <span>Print Time: {format(new Date(), "HH:mm")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span className="font-bold">{order.employees?.users?.full_name || 'Staff'}</span>
                        </div>
                        <div className="border-b border-dotted border-black/30 my-1"></div>
                        <div className="flex justify-between">
                            <span>Customer:</span>
                            <span className="font-bold">{order.users?.full_name || 'Retail Customer'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Phone:</span>
                            <span>{order.users?.phone || 'N/A'}</span>
                        </div>
                        {order.users?.customers && (
                            <>
                                <div className="flex justify-between">
                                    <span>Tier:</span>
                                    <span className="font-bold uppercase">{order.users?.customers?.current_rank_code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Accumulated points:</span>
                                    <span className="font-bold">
                                        +{(() => {
                                            const oldSpent = Number(order.users?.customers?.total_spent || 0) - Number(order.total_amount);
                                            const oldPoints = Math.floor(oldSpent / 10000);
                                            const newPoints = Math.floor(Number(order.users?.customers?.total_spent || 0) / 10000);
                                            return Math.max(0, newPoints - oldPoints);
                                        })()} points
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total current points:</span>
                                    <span>{(order.users?.customers?.loyalty_points || 0).toLocaleString('vi-VN')} points</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mb-2">
                        <div className="flex font-bold border-b border-dashed border-black pb-1 mb-1 text-[11px]">
                            <span className="flex-1">Item</span>
                            <span className="w-12 text-center">SL</span>
                            <span className="w-20 text-right">Total</span>
                        </div>
                        {order.order_items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex py-0.5 text-[11px]">
                                <span className="flex-1 leading-none">{(item.product_variants?.products?.name || 'Item').toUpperCase()}</span>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <span className="w-20 text-right">{Number(item.total_price).toLocaleString('vi-VN')}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal ({order.order_items?.length || 0})</span>
                            <span>{(Number(order.total_amount) + Number(order.discount_amount || 0)).toLocaleString('vi-VN')}</span>
                        </div>
                        {Number(order.discount_amount) > 0 && (
                            <div className="flex justify-between">
                                <span>Discount</span>
                                <span>-{Number(order.discount_amount).toLocaleString('vi-VN')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[14px] font-bold border-t border-dotted border-black pt-1">
                            <span>TOTAL PAYMENT</span>
                            <span>{Number(order.total_amount).toLocaleString('vi-VN')}₫</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{getPaymentMethodLabel(order.payment_method_code)}</span>
                            <span>{Number(order.total_amount).toLocaleString('vi-VN')}</span>
                        </div>
                        {order.payment_method_code === 'CASH' && order.cash_received && (
                            <>
                                <div className="flex justify-between">
                                    <span>Customer gave</span>
                                    <span>{Number(order.cash_received).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Return</span>
                                    <span>{Number(order.cash_change || 0).toLocaleString('vi-VN')}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-center mt-6 space-y-1 text-[11px] font-bold">
                        <p className="border-t border-dashed border-black pt-3">You will get this order for FREE if the points information is not yours.</p>
                        <p className="font-normal italic text-[10px]">If there are any errors in the receipt, please call 1900 998808 for support.</p>
                        <p className="text-md mt-2">Figi Core thanks you ~</p>
                        <p className="text-[10px]">Wifi: Figi Core Guest</p>
                        <p className="text-[10px]">Pass: figicore2026</p>
                    </div>
                </div>

                {/* Header - Glassmorphism */}
                <div className="screen-only px-6 py-5 border-b border-neutral-200/60 flex justify-between items-start bg-white/50 backdrop-blur-md sticky top-0 z-10">
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
                    {/* Official Stamp Effect */}
                    <div className={cn(
                        "w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center -rotate-12 opacity-40 transition-all border-neutral-200/50 text-neutral-300"
                    )}>
                        <span className="text-[10px] font-black uppercase text-center leading-none">
                            Official\nReceipt
                        </span>
                    </div>
                </div>

                <ScrollArea className="screen-only max-h-[70vh]">
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
                                            order.order_items.map((item: any, index: number) => (
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
                                    <span className="font-medium text-neutral-900">
                                        {(Number(order.total_amount) + Number(order.discount_amount || 0)).toLocaleString('vi-VN')}₫
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Discount</span>
                                    <span className="font-medium text-green-600">
                                        -{Number(order.discount_amount || 0).toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                                <Separator className="bg-neutral-200 dash-array" />
                                <div className="flex justify-between items-end pt-1">
                                    <span className="font-bold text-neutral-900 text-lg">Grand Total</span>
                                    <span className="font-bold text-indigo-600 text-2xl tracking-tight">
                                        {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                    </span>
                                </div>

                                {order.payment_method_code === 'CASH' && order.cash_received && (
                                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500 font-medium">Cash Received</span>
                                            <span className="font-bold text-neutral-900">{Number(order.cash_received).toLocaleString('vi-VN')}₫</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500 font-medium">Change Given</span>
                                            <span className="font-bold text-amber-600">{Number(order.cash_change || 0).toLocaleString('vi-VN')}₫</span>
                                        </div>
                                    </div>
                                )}
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
                <div className="screen-only p-5 border-t border-neutral-200 bg-white flex justify-between items-center gap-3">
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
