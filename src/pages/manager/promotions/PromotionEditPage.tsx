import { useEffect, useState } from 'react';
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
    return new Intl.NumberFormat('vi-VN').format(Number(s));
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

export default function PromotionEditPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') {
            toast({ title: 'Access Denied', description: 'Only managers can edit promotions.', variant: 'destructive' });
            navigate('/manager/vouchers?tab=promotions');
        }
    }, [user, navigate, toast]);

    const { data: promoData, isLoading } = useQuery({
        queryKey: ['promotion', id],
        queryFn: () => PromotionsService.getById(Number(id)),
        enabled: !!id,
    });

    // Detect AI-generated promotion — price-range apply section is locked
    const isAiPromotion = !!(promoData?.name?.startsWith('[AI Clearance]'));

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

    // Helper to format UTC Date to Local string for standard `datetime-local` inputs
    const toLocalISOString = (dtInput: any) => {
        if (!dtInput) return '';
        const d = new Date(dtInput);
        if (isNaN(d.getTime())) return '';
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (promoData) {
            let startDt = promoData.start_date ? toLocalISOString(promoData.start_date) : '';
            let endDt = promoData.end_date ? toLocalISOString(promoData.end_date) : '';

            form.reset({
                name: promoData.name || '',
                value: Number(promoData.value) || 0,
                start_datetime: startDt,
                end_datetime: endDt,
                is_recurring: promoData.is_recurring ?? false,
                min_apply_price: Number(promoData.min_apply_price) || 0,
                max_apply_price: promoData.max_apply_price !== null && promoData.max_apply_price !== undefined ? Number(promoData.max_apply_price) : undefined,
            });
        }
    }, [promoData, form]);

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
            const preview = await PromotionsService.previewByPriceRange(Number(id), { minPrice: minP, maxPrice: maxP });
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
                const preview = await PromotionsService.previewByPriceRange(Number(id), { minPrice: values.min_apply_price, maxPrice: maxP });

                if (preview.conflict_count > 0 && preview.conflict_products) {
                    setConflictData(preview.conflict_products);
                    setSafeVariantIds((preview.safe_products || []).map((p: any) => p.product_id));
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

            await PromotionsService.update(Number(id), {
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

            if (values.min_apply_price !== undefined || values.max_apply_price !== undefined) {
                toast({ title: 'Processing...', description: 'Applying promotion...' });
                let count = 0;
                if (explicitVariantIds && explicitVariantIds.length > 0) {
                    const result = await PromotionsService.applyByVariantIds(Number(id), explicitVariantIds);
                    count = result.count ?? explicitVariantIds.length;
                } else {
                    const maxP = values.max_apply_price ?? Number.MAX_SAFE_INTEGER;
                    const result = await PromotionsService.applyByPriceRange(Number(id), {
                        minPrice: values.min_apply_price || 0,
                        maxPrice: maxP,
                    });
                    count = result.count ?? 0;
                }
                toast({ title: 'Success!', description: `Updated and applied to ${count} products.` });
            } else {
                toast({ title: 'Success', description: 'Promotion updated successfully!' });
            }

            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            queryClient.invalidateQueries({ queryKey: ['promotion', id] });
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

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    if (isLoading) {
        return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Update Campaign</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Edit existing campaign information. Campaign type cannot be changed.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/manager/vouchers?tab=promotions')}>Cancel</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Program Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 mb-6 opacity-70 cursor-not-allowed">
                        <label className="text-sm font-medium leading-none">
                            Campaign Type
                        </label>
                        <Select value="PRODUCT_PERCENTAGE" disabled>
                            <SelectTrigger>
                                <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PRODUCT_PERCENTAGE">🏷️ Product Promotion (direct % off)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Campaign type cannot be changed after creation.</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handlePreSubmit)} className="space-y-5">

                            {/* AI LOCK BANNER */}
                            {isAiPromotion && (
                                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    <span className="text-xl leading-none shrink-0">🤖</span>
                                    <div>
                                        <p className="font-semibold">AI-Generated Promotion — Product Assignment Locked</p>
                                        <p className="text-amber-700 mt-0.5">This promotion was created by AI for a specific product. You can edit the name, discount value, and schedule, but the product assignment is managed by AI only.</p>
                                    </div>
                                </div>
                            )}

                            {/* Tên */}
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
                                            <Input type="number" min={1} max={100} placeholder="e.g. 20" {...field} />
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
                                                <Input type="datetime-local" {...field} />
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
                                                <Input type="datetime-local" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* is_recurring */}
                            {(() => {
                                const watchedStart = form.watch('start_datetime');
                                const watchedEnd = form.watch('end_datetime');
                                const startT = watchedStart?.split('T')[1]?.slice(0, 5);
                                const endT = watchedEnd?.split('T')[1]?.slice(0, 5);
                                const isSameTime = !!(startT && endT && startT === endT);
                                return (
                                <FormField
                                    control={form.control}
                                    name="is_recurring"
                                    render={({ field }) => (
                                        <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-4 ${isSameTime ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-orange-200 bg-orange-50'}`}>
                                            <div className="space-y-0.5">
                                                <FormLabel className={`text-base font-semibold ${isSameTime ? 'text-slate-500' : 'text-orange-900'}`}>🔁 Repeat Daily</FormLabel>
                                                <FormDescription className={isSameTime ? 'text-slate-400' : 'text-orange-700'}>
                                                    ON: repeats every day in the same time window. OFF: runs only in the selected date range.
                                                </FormDescription>
                                                {isSameTime && (
                                                    <p className="text-xs text-red-600 font-medium pt-1">
                                                        ⚠️ Start time and end time are the same ({startT}). Repeat Daily would run 24/7 — please use different times to enable this option.
                                                    </p>
                                                )}
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={isSameTime ? false : field.value}
                                                    onCheckedChange={isSameTime ? undefined : field.onChange}
                                                    disabled={isSameTime}
                                                    className={isSameTime ? 'cursor-not-allowed' : ''}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                );
                            })()}


                            {/* Price range auto-apply — hidden for AI promotions */}
                            {!isAiPromotion && (
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
                            )}

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isCheckingConflicts}>
                                {(form.formState.isSubmitting || isCheckingConflicts) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {(form.formState.isSubmitting || isCheckingConflicts) ? 'Processing...' : 'Update Promotion'}
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
