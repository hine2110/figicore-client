import { useEffect, useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

const formatNum = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const s = String(val).replace(/\D/g, '');
    if (!s) return '';
    return new Intl.NumberFormat('en-US').format(Number(s));
};
const parseNum = (val: string) => {
    const s = val.replace(/\D/g, '');
    return s ? Number(s) : undefined;
};

const formSchema = z.object({
    name: z.string().optional(),
    value: z.coerce.number().min(1, 'Discount value must be > 0.').max(100, 'Maximum discount is 100%.'),
    start_datetime: z.string().min(1, 'Start date & time is required'),
    end_datetime:   z.string().min(1, 'End date & time is required'),
    is_recurring: z.boolean().default(false),
    min_apply_price: z.number().optional().default(0),
    max_apply_price: z.number().optional(),
}).superRefine((data, ctx) => {
    if (data.start_datetime && data.end_datetime && data.start_datetime >= data.end_datetime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date/time must be after start date/time', path: ['end_datetime'] });
    }
    if (data.max_apply_price !== undefined && data.min_apply_price !== undefined) {
        if (data.max_apply_price <= data.min_apply_price) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Max price must be greater than min price', path: ['max_apply_price'] });
        }
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
            toast({ title: 'Access Denied', description: 'Only managers can create promotions.', variant: 'destructive' });
            navigate('/manager/vouchers?tab=promotions');
        }
    }, [user, navigate, toast]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: '',
            value: 0,
            start_datetime: '',
            end_datetime: '',
            is_recurring: false,
            min_apply_price: 0,
            max_apply_price: undefined,
        },
    });

    const minDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
    const [conflictData, setConflictData] = useState<any[]>([]);
    const [safeVariantIds, setSafeVariantIds] = useState<number[]>([]);
    const [selectedConflicts, setSelectedConflicts] = useState<Set<number>>(new Set());
    const [pendingFormValues, setPendingFormValues] = useState<FormValues | null>(null);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
    const [previewSafeData, setPreviewSafeData] = useState<any[]>([]);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [hasPreviewed, setHasPreviewed] = useState(false);

    const handlePreview = async () => {
        const minP = form.getValues('min_apply_price') || 0;
        const maxP = form.getValues('max_apply_price') ?? Number.MAX_SAFE_INTEGER;
        setIsPreviewing(true);
        try {
            const preview = await PromotionsService.previewByPriceRange(0, { minPrice: minP, maxPrice: maxP });
            setPreviewSafeData(preview.safe_products || []);
            setConflictData(preview.conflict_products || []);
            setHasPreviewed(true);
        } catch (err: any) {
            toast({ variant: 'destructive', description: err?.response?.data?.message || 'Failed to fetch preview' });
        } finally {
            setIsPreviewing(false);
        }
    };

    const toggleConflict = (productId: number) => {
        setSelectedConflicts(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    };

    const handlePreSubmit: SubmitHandler<FormValues> = async (values) => {
        if (values.min_apply_price !== undefined) {
            setIsCheckingConflicts(true);
            try {
                const maxP = values.max_apply_price ?? Number.MAX_SAFE_INTEGER;
                const preview = await PromotionsService.previewByPriceRange(0, { minPrice: values.min_apply_price, maxPrice: maxP });

                if (preview.conflict_count > 0 && preview.conflict_products) {
                    setConflictData(preview.conflict_products);
                    setSafeVariantIds((preview.safe_products || []).map((p: any) => p.product_id));
                    // Pre-tick all conflict products by default
                    setSelectedConflicts(new Set(preview.conflict_products.map((p: any) => p.product_id)));
                    setPendingFormValues(values);
                    setIsConflictDialogOpen(true);
                    return;
                }
            } catch (err) {
                console.error('Conflict check failed:', err);
            } finally {
                setIsCheckingConflicts(false);
            }
        }
        await executeSave(values);
    };

    // explicitVariantIds: if provided, only apply to these (selective mode)
    const executeSave = async (values: FormValues, explicitVariantIds?: number[]) => {
        try {
            // Auto-generate name if blank
            const en_months = ['January','February','March','April','May','June',
                              'July','August','September','October','November','December'];
            const PROMO_HOLIDAYS: Record<string, string> = {
                '01/01': "New Year's Sale",
                '08/03': "Women's Day Sale",
                '01/06': "Children's Day Sale",
                '20/10': "Vietnamese Women's Day Sale",
                '26/11': 'Black Friday Sale',
                '24/12': 'Christmas Sale',
                '11/11': '11.11 Mega Sale',
            };
            let finalName = values.name?.trim();
            if (!finalName) {
                const today = new Date();
                const key = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}`;
                finalName = PROMO_HOLIDAYS[key]
                    ? `${PROMO_HOLIDAYS[key]} – ${values.value}% Off`
                    : `${values.value}% Off · ${en_months[today.getMonth()]} ${today.getFullYear()}`;
            }
            // Split datetime-local → date (YYYY-MM-DD) + time (HH:mm) for backend
            const splitDT = (dt: string) => {
                if (!dt) return { date: undefined, time: '' };
                const [datePart, timePart] = dt.split('T');
                return { date: datePart, time: timePart?.slice(0, 5) || '' };
            };
            const { time: startTime } = splitDT(values.start_datetime);
            const { time: endTime } = splitDT(values.end_datetime);

            const newPromo = await PromotionsService.create({
                name: finalName,
                type_code: 'PERCENTAGE',
                value: values.value,
                start_time: startTime,
                end_time: endTime,
                is_recurring: values.is_recurring,
                start_date: new Date(values.start_datetime).toISOString(),
                end_date: new Date(values.end_datetime).toISOString(),
                min_apply_price: values.min_apply_price,
                max_apply_price: values.max_apply_price,
                is_flash_sale: false,
            });

            if (values.min_apply_price !== undefined) {
                toast({ title: 'Processing...', description: 'Applying promotion...' });
                let count = 0;
                if (explicitVariantIds && explicitVariantIds.length > 0) {
                    // Selective mode: apply only to the chosen variants
                    const result = await PromotionsService.applyByVariantIds(newPromo.promotion_id, explicitVariantIds);
                    count = result.count ?? explicitVariantIds.length;
                } else {
                    const maxP = values.max_apply_price ?? Number.MAX_SAFE_INTEGER;
                    const result = await PromotionsService.applyByPriceRange(newPromo.promotion_id, {
                        minPrice: values.min_apply_price,
                        maxPrice: maxP,
                    });
                    count = result.count ?? 0;
                }
                toast({
                    title: count > 0 ? 'Success!' : 'Attention',
                    description: count > 0
                        ? `Created and applied to ${count} products.`
                        : 'Created, but no products found in this price range.',
                });
            } else {
                toast({ title: 'Success', description: 'Promotion created successfully!' });
            }

            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            navigate('/manager/vouchers?tab=promotions');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error?.response?.data?.message || 'Failed to create promotion.',
            });
        }
    };

    const generateName = () => {}; // kept for compatibility

    if (user?.role_code !== 'MANAGER') return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create New Campaign</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Choose the appropriate campaign type. Flash Sale and Product Promotion will redirect to separate setup pages.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/manager/vouchers?tab=promotions')}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Program Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 mb-6">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Campaign Type <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value="PRODUCT_PERCENTAGE"
                            onValueChange={(val) => {
                                if (val === 'FLASH_SALE') navigate('/manager/promotions/flash-sale/new');
                                if (val === 'RANK_PERCENTAGE') navigate('/manager/vouchers/new?type=percentage');
                                if (val === 'FREE_SHIP') navigate('/manager/vouchers/new?type=freeship');
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FLASH_SALE">⚡ Flash Sale (custom price per product)</SelectItem>
                                <SelectItem value="PRODUCT_PERCENTAGE">🏷️ Product Promotion (direct % off)</SelectItem>
                                <SelectItem value="RANK_PERCENTAGE">🎫 Voucher — % off order</SelectItem>
                                <SelectItem value="FREE_SHIP">🚚 Voucher — Free shipping</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

            <Form {...form}>
                        <form onSubmit={form.handleSubmit(handlePreSubmit)} className="space-y-5">

                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Program Name <span className="text-slate-400 font-normal text-sm">(optional)</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Leave blank to auto-name by holiday..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Discount value */}
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount (%) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                onKeyDown={(e) => {
                                                    if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                                }}
                                                placeholder="e.g. 20"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Enter percentage, e.g. 20 (means -20%)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Start / End datetime-local */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_datetime"
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
                                    name="end_datetime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" min={form.watch('start_datetime') || minDateTime} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* is_recurring */}
                            <FormField
                                control={form.control}
                                name="is_recurring"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-semibold text-orange-900">🔁 Repeat Daily</FormLabel>
                                            <FormDescription className="text-orange-700">
                                                ON: repeats every day in the same time window. OFF: runs only in the selected date range.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Price range auto-apply */}
                            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                                <div>
                                    <h3 className="font-semibold text-base">Auto-Apply by Price Range</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        System scans and auto-applies this promotion to all variants within this price range.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="min_apply_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Min Price (VND)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="0"
                                                        value={formatNum(field.value)}
                                                        onChange={(e) => field.onChange(parseNum(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="max_apply_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Max Price (VND)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Leave blank = no limit"
                                                        value={formatNum(field.value)}
                                                        onChange={(e) => field.onChange(parseNum(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>Leave blank for no maximum price limit</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <Button type="button" variant="secondary" size="sm" onClick={handlePreview} disabled={isPreviewing}>
                                        {isPreviewing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Preview Products in Range
                                    </Button>
                                </div>
                                {hasPreviewed && (
                                    <div className="mt-4 border rounded-md p-3 bg-white max-h-60 overflow-y-auto">
                                        <h4 className="font-semibold text-sm mb-2 text-slate-700">Preview Results ({previewSafeData.length + conflictData.length} total)</h4>
                                        <ul className="space-y-2 text-sm">
                                            {previewSafeData.map(p => {
                                                const discount = form.getValues('value') || 0;
                                                const finalPrice = p.price * (1 - discount / 100);
                                                const cost = p.cost_price || 0;
                                                const isLoss = finalPrice < cost;
                                                return (
                                                <li key={p.product_id} className="flex flex-col gap-0.5 border-b pb-2 last:border-b-0 last:pb-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-green-600 font-bold">✓</span> <span className="font-medium text-slate-800">{p.name}</span>
                                                            {isLoss && <span className="ml-2 text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">Below Cost</span>}
                                                        </div>
                                                        <div className="text-right text-[11px] flex items-center gap-3">
                                                            <div className="text-slate-500">Cost: <strong>{Number(cost).toLocaleString()} VND</strong></div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-slate-400 line-through">{Number(p.price || 0).toLocaleString()} VND</span>
                                                                <span className="text-slate-300">→</span>
                                                                <span className={`font-bold ${isLoss ? 'text-red-600' : 'text-amber-600'}`}>{Number(finalPrice).toLocaleString()} VND</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            )})}
                                            {conflictData.map(c => {
                                                const discount = form.getValues('value') || 0;
                                                const finalPrice = c.price * (1 - discount / 100);
                                                const cost = c.cost_price || 0;
                                                const isLoss = finalPrice < cost;
                                                return (
                                                <li key={c.product_id} className="flex flex-col gap-0.5 border-b pb-2 last:border-b-0 last:pb-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-red-500 font-bold">⚠</span> <span className="font-medium text-slate-800">{c.name}</span>
                                                            {isLoss && <span className="ml-2 text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">Below Cost</span>}
                                                        </div>
                                                        <div className="text-right text-[11px] flex items-center gap-3">
                                                            <div className="text-slate-500">Cost: <strong>{Number(cost).toLocaleString()} VND</strong></div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-slate-400 line-through">{Number(c.price || 0).toLocaleString()} VND</span>
                                                                <span className="text-slate-300">→</span>
                                                                <span className={`font-bold ${isLoss ? 'text-red-600' : 'text-amber-600'}`}>{Number(finalPrice).toLocaleString()} VND</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-slate-500 ml-5">
                                                        Currently running in: <strong className={c.current_promotion?.is_flash_sale ? 'text-red-600' : 'text-orange-600'}>
                                                            {c.current_promotion?.is_flash_sale ? '⚡ ' : ''}{c.current_promotion?.name}
                                                        </strong>
                                                    </div>
                                                </li>
                                            )})}
                                            {previewSafeData.length === 0 && conflictData.length === 0 && (
                                                <li className="text-slate-500 italic py-2">No products found in this price range.</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isCheckingConflicts}>
                                {(form.formState.isSubmitting || isCheckingConflicts) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {(form.formState.isSubmitting || isCheckingConflicts) ? 'Processing...' : 'Create Promotion'}
                            </Button>

                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* CONFLICT DIALOG */}
            <Dialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            ⚠️ Promotion Overwrite Warning
                        </DialogTitle>
                        <DialogDescription className="text-slate-700 mt-2">
                            A total of <strong>{conflictData.length}</strong> products are currently running in another promotion.<br />
                            <span className="text-slate-500 text-xs">✔ Tick = overwrite (switch to new Promotion) &nbsp; □ Untick = keep current promotion.</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-64 overflow-y-auto border rounded-md my-3 bg-slate-50">
                        {conflictData.map((c) => (
                            <label
                                key={c.product_id}
                                className="flex items-start gap-3 p-3 border-b last:border-b-0 bg-white hover:bg-slate-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedConflicts.has(c.product_id)}
                                    onChange={() => toggleConflict(c.product_id)}
                                    className="mt-0.5 h-4 w-4 accent-red-600 cursor-pointer"
                                />
                                <div className="flex flex-col gap-0.5 text-sm">
                                    <span className="font-semibold text-slate-900">{c.name}</span>
                                    <span className="text-slate-500">
                                        Running: <strong className={c.current_promotion?.is_flash_sale ? 'text-red-600' : 'text-orange-600'}>
                                            {c.current_promotion?.is_flash_sale ? '⚡ ' : ''}{c.current_promotion?.name}
                                        </strong>
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                        Will apply to: <strong>{safeVariantIds.length}</strong> non-conflicting products + <strong>{selectedConflicts.size}</strong> products selected to overwrite = <strong>{safeVariantIds.length + selectedConflicts.size}</strong> in total.
                    </div>

                    <DialogFooter className="flex gap-2 justify-end mt-3">
                        <Button variant="outline" onClick={() => {
                            setIsConflictDialogOpen(false);
                            setPendingFormValues(null);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setIsConflictDialogOpen(false);
                                if (pendingFormValues) {
                                    // Combine safe + selected conflict variant IDs
                                    const finalIds = [
                                        ...safeVariantIds,
                                        ...conflictData
                                            .filter(c => selectedConflicts.has(c.product_id))
                                            .map(c => c.product_id)
                                    ];
                                    executeSave(pendingFormValues, finalIds.length > 0 ? finalIds : undefined);
                                }
                            }}
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Apply ({safeVariantIds.length + selectedConflicts.size} products)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
