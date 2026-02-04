import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ChevronRight, CheckCircle2, Box, Info, Trash2, Plus, RefreshCw, X, Calendar, Tag, Image as ImageIcon, Eye, Layers, Printer, Sparkles } from "lucide-react";
// @ts-ignore
import Barcode from 'react-barcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SmartCreatableSelect } from "@/components/common/SmartCreatableSelect";
import { productsService } from "@/services/products.service";
import { optionsService } from "@/services/options.service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VariantMediaManager, MediaItem } from "./VariantMediaManager";
import { ProductMediaGallery, MediaItem as GalleryMediaItem } from "./ProductMediaGallery";
import { MagicWriteDialog } from "./MagicWriteDialog";

// --- VALIDATION SCHEMAS ---
const baseSchema = z.object({
    name: z.string().min(2, "Product Name is required"),
    description: z.string().optional(),
    media_items: z.array(z.any()).optional(),
    brand_id: z.coerce.number().min(1, "Brand is required"),
    category_id: z.coerce.number().min(1, "Category is required"),
    series_id: z.coerce.number().optional(),
    type_code: z.enum(["RETAIL", "BLINDBOX", "PREORDER"]),
});

const mediaItemSchema = z.object({
    type: z.enum(['IMAGE', 'VIDEO']),
    source: z.enum(['CLOUDINARY', 'YOUTUBE']),
    url: z.string(),
});

const retailSchema = baseSchema.extend({
    type_code: z.literal("RETAIL"),
    variants: z.array(z.object({
        option_name: z.string().min(1, "Option Name is required"),
        price: z.coerce.number().min(1000, "Price must be at least 1,000 VND"),
        sku: z.string().min(1, "SKU is required"),

        media_assets: z.array(mediaItemSchema).optional(),
        description: z.string().optional(),
        weight_g: z.coerce.number().min(0).optional(),
        length_cm: z.coerce.number().min(0).optional(),
        width_cm: z.coerce.number().min(0).optional(),
        height_cm: z.coerce.number().min(0).optional(),
    })).min(1, "At least one variant is required"),
});

const blindboxSchema = baseSchema.extend({
    type_code: z.literal("BLINDBOX"),
    price: z.coerce.number().min(1000, "Ticket Price must be at least 1,000 VND"),
    min_value_allow: z.coerce.number().min(0),
    max_value_allow: z.coerce.number().min(0),
    start_date: z.string().min(1, "Start Date is required"),
    end_date: z.string().min(1, "End Date is required"),
});

const preorderSchema = baseSchema.extend({
    type_code: z.literal("PREORDER"),
    release_date: z.string().min(1, "Release date is required"),

    variants: z.array(z.object({
        option_name: z.string().min(1, "Option Name is required"),
        price: z.coerce.number().min(1000, "Full Price must be at least 1,000 VND"), // Full Price
        deposit_amount: z.coerce.number().min(1000, "Deposit must be at least 1,000 VND"), // Variant Level Deposit
        sku: z.string().min(1, "SKU is required"),
        stock_available: z.coerce.number().min(0).default(0), // Slots

        media_assets: z.array(mediaItemSchema).optional(),
        description: z.string().optional(),
        weight_g: z.coerce.number().min(0).optional(),
        length_cm: z.coerce.number().min(0).optional(),
        width_cm: z.coerce.number().min(0).optional(),
        height_cm: z.coerce.number().min(0).optional(),
    })).min(1, "At least one variant is required")
        .refine(variants => variants.every(v => v.deposit_amount < v.price), {
            message: "Deposit must be less than Full Price",
            path: ["0.deposit_amount"]
        })
});

const formSchema = z.discriminatedUnion("type_code", [
    retailSchema,
    blindboxSchema,
    preorderSchema
]);

type ProductFormValues = z.infer<typeof formSchema>;

const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

// Helper to get type gradient
const getTypeGradient = (type: string) => {
    switch (type) {
        case 'RETAIL': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
        case 'BLINDBOX': return 'bg-gradient-to-r from-purple-500 to-pink-500';
        case 'PREORDER': return 'bg-gradient-to-r from-orange-500 to-amber-500';
        default: return 'bg-neutral-500';
    }
};

const FormattedNumberInput = ({ field, placeholder = "0" }: { field: any, placeholder?: string }) => (
    <div className="space-y-1">
        <div className="relative">
            <Input type="number" min={0} placeholder={placeholder} {...field} className="font-mono" />
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">VND</span>
        </div>
        {field.value > 0 && <div className="text-xs font-medium text-blue-600">{formatPrice(field.value)}</div>}
    </div>
);

// --- SUB-COMPONENT: DETAIL VIEW (TWO-COLUMN) ---
function ProductDetailView({ product, onClose, onSuccess }: { product: any, onClose: () => void, onSuccess?: () => void }) {
    const [status, setStatus] = useState(product.status_code);
    const [galleryIndex, setGalleryIndex] = useState(0);

    // --- PRINT STATE ---
    const [showPrintConfig, setShowPrintConfig] = useState(false);
    const [printQuantities, setPrintQuantities] = useState<Record<number, number>>({});

    useEffect(() => {
        if (product.product_variants) {
            const initial: Record<number, number> = {};
            product.product_variants.forEach((v: any) => initial[v.variant_id] = 1);
            setPrintQuantities(initial);
        }
    }, [product]);

    // --- DATA PREPARATION ---
    // 1. Core Media
    const mainMedia: GalleryMediaItem[] = Array.isArray(product.media_urls)
        ? product.media_urls.map((url: string) => ({ type: 'IMAGE', source: 'CLOUDINARY', url }))
        : (product.media_urls ? [{ type: 'IMAGE', source: 'CLOUDINARY', url: product.media_urls }] : []);

    // 2. Variant Media (Fixed Logic: Grab ALL assets)
    const variantMediaItems: GalleryMediaItem[] = [];
    const variantIdToMediaIndex = new Map<number, number>();
    let currentMediaCount = mainMedia.length;

    if (product.product_variants) {
        product.product_variants.forEach((v: any) => {
            if (v.media_assets && Array.isArray(v.media_assets)) {
                // If this variant has any media, map the ID to the *start* index in the gallery
                if (v.media_assets.length > 0) {
                    variantIdToMediaIndex.set(v.variant_id, currentMediaCount);
                }

                // Add ALL assets to the gallery list
                v.media_assets.forEach((asset: any) => {
                    variantMediaItems.push({ ...asset, variantName: v.option_name });
                    currentMediaCount++;
                });
            }
        });
    }

    const combinedMedia = [...mainMedia, ...variantMediaItems];

    const handleToggleStatus = async () => {
        const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        setStatus(newStatus);
        try {
            await productsService.toggleStatus(product.product_id);
            onSuccess?.();
        } catch (error) {
            console.error("Status Toggle Failed", error);
            setStatus(status);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleVariantClick = (variantId: number) => {
        if (variantIdToMediaIndex.has(variantId)) {
            setGalleryIndex(variantIdToMediaIndex.get(variantId)!);
        }
    };

    const isRetail = product.type_code === 'RETAIL';
    const isBlindbox = product.type_code === 'BLINDBOX';
    const isPreorder = product.type_code === 'PREORDER';
    const bb = product.product_blindboxes?.[0];
    const pre = product.product_preorders?.[0];

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            <DialogTitle className="sr-only">Product Detail</DialogTitle>

            {/* PRINT OVERLAY (Configuration) */}
            {showPrintConfig && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in fade-in duration-200 overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-neutral-50">
                        <h3 className="font-bold flex items-center gap-2"><Printer className="w-5 h-5" /> Print Configuration</h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowPrintConfig(false)}><X className="w-5 h-5" /></Button>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 p-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100 flex items-start gap-3">
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Ready to Print Labels</p>
                                    <p>Select the quantity for each variant below. The layout is optimized for standard thermal sticket printers (2-inch width approx).</p>
                                </div>
                            </div>

                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-neutral-50"><TableRow><TableHead>Variant</TableHead><TableHead>SKU</TableHead><TableHead>Price</TableHead><TableHead className="w-[150px]">Quantity</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {product.product_variants?.map((v: any) => (
                                            <TableRow key={v.variant_id}>
                                                <TableCell className="font-medium">{v.option_name}</TableCell>
                                                <TableCell className="text-neutral-500 font-mono text-xs">{v.sku}</TableCell>
                                                <TableCell>{formatPrice(Number(v.price))}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={printQuantities[v.variant_id] || 0}
                                                        onChange={(e) => setPrintQuantities(prev => ({ ...prev, [v.variant_id]: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-neutral-50 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowPrintConfig(false)}>Cancel</Button>
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer className="w-4 h-4" />
                            Print {Object.values(printQuantities).reduce((a, b) => a + b, 0)} Labels
                        </Button>
                    </div>
                </div>
            )}

            {/* HIDDEN PRINT AREA (Robust 50x30mm Layout) */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #barcode-print-area, #barcode-print-area * { visibility: visible; }
                    #barcode-print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        background: white; 
                        display: flex;
                        flex-wrap: wrap;
                        align-content: flex-start;
                        padding: 0;
                    }
                    .sticker {
                        page-break-inside: avoid;
                        width: 50mm; 
                        height: 30mm;
                        border: 1px dashed #ddd; /* Light border guide */
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between; /* Distribute space */
                        padding: 2mm 1mm;
                        box-sizing: border-box;
                        margin: 0;
                        overflow: hidden;
                    }
                    /* FORCE SVG TO FIT CONTAINER */
                    .sticker svg {
                        max-width: 100% !important;
                        height: auto !important;
                        max-height: 18mm !important;
                        width: auto !important;
                    }
                    @page { margin: 0; size: auto; }
                }
            `}</style>

            <div id="barcode-print-area" className="hidden">
                {product.product_variants?.flatMap((v: any) => {
                    const count = printQuantities[v.variant_id] || 0;
                    return Array(count).fill(0).map((_, i) => (
                        <div key={`${v.variant_id}-${i}`} className="sticker">
                            {/* Product Name (Bold, Condensed) */}
                            <div className="text-[9px] font-bold uppercase truncate w-full text-center leading-none">
                                {product.name.substring(0, 20)}
                            </div>

                            {/* Variant Name */}
                            <div className="text-[8px] text-neutral-500 truncate w-full text-center leading-none mb-1">
                                {v.option_name}
                            </div>

                            {/* BARCODE (Pure SVG, No Text) */}
                            <div className="w-full flex justify-center items-center flex-1">
                                <Barcode
                                    value={v.sku || "UNKNOWN"}
                                    format="CODE128"
                                    width={1.2}         // Try 1.2 for better scanning, CSS will shrink it if needed
                                    height={40}         // Tall bars
                                    displayValue={false} // CRITICAL: Turn off default text
                                    margin={0}
                                    background="transparent"
                                />
                            </div>

                            {/* Manual SKU & Price Text */}
                            <div className="w-full flex justify-between items-end mt-1 px-1">
                                <span className="text-[7px] font-mono text-neutral-600 leading-none truncate max-w-[60%]">
                                    {v.sku}
                                </span>
                                <span className="text-[10px] font-bold leading-none">
                                    {formatPrice(Number(v.price))}
                                </span>
                            </div>
                        </div>
                    ));
                })}
            </div>

            {/* Header */}
            <div className="p-4 border-b shrink-0 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm", getTypeGradient(product.type_code))}>
                        <Box className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 leading-tight">{product.name}</h2>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Badge className={cn("text-[10px] h-5 border-0 text-white", getTypeGradient(product.type_code))}>
                                {product.type_code}
                            </Badge>
                            <span>{product.brands?.name}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => setShowPrintConfig(true)}>
                        <Printer className="w-4 h-4" /> Print Labels
                    </Button>

                    <div className="h-6 w-px bg-neutral-200" />

                    {/* Status Toggle (Green/Gray) */}
                    <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold uppercase", status === 'ACTIVE' ? "text-green-600" : "text-neutral-400")}>
                            {status === 'ACTIVE' ? "Active" : "Inactive"}
                        </span>
                        <Switch
                            checked={status === 'ACTIVE'}
                            onCheckedChange={handleToggleStatus}
                            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-neutral-200"
                        />
                    </div>
                    <div className="h-6 w-px bg-neutral-200" />
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-2">
                {/* LEFT: GALLERY */}
                <div className="bg-neutral-50 p-6 overflow-y-auto h-full border-r min-h-0 flex flex-col justify-center">
                    <ProductMediaGallery
                        media={combinedMedia}
                        activeIndex={galleryIndex}
                        onIndexChange={setGalleryIndex}
                    />
                </div>

                {/* RIGHT: DETAILS */}
                <div className="p-6 overflow-y-auto h-full min-h-0 space-y-8">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border border-blue-100 rounded-lg space-y-1 bg-blue-50">
                            <span className="text-[10px] uppercase font-bold text-blue-700 flex items-center gap-1"><Tag className="w-3 h-3 text-blue-600" /> Category</span>
                            <div className="font-medium text-sm truncate text-blue-900">{product.categories?.name}</div>
                        </div>
                        <div className="p-3 border border-purple-100 rounded-lg space-y-1 bg-purple-50">
                            <span className="text-[10px] uppercase font-bold text-purple-700 flex items-center gap-1"><Layers className="w-3 h-3 text-purple-600" /> Series</span>
                            <div className="font-medium text-sm truncate text-purple-900">{product.series?.name || "-"}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold border-b pb-2 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4 text-neutral-400" /> Description
                        </h3>
                        <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none bg-neutral-50 p-3 rounded-lg border">
                            {product.description || "No description."}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold border-b pb-2 mb-2">Configuration</h3>

                        {(isRetail || isPreorder) && (
                            <div className="border rounded-md overflow-hidden text-sm shadow-sm">
                                <Table>
                                    <TableHeader className="bg-neutral-50">
                                        <TableRow>
                                            <TableHead>Variant</TableHead>
                                            <TableHead>{isPreorder ? "Full Price" : "Price"}</TableHead>
                                            {isPreorder && <TableHead className="text-orange-600">Deposit</TableHead>}
                                            <TableHead>{isPreorder ? "Slots" : "Stock"}</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {product.product_variants?.map((v: any) => (
                                            <TableRow
                                                key={v.variant_id}
                                                className={cn("group cursor-pointer transition-colors", variantIdToMediaIndex.has(v.variant_id) ? "hover:bg-blue-50" : "hover:bg-neutral-50")}
                                                onClick={() => handleVariantClick(v.variant_id)}
                                            >
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    {v.option_name}
                                                    {variantIdToMediaIndex.has(v.variant_id) && <ImageIcon className="w-3 h-3 text-blue-400" />}
                                                </TableCell>
                                                <TableCell>{formatPrice(Number(v.price))}</TableCell>
                                                {isPreorder && (
                                                    <TableCell className="text-orange-600 font-medium">
                                                        {formatPrice(Number(v.deposit_amount || 0))}
                                                    </TableCell>
                                                )}
                                                <TableCell>{isPreorder ? (v.preorder_slot_limit || 0) : (v.stock_available || 0)}</TableCell>
                                                <TableCell className="text-neutral-500 font-mono text-xs">{v.sku}</TableCell>
                                                <TableCell>
                                                    {variantIdToMediaIndex.has(v.variant_id) && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Eye className="w-3 h-3 text-blue-600" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {isBlindbox && bb && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-purple-900">Blindbox Configuration</h4>
                                        <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Active Campaign
                                        </div>
                                    </div>
                                    <Badge className="bg-white text-purple-700 hover:bg-white border-purple-200 shadow-sm">{bb.target_margin}% Margin</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-white/60 p-3 rounded-lg border border-purple-100/50">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-purple-400">Ticket Price</label>
                                        <div className="text-2xl font-bold text-purple-900">{formatPrice(Number(bb.price))}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-purple-400">Value Range</label>
                                        <div className="text-sm font-medium text-purple-800 mt-1">
                                            {formatPrice(Number(bb.min_value_allow))} - {formatPrice(Number(bb.max_value_allow))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPreorder && pre && (
                            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-100 p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-orange-900">Pre-order Details</h4>
                                        <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                            <Box className="w-3 h-3" /> Limit: {pre.max_slots} slots
                                        </div>
                                    </div>
                                    <Badge className="bg-white text-orange-700 hover:bg-white border-orange-200 shadow-sm">
                                        Release: {new Date(pre.release_date).toLocaleDateString()}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-white/60 p-3 rounded-lg border border-orange-100/50">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-orange-400">Deposit</label>
                                        <div className="text-2xl font-bold text-orange-700">{formatPrice(Number(pre.deposit_amount))}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-orange-400">Full Price</label>
                                        <div className="text-2xl font-bold text-neutral-800">{formatPrice(Number(pre.full_price || 0))}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t bg-neutral-50 flex justify-end shrink-0">
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
    const { toast } = useToast();
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
            name: "", description: "", media_items: [], type_code: "RETAIL",

            variants: [{ option_name: "Standard", price: 0, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 }],
            price: 0, min_value_allow: 0, max_value_allow: 0, target_margin: 20, start_date: "", end_date: "",
            full_price: 0, deposit_amount: 0, release_date: "", max_slots: 100,
        },
    });

    const { fields, append, remove, update } = useFieldArray({ control: form.control, name: "variants" });
    const watchedType = form.watch("type_code");

    // Fetch Options
    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                try {
                    const [b, c, s] = await Promise.all([optionsService.getBrands(), optionsService.getCategories(), optionsService.getSeries()]);
                    setBrands(b.map((x: any) => ({ label: x.name, value: x.brand_id })));
                    setCategories(c.map((x: any) => ({ label: x.name, value: x.category_id })));
                    setSeries(s.map((x: any) => ({ label: x.name, value: x.series_id })));
                } catch (err) { console.error("Failed to load options", err); }
            };
            fetchData();
        }
    }, [open]);

    // Pre-fill Logic
    useEffect(() => {
        if (open && productToEdit && !isViewMode) {
            const p = productToEdit;
            const initialMediaItems = Array.isArray(p.media_urls)
                ? p.media_urls.map((u: string) => ({ type: 'IMAGE', source: 'CLOUDINARY', url: u }))
                : (p.media_urls ? [{ type: 'IMAGE', source: 'CLOUDINARY', url: p.media_urls }] : []);

            let formValues: any = {
                name: p.name,
                description: p.description,
                media_items: initialMediaItems,
                brand_id: p.brand_id,
                category_id: p.category_id,
                series_id: p.series_id,
                type_code: p.type_code,
            };

            if (p.type_code === 'RETAIL') {
                formValues.variants = p.product_variants?.map((v: any) => ({
                    option_name: v.option_name, price: Number(v.price), sku: v.sku, media_assets: v.media_assets || [], description: v.description || "",
                    weight_g: v.weight_g || 200, length_cm: v.length_cm || 10, width_cm: v.width_cm || 10, height_cm: v.height_cm || 10
                })) || [{ option_name: "Standard", price: 0, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 }];
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
                }
            }
            form.reset(formValues);
        } else if (open && !productToEdit) {
            form.reset({
                name: "", description: "", media_items: [], type_code: "RETAIL",

                variants: [{ option_name: "Standard", price: 0, deposit_amount: 0, stock_available: 10, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 }],
                price: 0, min_value_allow: 0, max_value_allow: 0, target_margin: 20, start_date: "", end_date: "",
                release_date: "",
            });
        }
    }, [open, productToEdit, form, isViewMode]);

    // Handlers
    const handleCreateBrand = async (name: string) => {
        const newItem = await optionsService.createBrand(name);
        if (newItem) { setBrands(prev => [...prev, { label: newItem.name, value: newItem.brand_id }]); return newItem.brand_id; }
        return null;
    };
    const handleCreateCategory = async (name: string) => {
        const newItem = await optionsService.createCategory(name);
        if (newItem) { setCategories(prev => [...prev, { label: newItem.name, value: newItem.category_id }]); return newItem.category_id; }
        return null;
    };
    const handleCreateSeries = async (name: string) => {
        const newItem = await optionsService.createSeries(name);
        if (newItem) { setSeries(prev => [...prev, { label: newItem.name, value: newItem.series_id }]); return newItem.series_id; }
        return null;
    };

    const handleGenSku = (index: number) => {
        const current = form.getValues(`variants.${index}`);
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        update(index, { ...current, sku: `SKU-${Date.now().toString().slice(-6)}-${randomStr}` });
    };

    // --- AI GENERATION LOGIC ---
    // --- AI GENERATION LOGIC ---
    const [magicWriteState, setMagicWriteState] = useState<{
        isOpen: boolean;
        target: 'MAIN' | 'VARIANT';
        variantIndex?: number;
        targetName?: string;
        imageUrl?: string; // <--- ADD THIS
    }>({ isOpen: false, target: 'MAIN' });

    // 1. Open for Main Description
    const handleOpenMainMagicWrite = () => {
        const name = form.getValues("name");
        const mainImage = form.getValues("media_items")?.[0]?.url; // Get Main Image

        if (!name) return toast({ title: "Validation Error", description: "Please enter Product Name first!", variant: "destructive" });

        setMagicWriteState({
            isOpen: true,
            target: 'MAIN',
            targetName: "Main Product",
            imageUrl: mainImage // <--- Set Main Image
        });
    };

    // 2. Open for Variant Description
    const handleOpenVariantMagicWrite = (index: number) => {
        const name = form.getValues("name");
        const vName = form.getValues(`variants.${index}.option_name`);

        // Get Variant Image
        const variantAssets = form.getValues(`variants.${index}.media_assets`);
        const variantImage = variantAssets?.[0]?.url;

        // Fallback to Main Image if variant has no image
        const mainImage = form.getValues("media_items")?.[0]?.url;
        const finalImage = variantImage || mainImage;

        if (!name || !vName) {
            return toast({ title: "Validation Error", description: "Please ensure Product Name and Variant Name are filled.", variant: "destructive" });
        }

        setMagicWriteState({
            isOpen: true,
            target: 'VARIANT',
            variantIndex: index,
            targetName: vName,
            imageUrl: finalImage // <--- Set Specific Variant Image
        });
    };

    // 3. Handle Success from Dialog
    const handleMagicWriteSuccess = (text: string) => {
        if (magicWriteState.target === 'MAIN') {
            form.setValue("description", text);
        } else if (magicWriteState.target === 'VARIANT' && typeof magicWriteState.variantIndex === 'number') {
            form.setValue(`variants.${magicWriteState.variantIndex}.description`, text);
        }
    };

    const onSubmit = async (data: ProductFormValues) => {
        setLoading(true);
        try {
            const mediaUrlsAsString = data.media_items?.map((m: MediaItem) => m.url) || [];
            let payload: any = {
                name: data.name, description: data.description,
                media_urls: mediaUrlsAsString,
                brand_id: data.brand_id, category_id: data.category_id, series_id: data.series_id,
                type_code: data.type_code, status_code: 'ACTIVE'
            };

            if (data.type_code === "RETAIL") {
                payload.variants = data.variants.map((v: any) => ({
                    option_name: v.option_name, price: v.price, sku: v.sku, media_assets: v.media_assets, description: v.description, stock_available: 0,
                    weight_g: v.weight_g, length_cm: v.length_cm, width_cm: v.width_cm, height_cm: v.height_cm
                }));
            } else if (data.type_code === "BLINDBOX") {
                payload.blindbox = {
                    price: data.price, min_value_allow: data.min_value_allow, max_value_allow: data.max_value_allow,
                    campaign_period: { start: data.start_date ? new Date(data.start_date).toISOString() : new Date().toISOString(), end: data.end_date ? new Date(data.end_date).toISOString() : new Date().toISOString() }
                };
            } else if (data.type_code === "PREORDER") {
                payload.preorder = {
                    release_date: data.release_date,
                    // Clean up: Removed deposit & max_slots from here (Moved to Variants)
                };
                payload.variants = data.variants.map((v: any) => ({
                    option_name: v.option_name,
                    price: v.price,                   // Full Price
                    deposit_amount: v.deposit_amount, // <-- Variant Level Deposit
                    preorder_slot_limit: v.stock_available, // <-- Form 'Slots' maps to DB 'preorder_slot_limit'
                    stock_available: 0,               // Physical Stock is 0 initially
                    sku: v.sku,
                    media_assets: v.media_assets,
                    description: v.description,
                    weight_g: v.weight_g,
                    length_cm: v.length_cm, width_cm: v.width_cm, height_cm: v.height_cm
                }));
            }

            if (isEditMode && productToEdit) {
                await productsService.update(productToEdit.product_id, payload);
                toast({ title: "Success", description: "Product Updated Successfully!", variant: "default" });
            } else {
                await productsService.create(payload);
                toast({ title: "Success", description: "Product Created Successfully!", variant: "default" });
            }
            onSuccess?.();
            handleClose();
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error?.response?.data?.message || error.message, variant: "destructive" });
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
        if (step === 1) fields = ["name", "description", "media_items"];
        if (step === 2) fields = ["brand_id", "category_id", "series_id"];
        if (step === 3) {
            if (step === 3) {
                if (watchedType === "RETAIL") fields = ["variants"];
                if (watchedType === "BLINDBOX") fields = ["price", "min_value_allow", "max_value_allow", "start_date", "end_date"];
                if (watchedType === "PREORDER") fields = ["variants", "release_date"];
            }
        }
        const valid = await form.trigger(fields);
        if (valid) setStep(s => s + 1);
    };

    const getBrandName = (id: number) => brands.find(b => b.value === id)?.label || "Unknown";



    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[900px] w-full h-[90vh] p-0 gap-0 overflow-hidden bg-white flex flex-col [&>button]:hidden"
                onInteractOutside={(e) => { e.preventDefault(); }}
            >
                {isViewMode && productToEdit ? (
                    <ProductDetailView product={productToEdit} onClose={handleClose} onSuccess={onSuccess} />
                ) : (
                    <>
                        <DialogHeader className="p-6 pb-2 shrink-0">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Box className="w-6 h-6 text-blue-600" />
                                {isEditMode ? "Update Product" : "Create New Product"}
                            </DialogTitle>
                            <DialogDescription className="hidden">
                                Fill in the details to create or update a product.
                            </DialogDescription>
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
                                        {s === 1 && "Basic"} {s === 2 && "Classify"} {s === 3 && "Pricing"} {s === 4 && "Review"}
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
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-semibold">Description</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-purple-600 hover:text-purple-700 h-5 px-1 text-[10px] gap-1"
                                                            onClick={handleOpenMainMagicWrite}
                                                        >
                                                            <Sparkles className="w-3 h-3" /> AI Write
                                                        </Button>
                                                    </div>
                                                    <FormControl><Textarea placeholder="Details..." {...field} className="min-h-[120px]" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="media_items" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cover Media (Max 1 Recommended)</FormLabel>
                                                    <FormControl>
                                                        <VariantMediaManager value={field.value} onChange={(vals) => {
                                                            if (vals.length > 1) { field.onChange([vals[vals.length - 1]]); } else { field.onChange(vals); }
                                                        }} />
                                                    </FormControl>
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
                                                            <Button type="button" size="sm" variant="outline" onClick={() => append({ option_name: "", price: 0, sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100)}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 })}><Plus className="w-4 h-4 mr-2" />Add</Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {fields.map((field, index) => (
                                                                <div key={field.id} className="grid grid-cols-12 gap-2 items-start border-b pb-4 last:border-0 last:pb-0">
                                                                    <div className="col-span-11 grid grid-cols-12 gap-2">
                                                                        <div className="col-span-4"><FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem>)} /></div>
                                                                        <div className="col-span-3"><FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} /></div>
                                                                        <div className="col-span-3">
                                                                            <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                                                                                <FormItem>
                                                                                    <div className="flex gap-1">
                                                                                        <FormControl><Input placeholder="SKU" {...field} readOnly className="bg-neutral-100 text-neutral-500 font-mono text-xs" /></FormControl>
                                                                                        <Button type="button" variant="outline" size="icon" onClick={() => handleGenSku(index)}><RefreshCw className="w-3 h-3" /></Button>
                                                                                    </div>
                                                                                </FormItem>
                                                                            )} />
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="outline" className="w-full relative overflow-hidden">
                                                                                        <ImageIcon className="w-4 h-4 mr-1" />
                                                                                        Media
                                                                                        {form.watch(`variants.${index}.media_assets`)?.length > 0 && (
                                                                                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
                                                                                        )}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-[400px]" align="end">
                                                                                    <FormField control={form.control} name={`variants.${index}.media_assets`} render={({ field }) => (
                                                                                        <VariantMediaManager value={field.value} onChange={field.onChange} />
                                                                                    )} />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-1 pt-8 text-right"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>

                                                                    {/* NEW: Physical Specs Row */}
                                                                    <div className="col-span-11 grid grid-cols-4 gap-2 mt-2">
                                                                        <FormField control={form.control} name={`variants.${index}.weight_g`} render={({ field }) => (
                                                                            <FormItem className="space-y-1">
                                                                                <div className="flex justify-between"><FormLabel className="text-[10px] text-neutral-500 uppercase">Weight (g)</FormLabel></div>
                                                                                <FormControl><Input type="number" min={0} placeholder="200" {...field} className="h-8 text-xs" /></FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                        <FormField control={form.control} name={`variants.${index}.length_cm`} render={({ field }) => (
                                                                            <FormItem className="space-y-1">
                                                                                <FormLabel className="text-[10px] text-neutral-500 uppercase">Length (cm)</FormLabel>
                                                                                <FormControl><Input type="number" min={0} placeholder="10" {...field} className="h-8 text-xs" /></FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                        <FormField control={form.control} name={`variants.${index}.width_cm`} render={({ field }) => (
                                                                            <FormItem className="space-y-1">
                                                                                <FormLabel className="text-[10px] text-neutral-500 uppercase">Width (cm)</FormLabel>
                                                                                <FormControl><Input type="number" min={0} placeholder="10" {...field} className="h-8 text-xs" /></FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                        <FormField control={form.control} name={`variants.${index}.height_cm`} render={({ field }) => (
                                                                            <FormItem className="space-y-1">
                                                                                <FormLabel className="text-[10px] text-neutral-500 uppercase">Height (cm)</FormLabel>
                                                                                <FormControl><Input type="number" min={0} placeholder="10" {...field} className="h-8 text-xs" /></FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                    </div>

                                                                    {/* NEW: Variant Description Row */}
                                                                    <div className="col-span-12 mt-1">
                                                                        <FormField control={form.control} name={`variants.${index}.description`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormControl>
                                                                                    <div className="relative">
                                                                                        <Textarea
                                                                                            placeholder="Variant details (e.g. specific features, size info)..."
                                                                                            {...field}
                                                                                            className="min-h-[60px] text-xs resize-none bg-white font-normal pr-10"
                                                                                        />
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="absolute right-2 top-2 h-6 w-6 text-purple-600 hover:bg-purple-50"
                                                                                            onClick={() => handleOpenVariantMagicWrite(index)}
                                                                                        >
                                                                                            <Sparkles className="w-3 h-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {watchedType === "BLINDBOX" && (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="min_value_allow" render={({ field }) => (<FormItem><FormLabel>Min Value</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="max_value_allow" render={({ field }) => (<FormItem><FormLabel>Max Value</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>

                                                        {/* Smart Tier Preview */}
                                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100 space-y-3">
                                                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-purple-700">
                                                                <Layers className="w-3 h-3" /> Smart Tier Distribution
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="bg-white/60 p-2 rounded-lg border border-purple-100/50">
                                                                    <div className="text-[10px] font-bold text-neutral-500 uppercase">Common (80%)</div>
                                                                    <div className="text-xs font-medium text-purple-900 mt-0.5">
                                                                        {formatPrice(form.watch('min_value_allow') || 0)} - {formatPrice(form.watch('price') || 0)}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white/60 p-2 rounded-lg border border-purple-100/50">
                                                                    <div className="text-[10px] font-bold text-blue-500 uppercase">Rare (15%)</div>
                                                                    <div className="text-xs font-medium text-purple-900 mt-0.5">
                                                                        &gt; {formatPrice(form.watch('price') || 0)}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white/60 p-2 rounded-lg border border-purple-100/50">
                                                                    <div className="text-[10px] font-bold text-amber-500 uppercase">Legend (5%)</div>
                                                                    <div className="text-xs font-medium text-purple-900 mt-0.5">
                                                                        Max: {formatPrice(form.watch('max_value_allow') || 0)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem><FormLabel>Start</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem><FormLabel>End</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                    </div>
                                                )}
                                                {watchedType === "PREORDER" && (
                                                    <div className="space-y-4">
                                                        <FormField control={form.control} name="release_date" render={({ field }) => (<FormItem><FormLabel>Release Date</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />

                                                        {/* Variants Section Reuse for Preorder */}
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="text-sm font-medium">Pre-order Versions (Full Price & Deposit)</h4>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => append({ option_name: "", price: 0, deposit_amount: 0, stock_available: 10, sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100)}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 })}><Plus className="w-4 h-4 mr-2" />Add</Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {fields.map((field, index) => (
                                                                <div key={field.id} className="grid grid-cols-12 gap-2 items-start border-b pb-4 last:border-0 last:pb-0">
                                                                    <div className="col-span-11 grid grid-cols-12 gap-2">
                                                                        <div className="col-span-4"><FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] text-neutral-500 uppercase">Ver Name</FormLabel><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem>)} /></div>

                                                                        {/* Full Price & Deposit */}
                                                                        <div className="col-span-2"><FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] text-neutral-500 uppercase">Full Price</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} /></div>
                                                                        <div className="col-span-2"><FormField control={form.control} name={`variants.${index}.deposit_amount`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] text-neutral-500 uppercase">Deposit</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} /></div>

                                                                        {/* Slots */}
                                                                        <div className="col-span-2"><FormField control={form.control} name={`variants.${index}.stock_available`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] text-neutral-500 uppercase">Slots</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>)} /></div>

                                                                        {/* Media Button */}
                                                                        <div className="col-span-2 mt-6">
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="outline" className="w-full relative overflow-hidden h-9">
                                                                                        <ImageIcon className="w-4 h-4 mr-1" />
                                                                                        Media
                                                                                        {form.watch(`variants.${index}.media_assets`)?.length > 0 && (
                                                                                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
                                                                                        )}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-[400px]" align="end">
                                                                                    <FormField control={form.control} name={`variants.${index}.media_assets`} render={({ field }) => (
                                                                                        <VariantMediaManager value={field.value} onChange={field.onChange} />
                                                                                    )} />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-1 pt-8 text-right"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>

                                                                    {/* SKU & Specs */}
                                                                    <div className="col-span-11 grid grid-cols-12 gap-2 mt-2">
                                                                        <div className="col-span-4">
                                                                            <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                                                                                <FormItem className="space-y-1">
                                                                                    <div className="flex gap-1">
                                                                                        <FormControl><Input placeholder="SKU" {...field} readOnly className="bg-neutral-100 text-neutral-500 font-mono text-xs h-8" /></FormControl>
                                                                                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleGenSku(index)}><RefreshCw className="w-3 h-3" /></Button>
                                                                                    </div>
                                                                                </FormItem>
                                                                            )} />
                                                                        </div>
                                                                        <div className="col-span-8 grid grid-cols-4 gap-2">
                                                                            {/* Specs Inputs Reuse */}
                                                                            <FormField control={form.control} name={`variants.${index}.weight_g`} render={({ field }) => (<FormItem className="space-y-1"><FormControl><Input type="number" placeholder="W(g)" {...field} className="h-8 text-xs" /></FormControl></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.length_cm`} render={({ field }) => (<FormItem className="space-y-1"><FormControl><Input type="number" placeholder="L(cm)" {...field} className="h-8 text-xs" /></FormControl></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.width_cm`} render={({ field }) => (<FormItem className="space-y-1"><FormControl><Input type="number" placeholder="W(cm)" {...field} className="h-8 text-xs" /></FormControl></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.height_cm`} render={({ field }) => (<FormItem className="space-y-1"><FormControl><Input type="number" placeholder="H(cm)" {...field} className="h-8 text-xs" /></FormControl></FormItem>)} />
                                                                        </div>
                                                                    </div>

                                                                    {/* Description Row (AI Write) */}
                                                                    <div className="col-span-12 mt-1">
                                                                        <FormField control={form.control} name={`variants.${index}.description`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormControl>
                                                                                    <div className="relative">
                                                                                        <Textarea
                                                                                            placeholder="Pre-order version details..."
                                                                                            {...field}
                                                                                            className="min-h-[60px] text-xs resize-none bg-white font-normal pr-10"
                                                                                        />
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="absolute right-2 top-2 h-6 w-6 text-purple-600 hover:bg-purple-50"
                                                                                            onClick={() => handleOpenVariantMagicWrite(index)}
                                                                                        >
                                                                                            <Sparkles className="w-3 h-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
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
                                                    {form.getValues("media_items")?.[0]?.url ? <img src={form.getValues("media_items")[0].url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-neutral-300"><Box className="w-8 h-8" /></div>}
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

                {/* AI DIALOG - Main Form Scope */}
                <MagicWriteDialog
                    open={magicWriteState.isOpen}
                    onOpenChange={(open) => setMagicWriteState(prev => ({ ...prev, isOpen: open }))}
                    productName={form.watch("name") || ""}
                    targetName={magicWriteState.targetName}
                    imageUrl={magicWriteState.imageUrl} // <--- Use state instead of calculating it here
                    onSuccess={handleMagicWriteSuccess}
                />

            </DialogContent>
        </Dialog>
    );
}