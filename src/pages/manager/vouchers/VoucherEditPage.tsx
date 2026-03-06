import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

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
    "01/01": "Tết Dương lịch (Siêu Sale 1.1)",
    "02/02": "Siêu Sale 2.2",
    "03/03": "Siêu Sale 3.3",
    "04/04": "Siêu Sale 4.4",
    "05/05": "Siêu Sale 5.5",
    "06/06": "Siêu Sale 6.6",
    "07/07": "Siêu Sale 7.7",
    "08/08": "Siêu Sale 8.8",
    "09/09": "Siêu Sale 9.9",
    "10/10": "Siêu Sale 10.10",
    "11/11": "Siêu Sale 11.11",
    "12/12": "Siêu Sale 12.12",
    "14/02": "Valentine",
    "08/03": "Quốc tế Phụ nữ",
    "30/04": "Giải phóng miền Nam",
    "01/05": "Quốc tế Lao động",
    "01/06": "Quốc tế Thiếu nhi",
    "02/09": "Quốc khánh",
    "20/10": "Phụ nữ Việt Nam",
    "20/11": "Nhà giáo Việt Nam",
    "24/12": "Giáng sinh",
    "26/11": "Black Friday"
};

const parseNumberStr = (val: string) => {
    const numericStr = val.replace(/\D/g, '');
    return numericStr ? Number(numericStr) : undefined;
};

// Simplified form schema for editing. Usually type and code/name shouldn't be heavily edited or we adjust validation.
// For vouchers, type is usually already set, but we use the same schema.
const formSchema = z.object({
    discount_type: z.enum(['PRODUCT_PERCENTAGE', 'RANK_PERCENTAGE', 'FREE_SHIP']),
    name: z.string().optional(),
    code: z.string().optional(),
    discount_value: z.coerce.number().min(0, "Value must be positive").optional(),
    start_date: z.string().min(1, "Required"),
    end_date: z.string().min(1, "Required"),
    
    // For Vouchers
    min_order_value: z.coerce.number().min(0).optional(),
    apply_rank_code: z.string().optional(),
    max_quantity: z.coerce.number().min(1, "Must have at least 1").optional(),
    is_public: z.boolean().default(true),

    // For Promotions
    min_price: z.number().optional().default(0),
    max_price: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date must be after start date",
            path: ["end_date"]
        });
    }

    if (data.discount_type === 'PRODUCT_PERCENTAGE') {
        if (data.name && data.name.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Program name must be at least 2 characters if provided", path: ["name"] });
        }
        if (data.discount_value === undefined || data.discount_value <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Discount value required", path: ["discount_value"] });
        }
        if (data.max_price !== undefined && data.min_price !== undefined && data.max_price <= data.min_price) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be > Minimum price", path: ["max_price"] });
        }
    } else {
        if (data.code && data.code.length > 0 && data.code.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Voucher code must be at least 3 characters if provided", path: ["code"] });
        }
        if (data.discount_type === 'RANK_PERCENTAGE' && (data.discount_value === undefined || data.discount_value <= 0)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Discount value required", path: ["discount_value"] });
        }
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

    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'voucher'; // 'promotion' or 'voucher'

    // Fetch existing data
    const { data: voucherData, isLoading: isLoadingVoucher, isError: isErrorVoucher } = useQuery({
        queryKey: ['voucher', id],
        queryFn: () => VouchersService.getById(Number(id)),
        enabled: !!id && type === 'voucher'
    });

    const { data: promoData, isLoading: isLoadingPromo, isError: isErrorPromo } = useQuery({
        queryKey: ['promotion', id],
        queryFn: () => PromotionsService.getById(Number(id)),
        enabled: !!id && type === 'promotion'
    });

    const isLoading = type === 'voucher' ? isLoadingVoucher : isLoadingPromo;
    const isError = type === 'voucher' ? isErrorVoucher : isErrorPromo;

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
            apply_rank_code: "ALL",
            max_quantity: undefined,
            is_public: true,
            min_price: 0,
            max_price: undefined,
        },
    });

    // Populate form when data loads
    useEffect(() => {
        if (type === 'voucher' && voucherData) {
            let dtype = voucherData.discount_type;
            if (dtype === 'PERCENTAGE' && voucherData.code) {
                dtype = 'RANK_PERCENTAGE'; // Code-based percentage is order voucher
            } else if (dtype === 'PERCENTAGE' && !voucherData.code) {
                dtype = 'PRODUCT_PERCENTAGE';
            }

            form.reset({
                discount_type: dtype as any,
                name: voucherData.name || "",
                code: voucherData.code || "",
                discount_value: voucherData.discount_value || 0,
                start_date: voucherData.start_date ? voucherData.start_date.substring(0, 16) : "",
                end_date: voucherData.end_date ? voucherData.end_date.substring(0, 16) : "",
                min_order_value: voucherData.min_order_value || 0,
                apply_rank_code: voucherData.apply_rank_code || "ALL",
                max_quantity: voucherData.max_quantity || undefined,
                is_public: voucherData.is_public ?? true,
                min_price: 0,
                max_price: undefined,
            });
        } else if (type === 'promotion' && promoData) {
            form.reset({
                discount_type: 'PRODUCT_PERCENTAGE',
                name: promoData.name || "",
                code: "",
                discount_value: Number(promoData.value) || 0,
                start_date: promoData.start_date ? promoData.start_date.substring(0, 16) : "",
                end_date: promoData.end_date ? promoData.end_date.substring(0, 16) : "",
                min_order_value: 0,
                apply_rank_code: "ALL",
                max_quantity: undefined,
                is_public: true,
                min_price: Number(promoData.min_apply_price) || 0,
                max_price: promoData.max_apply_price ? Number(promoData.max_apply_price) : undefined,
            });
        }
    }, [voucherData, promoData, form, type]);

    const watchType = form.watch('discount_type');
    const isPromo = watchType === 'PRODUCT_PERCENTAGE';

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            if (isPromo) {
                // If converted to or edited as a product promotion (usually shouldn't cross-convert but handle just in case)
                let finalName = values.name;
                if (!finalName || finalName.trim() === '') {
                    const startDateObj = new Date(values.start_date);
                    
                    const dateMonthKey = format(startDateObj, 'dd/MM');
                    const holidayName = VIETNAMESE_HOLIDAYS[dateMonthKey];

                    if (holidayName) {
                        finalName = `[${holidayName}] Sale ${values.discount_value}%`;
                    } else {
                        finalName = `Sale ${values.discount_value}%`;
                    }
                }

                await PromotionsService.update(Number(id), {
                    name: finalName,
                    type_code: 'PERCENTAGE',
                    value: values.discount_value!,
                    start_date: new Date(values.start_date).toISOString(),
                    end_date: new Date(values.end_date).toISOString(),
                    min_apply_price: values.min_price,
                    max_apply_price: values.max_price,
                });

                toast({ title: "Success", description: "Product Promotion updated!" });
                queryClient.invalidateQueries({ queryKey: ['promotions'] });
                queryClient.invalidateQueries({ queryKey: ['promotion', id] });
                queryClient.invalidateQueries({ queryKey: ['voucher', id] });
                navigate('/manager/vouchers?tab=promotions');
            } else {
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
                    apply_rank_code: values.apply_rank_code === 'ALL' ? undefined : values.apply_rank_code,
                    max_quantity: values.max_quantity || undefined,
                    is_public: values.is_public,
                    start_date: new Date(values.start_date).toISOString(),
                    end_date: new Date(values.end_date).toISOString(),
                };

                await VouchersService.update(Number(id), payload);
                toast({ title: "Success", description: "Voucher updated successfully." });
                queryClient.invalidateQueries({ queryKey: ['vouchers'] });
                queryClient.invalidateQueries({ queryKey: ['voucher', id] });
                queryClient.invalidateQueries({ queryKey: ['promotions'] });
                navigate('/manager/vouchers?tab=vouchers');
            }
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
                                                <SelectItem value="PRODUCT_PERCENTAGE">Product Promotion (% off direct price)</SelectItem>
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
                                {/* CONDITIONAL: NAME vs CODE */}
                                {isPromo ? (
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Program Name (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Summer Sale. Leave blank to auto-generate." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
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
                                )}

                                {/* CONDITIONAL: IS_PUBLIC (Only for Vouchers) */}
                                {!isPromo && (
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
                                )}
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
                                                    <Input type="number" placeholder="e.g. 15" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : <div />} {/* Empty div to keep grid alignment if Free Ship */}
                            </div>

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

                            {/* SECTION: PRODUCT PROMOTION FIELDS (Readonly mostly, but allowed to change limits if we want) */}
                            {isPromo && (
                                <div className="space-y-4 border rounded-lg p-5 bg-slate-50">
                                    <h3 className="font-semibold text-lg">Application Range</h3>
                                    <p className="text-sm text-slate-500">
                                        Price range limits for applying this promotion.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                            placeholder="No limit" 
                                                            value={formatNumberStr(field.value)}
                                                            onChange={(e) => field.onChange(parseNumberStr(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* SECTION: VOUCHER CONDITIONS */}
                            {!isPromo && (
                                <div className="space-y-4 border rounded-lg p-5 bg-slate-50">
                                    <h3 className="font-semibold text-lg">Conditions & Restrictions</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="apply_rank_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Customer Rank Required</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || "ALL"}>
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
                                                        <Input 
                                                            type="number" 
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
                                </div>
                            )}

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
