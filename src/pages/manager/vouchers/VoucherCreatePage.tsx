import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';


import { VouchersService } from '@/services/vouchers.service';
import { PromotionsService, PromotionPreviewResult } from '@/services/promotions.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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

const formSchema = z.object({
    discount_type: z.enum(['PRODUCT_PERCENTAGE', 'RANK_PERCENTAGE', 'FREE_SHIP']),
    name: z.string().optional(),
    code: z.string().optional(),
    discount_value: z.coerce.number().min(0, "Value must be positive").optional(),

    // For Vouchers: full datetime range
    start_date: z.string().optional(),
    end_date: z.string().optional(),

    // For Promotions: daily time window (HH:mm)
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    is_recurring: z.boolean().default(false),

    // For Vouchers
    min_order_value: z.coerce.number().min(0).optional(),
    apply_rank_code: z.string().optional(),
    max_quantity: z.coerce.number().min(1, "Must have at least 1").optional(),
    is_public: z.boolean().default(true),

    // For Promotions
    min_price: z.number().optional().default(0),
    max_price: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.discount_type === 'PRODUCT_PERCENTAGE') {
        if (!data.start_time || !data.end_time) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start time is required", path: ["start_time"] });
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time is required", path: ["end_time"] });
        } else if (data.start_time >= data.end_time) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time must be after start time", path: ["end_time"] });
        }
        if (data.name && data.name.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Program name must be at least 2 characters if provided", path: ["name"] });
        }
        if (data.discount_value === undefined || data.discount_value <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Discount value required", path: ["discount_value"] });
        }
        if (data.max_price !== undefined && data.min_price !== undefined && data.max_price <= data.min_price) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be greater than Minimum Price", path: ["max_price"] });
        }
        if (data.min_price === undefined || data.min_price === null) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Minimum Price is required", path: ["min_price"] });
        }
        if (data.max_price === undefined || data.max_price === null) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Maximum Price is required", path: ["max_price"] });
        }
    } else {
        if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date must be after start date", path: ["end_date"] });
        }
        if (!data.start_date) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["start_date"] });
        if (!data.end_date) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["end_date"] });
        if (data.code && data.code.length > 0 && data.code.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Voucher code must be at least 3 characters if provided", path: ["code"] });
        }
        if (data.discount_type === 'RANK_PERCENTAGE' && (data.discount_value === undefined || data.discount_value <= 0)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Discount value required", path: ["discount_value"] });
        }
    }
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
            discount_type: "PRODUCT_PERCENTAGE",
            name: "",
            code: "",
            discount_value: 0,
            start_date: "",
            end_date: "",
            start_time: "",
            end_time: "",
            is_recurring: false,
            min_order_value: 0,
            apply_rank_code: "ALL",
            max_quantity: undefined,
            is_public: true,
            min_price: undefined,
            max_price: undefined,
        },
    });

    const watchType = form.watch('discount_type');
    const isPromo = watchType === 'PRODUCT_PERCENTAGE';

    // ── Preview dialog state ──
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<PromotionPreviewResult | null>(null);
    const [pendingPromoId, setPendingPromoId] = useState<number | null>(null);
    const [pendingRange, setPendingRange] = useState<{ minPrice: number; maxPrice: number } | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const handleApplyRange = async (overwrite: boolean) => {
        if (!pendingPromoId || !pendingRange) return;
        setIsApplying(true);
        try {
            const result = await PromotionsService.applyByPriceRange(pendingPromoId, pendingRange, overwrite);
            const skipped = result.skipped ?? 0;
            toast({
                title: "Success!",
                description: `Applied to ${result.count} item variants.${ skipped > 0 ? ` ${skipped} variants with existing promotions were skipped.` : '' }`
            });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e?.response?.data?.message || 'Failed to apply range.' });
        } finally {
            setIsApplying(false);
            setPreviewOpen(false);
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            navigate('/manager/vouchers?tab=promotions');
        }
    };

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            if (isPromo) {
                // Auto-generate name if not provided
                let finalName = values.name;
                if (!finalName || finalName.trim() === '') {
                    const today = new Date();
                    const dd = String(today.getDate()).padStart(2, '0');
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dateMonthKey = `${dd}/${mm}`;
                    const holidayName = VIETNAMESE_HOLIDAYS[dateMonthKey];

                    if (holidayName) {
                        finalName = `[${holidayName}] Flash Sale ${values.discount_value}%`;
                    } else {
                        finalName = `Flash Sale ${values.discount_value}% (${values.start_time} - ${values.end_time})`;
                    }
                }

                const newPromo = await PromotionsService.create({
                    name: finalName,
                    type_code: 'PERCENTAGE',
                    value: values.discount_value!,
                    start_time: values.start_time!,
                    end_time: values.end_time!,
                    is_recurring: values.is_recurring ?? false,
                    min_apply_price: values.min_price,
                    max_apply_price: values.max_price,
                });

                const hasPriceRange = values.min_price !== undefined && values.max_price !== undefined;
                if (hasPriceRange) {
                    toast({ title: "Scanning products...", description: "Checking for conflicts..." });
                    const preview = await PromotionsService.previewByPriceRange(newPromo.promotion_id, {
                        minPrice: values.min_price!,
                        maxPrice: values.max_price!
                    });

                    if (preview.conflict_count === 0) {
                        // No conflicts — apply immediately
                        const result = await PromotionsService.applyByPriceRange(newPromo.promotion_id, {
                            minPrice: values.min_price!,
                            maxPrice: values.max_price!
                        }, true);
                        toast({ title: "Success!", description: `Created and applied to ${result.count} item variants.` });
                        queryClient.invalidateQueries({ queryKey: ['promotions'] });
                        navigate('/manager/vouchers?tab=promotions');
                    } else {
                        // Has conflicts — show dialog
                        setPendingPromoId(newPromo.promotion_id);
                        setPendingRange({ minPrice: values.min_price!, maxPrice: values.max_price! });
                        setPreviewData(preview);
                        setPreviewOpen(true);
                        // Don't navigate yet — wait for user decision
                    }
                } else {
                    toast({ title: "Success", description: "Product Promotion created!" });
                    queryClient.invalidateQueries({ queryKey: ['promotions'] });
                    navigate('/manager/vouchers?tab=promotions');
                }
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
                    start_date: new Date(values.start_date!).toISOString(),
                    end_date: new Date(values.end_date!).toISOString(),
                };

                await VouchersService.create(payload);
                toast({ title: "Success", description: "Voucher created successfully." });
                queryClient.invalidateQueries({ queryKey: ['vouchers'] });
                navigate('/manager/vouchers');
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error?.response?.data?.message || "Failed to create." });
        }
    };

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Create New Campaign</h2>
                <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            {/* MASTER SWITCH: DISCOUNT TYPE */}
                            <FormField
                                control={form.control}
                                name="discount_type"
                                render={({ field }) => (
                                    <FormItem className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                                        <FormLabel className="text-indigo-900 font-semibold">Select Campaign Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white border-indigo-200">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PRODUCT_PERCENTAGE">Product Promotion (% off direct price)</SelectItem>
                                                <SelectItem value="RANK_PERCENTAGE">Rank Voucher (% off order value)</SelectItem>
                                                <SelectItem value="FREE_SHIP">Free Shipping Voucher</SelectItem>
                                            </SelectContent>
                                        </Select>
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

                            {/* TIME INPUTS — only for Product Promotions */}
                            {isPromo ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                        When ON — Flash Sale repeats every day in the same time window. When OFF — it runs only today, then deactivates automatically.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </>
                            ) : (
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
                            )}

                            {/* SECTION: PRODUCT PROMOTION FIELDS */}
                            {isPromo && (
                                <div className="space-y-4 border rounded-lg p-5 bg-slate-50">
                                    <h3 className="font-semibold text-lg">Application Range</h3>
                                    <p className="text-sm text-slate-500">
                                        System automatically scans and applies the promotion to all item variants in this price range.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="min_price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Minimum Price (VND) <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="text" 
                                                            placeholder="e.g. 100.000" 
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
                                                    <FormLabel>Maximum Price (VND) <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="text" 
                                                            placeholder="e.g. 500.000" 
                                                            value={formatNumberStr(field.value)}
                                                            onChange={(e) => field.onChange(parseNumberStr(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
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
                            )}

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold h-12" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                {isPromo ? "Create Product Promotion" : "Create Voucher"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* ── Conflict Preview Dialog ── */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Promotion Conflict Detected
                        </DialogTitle>
                        <DialogDescription>
                            Some item variants in this price range already have an active promotion. Choose how to proceed.
                        </DialogDescription>
                    </DialogHeader>

                    {previewData ? (
                        <div className="space-y-4 py-2">
                            {/* Summary Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-800 dark:bg-emerald-950">
                                    <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600 mb-1" />
                                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{previewData.safe_count}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Ready to apply</p>
                                </div>
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-950">
                                    <AlertTriangle className="mx-auto h-5 w-5 text-amber-600 mb-1" />
                                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{previewData.conflict_count}</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-500">Have existing promotions</p>
                                </div>
                            </div>

                            {/* Conflict List */}
                            {previewData.conflict_products.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Conflicting variants:</p>
                                    <div className="max-h-52 overflow-y-auto space-y-2 rounded-md border p-2">
                                        {previewData.conflict_products.map(cp => (
                                            <div key={cp.product_id} className="flex items-center justify-between gap-2 text-sm px-1">
                                                <span className="font-medium truncate flex-1">{cp.name}</span>
                                                <Badge variant="outline" className="shrink-0 text-xs border-amber-400 text-amber-600">
                                                    {cp.current_promotion.name} • {Number(cp.current_promotion.value)}%
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            disabled={isApplying}
                            onClick={() => handleApplyRange(false)}
                        >
                            {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            ⏭️ Skip existing ({previewData?.conflict_count ?? 0})
                        </Button>
                        <Button
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={isApplying}
                            onClick={() => handleApplyRange(true)}
                        >
                            {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            ✅ Overwrite all
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
