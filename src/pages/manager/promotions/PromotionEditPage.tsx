import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';

import { PromotionsService } from '@/services/promotions.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// To format number with dots: 100000 -> "100.000"
const formatNumberStr = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const numericStr = String(val).replace(/\D/g, ''); // Remove non-digits
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
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    min_price: z.number().optional().default(0),
    max_price: z.number().optional(),
}).refine(data => {
    if (data.max_price !== undefined && data.min_price !== undefined) {
        return data.max_price > data.min_price;
    }
    return true; // if max_price is not provided, it's valid (no upper limit)
}, {
    message: "Maximum price must be strictly greater than minimum price",
    path: ["max_price"],
});

type FormValues = z.infer<typeof formSchema>;

export default function PromotionEditPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Security Check
    useEffect(() => {
        if (user?.role_code !== 'MANAGER') {
            toast({ title: "Access Denied", description: "Only managers can edit promotions.", variant: "destructive" });
            navigate('/manager/vouchers?tab=promotions');
        }
    }, [user, navigate, toast]);

    const { data: promotion, isLoading } = useQuery({
        queryKey: ['promotion', id],
        queryFn: () => PromotionsService.getById(Number(id)),
        enabled: !!id,
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            type_code: "PERCENTAGE",
            value: 0,
            start_date: "",
            end_date: "",
            min_price: 0,
            max_price: undefined,
        },
    });

    useEffect(() => {
        if (promotion) {
            form.reset({
                name: promotion.name,
                type_code: promotion.type_code as 'PERCENTAGE',
                value: Number(promotion.value),
                // Localize datetime for input[type="datetime-local"]
                start_date: format(new Date(promotion.start_date), "yyyy-MM-dd'T'HH:mm"),
                end_date: format(new Date(promotion.end_date), "yyyy-MM-dd'T'HH:mm"),
                min_price: promotion.min_apply_price !== null && promotion.min_apply_price !== undefined ? Number(promotion.min_apply_price) : 0,
                max_price: promotion.max_apply_price !== null && promotion.max_apply_price !== undefined ? Number(promotion.max_apply_price) : undefined,
            });
        }
    }, [promotion, form]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        if (new Date(values.start_date) >= new Date(values.end_date)) {
            form.setError("end_date", { message: "End date must be after start date" });
            return;
        }

        try {
            await PromotionsService.update(Number(id), {
                name: values.name,
                type_code: values.type_code,
                value: values.value,
                start_date: new Date(values.start_date).toISOString(),
                end_date: new Date(values.end_date).toISOString(),
                min_apply_price: values.min_price,
                max_apply_price: values.max_price !== undefined ? values.max_price : null as any,
            });

            // Re-apply to the new price range
            if (values.min_price !== undefined) {
                const maxP = values.max_price !== undefined ? values.max_price : Number.MAX_SAFE_INTEGER;
                await PromotionsService.applyByPriceRange(Number(id), {
                    minPrice: values.min_price,
                    maxPrice: maxP
                });
            }

            toast({ title: "Success", description: "Promotion updated successfully!" });
            
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            queryClient.invalidateQueries({ queryKey: ['promotion', id] });
            navigate('/manager/vouchers?tab=promotions');

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update promotion." });
        }
    }

    if (user?.role_code !== 'MANAGER') return null;

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Edit Promotion</h2>
                <Button variant="outline" onClick={() => navigate('/manager/vouchers?tab=promotions')}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Update Promotion Info</CardTitle>
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
                                            <Input placeholder="e.g. Summer Sale" {...field} />
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
                                            <Select onValueChange={field.onChange} value={field.value} disabled={true}>
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
                                            <FormDescription>
                                                Enter % (e.g. 20)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                                        onChange={(e) => {
                                                            const val = parseNumberStr(e.target.value);
                                                            field.onChange(val);
                                                        }}
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
                                                        onChange={(e) => {
                                                            const val = parseNumberStr(e.target.value);
                                                            field.onChange(val);
                                                        }}
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
                                {form.formState.isSubmitting ? "Updating..." : "Update Promotion"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
