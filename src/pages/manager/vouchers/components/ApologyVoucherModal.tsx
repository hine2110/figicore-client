import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VouchersService } from '@/services/vouchers.service';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GitCommit, Loader2, Gift } from 'lucide-react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApologyVoucherModal({ open, onOpenChange }: Props) {
    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');

    const mutation = useMutation({
        mutationFn: (userEmail: string) => VouchersService.sendApologyVoucher(userEmail),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
            toast.success('Apology voucher sent successfully!');
            setEmail('');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to send voucher. Customer email may not exist.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter customer email.');
            return;
        }
        mutation.mutate(email);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <Gift className="w-5 h-5" />
                            Send Apology Gift
                        </DialogTitle>
                        <DialogDescription>
                            Send a 15% OFF Voucher (up to 150k) as a sincere apology directly to the affected customer's wallet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Customer Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="customer@domain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    The system will send a sincere apology email with the voucher to this address.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-rose-600 hover:bg-rose-700">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Apology Voucher
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
