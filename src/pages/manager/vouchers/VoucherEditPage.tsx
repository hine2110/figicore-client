import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { VouchersService } from '@/services/vouchers.service';
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
import { Skeleton } from '@/components/ui/skeleton';

const formatNumberStr = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const numericStr = String(val).replace(/\D/g, '');
    if (!numericStr) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(numericStr));
};

const VIETNAMESE_HOLIDAYS: Record<string, string> = {
    "01/01": "New Year's Day (1.1 Mega Sale)",
    "02/02": "2.2 Mega Sale",
    "03/03": "3.3 Mega Sale",
    "04/04": "4.4 Mega Sale",
    "05/05": "5.5 Mega Sale",
    "06/06": "6.6 Mega Sale",
    "07/07": "7.7 Mega Sale",
    "08/08": "8.8 Mega Sale",
    "09/09": "9.9 Mega Sale",
    "10/10": "10.10 Mega Sale",
    "11/11": "11.11 Mega Sale",
    "12/12": "12.12 Mega Sale",
    "14/02": "Valentine's Day",
    "08/03": "International Women's Day",
    "30/04": "Reunification Day",
    "01/05": "Labor Day",
    "01/06": "Children's Day",
    "02/09": "National Day",
    "20/10": "Vietnamese Women's Day",
    "20/11": "Vietnamese Teacher's Day",
    "24/12": "Christmas",
    "26/11": "Black Friday"
};

const parseNumberStr = (val: string) => {
    const numericStr = val.replace(/\D/g, '');
    return numericStr ? Number(numericStr) : undefined;
};

/**
 * Convert a datetime-local string ("2026-04-05T23:01") to ISO-8601 UTC.
 * Unlike `new Date(str).toISOString()` which treats the string as UTC,
 * this function treats it as LOCAL time (correct for datetime-local inputs).
 */
const localDatetimeToISO = (datetimeLocalStr: string): string => {
    if (!datetimeLocalStr) return '';
    const d = new Date(datetimeLocalStr); // browsers parse datetime-local as LOCAL
    return d.toISOString();
};

// Simplified form schema for editing.
const formSchema = z.object({
    discount_type: z.enum(['RANK_PERCENTAGE', 'FREE_SHIP']),
    name: z.string().optional(),
    code: z.string().optional(),
    discount_value: z.coerce.number().min(0, "Value must be positive").optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    min_order_value: z.coerce.number().min(0).optional(),
    max_discount_amount: z.coerce.number().min(0).optional(),
    apply_rank_code: z.string().optional(),
    max_quantity: z.coerce.number().min(1, "Must have at least 1").optional(),
    is_public: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date must be after start date", path: ["end_date"] });
    }
    if (data.code && data.code.length > 0 && data.code.length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Voucher code must be at least 3 characters if provided", path: ["code"] });
    }
    if (data.discount_type === 'RANK_PERCENTAGE' && (data.discount_value === undefined || data.discount_value <= 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Discount value required", path: ["discount_value"] });
    }
});

type FormValues = z.infer<typeof formSchema>;

export default function VoucherEditPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') {
            navigate('/');
        }
    }, [user, navigate]);

    const { data: voucherData, isLoading, isError } = useQuery({
        queryKey: ['voucher', id],
        queryFn: () => VouchersService.getById(Number(id)),
        enabled: !!id
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            discount_type: "RANK_PERCENTAGE",
            name: "",
            code: "",
            discount_value: 0,
            start_date: "",
            end_date: "",
            min_order_value: 0,
            max_discount_amount: undefined,
            apply_rank_code: "ALL",
            max_quantity: undefined,
            is_public: true,
        },
    });

    useEffect(() => {
        if (voucherData) {
            let dtype = voucherData.discount_type;
            if (dtype === 'PERCENTAGE' && voucherData.code) {
                dtype = 'RANK_PERCENTAGE'; // Code-based percentage is order voucher
            } else if (dtype === 'PERCENTAGE' && !voucherData.code) {
                dtype = 'PRODUCT_PERCENTAGE'; // (Fallback, shouldn't occur)
            }

            // Convert UTC ISO string → local datetime-local string (YYYY-MM-DDTHH:mm)
            const toLocalDatetimeStr = (isoStr: string | null | undefined): string => {
                if (!isoStr) return '';
                const d = new Date(isoStr);
                if (isNaN(d.getTime())) return '';
                const offset = d.getTimezoneOffset() * 60000;
                return new Date(d.getTime() - offset).toISOString().slice(0, 16);
            };

            form.reset({
                discount_type: dtype as any,
                name: voucherData.name || "",
                code: voucherData.code || "",
                discount_value: voucherData.discount_value || 0,
                start_date: toLocalDatetimeStr(voucherData.start_date),
                end_date: toLocalDatetimeStr(voucherData.end_date),
                min_order_value: voucherData.min_order_value || 0,
                max_discount_amount: voucherData.max_discount_amount || undefined,
                apply_rank_code: voucherData.apply_rank_code || "ALL",
                max_quantity: voucherData.max_quantity || undefined,
                is_public: voucherData.is_public ?? true,
            });
        }
    }, [voucherData, form]);

    const watchType = form.watch('discount_type');

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            let finalCode = values.code?.toUpperCase();

            if (!finalCode || finalCode.trim() === '') {
                const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                if (watchType === 'FREE_SHIP') {
                    finalCode = `FREESHIP${randomSuffix}`;
                } else {
                    finalCode = `SALE${values.discount_value}${randomSuffix}`;
                }
            }

            const payload = {
                code: finalCode,
                discount_type: watchType === 'FREE_SHIP' ? 'FREE_SHIP' : 'PERCENTAGE',
                discount_value: watchType === 'FREE_SHIP' ? 0 : values.discount_value!,
                min_order_value: values.min_order_value,
                max_discount_amount: values.max_discount_amount,
                apply_rank_code: values.apply_rank_code === 'ALL' ? undefined : values.apply_rank_code,
                max_quantity: values.max_quantity || undefined,
                is_public: values.is_public,
                is_active: true, // preserve active state when updating
                ...(values.start_date ? { start_date: localDatetimeToISO(values.start_date) } : {}),
                ...(values.end_date   ? { end_date:   localDatetimeToISO(values.end_date)   } : {}),
            };

            await VouchersService.update(Number(id), payload);
            toast({ title: "Success", description: "Voucher updated successfully." });
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
            queryClient.invalidateQueries({ queryKey: ['voucher', id] });
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            navigate('/manager/vouchers?tab=vouchers');
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error?.response?.data?.message || "Failed to update." });
        }
    };

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (isError) {
        return <div className="text-center text-red-500 py-10">Failed to load voucher data.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Edit Campaign</h2>
                <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            {/* MASTER SWITCH: DISCOUNT TYPE (Disabled for Edit usually to prevent complex type switching, but allowed here for flexibility if needed, or we disable it) */}
                            <FormField
                                control={form.control}
                                name="discount_type"
                                render={({ field }) => (
                                    <FormItem className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                                        <FormLabel className="text-indigo-900 font-semibold">Campaign Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled>
                                            <FormControl>
                                                <SelectTrigger className="bg-white border-indigo-200 opacity-70">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="RANK_PERCENTAGE">Rank Voucher (% off order value)</SelectItem>
                                                <SelectItem value="FREE_SHIP">Free Shipping Voucher</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Type cannot be changed after creation. Please create a new one instead.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Voucher Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. NEWYEAR2026. Leave blank to auto-generate." className="uppercase" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* CONDITIONAL: IS_PUBLIC */}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CONDITIONAL: VALUE (Hidden for Free Ship) */}
                                {watchType !== 'FREE_SHIP' ? (
                                    <FormField
                                        control={form.control}
                                        name="discount_value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Value (%)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        onKeyDown={(e) => {
                                                            if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                                        }}
                                                        placeholder="e.g. 15"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : <div />} {/* Empty div to keep grid alignment if Free Ship */}
                            </div>

                            {/* DATE/TIME SECTION */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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



                            {/* SECTION: VOUCHER CONDITIONS */}
                            <div className="space-y-4 border rounded-lg p-5 bg-slate-50">
                                    <h3 className="font-semibold text-lg">Conditions & Restrictions</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="apply_rank_code"
                                            render={({ field }) => (
                                                <FormItem className="col-span-full">
                                                    <FormLabel className="text-base font-semibold">Đối tượng áp dụng</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || "ALL"}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn hạng khách hàng" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ALL">
                                                                <span className="flex items-center gap-2">👥 Tất cả khách hàng</span>
                                                            </SelectItem>
                                                            <SelectItem value="BRONZE">
                                                                <span className="flex items-center gap-2">🥉 Hạng Đồng (Bronze)</span>
                                                            </SelectItem>
                                                            <SelectItem value="SILVER">
                                                                <span className="flex items-center gap-2">🥈 Hạng Bạc (Silver)</span>
                                                            </SelectItem>
                                                            <SelectItem value="GOLD">
                                                                <span className="flex items-center gap-2">🥇 Hạng Vàng (Gold)</span>
                                                            </SelectItem>
                                                            <SelectItem value="DIAMOND">
                                                                <span className="flex items-center gap-2">💎 Hạng Kim Cương (Diamond)</span>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        Nếu chọn hạng cụ thể, hệ thống sẽ tự động gửi email thông báo có voucher đến các khách hàng thuộc hạng này.
                                                    </FormDescription>
                                                    {field.value && field.value !== 'ALL' && (
                                                        <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-1">
                                                            <span className="text-amber-600 mt-0.5">📧</span>
                                                            <span className="text-amber-800">
                                                                Email thông báo sẽ được gửi tự động đến tất cả khách hàng hạng <strong>{field.value}</strong> ngay khi voucher được tạo.
                                                            </span>
                                                        </div>
                                                    )}
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
                                                        <Input 
                                                            type="number" 
                                                            min={1}
                                                            onKeyDown={(e) => {
                                                                if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                                            }}
                                                            placeholder="Leave blank for unlimited" 
                                                            value={field.value === undefined || field.value === null ? "" : field.value}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                field.onChange(val === "" ? undefined : Number(val));
                                                            }}
                                                        />
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
                                    {/* MAX DISCOUNT CAP — Only visible for Percentage */}
                                    {watchType !== 'FREE_SHIP' && (
                                        <FormField
                                            control={form.control}
                                            name="max_discount_amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Maximum Discount Cap (VND)</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="text" 
                                                            placeholder="Leave blank for no limit" 
                                                            value={formatNumberStr(field.value)}
                                                            onChange={(e) => field.onChange(parseNumberStr(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Limits the discount for high-value orders (e.g., 10% up to 100k)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold h-12" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Update Campaign
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
