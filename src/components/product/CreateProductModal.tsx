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
import { SmartCreatableStringSelect } from "@/components/common/SmartCreatableStringSelect";
import { productsService } from "@/services/products.service";
import { optionsService } from "@/services/options.service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
        scale: z.string().optional(),
        material: z.string().optional(),
        included_items: z.string().optional(),
    })).min(1, "At least one variant is required"),
});

const blindboxSchema = baseSchema.extend({
    type_code: z.literal("BLINDBOX"),
    price: z.coerce.number().min(1000, "Ticket Price must be at least 1,000 VND"),
    min_value_allow: z.coerce.number().min(0),
    max_value_allow: z.coerce.number().min(0),
    scale: z.string().optional(),
    material: z.string().optional(),
    included_items: z.string().optional(),
    start_date: z.string().min(1, "Start Date is required"),
    end_date: z.string().min(1, "End Date is required"),
});

const preorderSchema = baseSchema.extend({
    type_code: z.literal("PREORDER"),
    release_date: z.string().min(1, "Release date is required"),

    variants: z.array(z.object({
        option_name: z.string().min(1, "Option Name is required"),
        price: z.coerce.number().min(1000, "Full Price must be at least 1,000 VND"),
        deposit_amount: z.coerce.number().min(1000, "Deposit must be at least 1,000 VND"),
        slot_limit: z.coerce.number().min(0, "Slots must be positive").default(0), // Maps to preorder_slot_limit
        max_qty_per_user: z.coerce.number().min(1, "Min limit is 1").default(2),   // Maps to max_qty_per_user
        sku: z.string().min(1, "SKU is required"),
        // stock_available is NOT required for input, will be set to 0 by backend/transformer

        media_assets: z.array(mediaItemSchema).optional(),
        description: z.string().optional(),
        weight_g: z.coerce.number().min(0).optional(),
        length_cm: z.coerce.number().min(0).optional(),
        width_cm: z.coerce.number().min(0).optional(),
        height_cm: z.coerce.number().min(0).optional(),
        scale: z.string().optional(),
        material: z.string().optional(),
        included_items: z.string().optional(),
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

    const [selectedVariant, setSelectedVariant] = useState<any>(product.product_variants?.[0] || null);

    // Update selected variant if product changes
    useEffect(() => {
        if (product.product_variants?.length > 0) {
            setSelectedVariant(product.product_variants[0]);
        }
    }, [product]);

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
        const variant = product.product_variants?.find((v: any) => v.variant_id === variantId);
        if (variant) setSelectedVariant(variant);

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
                        <h3 className="text-sm font-bold border-b pb-2 mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-neutral-400" /> Description
                            </div>
                            {selectedVariant && (
                                <Badge variant="outline" className="text-[10px] font-normal h-5 border-blue-200 text-blue-700 bg-blue-50">
                                    {selectedVariant.option_name}
                                </Badge>
                            )}
                        </h3>
                        <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none bg-neutral-50 p-3 rounded-lg border">
                            {selectedVariant?.description || product.description || "No description."}
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
                                        {product.product_variants?.map((v: any) => {
                                            const preDef = v.product_preorder_configs;
                                            const displayPrice = isPreorder ? (preDef?.full_price || 0) : v.price;
                                            const displayDeposit = isPreorder ? (preDef?.deposit_amount || 0) : 0;
                                            const displaySlots = isPreorder ? (preDef?.total_slots || 0) : v.stock_available;

                                            return (
                                                <TableRow
                                                    key={v.variant_id}
                                                    className={cn("group cursor-pointer transition-colors", variantIdToMediaIndex.has(v.variant_id) ? "hover:bg-blue-50" : "hover:bg-neutral-50")}
                                                    onClick={() => handleVariantClick(v.variant_id)}
                                                >
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        {v.option_name}
                                                        {variantIdToMediaIndex.has(v.variant_id) && <ImageIcon className="w-3 h-3 text-blue-400" />}
                                                    </TableCell>
                                                    <TableCell>{formatPrice(Number(displayPrice))}</TableCell>
                                                    {isPreorder && (
                                                        <TableCell className="text-orange-600 font-medium">
                                                            {formatPrice(Number(displayDeposit))}
                                                        </TableCell>
                                                    )}
                                                    <TableCell>{displaySlots}</TableCell>
                                                    <TableCell className="text-neutral-500 font-mono text-xs">{v.sku}</TableCell>
                                                    <TableCell>
                                                        {variantIdToMediaIndex.has(v.variant_id) && (
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Eye className="w-3 h-3 text-blue-600" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
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

            variants: [{ option_name: "Standard", price: 0, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10, scale: "", material: "", included_items: "" }],
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
                    formValues.release_date = pre.release_date ? new Date(pre.release_date).toISOString().split('T')[0] : "";
                }
                // Map Pre-order Variants
                formValues.variants = p.product_variants?.map((v: any) => ({
                    option_name: v.option_name,
                    price: Number(v.price), // Full Price
                    deposit_amount: Number(v.deposit_amount || 0),
                    slot_limit: v.preorder_slot_limit || 0,
                    max_qty_per_user: v.max_qty_per_user || 2,
                    sku: v.sku,
                    media_assets: v.media_assets || [],
                    description: v.description || "",
                    weight_g: v.weight_g || 200, length_cm: v.length_cm || 10, width_cm: v.width_cm || 10, height_cm: v.height_cm || 10
                })) || [{ option_name: "Standard", price: 0, deposit_amount: 0, slot_limit: 50, max_qty_per_user: 2, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 }];
            }
            form.reset(formValues);
        } else if (open && !productToEdit) {
            form.reset({
                name: "", description: "", media_items: [], type_code: "RETAIL",

                variants: [{ option_name: "Standard", price: 0, deposit_amount: 0, slot_limit: 50, max_qty_per_user: 2, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 }],
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
        imageUrl?: string;
        richContext?: any; // <--- Added Rich Context
    }>({ isOpen: false, target: 'MAIN' });



    const [generatingIndex, setGeneratingIndex] = useState<number | null>(null); // Track which variant is generating
    const [scaleSuggestions, setScaleSuggestions] = useState<string[]>([]);
    const [materialSuggestions, setMaterialSuggestions] = useState<string[]>([]);

    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const [scales, materials] = await Promise.all([
                    productsService.getAttributeSuggestions('scale'),
                    productsService.getAttributeSuggestions('material')
                ]);
                setScaleSuggestions(scales);
                setMaterialSuggestions(materials);
            } catch (error) {
                console.error("Failed to fetch attribute suggestions", error);
            }
        };
        fetchAttributes();
    }, []);



    // 2. Auto-Generate for Variant Description (No Dialog)
    const handleAutoGenerateVariantDescription = async (index: number) => {
        const values = form.getValues();
        const name = values.name;
        const variant = values.variants[index];
        const vName = variant.option_name;

        // Get Variant Image
        const variantImage = variant.media_assets?.[0]?.url;
        // Fallback to Main Image if variant has no image
        const mainImage = values.media_items?.[0]?.url;
        const finalImage = variantImage || mainImage;

        if (!name || !vName) {
            return toast({ title: "Validation Error", description: "Product Name and Variant Name are required.", variant: "destructive" });
        }

        // Gather Rich Context
        const brandName = brands.find(b => b.value === values.brand_id)?.label;
        const catName = categories.find(c => c.value === values.category_id)?.label;
        const seriesName = series.find(s => s.value === values.series_id)?.label;

        setGeneratingIndex(index);
        try {
            const text = await productsService.generateAiDescription({
                productName: name,
                variantName: vName,
                imageUrl: finalImage,
                richContext: {
                    brand: brandName,
                    category: catName,
                    series: seriesName,
                    variants: {
                        price: variant.price,
                        scale: variant.scale,
                        material: variant.material,
                        included_items: variant.included_items
                    }
                }
            });
            form.setValue(`variants.${index}.description`, text);
            toast({ title: "Magic Write", description: "Description generated successfully!" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to generate description.", variant: "destructive" });
        } finally {
            setGeneratingIndex(null);
        }
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
                    weight_g: v.weight_g, length_cm: v.length_cm, width_cm: v.width_cm, height_cm: v.height_cm,
                    scale: v.scale, material: v.material, included_items: v.included_items ? v.included_items.split(',').map((s: string) => s.trim()) : []
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
                    price: 0,                         // Retail Price is 0
                    stock_available: 0,               // Physical Stock is 0 initially
                    sku: v.sku,
                    media_assets: v.media_assets,
                    description: v.description,
                    weight_g: v.weight_g,
                    length_cm: v.length_cm, width_cm: v.width_cm, height_cm: v.height_cm,
                    scale: v.scale, material: v.material, included_items: v.included_items ? v.included_items.split(',').map((s: string) => s.trim()) : [],

                    // NEW: Nested Pre-order Definition
                    preorder_config: {
                        deposit_amount: v.deposit_amount,
                        full_price: v.price,          // Mapped from form 'price' input
                        total_slots: v.slot_limit,    // Maps form 'slot_limit' -> DB 'total_slots'
                        max_qty_per_user: v.max_qty_per_user,
                        release_date: data.release_date // Sync with parent release date
                    }
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
        if (!isEditMode) form.reset();
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

                        <div className="p-6 flex-1 overflow-y-auto space-y-8">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                    {/* SECTION 1: BASIC INFO */}
                                    <Card>
                                        <CardHeader className="pb-3 border-b bg-neutral-50/50 rounded-t-lg">
                                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-900">1. Basic Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product Name <span className="text-red-500">*</span></FormLabel>
                                                        <FormControl><Input placeholder="E.g. Gundam RX-78-2 Ver.Ka" {...field} className="text-base" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />

                                            </div>

                                            <div>
                                                <FormField control={form.control} name="media_items" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cover Media (Max 1)</FormLabel>
                                                        <FormControl>
                                                            <VariantMediaManager value={field.value} onChange={(vals) => {
                                                                if (vals.length > 1) { field.onChange([vals[vals.length - 1]]); } else { field.onChange(vals); }
                                                            }} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* SECTION 2: CLASSIFICATION */}
                                    <Card>
                                        <CardHeader className="pb-3 border-b bg-neutral-50/50 rounded-t-lg">
                                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-900">2. Classification</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        </CardContent>
                                    </Card>

                                    {/* SECTION 3: TYPE & DETAILS */}
                                    <Card>
                                        <CardHeader className="pb-3 border-b bg-neutral-50/50 rounded-t-lg">
                                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-900">3. Product Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">

                                            <FormField control={form.control} name="type_code" render={({ field }) => (
                                                <FormItem className="md:w-1/3">
                                                    <FormLabel>Product Type <span className="text-red-500">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="RETAIL">Retail Product</SelectItem>
                                                            <SelectItem value="BLINDBOX">Blind Box Set</SelectItem>
                                                            <SelectItem value="PREORDER">Pre-order Item</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            {/* DYNAMIC FIELDS based on Type */}
                                            <div className="space-y-6">
                                                {/* RETAIL VARIANTS */}
                                                {watchedType === "RETAIL" && (
                                                    <div className="space-y-5">
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="font-semibold text-sm">Retail Variants</h4>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => append({ option_name: "", price: 0, sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100)}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 })}><Plus className="w-4 h-4 mr-2" />Add Variant</Button>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {fields.map((field, index) => (
                                                                <div key={field.id} className="bg-white p-4 rounded-lg border shadow-sm relative group">
                                                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-neutral-400 hover:text-red-500" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>

                                                                    <div className="grid grid-cols-12 gap-4">
                                                                        {/* Row 1: Basic Stats */}
                                                                        <div className="col-span-4">
                                                                            <FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500">Name</FormLabel><FormControl><Input placeholder="Variant Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                                        </div>
                                                                        <div className="col-span-3">
                                                                            <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500">Retail Price</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                                        </div>
                                                                        <div className="col-span-3">
                                                                            <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel className="text-xs text-neutral-500">SKU</FormLabel>
                                                                                    <div className="flex gap-1">
                                                                                        <FormControl><Input placeholder="SKU" {...field} readOnly className="bg-neutral-100 font-mono text-xs" /></FormControl>
                                                                                        <Button type="button" variant="outline" size="icon" onClick={() => handleGenSku(index)}><RefreshCw className="w-3 h-3" /></Button>
                                                                                    </div>
                                                                                </FormItem>
                                                                            )} />
                                                                        </div>
                                                                        <div className="col-span-2 flex items-end">
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="outline" className="w-full relative overflow-hidden">
                                                                                        <ImageIcon className="w-4 h-4 mr-2" /> Media
                                                                                        {form.watch(`variants.${index}.media_assets`)?.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-[400px]" align="end">
                                                                                    <FormField control={form.control} name={`variants.${index}.media_assets`} render={({ field }) => (
                                                                                        <VariantMediaManager value={field.value} onChange={field.onChange} />
                                                                                    )} />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </div>



                                                                        {/* Row 2: Physical Specs */}
                                                                        <div className="col-span-12 grid grid-cols-4 gap-4 bg-neutral-50 p-3 rounded-md">
                                                                            <FormField control={form.control} name={`variants.${index}.weight_g`} render={({ field }) => (<FormItem className="space-y-0"><FormLabel className="text-[10px] uppercase text-neutral-500">Weight (g)</FormLabel><FormControl><Input type="number" min={0} {...field} className="h-8 text-xs bg-white" /></FormControl></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.length_cm`} render={({ field }) => (<FormItem className="space-y-0"><FormLabel className="text-[10px] uppercase text-neutral-500">Length (cm)</FormLabel><FormControl><Input type="number" min={0} {...field} className="h-8 text-xs bg-white" /></FormControl></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.width_cm`} render={({ field }) => (<FormItem className="space-y-0"><FormLabel className="text-[10px] uppercase text-neutral-500">Width (cm)</FormLabel><FormControl><Input type="number" min={0} {...field} className="h-8 text-xs bg-white" /></FormControl></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.height_cm`} render={({ field }) => (<FormItem className="space-y-0"><FormLabel className="text-[10px] uppercase text-neutral-500">Height (cm)</FormLabel><FormControl><Input type="number" min={0} {...field} className="h-8 text-xs bg-white" /></FormControl></FormItem>)} />
                                                                        </div>

                                                                        {/* Row 3: Extra Info */}
                                                                        <div className="col-span-12 grid grid-cols-3 gap-4">
                                                                            <FormField control={form.control} name={`variants.${index}.scale`} render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel className="text-xs text-neutral-500">Scale</FormLabel>
                                                                                    <FormControl>
                                                                                        <SmartCreatableStringSelect
                                                                                            options={scaleSuggestions}
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            placeholder="1/144"
                                                                                            label="Scale"
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )} />
                                                                            <FormField control={form.control} name={`variants.${index}.material`} render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel className="text-xs text-neutral-500">Material</FormLabel>
                                                                                    <FormControl>
                                                                                        <SmartCreatableStringSelect
                                                                                            options={materialSuggestions}
                                                                                            value={field.value}
                                                                                            onChange={field.onChange}
                                                                                            placeholder="PVC, ABS"
                                                                                            label="Material"
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )} />
                                                                            <FormField control={form.control} name={`variants.${index}.included_items`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500">Included Items (comma separated)</FormLabel><FormControl><Input placeholder="Base, Weapon..." {...field} className="h-8 text-xs bg-white" /></FormControl></FormItem>)} />
                                                                        </div>

                                                                        {/* Variant Description (Moved to Bottom) */}
                                                                        <div className="col-span-12 mt-2">
                                                                            <FormField control={form.control} name={`variants.${index}.description`} render={({ field }) => (
                                                                                <FormItem>
                                                                                    <div className="flex justify-between items-center mb-1">
                                                                                        <FormLabel className="text-xs text-neutral-500">Variant Description</FormLabel>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-6 text-purple-600 gap-1 hover:bg-purple-50"
                                                                                            onClick={() => handleAutoGenerateVariantDescription(index)}
                                                                                            disabled={generatingIndex === index}
                                                                                        >
                                                                                            {generatingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                                            <span className="text-xs">Auto-Generate</span>
                                                                                        </Button>
                                                                                    </div>
                                                                                    <FormControl><Textarea placeholder="Generated description based on details..." {...field} className="min-h-[80px] text-xs bg-neutral-50" /></FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* BLINDBOX FIELDS */}
                                                {watchedType === "BLINDBOX" && (
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Ticket Price</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-6 p-4 bg-white rounded-lg border">
                                                            <FormField control={form.control} name="min_value_allow" render={({ field }) => (<FormItem><FormLabel>Min Value (Common)</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="max_value_allow" render={({ field }) => (<FormItem><FormLabel>Max Value (Secret)</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem><FormLabel>Sale Start</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem><FormLabel>Sale End</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* PREORDER FIELDS */}
                                                {watchedType === "PREORDER" && (
                                                    <div className="space-y-6">
                                                        <FormField control={form.control} name="release_date" render={({ field }) => (<FormItem className="md:w-1/2"><FormLabel>Target Release Date</FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />

                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-100">
                                                                <div>
                                                                    <h4 className="font-bold text-orange-900 text-sm">Pre-order Options</h4>
                                                                    <p className="text-xs text-orange-700">Define versions (e.g. Standard, Deluxe) with separate deposit rules.</p>
                                                                </div>
                                                                <Button type="button" size="sm" variant="outline" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => append({ option_name: "", price: 0, deposit_amount: 0, slot_limit: 50, max_qty_per_user: 2, sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100)}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 })}><Plus className="w-4 h-4 mr-2" />Add Version</Button>
                                                            </div>

                                                            <div className="space-y-4">
                                                                {fields.map((field, index) => (
                                                                    <Card key={field.id} className="relative group overflow-hidden border border-orange-200 shadow-sm">
                                                                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                                                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-neutral-400 hover:text-red-500 z-10" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>

                                                                        <CardContent className="p-4 space-y-4">

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                                                <div className="md:col-span-2">
                                                                                    <FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500">Version Name</FormLabel><FormControl><Input placeholder="e.g. Deluxe Edition" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                                                </div>
                                                                                <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel className="text-xs text-neutral-500">SKU</FormLabel>
                                                                                        <div className="flex gap-1">
                                                                                            <FormControl><Input placeholder="SKU" {...field} readOnly className="bg-neutral-100 font-mono text-xs" /></FormControl>
                                                                                            <Button type="button" variant="outline" size="icon" onClick={() => handleGenSku(index)}><RefreshCw className="w-3 h-3" /></Button>
                                                                                        </div>
                                                                                    </FormItem>
                                                                                )} />
                                                                                <div className="md:col-span-1 pt-6 text-right">
                                                                                    {/* Media Trigger */}
                                                                                    <Popover>
                                                                                        <PopoverTrigger asChild>
                                                                                            <Button variant="outline" size="sm" className="relative">
                                                                                                <ImageIcon className="w-4 h-4 mr-2" /> Media
                                                                                                {form.watch(`variants.${index}.media_assets`)?.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
                                                                                            </Button>
                                                                                        </PopoverTrigger>
                                                                                        <PopoverContent className="w-[400px]" align="end">
                                                                                            <FormField control={form.control} name={`variants.${index}.media_assets`} render={({ field }) => (<VariantMediaManager value={field.value} onChange={field.onChange} />)} />
                                                                                        </PopoverContent>
                                                                                    </Popover>
                                                                                </div>
                                                                            </div>



                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                                                                                <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold text-orange-800">Full Price</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                                                <FormField control={form.control} name={`variants.${index}.deposit_amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold text-orange-800">Deposit</FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                                                <FormField control={form.control} name={`variants.${index}.slot_limit`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500">Total Slots</FormLabel><FormControl><Input type="number" {...field} className="font-mono" /></FormControl></FormItem>)} />
                                                                                <FormField control={form.control} name={`variants.${index}.max_qty_per_user`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500">Max / User</FormLabel><FormControl><Input type="number" {...field} className="font-mono" /></FormControl></FormItem>)} />
                                                                            </div>

                                                                            <div className="grid grid-cols-3 gap-4 mt-4">
                                                                                <FormField control={form.control} name={`variants.${index}.scale`} render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel className="text-xs text-neutral-500">Scale</FormLabel>
                                                                                        <FormControl>
                                                                                            <SmartCreatableStringSelect
                                                                                                options={scaleSuggestions}
                                                                                                value={field.value}
                                                                                                onChange={field.onChange}
                                                                                                placeholder="1/144"
                                                                                                label="Scale"
                                                                                            />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )} />
                                                                                <FormField control={form.control} name={`variants.${index}.material`} render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel className="text-xs text-neutral-500">Material</FormLabel>
                                                                                        <FormControl>
                                                                                            <SmartCreatableStringSelect
                                                                                                options={materialSuggestions}
                                                                                                value={field.value}
                                                                                                onChange={field.onChange}
                                                                                                placeholder="PVC, ABS"
                                                                                                label="Material"
                                                                                            />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )} />
                                                                                <FormField control={form.control} name={`variants.${index}.included_items`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500">Included Items</FormLabel><FormControl><Input placeholder="Base, Weapon..." {...field} className="h-8 text-xs bg-white" /></FormControl></FormItem>)} />
                                                                            </div>


                                                                            <div className="col-span-12 mt-2">
                                                                                <FormField
                                                                                    control={form.control}
                                                                                    name={`variants.${index}.description`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem>
                                                                                            <div className="flex justify-between items-center mb-1">
                                                                                                <FormLabel className="text-xs text-neutral-500">Variant Description</FormLabel>
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    className="h-6 text-purple-600 gap-1 hover:bg-purple-50"
                                                                                                    onClick={() => handleAutoGenerateVariantDescription(index)}
                                                                                                    disabled={generatingIndex === index}
                                                                                                >
                                                                                                    {generatingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                                                    <span className="text-xs">Auto-Generate</span>
                                                                                                </Button>
                                                                                            </div>
                                                                                            <FormControl>
                                                                                                <Textarea placeholder="Generated description based on details..." {...field} className="min-h-[80px] text-xs bg-neutral-50" />
                                                                                            </FormControl>
                                                                                            <FormMessage />
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                        </CardContent>
                                    </Card>

                                    {/* FOOTER ACTIONS */}
                                    <div className="p-4 border-t bg-neutral-50 flex justify-end gap-3 shrink-0">
                                        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                                        <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={loading} className="min-w-[120px]">
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? "Update Product" : "Create Product")}
                                        </Button>
                                    </div>
                                </form>
                            </Form>


                            {/* AI DIALOG - Main Form Scope */}
                            <MagicWriteDialog
                                open={magicWriteState.isOpen}
                                onOpenChange={(open) => setMagicWriteState(prev => ({ ...prev, isOpen: open }))}
                                productName={form.watch("name") || ""}
                                targetName={magicWriteState.targetName}
                                imageUrl={magicWriteState.imageUrl}
                                richContext={magicWriteState.richContext}
                                onSuccess={handleMagicWriteSuccess}
                            />
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog >
    );
}