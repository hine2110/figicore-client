import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemService, WeeklyVoucherConfig } from '@/services/system.service';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WeeklyVoucherSettingsModal({ open, onOpenChange }: Props) {
    const queryClient = useQueryClient();
    const [config, setConfig] = useState<WeeklyVoucherConfig | null>(null);

    const { data: serverConfig, isLoading } = useQuery({
        queryKey: ['weeklyVoucherConfig'],
        queryFn: systemService.getWeeklyVoucherConfig,
        enabled: open,
    });

    useEffect(() => {
        if (serverConfig?.data) {
            setConfig(serverConfig.data);
        }
    }, [serverConfig]);

    const mutation = useMutation({
        mutationFn: systemService.updateWeeklyVoucherConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weeklyVoucherConfig'] });
            toast.success('Successfully saved weekly voucher automation settings.');
            onOpenChange(false);
        },
        onError: () => {
            toast.error('Failed to save settings. Please try again.');
        },
    });

    if (!config || isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const handleChange = (rank: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND', field: keyof WeeklyVoucherConfig['BRONZE'], value: string) => {
        setConfig(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [rank]: {
                    ...prev[rank],
                    [field]: Number(value) || 0,
                }
            };
        });
    };

    const handleSave = () => {
        mutation.mutate(config);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        Weekly Voucher Automation
                    </DialogTitle>
                    <DialogDescription>
                        Configure the values for the automated weekly vouchers distributed to ranked members every Monday at 00:01.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold">Enable Automation</Label>
                            <p className="text-sm text-muted-foreground">Automatically trigger voucher generation every Monday.</p>
                        </div>
                        <Switch
                            checked={config.is_enabled}
                            onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })}
                        />
                    </div>

                    <div className="space-y-4">
                        {(['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const).map(rank => (
                            <div key={rank} className="border rounded-lg p-4 space-y-3 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                                    rank === 'BRONZE' ? 'bg-[#cd7f32]' : 
                                    rank === 'SILVER' ? 'bg-[#c0c0c0]' : 
                                    rank === 'GOLD' ? 'bg-[#ffd700]' : 'bg-[#b9f2ff]'
                                }`}></div>
                                <h4 className="font-semibold">{rank} RANK</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">{rank === 'BRONZE' ? 'Discount (N/A FS)' : 'Discount (%)'}</Label>
                                        <Input
                                            type="number"
                                            value={config[rank].value}
                                            disabled={rank === 'BRONZE'}
                                            onChange={(e) => handleChange(rank, 'value', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Min Order (VND)</Label>
                                        <Input
                                            type="number"
                                            value={config[rank].minOrder}
                                            onChange={(e) => handleChange(rank, 'minOrder', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Max Cap (VND)</Label>
                                        <Input
                                            type="number"
                                            value={config[rank].maxCap}
                                            onChange={(e) => handleChange(rank, 'maxCap', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Quantity</Label>
                                        <Input
                                            type="number"
                                            value={config[rank].quantity}
                                            onChange={(e) => handleChange(rank, 'quantity', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
