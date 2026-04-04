import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { VouchersService, MyVoucher } from '@/services/vouchers.service';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TicketPercent, Loader2, Clock, CheckCheck, Ban } from 'lucide-react';
import { format } from 'date-fns';

// ── Rank badge config ────────────────────────────────────────────────────────
const RANK_BADGE: Record<string, { label: string; color: string }> = {
    BRONZE:  { label: '🥉 Bronze',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
    SILVER:  { label: '🥈 Silver',    color: 'bg-slate-100  text-slate-700  border-slate-200'  },
    GOLD:    { label: '🥇 Gold',      color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    DIAMOND: { label: '💎 Diamond',   color: 'bg-cyan-100  text-cyan-800   border-cyan-200'   },
};

// ── Voucher Ticket Card ──────────────────────────────────────────────────────
function VoucherTicket({ v, status }: { v: MyVoucher; status: 'COLLECTED' | 'USED' | 'EXPIRED' }) {
    const promo = v.promotions;
    if (!promo) return null;

    const isExpiringSoon =
        status === 'COLLECTED' &&
        promo.end_date &&
        new Date(promo.end_date).getTime() - Date.now() < 86400000 * 3; // 3 days

    const stripeColor =
        status === 'COLLECTED' ? 'from-violet-500 to-fuchsia-500' :
        status === 'USED'      ? 'from-slate-400  to-slate-500'   :
                                 'from-red-400    to-rose-500';

    const discountLabel =
        promo.discount_type === 'FREE_SHIP'  ? '🚚 Free Shipping' :
        promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}% OFF` :
                                               `${new Intl.NumberFormat('en-US').format(Number(promo.discount_value))}đ OFF`;

    const rankInfo = promo.apply_rank_code ? RANK_BADGE[promo.apply_rank_code] : null;

    return (
        <div className={`relative rounded-2xl overflow-hidden border shadow-sm transition-shadow hover:shadow-md ${status !== 'COLLECTED' ? 'opacity-70 grayscale-[30%]' : ''} bg-white`}>
            {/* Left colored stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${stripeColor}`} />

            {/* Ticket notch effect */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-[5px] opacity-20">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                ))}
            </div>

            <div className="pl-7 pr-5 py-5">
                {/* Top row: code + status badge */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">VOUCHER CODE</span>
                        <span className="font-black text-base tracking-wider font-mono text-slate-900">{promo.code}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {status === 'COLLECTED' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px]">
                                ✓ Available
                            </Badge>
                        )}
                        {status === 'USED' && (
                            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 text-[10px] flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" /> Used
                            </Badge>
                        )}
                        {status === 'EXPIRED' && (
                            <Badge className="bg-red-100 text-red-600 hover:bg-red-100 text-[10px] flex items-center gap-1">
                                <Ban className="w-3 h-3" /> Expired
                            </Badge>
                        )}
                        {isExpiringSoon && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Expiring Soon
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Discount value — large */}
                <div className={`text-2xl font-black mb-3 bg-gradient-to-r ${stripeColor} bg-clip-text text-transparent`}>
                    {discountLabel}
                </div>

                {/* Divider dashed */}
                <div className="border-t border-dashed border-slate-200 my-3" />

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-500">
                    {promo.min_order_value && Number(promo.min_order_value) > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                            Min. Order: <strong className="text-slate-700">{new Intl.NumberFormat('en-US').format(Number(promo.min_order_value))}đ</strong>
                        </div>
                    )}
                    {rankInfo && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                            For Rank:&nbsp;
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${rankInfo.color}`}>{rankInfo.label}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                        {status === 'USED' && v.used_at
                            ? <>Used At: <strong className="text-slate-700">{format(new Date(v.used_at), 'dd/MM/yyyy HH:mm')}</strong></>
                            : <>Expires: <strong className="text-slate-700">{promo.end_date ? format(new Date(promo.end_date), 'dd/MM/yyyy') : '—'}</strong></>
                        }
                    </div>
                </div>

                {/* Hint for available */}
                {status === 'COLLECTED' && (
                    <div className="mt-3 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 text-[11px] text-violet-700 font-medium">
                        💡 Automatically applied at checkout
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyVouchers({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <TicketPercent className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">No {label} vouchers.</p>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MyVouchersTab() {
    const [activeStatus, setActiveStatus] = useState<'COLLECTED' | 'USED' | 'EXPIRED'>('COLLECTED');

    const { data: vouchers, isLoading } = useQuery({
        queryKey: ['my_vouchers'],
        queryFn: VouchersService.getMyVouchers,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const collected = (vouchers || []).filter(v => v.status === 'COLLECTED');
    const used      = (vouchers || []).filter(v => v.status === 'USED');
    const expired   = (vouchers || []).filter(v => v.status === 'EXPIRED');

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Voucher Wallet</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Manage and use your coupons.</p>
                </div>
                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                    {collected.length} active
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs value={activeStatus} onValueChange={v => setActiveStatus(v as any)}>
                <TabsList className="bg-slate-100 p-1 rounded-xl w-full grid grid-cols-3">
                    <TabsTrigger value="COLLECTED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-violet-700 font-semibold">
                        Available <Badge className="ml-1.5 bg-violet-100 text-violet-700 hover:bg-violet-100 px-1.5 h-4 text-[10px]">{collected.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="USED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
                        Used <Badge className="ml-1.5 bg-slate-200 text-slate-600 hover:bg-slate-200 px-1.5 h-4 text-[10px]">{used.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="EXPIRED" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
                        Expired <Badge className="ml-1.5 bg-red-100 text-red-600 hover:bg-red-100 px-1.5 h-4 text-[10px]">{expired.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="COLLECTED" className="mt-4">
                    {collected.length === 0 ? <EmptyVouchers label="active" /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {collected.map(v => <VoucherTicket key={v.id} v={v} status="COLLECTED" />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="USED" className="mt-4">
                    {used.length === 0 ? <EmptyVouchers label="used" /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {used.map(v => <VoucherTicket key={v.id} v={v} status="USED" />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="EXPIRED" className="mt-4">
                    {expired.length === 0 ? <EmptyVouchers label="expired" /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {expired.map(v => <VoucherTicket key={v.id} v={v} status="EXPIRED" />)}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
