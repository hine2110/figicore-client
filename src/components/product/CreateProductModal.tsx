import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ChevronRight, CheckCircle2, Box, Info, Trash2, Plus, Eye, X, Calendar, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { SmartCreatableSelect } from "@/components/common/SmartCreatableSelect";
import { productsService } from "@/services/products.service";
import { optionsService } from "@/services/options.service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- VALIDATION SCHEMAS ---
const baseSchema = z.object({
    name: z.string().min(2, "Product Name is required"),
    description: z.string().optional(),
    media_urls: z.string().optional(),
    brand_id: z.coerce.number().min(1, "Brand is required"),
    category_id: z.coerce.number().min(1, "Category is required"),
    series_id: z.coerce.number().optional(),
    type_code: z.enum(["RETAIL", "BLINDBOX", "PREORDER"]),
});

const retailSchema = baseSchema.extend({
    type_code: z.literal("RETAIL"),
    variants: z.array(z.object({
        option_name: z.string().min(1, "Option Name is required"),
        price: z.coerce.number().min(1000, "Price must be at least 1,000 VND"),
        sku: z.string().optional(),
        image_url: z.string().optional(),
    })).min(1, "At least one variant is required"),
});

const blindboxSchema = baseSchema.extend({
    type_code: z.literal("BLINDBOX"),
    price: z.coerce.number().min(1000, "Ticket Price must be at least 1,000 VND"),
    min_value_allow: z.coerce.number().min(0),
    max_value_allow: z.coerce.number().min(0),
    target_margin: z.coerce.number().min(0).max(100).optional(),
    start_date: z.string().min(1, "Start Date is required"),
    end_date: z.string().min(1, "End Date is required"),
}).refine((data) => data.max_value_allow >= data.min_value_allow, {
    message: "Max value cannot be less than Min value",
    path: ["max_value_allow"],
}).refine((data) => {
    if (!data.start_date || !data.end_date) return true;
    return new Date(data.end_date) > new Date(data.start_date);
}, {
    message: "End Date must be after Start Date",
    path: ["end_date"],
}).refine((data) => {
    if (!data.start_date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(data.start_date) >= today;
}, {
    message: "Start Date cannot be in the past",
    path: ["start_date"],
});

const preorderSchema = baseSchema.extend({
    type_code: z.literal("PREORDER"),
    full_price: z.coerce.number().min(1000, "Full Price must be at least 1,000 VND"),
    deposit_amount: z.coerce.number().min(1000, "Deposit must be at least 1,000 VND"),
    release_date: z.string().min(1, "Release date is required"),
    max_slots: z.coerce.number().min(1).optional(),
}).refine((data) => data.deposit_amount <= data.full_price, {
    message: "Deposit cannot be greater than Full Price",
    path: ["deposit_amount"],
}).refine((data) => {
    if (!data.release_date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(data.release_date) >= today;
}, {
    message: "Release Date cannot be in the past",
    path: ["release_date"],
});

const formSchema = z.discriminatedUnion("type_code", [
    retailSchema,
    blindboxSchema,
    preorderSchema
]);

type ProductFormValues = z.infer<typeof formSchema>;

// --- SUB-COMPONENT: DETAIL VIEW (RICH UI) ---
function ProductDetailView({ product, onClose, onSuccess }: { product: any, onClose: () => void, onSuccess?: () => void }) {
    const [status, setStatus] = useState(product.status_code);

    // Optimistic Update Wrapper
    const handleToggleStatus = async () => {
        const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        setStatus(newStatus);
        try {
            await productsService.toggleStatus(product.product_id);
            // Optionally trigger onSuccess to fresh grid if needed, though status is local here too
            onSuccess?.();
        } catch (error) {
            console.error("Status Toggle Failed", error);
            setStatus(status); // Revert
        }
    };

    if (!product) return null;

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    // Type specific logic
    const isRetail = product.type_code === 'RETAIL';
    const isBlindbox = product.type_code === 'BLINDBOX';
    const isPreorder = product.type_code === 'PREORDER';

    const bb = product.product_blindboxes?.[0];
    const pre = product.product_preorders?.[0];

    return (
        <div className="flex flex-col h-full bg-white">
            <DialogTitle className="sr-only">Product Detail</DialogTitle>
            <div className="p-6 pb-2 border-b shrink-0 flex justify-between items-center bg-neutral-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Box className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">{product.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Badge variant="outline">{product.type_code}</Badge>
                            <span>{product.brands?.name || "Unknown Brand"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Toggle in Header */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                        <span className={cn("text-xs font-bold uppercase", status === 'ACTIVE' ? "text-green-600" : "text-neutral-400")}>
                            {status === 'ACTIVE' ? "Active" : "Inactive"}
                        </span>
                        <Switch
                            checked={status === 'ACTIVE'}
                            onCheckedChange={handleToggleStatus}
                            className="data-[state=checked]:bg-green-600"
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* 1. KEY METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-xl bg-neutral-50 space-y-1">
                        <div className="text-xs font-medium text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Category
                        </div>
                        <div className="font-semibold">{product.categories?.name || "N/A"}</div>
                    </div>
                    <div className="p-4 border rounded-xl bg-neutral-50 space-y-1">
                        <div className="text-xs font-medium text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                            <Box className="w-3 h-3" /> Series
                        </div>
                        <div className="font-semibold">{product.series?.name || "N/A"}</div>
                    </div>
                    <div className="p-4 border rounded-xl bg-neutral-50 space-y-1">
                        <div className="text-xs font-medium text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                            <Info className="w-3 h-3" /> Status
                        </div>
                        <Badge className={status === 'ACTIVE' ? "bg-green-600" : "bg-neutral-400"}>
                            {status}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 2. IMAGE */}
                    <div className="col-span-1">
                        <div className="aspect-square bg-neutral-100 rounded-xl overflow-hidden border">
                            {product.media_urls?.[0] ?
                                <img src={product.media_urls[0]} className="w-full h-full object-cover" /> :
                                <div className="flex items-center justify-center h-full text-neutral-300"><Box className="w-12 h-12" /></div>
                            }
                        </div>
                    </div>

                    {/* 3. DETAILS */}
                    <div className="col-span-2 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-neutral-900 border-b pb-2 mb-3">Description</h3>
                            <p className="text-neutral-600 leading-relaxed text-sm">
                                {product.description || "No description provided."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-neutral-900 border-b pb-2 mb-3">Pricing & Configuration</h3>

                            {/* RETAIL OR PREORDER VARIANTS */}
                            {/* Preorder creates explicit variants now, so we can show them in table logic if desired, or simplified block */}
                            {(isRetail || isPreorder) && (
                                <div className="border rounded-md overflow-hidden">
                                    <div className="p-2 bg-neutral-100/50 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b">
                                        {isRetail ? "Product Variants" : "Payment Options (Variants)"}
                                    </div>
                                    <Table>
                                        <TableHeader className="bg-neutral-50"><TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Code</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {product.product_variants?.map((v: any) => (
                                                <TableRow key={v.variant_id}>
                                                    <TableCell className="font-medium">{v.option_name}</TableCell>
                                                    <TableCell>{formatPrice(Number(v.price))}</TableCell>
                                                    <TableCell className="text-neutral-500 font-mono text-xs">{v.sku}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {isBlindbox && bb && (
                                <div className="bg-purple-50 rounded-xl border border-purple-100 overflow-hidden mt-4">
                                    <div className="bg-purple-100/50 p-4 border-b border-purple-200 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-purple-900 font-bold">
                                            <Box className="w-5 h-5" /> Blindbox Campaign
                                        </div>
                                        <Badge className="bg-purple-600 hover:bg-purple-700 text-white">{bb.target_margin}% Margin</Badge>
                                    </div>
                                    <div className="p-6 grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs uppercase font-bold text-purple-400">Ticket Price</label>
                                            <div className="text-3xl font-bold text-purple-900 mt-1">{formatPrice(Number(bb.price))}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase font-bold text-purple-400">Value Range</label>
                                            <div className="text-lg font-medium text-purple-800 mt-1">
                                                {formatPrice(Number(bb.min_value_allow))} - {formatPrice(Number(bb.max_value_allow))}
                                            </div>
                                            <div className="w-full h-2 bg-purple-200 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-purple-500 w-2/3 opacity-50"></div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2 text-sm text-purple-700 bg-purple-100/50 p-3 rounded-lg">
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            <span>Campaign Active</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isPreorder && pre && (
                                <div className="bg-orange-50 rounded-xl border border-orange-100 overflow-hidden mt-4">
                                    <div className="bg-orange-100/50 p-4 border-b border-orange-200 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-orange-900 font-bold">
                                            <Calendar className="w-5 h-5" /> Pre-order Info
                                        </div>
                                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white">
                                            Limit: {pre.max_slots} pcs
                                        </Badge>
                                    </div>
                                    <div className="p-6 grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="text-xs uppercase font-bold text-orange-400">Full Price</label>
                                            <div className="text-3xl font-bold text-neutral-800 mt-1">
                                                {formatPrice(Number(pre.full_price || 0))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase font-bold text-orange-400">Required Deposit</label>
                                            <div className="text-3xl font-bold text-orange-600 mt-1">{formatPrice(Number(pre.deposit_amount))}</div>
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2 text-sm text-orange-800 bg-orange-100/50 p-3 rounded-lg">
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            <span>Est. Release: <b>{new Date(pre.release_date).toLocaleDateString('vi-VN')}</b></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t bg-neutral-50 flex justify-end">
                <Button onClick={onClose} variant="outline">Close View</Button>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
interface CreateProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    productToEdit?: any;
    isViewMode?: boolean;
}

export function CreateProductModal({ open, onOpenChange, onSuccess, productToEdit, isViewMode = false }: CreateProductModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Local Options
    const [brands, setBrands] = useState<{ label: string, value: number }[]>([]);
    const [categories, setCategories] = useState<{ label: string, value: number }[]>([]);
    const [series, setSeries] = useState<{ label: string, value: number }[]>([]);

    const isEditMode = !!productToEdit;

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "", description: "", media_urls: "", type_code: "RETAIL",
            variants: [{ option_name: "Standard", price: 0, sku: "", image_url: "" }],
            price: 0, min_value_allow: 0, max_value_allow: 0, target_margin: 20, start_date: "", end_date: "",
            full_price: 0, deposit_amount: 0, release_date: "", max_slots: 100,
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });
    const watchedType = form.watch("type_code");

    // Fetch Options
    useEffect(() => {
        // Only fetch if opening in Edit/Create mode to save resources, OR if needed for view mode logic later
        if (open) {
            const fetchData = async () => {
                try {
                    const [b, c, s] = await Promise.all([
                        optionsService.getBrands(),
                        optionsService.getCategories(),
                        optionsService.getSeries()
                    ]);
                    setBrands(b.map((x: any) => ({ label: x.name, value: x.brand_id })));
                    setCategories(c.map((x: any) => ({ label: x.name, value: x.category_id })));
                    setSeries(s.map((x: any) => ({ label: x.name, value: x.series_id })));
                } catch (err) {
                    console.error("Failed to load options", err);
                }
            };
            fetchData();
        }
    }, [open]);

    // Pre-fill Logic
    useEffect(() => {
        if (open && productToEdit && !isViewMode) {
            const p = productToEdit;
            let formValues: any = {
                name: p.name,
                description: p.description,
                media_urls: Array.isArray(p.media_urls) && p.media_urls.length > 0 ? p.media_urls[0] : (typeof p.media_urls === 'string' ? p.media_urls : ""),
                brand_id: p.brand_id,
                category_id: p.category_id,
                series_id: p.series_id,
                type_code: p.type_code,
            };

            // Map Type Specifics
            if (p.type_code === 'RETAIL') {
                formValues.variants = p.product_variants?.map((v: any) => ({
                    option_name: v.option_name, price: Number(v.price), sku: v.sku, image_url: v.image_url
                })) || [{ option_name: "Standard", price: 0 }];
            } else if (p.type_code === 'BLINDBOX') {
                const bb = p.product_blindboxes?.[0];
                if (bb) {
                    formValues.price = Number(bb.price);
                    formValues.min_value_allow = Number(bb.min_value_allow);
                    formValues.max_value_allow = Number(bb.max_value_allow);
                    formValues.target_margin = Number(bb.target_margin);
                }
            } else if (p.type_code === 'PREORDER') {
                const pre = p.product_preorders?.[0];
                if (pre) {
                    formValues.deposit_amount = Number(pre.deposit_amount);
                    formValues.full_price = Number(pre.full_price || 0);
                    formValues.release_date = pre.release_date ? new Date(pre.release_date).toISOString().split('T')[0] : "";
                    formValues.max_slots = pre.max_slots;
                    // Note: No longer relying on variant price for full price display in Edit form logic if we have full_price field,
                    // but we might want to sync them or just ignore variant price for preorder if full_price exists.
                }
            }
            form.reset(formValues);
        } else if (open && !productToEdit) {
            form.reset({
                name: "", description: "", media_urls: "", type_code: "RETAIL",
                variants: [{ option_name: "Standard", price: 0, sku: "", image_url: "" }],
                price: 0, min_value_allow: 0, max_value_allow: 0, target_margin: 20, start_date: "", end_date: "",
                full_price: 0, deposit_amount: 0, release_date: "", max_slots: 100,
            });
        }
    }, [open, productToEdit, form, isViewMode]);

    // Handlers
    const handleCreateBrand = async (name: string) => {
        const newItem = await optionsService.createBrand(name);
        if (newItem) {
            setBrands(prev => [...prev, { label: newItem.name, value: newItem.brand_id }]);
            return newItem.brand_id;
        }
        return null;
    };
    const handleCreateCategory = async (name: string) => {
        const newItem = await optionsService.createCategory(name);
        if (newItem) {
            setCategories(prev => [...prev, { label: newItem.name, value: newItem.category_id }]);
            return newItem.category_id;
        }
        return null;
    };
    const handleCreateSeries = async (name: string) => {
        const newItem = await optionsService.createSeries(name);
        if (newItem) {
            setSeries(prev => [...prev, { label: newItem.name, value: newItem.series_id }]);
            return newItem.series_id;
        }
        return null;
    };

    const onSubmit = async (data: ProductFormValues) => {
        setLoading(true);
        try {
            let payload: any = {
                name: data.name, description: data.description,
                media_urls: data.media_urls ? [data.media_urls] : [],
                brand_id: data.brand_id, category_id: data.category_id, series_id: data.series_id,
                type_code: data.type_code, status_code: 'ACTIVE'
            };

            if (data.type_code === "RETAIL") {
                payload.variants = data.variants.map(v => ({
                    option_name: v.option_name, price: v.price, sku: v.sku, image_url: v.image_url, stock_available: 0
                }));
            } else if (data.type_code === "BLINDBOX") {
                payload.blindbox = {
                    price: data.price, min_value_allow: data.min_value_allow, max_value_allow: data.max_value_allow,
                    target_margin: data.target_margin,
                    campaign_period: { start: data.start_date ? new Date(data.start_date).toISOString() : new Date().toISOString(), end: data.end_date ? new Date(data.end_date).toISOString() : new Date().toISOString() }
                };
            } else if (data.type_code === "PREORDER") {
                payload.preorder = {
                    deposit_amount: data.deposit_amount,
                    full_price: data.full_price, // Added full_price
                    release_date: data.release_date ? new Date(data.release_date).toISOString() : new Date().toISOString(), max_slots: data.max_slots
                };
                // With Backend "Smart Variants", we NO LONGER send manual variants for Preorder/Blindbox creation.
                // The backend handles the generation.
                // However, DTO might expect "variants" property to be optional or present. 
                // Looking at DTO logic, it verifies Retail, but Preorder/Blindbox variants are optional there.
                // So we can omit it for P/B types if backend handles it. But DTO validation might strict check?
                // Checked DTO: variants is @ValidateIf(RETAIL). So safe to omit.
            }

            if (isEditMode && productToEdit) {
                await productsService.update(productToEdit.product_id, payload);
                alert("✅ Product Updated Successfully!");
            } else {
                await productsService.create(payload);
                alert("✅ Product Created Successfully!");
            }
            onSuccess?.();
            handleClose();
        } catch (error: any) {
            console.error(error);
            alert(`❌ Failed: ${error?.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setStep(1);
        if (!isEditMode) form.reset();
    };

    const nextStep = async () => {
        let fields: any[] = [];
        if (step === 1) fields = ["name", "description", "media_urls"];
        if (step === 2) fields = ["brand_id", "category_id", "series_id"];
        if (step === 3) {
            if (watchedType === "RETAIL") fields = ["variants"];
            if (watchedType === "BLINDBOX") fields = ["price", "min_value_allow", "max_value_allow", "start_date", "end_date"];
            if (watchedType === "PREORDER") fields = ["full_price", "deposit_amount", "release_date"];
        }
        const valid = await form.trigger(fields);
        if (valid) setStep(s => s + 1);
    };

    const getBrandName = (id: number) => brands.find(b => b.value === id)?.label || "Unknown";

    // Formatter component
    const FormattedNumberInput = ({ field, placeholder = "0" }: { field: any, placeholder?: string }) => (
        <div className="space-y-1">
            <div className="relative">
                <Input type="number" min={0} placeholder={placeholder} {...field} className="font-mono" />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">VND</span>
            </div>
            {/* Real-time Formatter */}
            {field.value > 0 && (
                <div className="text-xs font-medium text-blue-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(field.value)}
                </div>
            )}
        </div>
    );

    // --- RENDER ---
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden bg-white max-h-[90vh] flex flex-col [&>button]:hidden">
                {isViewMode && productToEdit ? (
                    <ProductDetailView product={productToEdit} onClose={handleClose} onSuccess={onSuccess} />
                ) : (
                    <>
                        <DialogHeader className="p-6 pb-2 shrink-0">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Box className="w-6 h-6 text-blue-600" />
                                {isEditMode ? "Update Product" : "Create New Product"}
                            </DialogTitle>
                        </DialogHeader>

                        {/* STEPPER */}
                        <div className="px-6 py-4 bg-neutral-50 border-b border-t border-neutral-100 flex justify-between shrink-0">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex flex-col items-center gap-1 w-1/4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2",
                                        step === s ? "bg-blue-600 text-white border-blue-600 shadow-md scale-110" :
                                            step > s ? "bg-green-500 text-white border-green-500" : "bg-white text-neutral-300 border-neutral-200"
                                    )}>
                                        {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                    </div>
                                    <span className={cn("text-[10px] font-medium uppercase tracking-wider", step === s ? "text-blue-700" : "text-neutral-400")}>
                                        {s === 1 && "Basic"}
                                        {s === 2 && "Classify"}
                                        {s === 3 && "Pricing"}
                                        {s === 4 && "Review"}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* FORM */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            <Form {...form}>
                                <form className="space-y-4">
                                    {/* STEP 1: BASIC */}
                                    {step === 1 && (
                                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300">
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Name <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl><Input placeholder="Name" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="description" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl><Textarea placeholder="Details..." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="media_urls" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Image URL</FormLabel>
                                                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    )}

                                    {/* STEP 2: CLASSIFY */}
                                    {step === 2 && (
                                        <div className="space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                                            <FormField control={form.control} name="brand_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Brand <span className="text-red-500">*</span></FormLabel>
                                                    <SmartCreatableSelect options={brands} value={field.value} onChange={field.onChange} onCreate={handleCreateBrand} label="Brand" />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="category_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                                                    <SmartCreatableSelect options={categories} value={field.value} onChange={field.onChange} onCreate={handleCreateCategory} label="Category" />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="series_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Series (Optional)</FormLabel>
                                                    <SmartCreatableSelect options={series} value={field.value} onChange={field.onChange} onCreate={handleCreateSeries} label="Series" />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    )}

                                    {/* STEP 3: LOGIC */}
                                    {step === 3 && (
                                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                                            <FormField control={form.control} name="type_code" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="RETAIL">Retail</SelectItem>
                                                            <SelectItem value="BLINDBOX">Blind Box</SelectItem>
                                                            <SelectItem value="PREORDER">Pre-order</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <div className="p-4 border rounded-md bg-neutral-50/50 space-y-4">
                                                {watchedType === "RETAIL" && (
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="text-sm font-medium">Variants</h4>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => append({ option_name: "", price: 0, sku: "", image_url: "" })}><Plus className="w-4 h-4 mr-2" />Add</Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {fields.map((field, index) => (
                                                                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                                                                    <div className="col-span-4"><FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem>)} /></div>
                                                                    <div className="col-span-3"><FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} /></div>
                                                                    <div className="col-span-4"><FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (<FormItem><FormControl><Input placeholder="SKU" {...field} /></FormControl></FormItem>)} /></div>
                                                                    <div className="col-span-1"><Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {watchedType === "BLINDBOX" && (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="target_margin" render={({ field }) => (<FormItem><FormLabel>Margin %</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="min_value_allow" render={({ field }) => (<FormItem><FormLabel>Min Value</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="max_value_allow" render={({ field }) => (<FormItem><FormLabel>Max Value</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem><FormLabel>Start</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem><FormLabel>End</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                    </div>
                                                )}
                                                {watchedType === "PREORDER" && (
                                                    <div className="space-y-4">
                                                        <FormField control={form.control} name="full_price" render={({ field }) => (<FormItem><FormLabel>Full Price</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="deposit_amount" render={({ field }) => (<FormItem><FormLabel>Deposit</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="max_slots" render={({ field }) => (<FormItem><FormLabel>Max Slots</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                        <FormField control={form.control} name="release_date" render={({ field }) => (<FormItem><FormLabel>Release Date</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: REVIEW */}
                                    {step === 4 && (
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="w-24 h-24 bg-neutral-100 rounded-md shrink-0 border overflow-hidden">
                                                    {form.getValues("media_urls") ? <img src={form.getValues("media_urls")} className="w-full h-full object-cover" /> : null}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">{form.getValues("name")}</h4>
                                                    <div className="flex gap-2 text-sm text-neutral-500 mt-1">
                                                        <Badge variant="outline">{watchedType}</Badge>
                                                        <span>{getBrandName(form.getValues("brand_id"))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                                                Everything looks good! Ready to create product.
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </Form>
                        </div>
                        <div className="p-4 border-t bg-neutral-50 flex justify-between shrink-0">
                            <Button type="button" variant="ghost" onClick={() => step > 1 ? setStep(s => s - 1) : handleClose()}>Back</Button>
                            <Button type="button" onClick={step < 4 ? nextStep : form.handleSubmit(onSubmit)} disabled={loading}>
                                {step < 4 ? <><span className="mr-2">Next</span> <ChevronRight className="w-4 h-4" /></> : <>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} {isEditMode ? "Update" : "Create"}</>}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}