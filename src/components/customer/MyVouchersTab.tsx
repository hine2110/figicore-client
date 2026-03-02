import { useQuery } from '@tanstack/react-query';
import { VouchersService } from '@/services/vouchers.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketPercent, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function MyVouchersTab() {
    const { data: vouchers, isLoading } = useQuery({
        queryKey: ['my_vouchers'],
        queryFn: VouchersService.getMyVouchers,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!vouchers || vouchers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-orange-50/30">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <TicketPercent className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No vouchers yet</h3>
                <p className="text-slate-500 max-w-sm">
                    You haven't collected any vouchers. Check the home page for available promotions!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">My Vouchers</h3>
                    <p className="text-slate-500">View and manage your collected discounts.</p>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {vouchers.length} Available
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {vouchers.map((v) => {
                    const promo = v.promotions;
                    if (!promo) return null;

                    const isExpiringSoon = promo.end_date ? new Date(promo.end_date).getTime() - new Date().getTime() < 86400000 * 3 : false;

                    return (
                        <Card key={v.id} className="relative overflow-hidden border-orange-200 shadow-sm hover:shadow-md transition-shadow bg-orange-50/50 group">
                            {/* Decorative Edge */}
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-orange-400 to-orange-600 rounded-l-xl" />
                            
                            <CardHeader className="pl-6 pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge className="bg-orange-600 hover:bg-orange-700 mb-2">
                                        {promo.code}
                                    </Badge>
                                    {isExpiringSoon && (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-0 flex gap-1 items-center">
                                            <Clock className="w-3 h-3" /> Expiring Soon
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl text-orange-600 font-black">
                                    {promo.discount_type === 'PERCENTAGE' 
                                        ? `${promo.discount_value}% OFF` 
                                        : `${new Intl.NumberFormat('vi-VN').format(Number(promo.discount_value))}đ OFF`}
                                </CardTitle>
                                <CardDescription className="text-slate-600 font-medium mt-1">
                                    {promo.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-6 pb-6 pt-3">
                                <ul className="space-y-2 text-sm text-slate-600 mb-4">
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" />
                                        <span>Min order: {promo.min_order_value ? `${new Intl.NumberFormat('vi-VN').format(Number(promo.min_order_value))}đ` : '0đ'}</span>
                                    </li>
                                    {promo.apply_rank_code && (
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" />
                                            <span>Rank limit: <strong className="text-orange-700">{promo.apply_rank_code}</strong></span>
                                        </li>
                                    )}
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" />
                                        <span>Use before: {promo.end_date ? format(new Date(promo.end_date), 'dd/MM/yyyy HH:mm') : 'No Expiry'}</span>
                                    </li>
                                </ul>
                                <div className="text-xs text-slate-400 bg-white/50 px-3 py-2 rounded-lg border border-orange-100 mt-2">
                                    Apply this code at checkout to claim your discount.
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
