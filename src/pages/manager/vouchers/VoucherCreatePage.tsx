import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

// ── Helpers ─────────────────────────────────────────────────────────────────
const formatNumberStr = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const numericStr = String(val).replace(/\D/g, '');
    if (!numericStr) return '';
    return new Intl.NumberFormat('en-US').format(Number(numericStr));
};

const parseNumberStr = (val: string) => {
    const numericStr = val.replace(/\D/g, '');
    return numericStr ? Number(numericStr) : undefined;
};

// ── Zod Schema (Voucher ONLY) ────────────────────────────────────────────────
// Vouchers are cart/checkout discount codes — completely separate from
// Product Promotions (direct price changes) and Flash Sales (time-limited fixed price).
const voucherSchema = z.object({
    voucher_type: z.enum(['RANK_PERCENTAGE', 'FREE_SHIP']),
    code: z.string().optional(),
    discount_value: z.coerce.number().min(0).optional(),
    start_date: z.string().min(1, 'Required'),
    end_date: z.string().min(1, 'Required'),
    min_order_value: z.coerce.number().min(0).optional(),
    max_discount_amount: z.coerce.number().min(0).optional(),
    apply_rank_code: z.string().optional(),
    max_quantity: z.coerce.number().min(1).optional(),
    is_public: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (new Date(data.start_date) >= new Date(data.end_date)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be after start date', path: ['end_date'] });
    }
    if (data.code && data.code.length > 0 && data.code.length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Voucher code must be at least 3 characters', path: ['code'] });
    }
    if (data.voucher_type === 'RANK_PERCENTAGE' && (data.discount_value === undefined || data.discount_value <= 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Discount value is required', path: ['discount_value'] });
    }
});

type FormValues = z.infer<typeof voucherSchema>;

// ── Component ────────────────────────────────────────────────────────────────
export default function VoucherCreatePage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();

    // Pre-select type from URL: ?type=freeship → FREE_SHIP, else → RANK_PERCENTAGE
    const defaultType = searchParams.get('type') === 'freeship' ? 'FREE_SHIP' : 'RANK_PERCENTAGE';

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') {
            navigate('/');
        }
    }, [user, navigate]);

    const form = useForm<FormValues>({
        resolver: zodResolver(voucherSchema) as any,
        defaultValues: {
            voucher_type: defaultType,
            code: '',
            discount_value: undefined,
            start_date: '',
            end_date: '',
            min_order_value: 0,
            max_discount_amount: undefined,
            apply_rank_code: 'ALL',
            max_quantity: undefined,
            is_public: true,
        },
    });

    const minDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const watchType = form.watch('voucher_type');
    const isFreeShip = watchType === 'FREE_SHIP';

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            // Auto-generate code if missing
            let finalCode = values.code?.toUpperCase().trim();
            if (!finalCode) {
                const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                finalCode = isFreeShip ? `FREESHIP${suffix}` : `SALE${values.discount_value}${suffix}`;
            }

            const payload = {
                code: finalCode,
                discount_type: isFreeShip ? 'FREE_SHIP' : 'PERCENTAGE',
                discount_value: isFreeShip ? 0 : values.discount_value!,
                min_order_value: values.min_order_value,
                max_discount_amount: values.max_discount_amount,
                apply_rank_code: values.apply_rank_code === 'ALL' ? undefined : values.apply_rank_code,
                max_quantity: values.max_quantity || undefined,
                is_public: values.is_public,
                start_date: new Date(values.start_date).toISOString(),
                end_date: new Date(values.end_date).toISOString(),
            };

            await VouchersService.create(payload);
            toast({ title: 'Success', description: `Voucher ${finalCode} created successfully.` });
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
            navigate('/manager/vouchers');
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'Failed to create voucher.' });
        }
    };

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create New Campaign</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Choose the appropriate campaign type. Flash Sale and Product Promotion will redirect to separate setup pages.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/manager/vouchers?tab=vouchers')}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Voucher Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* CAMPAIGN TYPE SELECTOR */}
                            <FormField
                                control={form.control}
                                name="voucher_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Campaign Type <span className="text-red-500">*</span></FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                // Flash Sale & Product Promotion → redirect to dedicated pages
                                                if (val === 'FLASH_SALE') {
                                                    navigate('/manager/promotions/flash-sale/new');
                                                    return;
                                                }
                                                if (val === 'PRODUCT_PERCENTAGE') {
                                                    navigate('/manager/promotions/new');
                                                    return;
                                                }
                                                field.onChange(val);
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select campaign type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FLASH_SALE">⚡ Flash Sale (custom price per product)</SelectItem>
                                                <SelectItem value="PRODUCT_PERCENTAGE">🏷️ Product Promotion (direct % off)</SelectItem>
                                                <SelectItem value="RANK_PERCENTAGE">🎫 Voucher — % off order</SelectItem>
                                                <SelectItem value="FREE_SHIP">🚚 Voucher — Free shipping</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* VOUCHER CODE */}
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Voucher Code</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. SUMMER2026 (auto-generated if blank)"
                                                    className="uppercase"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* IS PUBLIC */}
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

                            {/* DISCOUNT VALUE — hidden for Free Shipping */}
                            {!isFreeShip && (
                                <FormField
                                    control={form.control}
                                    name="discount_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Value (%) <span className="text-red-500">*</span></FormLabel>
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
                            )}

                            {/* DATE RANGE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" min={minDateTime} {...field} />
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
                                            <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" min={form.watch('start_date') || minDateTime} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* CONDITIONS */}
                            <div className="space-y-4 border rounded-lg p-5 bg-slate-50">
                                <h3 className="font-semibold text-base">Conditions &amp; Restrictions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="apply_rank_code"
                                        render={({ field }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel className="text-base font-semibold">Target Audience</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select customer rank" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="ALL">
                                                            <span className="flex items-center gap-2">👥 All Customers</span>
                                                        </SelectItem>
                                                        <SelectItem value="BRONZE">
                                                            <span className="flex items-center gap-2">🥉 Bronze Rank</span>
                                                        </SelectItem>
                                                        <SelectItem value="SILVER">
                                                            <span className="flex items-center gap-2">🥈 Silver Rank</span>
                                                        </SelectItem>
                                                        <SelectItem value="GOLD">
                                                            <span className="flex items-center gap-2">🥇 Gold Rank</span>
                                                        </SelectItem>
                                                        <SelectItem value="DIAMOND">
                                                            <span className="flex items-center gap-2">💎 Diamond Rank</span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    If a specific rank is selected, the system will automatically send an email notification to all customers in that rank.
                                                </FormDescription>
                                                {field.value && field.value !== 'ALL' && (
                                                    <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-1">
                                                        <span className="text-amber-600 mt-0.5">📧</span>
                                                        <span className="text-amber-800">
                                                            An automated notification email will be sent to all <strong>{field.value}</strong> rank customers immediately upon creation.
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
                                                <FormLabel>Maximum Claims Allowed</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        onKeyDown={(e) => {
                                                            if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                                        }}
                                                        placeholder="Leave blank for unlimited"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>Total max times this voucher can be collected</FormDescription>
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
                                                        placeholder="0 (no minimum)"
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
                                        name="max_discount_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maximum Discount Cap (VND)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder={isFreeShip ? "e.g. 30,000 (standard cap)" : "Leave blank for no limit"}
                                                        value={formatNumberStr(field.value)}
                                                        onChange={(e) => field.onChange(parseNumberStr(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {isFreeShip 
                                                        ? "Limits the shipping discount amount (e.g. Free ship up to 30k)" 
                                                        : "Limits the discount for high-value orders (e.g. 10% up to 100k)"}
                                                </FormDescription>
                                                {/* TECHNICAL NOTE: For FREE_SHIP vouchers, the cap must be a round
                                                    thousand (e.g. 30,000 / 50,000) to stay in sync with the GHN fee
                                                    rounding logic on the backend (ceil to nearest 1,000 VND).
                                                    A non-round cap (e.g. 30,200) can still produce fractional
                                                    amounts on the Checkout summary. */}
                                                {isFreeShip && (
                                                    <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-1">
                                                        <span className="text-amber-500 mt-0.5 shrink-0">⚠️</span>
                                                        <span className="text-amber-800">
                                                            <strong>Technical Note:</strong> Max discount should be{' '}
                                                            <strong>rounded to thousands</strong> (30,000 · 50,000 · 70,000…).
                                                            GHN shipping fee is rounded up to thousands on backend; if odd cap
                                                            it will cause odd discount amount displayed on Checkout page.
                                                        </span>
                                                    </div>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold h-12"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Create Voucher
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
