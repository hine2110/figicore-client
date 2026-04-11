import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VouchersService } from '@/services/vouchers.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, TicketPercent, Truck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function CollectVoucherBlock() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();

    const { data: vouchers, isLoading } = useQuery({
        queryKey: ['collectible_vouchers'],
        queryFn: VouchersService.getCollectible,
        enabled: isAuthenticated,
    });

    const collectMutation = useMutation({
        mutationFn: VouchersService.collect,
        onSuccess: () => {
            toast({ title: 'Success', description: 'Voucher saved to your wallet!' });
            queryClient.invalidateQueries({ queryKey: ['collectible_vouchers'] });
        },
        onError: (error: any) => {
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: error?.response?.data?.message || 'Failed to collect voucher.' 
            });
        }
    });

    if (!isAuthenticated || isLoading) return null;
    if (!vouchers || vouchers.length === 0) {
        return (
            <div className="my-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TicketPercent className="w-5 h-5 text-orange-500" />
                    Available Vouchers
                </h3>
                <Card className="border-dashed bg-slate-50">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <TicketPercent className="w-12 h-12 text-slate-300 mb-4" />
                        <h4 className="text-lg font-medium text-slate-700">No Vouchers Available</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-md">
                            You have collected all available vouchers, or there are no new promotions at the moment. Please check back later!
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="my-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-orange-500" />
                Available Vouchers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {vouchers.map((v) => {
                    const isFreeShip = v.discount_type === 'FREE_SHIP';
                    
                    return (
                        <div key={v.promotion_id} className="ticket-container group hover:shadow-lg transition-all duration-300">
                            {/* Left Section (Brand/Icon) */}
                            <div className={`ticket-left ${isFreeShip ? 'ticket-left-freeship' : 'ticket-left-discount'}`}>
                                {isFreeShip ? (
                                    <Truck className="w-8 h-8 mb-1" />
                                ) : (
                                    <TicketPercent className="w-8 h-8 mb-1" />
                                )}
                                <div className="ticket-brand-text">
                                    {isFreeShip ? 'FREE SHIP' : 'FIGI VOUCHER'}
                                </div>
                            </div>

                            {/* Right Section (Details) */}
                            <div className="ticket-right">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="space-y-0.5">
                                        <h4 className={`font-bold text-sm md:text-base leading-tight ${isFreeShip ? 'text-emerald-700' : 'text-slate-900'}`}>
                                            {isFreeShip 
                                                ? 'Miễn phí vận chuyển'
                                                : v.discount_type === 'PERCENTAGE' 
                                                    ? `Giảm ${v.discount_value}%` 
                                                    : `Giảm ${new Intl.NumberFormat('vi-VN').format(Number(v.discount_value))}đ`
                                            }
                                        </h4>
                                        <div className="flex flex-col gap-0.5">
                                            {!isFreeShip && Number(v.max_discount_amount || 0) > 0 && (
                                                <p className="text-[11px] text-orange-600 font-medium">
                                                    Tối đa {new Intl.NumberFormat('vi-VN').format(Number(v.max_discount_amount))}đ
                                                </p>
                                            )}
                                            <p className="text-[11px] text-slate-500">
                                                Đơn tối thiểu {new Intl.NumberFormat('vi-VN').format(Number(v.min_order_value || 0))}đ
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant={v.is_collected ? "outline" : "default"}
                                        className={`h-7 px-3 text-[10px] uppercase font-bold tracking-wider rounded-md ${
                                            v.is_collected 
                                                ? "bg-slate-100 text-slate-400 border-none" 
                                                : isFreeShip
                                                    ? "bg-[#10b981] hover:bg-[#059669] text-white"
                                                    : "bg-[#ee4d2d] hover:bg-[#d73211] text-white"
                                        }`}
                                        onClick={() => collectMutation.mutate(v.promotion_id)}
                                        disabled={v.is_collected || !v.can_collect || v.is_out_of_stock || collectMutation.isPending}
                                    >
                                        {collectMutation.isPending && collectMutation.variables === v.promotion_id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (v.is_collected ? 'Đã Lưu' : (v.is_out_of_stock ? 'Hết' : 'Lưu'))}
                                    </Button>
                                </div>
                                
                                <div className="mt-2 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                                        {v.code}
                                    </span>
                                    {v.end_date && (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            HSD: {new Date(v.end_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
