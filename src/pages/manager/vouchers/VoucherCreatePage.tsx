import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

import { VouchersService } from '@/services/vouchers.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const formatNumberStr = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const numericStr = String(val).replace(/\D/g, '');
    if (!numericStr) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(numericStr));
};

const parseNumberStr = (val: string) => {
    const numericStr = val.replace(/\D/g, '');
    return numericStr ? Number(numericStr) : undefined;
};

const formSchema = z.object({
    code: z.string().min(3, "Voucher code must be at least 3 characters").max(20),
    discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIP']),
    discount_value: z.coerce.number().min(0, "Value must be positive"),
    min_order_value: z.coerce.number().min(0).optional(),
    apply_rank_code: z.string().optional(), // "ALL", "BRONZE", "SILVER", "GOLD", "DIAMOND"
    max_quantity: z.coerce.number().min(1, "Must have at least 1").optional(),
    is_public: z.boolean().default(true),
    start_date: z.string().min(1, "Required"),
    end_date: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function VoucherCreatePage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') {
            navigate('/');
        }
    }, [user, navigate]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            code: "",
            discount_type: "PERCENTAGE",
            discount_value: 0,
            min_order_value: 0,
            apply_rank_code: "ALL",
            max_quantity: undefined,
            is_public: true,
            start_date: "",
            end_date: "",
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        if (new Date(values.start_date) >= new Date(values.end_date)) {
            form.setError("end_date", { message: "End date must be after start date" });
            return;
        }

        try {
            const payload = {
                code: values.code.toUpperCase(),
                discount_type: values.discount_type,
                discount_value: values.discount_value,
                min_order_value: values.min_order_value,
                apply_rank_code: values.apply_rank_code === 'ALL' ? undefined : values.apply_rank_code,
                max_quantity: values.max_quantity || undefined,
                is_public: values.is_public,
                start_date: new Date(values.start_date).toISOString(),
                end_date: new Date(values.end_date).toISOString(),
            };

            if (payload.discount_type === 'FREE_SHIP') {
                payload.discount_value = 0;
            }

            await VouchersService.create(payload);
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
            navigate('/manager/vouchers');
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error?.response?.data?.message || "Failed to create voucher." });
        }
    };

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Create New Voucher</h2>
                <Button variant="outline" onClick={() => navigate('/manager/vouchers')}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Voucher Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Voucher Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. SUMMER2026" className="uppercase" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="is_public"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Public Collection</FormLabel>
                                                <FormDescription>Show in public voucher gallery</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="discount_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                                    <SelectItem value="FIXED_AMOUNT">Fixed Amount (VND)</SelectItem>
                                                    <SelectItem value="FREE_SHIP">Free Shipping</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch('discount_type') !== 'FREE_SHIP' && (
                                    <FormField
                                        control={form.control}
                                        name="discount_value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Value</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                                <h3 className="font-semibold text-lg">Conditions & Restrictions</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="apply_rank_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Customer Rank Required</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Any Rank" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="ALL">All Customers</SelectItem>
                                                        <SelectItem value="BRONZE">Bronze</SelectItem>
                                                        <SelectItem value="SILVER">Silver</SelectItem>
                                                        <SelectItem value="GOLD">Gold</SelectItem>
                                                        <SelectItem value="DIAMOND">Diamond</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="max_quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maximum Collection Limit</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Leave blank for unlimited" {...field} />
                                                </FormControl>
                                                <FormDescription>Total max claims allowed</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="min_order_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Minimum Order Value (VND)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="text" 
                                                    placeholder="0" 
                                                    value={formatNumberStr(field.value)}
                                                    onChange={(e) => field.onChange(parseNumberStr(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Voucher
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
