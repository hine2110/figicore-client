import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

import { PromotionsService } from '@/services/promotions.service';
import { productsService } from '@/services/products.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetOpexConfig } from '@/hooks/useOpexSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

// ── Zod Schema (Flash Sale ONLY) ─────────────────────────────────────────────
const opexRef = { current: 0 };

const flashSaleSchema = z.object({
    name: z.string().optional(),
    start_datetime: z.string().min(1, 'Start date & time is required'),
    end_datetime: z.string().min(1, 'End date & time is required'),
    is_recurring: z.boolean().default(false),
    items: z.array(z.object({
        variant_id: z.number(),
        name: z.string(),
        sku: z.string(),
        stock_available: z.number(),
        cost_price: z.number(),
        original_price: z.number(),
        flash_sale_price: z.coerce.number().min(1, 'Price must be > 0'),
        quota: z.coerce.number().min(1, 'Quota must be > 0'),
    })).min(1, 'At least 1 product is required'),
}).superRefine((data, ctx) => {
    if (data.start_datetime >= data.end_datetime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date/time must be after start date/time', path: ['end_datetime'] });
    }
    data.items.forEach((item, index) => {
        if (item.quota > item.stock_available) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Exceeds available stock (${item.stock_available})`, path: [`items.${index}.quota`] });
        }
        if (item.flash_sale_price >= item.original_price) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Flash Sale price must be < original price (${item.original_price.toLocaleString()})`, path: ['items', index, 'flash_sale_price'] });
        }
        const breakEvenPrice = item.cost_price * (1 + opexRef.current);
        if (item.flash_sale_price < Math.ceil(breakEvenPrice)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `OPEX Loss! Price must be >= Break-even (${Math.ceil(breakEvenPrice).toLocaleString()})`, path: ['items', index, 'flash_sale_price'] });
        }
    });
});

type FormValues = z.infer<typeof flashSaleSchema>;

const VIETNAMESE_HOLIDAYS: Record<string, string> = {
    "01/01": "New Year's Sale (1.1)",
    "02/02": "Mega Sale 2.2",
    "03/03": "Mega Sale 3.3",
    "04/04": "Mega Sale 4.4",
    "05/05": "Mega Sale 5.5",
    "06/06": "Mega Sale 6.6",
    "07/07": "Mega Sale 7.7",
    "08/08": "Mega Sale 8.8",
    "09/09": "Mega Sale 9.9",
    "10/10": "Mega Sale 10.10",
    "11/11": "11.11 Mega Sale",
    "12/12": "12.12 Year-End Sale",
    "14/02": "Valentine's Day",
    "08/03": "International Women's Day",
    "26/11": "Black Friday",
    "24/12": "Christmas Sale",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function FlashSaleCreatePage() {
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
        resolver: zodResolver(flashSaleSchema) as any,
        mode: 'onChange',
        defaultValues: {
            name: '',
            start_datetime: '',
            end_datetime: '',
            is_recurring: false,
            items: [],
        },
    });

    const minDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const { data: opexConfig } = useGetOpexConfig();
    useEffect(() => {
        if (opexConfig) {
            opexRef.current = Object.values(opexConfig).reduce((sum: number, val: any) => sum + Number(val), 0) / 100;
        }
    }, [opexConfig]);

    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const handleSearchVariant = async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await productsService.getProducts({ search: searchTerm });
            const products = Array.isArray(res) ? res : (res as any)?.data;
            if (!products || products.length === 0) {
                setSearchResults([]);
                return;
            }

            // Exclude BLINDBOX and PREORDER from Flash Sale
            const filteredProducts = products.filter((p: any) => p.type_code !== 'BLINDBOX' && p.type_code !== 'PREORDER');

            const allVariants = filteredProducts.flatMap((p: any) => 
                (p.product_variants || []).map((v: any) => ({
                    ...v,
                    product_name: p.name
                }))
            );
            setSearchResults(allVariants);
        } catch {
            toast({ variant: 'destructive', description: 'Error searching for product' });
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchTerm.trim()) {
                handleSearchVariant();
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const handleAddVariant = (variant: any) => {
        if (fields.some(f => f.variant_id === variant.variant_id)) {
            toast({ variant: 'destructive', description: 'This variant is already in the list' });
            return;
        }
        append({
            variant_id: variant.variant_id,
            sku: variant.sku,
            name: `${variant.product_name} - ${variant.option_name}`,
            stock_available: variant.stock_available || 0,
            cost_price: Number(variant.cost_price || 0),
            original_price: Number(variant.price),
            flash_sale_price: 0,
            quota: 0,
        });
        toast({ title: 'Added!', description: `${variant.sku} has been added to the Flash Sale.` });
        setSearchTerm('');
        setSearchResults([]);
    };

    const [batchDiscountPct, setBatchDiscountPct] = useState<string>('');
    const [batchQuota, setBatchQuota] = useState<string>('');

    const applyBatchSettings = () => {
        const items = form.getValues('items');
        if (!items || items.length === 0) return;
        const updatedItems = items.map(item => {
            let fsPrice = item.flash_sale_price;
            if (batchDiscountPct) {
                const pct = Number(batchDiscountPct);
                if (pct > 0 && pct < 100) {
                    fsPrice = item.original_price * (1 - pct/100);
                }
            }
            return {
                ...item,
                flash_sale_price: fsPrice,
                quota: batchQuota ? Number(batchQuota) : item.quota
            };
        });
        form.setValue('items', updatedItems, { shouldValidate: true, shouldDirty: true });
        form.trigger();
        toast({ title: 'Batch apply successful', description: `Updated ${items.length} products.` });
    };
    const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
    const [conflictData, setConflictData] = useState<any[]>([]);
    const [pendingFormValues, setPendingFormValues] = useState<FormValues | null>(null);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
    // Set of variant_ids the manager chose to OVERWRITE
    const [checkedConflictIds, setCheckedConflictIds] = useState<Set<number>>(new Set());

    const handlePreSubmit: SubmitHandler<FormValues> = async (values) => {
        setIsCheckingConflicts(true);
        try {
            const variantIds = values.items.map(i => i.variant_id);
            const preview = await PromotionsService.previewByVariantIds(variantIds);

            if (preview.conflict_count > 0 && preview.conflict_variants) {
                setConflictData(preview.conflict_variants);
                // Default: all conflicts are checked (will be overwritten)
                setCheckedConflictIds(new Set(preview.conflict_variants.map((c: any) => c.variant_id)));
                setPendingFormValues(values);
                setIsConflictDialogOpen(true);
            } else {
                await executeSave(values);
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not check for promotion conflicts.' });
        } finally {
            setIsCheckingConflicts(false);
        }
    };

    const executeSave = async (values: FormValues) => {
        try {
            // Auto-generate name if blank
            let finalName = values.name?.trim();
            if (!finalName) {
                const today = new Date();
                const key = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
                finalName = VIETNAMESE_HOLIDAYS[key]
                    ? `[${VIETNAMESE_HOLIDAYS[key]}] Flash Sale`
                    : `Flash Sale (${values.start_datetime.replace('T', ' ')} to ${values.end_datetime.replace('T', ' ')})`;
            }

            // Split datetime-local into exact date and time for backend
            const splitDT = (dt: string) => {
                if (!dt) return { date: undefined, time: '' };
                const [datePart, timePart] = dt.split('T');
                return { date: datePart, time: timePart?.slice(0, 5) || '' };
            };
            const { time: startTime } = splitDT(values.start_datetime);
            const { time: endTime } = splitDT(values.end_datetime);

            await PromotionsService.create({
                name: finalName,
                type_code: 'FIXED_AMOUNT',
                value: 0,
                start_time: startTime,
                end_time: endTime,
                start_date: new Date(values.start_datetime).toISOString(),
                end_date: new Date(values.end_datetime).toISOString(),
                is_recurring: values.is_recurring,
                is_flash_sale: true,
                items: values.items.map(i => ({
                    variant_id: i.variant_id,
                    flash_sale_price: i.flash_sale_price,
                    quota: i.quota,
                })),
            });

            toast({ title: '⚡ Flash Sale Created!', description: `${finalName} has been created successfully.` });
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            navigate('/manager/vouchers?tab=promotions');
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'Failed to create Flash Sale.' });
        }
    };

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="w-full pb-12">
            <div className="max-w-2xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create New Campaign</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Choose the appropriate campaign type. Flash Sale and Product Promotion will redirect to separate setup pages.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/manager/vouchers?tab=promotions')}>Cancel</Button>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePreSubmit)} className="space-y-6">

                    <div className="max-w-2xl mx-auto">
                        {/* BASIC INFO */}
                        <Card>
                        <CardHeader><CardTitle>Program Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Campaign Type <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value="FLASH_SALE"
                                    onValueChange={(val) => {
                                        if (val === 'PRODUCT_PERCENTAGE') navigate('/manager/promotions/new');
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

                            {/* TIME WINDOW */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_datetime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date & Time <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="datetime-local" min={minDateTime} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_datetime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date & Time <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="datetime-local" min={form.watch('start_datetime') || minDateTime} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* RECURRING TOGGLE */}
                            <FormField
                                control={form.control}
                                name="is_recurring"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-semibold text-orange-900">🔁 Repeat Daily</FormLabel>
                                            <FormDescription className="text-orange-700">
                                                ON — Flash Sale repeats every day in the same time window. OFF — Runs only within the selected date range.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                        </CardContent>
                    </Card>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* PRODUCT MASTER-DETAIL */}
                        <Card className="border-red-100">
                        <CardHeader className="bg-red-50/50 rounded-t-lg">
                            <CardTitle className="text-red-900">⚡ Flash Sale Product Config</CardTitle>
                            <p className="text-sm text-red-700">Add products and configure individual Flash Sale prices & quota per item.</p>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* SEARCH */}
                            <div className="flex items-center gap-2 max-w-xl relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search product name to add..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white pl-9"
                                />
                                {isSearching && <Loader2 className="w-5 h-5 animate-spin text-red-500 shrink-0" />}
                            </div>

                            {/* SEARCH RESULTS */}
                            {searchResults.length > 0 && (
                                <div className="border rounded-md shadow-sm bg-white overflow-hidden max-h-60 overflow-y-auto mb-4 border-red-200">
                                    <div className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 border-b border-red-100 flex justify-between sticky top-0 z-10">
                                        <span>Search Results ({searchResults.length} variants)</span>
                                        <button type="button" onClick={() => setSearchResults([])} className="text-red-600 hover:underline">Clear</button>
                                    </div>
                                    <ul className="divide-y divide-slate-100">
                                        {searchResults.map(variant => (
                                            <li key={variant.variant_id} className="p-3 hover:bg-slate-50 flex items-center justify-between group">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-900">{variant.product_name} <span className="text-slate-500 font-normal">— {variant.option_name}</span></div>
                                                    <div className="text-xs text-slate-500 mt-1 space-x-3">
                                                        <span className="font-mono text-slate-400">{variant.sku}</span>
                                                        <span className={variant.stock_available > 0 ? "text-green-600" : "text-red-500 font-medium"}>Stock: {variant.stock_available}</span>
                                                        <span className="text-slate-500">Cost: {Number(variant.cost_price || 0).toLocaleString()}đ</span>
                                                        <span>Original Price: {Number(variant.price).toLocaleString()}đ</span>
                                                    </div>
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="secondary"
                                                    onClick={() => handleAddVariant(variant)}
                                                    disabled={fields.some(f => f.variant_id === variant.variant_id)}
                                                    className={`transition-opacity ${fields.some(f => f.variant_id === variant.variant_id) ? 'opacity-50 cursor-not-allowed' : 'opacity-0 xl:group-hover:opacity-100'}`}
                                                >
                                                    {fields.some(f => f.variant_id === variant.variant_id) ? 'Added' : 'Add to List'}
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Root error for items array */}
                            {form.formState.errors.items?.root && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.items.root.message}</p>
                            )}
                            {(form.formState.errors.items as any)?.message && (
                                <p className="text-sm font-medium text-destructive">{(form.formState.errors.items as any).message}</p>
                            )}

                            {/* BATCH SETUP */}
                            {fields.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-lg mb-4">
                                    <div className="flex-1 w-full space-y-1.5">
                                        <label className="text-xs font-semibold text-orange-900 uppercase tracking-wider">Discount % (All)</label>
                                        <Input
                                            type="text"
                                            placeholder="Ex: 10"
                                            value={batchDiscountPct}
                                            maxLength={2}
                                            onChange={(e) => setBatchDiscountPct(e.target.value.replace(/\D/g, ''))}
                                            className="bg-white border-orange-200 focus-visible:ring-orange-500"
                                        />
                                    </div>
                                    <div className="flex-1 w-full space-y-1.5">
                                        <label className="text-xs font-semibold text-orange-900 uppercase tracking-wider">Quota (All)</label>
                                        <Input
                                            type="text"
                                            placeholder="Ex: 10"
                                            value={batchQuota ? Number(batchQuota).toLocaleString('en-US') : ''}
                                            onChange={(e) => setBatchQuota(e.target.value.replace(/\D/g, ''))}
                                            className="bg-white border-orange-200 focus-visible:ring-orange-500"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={applyBatchSettings}
                                        disabled={!batchDiscountPct && !batchQuota}
                                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shrink-0"
                                    >
                                        Apply to all
                                    </Button>
                                </div>
                            )}

                            {/* TABLE */}
                            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[250px]">Product & SKU</TableHead>
                                            <TableHead className="text-center w-[120px]">Cost Price</TableHead>
                                            <TableHead className="text-center w-[120px]">Original Price</TableHead>
                                            <TableHead className="text-center w-[80px]">Stock</TableHead>
                                            <TableHead className="text-center w-[160px]">Flash Sale Price</TableHead>
                                            <TableHead className="text-center w-[100px]">Discount</TableHead>
                                            <TableHead className="text-center w-[120px]">Quota</TableHead>
                                            <TableHead className="w-[50px]" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground bg-slate-50/50">
                                                    No products added yet. Search and add from the bar above.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            fields.map((field, index) => {
                                                const rowQuota = form.watch(`items.${index}.quota`);
                                                const isQuotaOver = field.stock_available > 0 && rowQuota > field.stock_available;
                                                return (
                                                    <TableRow key={field.id} className={isQuotaOver ? 'bg-red-50/50' : ''}>
                                                        <TableCell>
                                                            <div className="font-semibold text-sm text-slate-800 line-clamp-2">{field.name}</div>
                                                            <div className="text-xs text-slate-500 font-mono mt-1">{field.sku}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center text-slate-500">
                                                            {field.cost_price?.toLocaleString() || 0} VND
                                                            <div className="text-[10px] text-slate-400 mt-1" title="Minimum price to avoid losing money based on OPEX setting">Break-even: {Math.ceil(field.cost_price * (1 + opexRef.current)).toLocaleString()} VND</div>
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium text-slate-600">
                                                            {field.original_price.toLocaleString()} VND
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="inline-flex px-2 py-1 rounded bg-green-100 text-green-800 font-bold text-sm">
                                                                {field.stock_available}
                                                                {field.stock_available === 0 && <span className="text-[10px] text-red-600 ml-1">Out</span>}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="relative">
                                                            <FormField control={form.control} name={`items.${index}.flash_sale_price`} render={({ field: f, fieldState }) => (
                                                                <FormItem className="relative flex flex-col items-center justify-center space-y-0">
                                                                    <FormControl>
                                                                        <Input 
                                                                            type="text" 
                                                                            value={f.value !== undefined && f.value !== null ? Number(f.value).toLocaleString('en-US') : ''}
                                                                            disabled
                                                                            className={`text-center bg-slate-50 font-semibold ${fieldState.error ? 'border-red-500 text-red-600' : 'border-orange-100 text-slate-500'}`} 
                                                                            title="Computed from Discount %"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {(() => {
                                                                const fsPrice = form.watch(`items.${index}.flash_sale_price`) || 0;
                                                                const original = field.original_price || 0;
                                                                const percent = (original > 0 && fsPrice > 0 && fsPrice < original) 
                                                                    ? Math.round(((original - fsPrice) / original) * 100) 
                                                                    : '';
                                                                const amountSaved = original > 0 && fsPrice > 0 ? (original - fsPrice) : 0;
                                                                return (
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="relative w-[70px]">
                                                                            <Input
                                                                                type="text"
                                                                                value={percent}
                                                                                onChange={(e) => {
                                                                                    let pct = Number(e.target.value.replace(/\D/g, ''));
                                                                                    if (pct > 99) pct = 99;
                                                                                    if (pct >= 0) {
                                                                                        form.setValue(`items.${index}.flash_sale_price`, original * (1 - pct/100), { shouldValidate: true });
                                                                                    }
                                                                                }}
                                                                                className="text-center font-bold text-red-600 bg-red-50 border-red-200 h-8 pr-4"
                                                                                maxLength={2}
                                                                            />
                                                                            <span className="absolute right-2 top-2 text-xs font-bold text-red-500/70 select-none pointer-events-none">%</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField control={form.control} name={`items.${index}.quota`} render={({ field: f, fieldState }) => (
                                                                <FormItem className="relative flex flex-col items-center justify-center space-y-0">
                                                                    <FormControl>
                                                                        <Input
                                                                            type="text"
                                                                            value={f.value !== undefined && f.value !== null ? Number(f.value).toLocaleString('en-US') : ''}
                                                                            onChange={(e) => {
                                                                                const rawValue = e.target.value.replace(/\D/g, '');
                                                                                f.onChange(rawValue ? Number(rawValue) : 0);
                                                                            }}
                                                                            className={`text-center font-bold ${fieldState.error || isQuotaOver ? 'border-red-500 bg-red-50 text-red-600 focus-visible:ring-red-500' : 'border-blue-200'}`}
                                                                            title={fieldState.error?.message || (isQuotaOver ? "Exceeds available stock" : "")}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="hover:bg-red-100 hover:text-red-600">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 font-semibold h-12"
                            disabled={form.formState.isSubmitting || isCheckingConflicts}
                        >
                            {(form.formState.isSubmitting || isCheckingConflicts) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            ⚡ Create Flash Sale
                        </Button>
                    </div>
                </form>
            </Form>

            {/* CONFLICT DIALOG */}
            <Dialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            ⚠️ Promotion Overwrite Warning
                        </DialogTitle>
                        <DialogDescription className="text-slate-700 mt-2">
                            A total of <strong>{conflictData.length}</strong> products are currently running in another promotion.
                            <br />
                            <span className="text-xs text-slate-500">
                                ✅ Tick — include in new Promotion &amp; overwrite &nbsp;|&nbsp; ☐ Untick — keep current promotion
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-60 overflow-y-auto border rounded-md my-3 divide-y bg-slate-50">
                        {conflictData.map((c) => {
                            const isChecked = checkedConflictIds.has(c.variant_id);
                            return (
                                <label
                                    key={c.variant_id}
                                    className={`flex items-start gap-3 p-3 cursor-pointer select-none transition-colors ${
                                        isChecked ? 'bg-white hover:bg-slate-50' : 'bg-slate-100 hover:bg-slate-200'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 accent-red-600 cursor-pointer"
                                        checked={isChecked}
                                        onChange={() => {
                                            setCheckedConflictIds(prev => {
                                                const next = new Set(prev);
                                                if (next.has(c.variant_id)) next.delete(c.variant_id);
                                                else next.add(c.variant_id);
                                                return next;
                                            });
                                        }}
                                    />
                                    <div className="flex flex-col gap-0.5">
                                        <span className={`font-semibold text-sm ${
                                            isChecked ? 'text-slate-900' : 'text-slate-400 line-through'
                                        }`}>
                                            {c.name}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Running:{' '}
                                            <strong className="text-orange-600">{c.current_promotion?.name}</strong>
                                        </span>
                                        {!isChecked && (
                                            <span className="text-[10px] text-slate-400 italic">
                                                Will not be added to this Flash Sale
                                            </span>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    {(() => {
                        const totalItems = pendingFormValues?.items.length ?? 0;
                        const conflictIds = new Set(conflictData.map(c => c.variant_id));
                        const nonConflictCount = (pendingFormValues?.items ?? []).filter(
                            i => !conflictIds.has(i.variant_id)
                        ).length;
                        const overwriteCount = checkedConflictIds.size;
                        const finalCount = nonConflictCount + overwriteCount;
                        return (
                            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                                Will apply to: <strong>{nonConflictCount}</strong> non-conflicting products
                                {' '}+ <strong>{overwriteCount}</strong> products selected to overwrite
                                {' '}= <strong>{finalCount}</strong> in total
                            </div>
                        );
                    })()}

                    <DialogFooter className="flex gap-2 justify-end mt-2">
                        <Button variant="outline" onClick={() => {
                            setIsConflictDialogOpen(false);
                            setPendingFormValues(null);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (!pendingFormValues) return;
                                setIsConflictDialogOpen(false);
                                // Filter: keep non-conflict items + conflict items the manager chose to overwrite
                                const conflictIds = new Set(conflictData.map(c => c.variant_id));
                                const filteredItems = pendingFormValues.items.filter(
                                    item => !conflictIds.has(item.variant_id) || checkedConflictIds.has(item.variant_id)
                                );
                                executeSave({ ...pendingFormValues, items: filteredItems });
                            }}
                            disabled={form.formState.isSubmitting || (
                                // Disable if no items would be saved at all
                                (() => {
                                    const conflictIds = new Set(conflictData.map(c => c.variant_id));
                                    const nonConflict = (pendingFormValues?.items ?? []).filter(i => !conflictIds.has(i.variant_id)).length;
                                    return nonConflict + checkedConflictIds.size === 0;
                                })()
                            )}
                        >
                            {form.formState.isSubmitting
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : null}
                            {(() => {
                                const conflictIds = new Set(conflictData.map(c => c.variant_id));
                                const nonConflict = (pendingFormValues?.items ?? []).filter(i => !conflictIds.has(i.variant_id)).length;
                                const total = nonConflict + checkedConflictIds.size;
                                return `Apply (${total} products)`;
                            })()}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
