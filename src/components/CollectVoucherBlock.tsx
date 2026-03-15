import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VouchersService } from '@/services/vouchers.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, TicketPercent } from 'lucide-react';
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vouchers.map((v) => (
                    <Card key={v.promotion_id} className="border-orange-200 bg-orange-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-orange-600">
                                {v.discount_type === 'PERCENTAGE' ? `${v.discount_value}% OFF` : `${new Intl.NumberFormat('vi-VN').format(Number(v.discount_value))}đ OFF`}
                            </CardTitle>
                            <CardDescription>
                                {v.min_order_value ? `Min order: ${new Intl.NumberFormat('vi-VN').format(Number(v.min_order_value))}đ` : 'No minimum order'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-end">
                            <div className="text-sm font-medium">
                                Code: <span className="font-bold uppercase">{v.code}</span>
                            </div>
                            <Button 
                                size="sm" 
                                variant={v.is_collected ? "outline" : "default"}
                                className={v.is_collected ? "bg-white text-gray-500 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"}
                                onClick={() => collectMutation.mutate(v.promotion_id)}
                                disabled={v.is_collected || !v.can_collect || v.is_out_of_stock || collectMutation.isPending}
                            >
                                {collectMutation.isPending && collectMutation.variables === v.promotion_id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                {v.is_collected ? 'Saved' : (v.is_out_of_stock ? 'Out of Stock' : (!v.can_collect ? 'Locked' : 'Collect'))}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
