import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { PromotionsService } from '@/services/promotions.service';
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
    name: z.string().min(2, "Promotion name must be at least 2 characters."),
    type_code: z.enum(['PERCENTAGE']),
    value: z.coerce.number().min(0, "Value must be greater than or equal to 0."),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    is_recurring: z.boolean().default(false),
    min_price: z.number().optional().default(0),
    max_price: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.max_price !== undefined && data.min_price !== undefined) {
        if (data.max_price <= data.min_price) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Maximum price must be strictly greater than minimum price", path: ["max_price"] });
        }
    }
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time must be after start time", path: ["end_time"] });
    }
});

type FormValues = z.infer<typeof formSchema>;

export default function PromotionCreatePage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user?.role_code !== 'MANAGER') {
            toast({ title: "Access Denied", description: "Only managers can create promotions.", variant: "destructive" });
            navigate('/manager/promotions');
        }
    }, [user, navigate, toast]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            type_code: "PERCENTAGE",
            value: 0,
            start_time: "",
            end_time: "",
            is_recurring: false,
            min_price: 0,
            max_price: undefined,
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            const newPromo = await PromotionsService.create({
                name: values.name,
                type_code: values.type_code,
                value: values.value,
                start_time: values.start_time,
                end_time: values.end_time,
                is_recurring: values.is_recurring,
                min_apply_price: values.min_price,
                max_apply_price: values.max_price,
            });

            if (values.min_price !== undefined) {
                toast({ title: "Processing...", description: "System is scanning and applying automatically..." });
                const maxP = values.max_price !== undefined ? values.max_price : Number.MAX_SAFE_INTEGER;
                const result = await PromotionsService.applyByPriceRange(newPromo.promotion_id, {
                    minPrice: values.min_price,
                    maxPrice: maxP
                });

                if (result.count > 0) {
                    toast({ title: "Success!", description: `Created and automatically applied to ${result.count} products.` });
                } else {
                    toast({ title: "Attention", description: "Created, but no products found in this price range.", variant: "default" });
                }
            } else {
                toast({ title: "Success", description: "Promotion created!" });
            }

            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            navigate('/manager/promotions');

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to create promotion." });
        }
    }

    if (user?.role_code !== 'MANAGER') return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Create New Promotion</h2>
                <Button variant="outline" onClick={() => navigate('/manager/promotions')}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Promotion Info & Scope</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Program Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Flash Sale Evening" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={true}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Percentage (%)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Value</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>Enter % (e.g. 20)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Flash Sale Time Window */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>⚡ Start Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="end_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>⚡ End Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="is_recurring"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-semibold text-orange-900">🔁 Daily Recurring</FormLabel>
                                            <FormDescription className="text-orange-700">
                                                When ON — Flash Sale repeats every day. When OFF — runs only today, then deactivates.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Auto-Apply Price Range Section */}
                            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                                <h3 className="font-semibold text-lg">Application Range</h3>
                                <p className="text-sm text-slate-500">
                                    System automatically scans and applies the promotion to all products in this price range.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="min_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Minimum Price (VND)</FormLabel>
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
                                    <FormField
                                        control={form.control}
                                        name="max_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maximum Price (VND)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Leave blank for no limit"
                                                        value={formatNumberStr(field.value)}
                                                        onChange={(e) => field.onChange(parseNumberStr(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>Leave blank for no maximum limit</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {form.formState.isSubmitting ? "Creating & Applying..." : "Create Promotion"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
