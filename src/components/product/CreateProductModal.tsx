import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ChevronRight, CheckCircle2, Box, Info, Trash2, Plus, RefreshCw, X, Calendar, Tag, Image as ImageIcon, Eye, Layers, Printer, Sparkles, ChevronDown } from "lucide-react";
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
    media_items: z.array(z.any()).min(1, "At least one product image is required"),
    brand_id: z.coerce.number().min(1, "Brand is required"),
    category_id: z.coerce.number().min(1, "Category is required"),
    series_id: z.coerce.number().min(1, "Series is required"),
    type_code: z.enum(["RETAIL", "BLINDBOX", "PREORDER", "AUCTION"]),
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
        cost_price: z.coerce.number().min(0, "Cost Price must be positive"),
        price: z.coerce.number().min(1000, "Price must be at least 1,000 VND"),
        sku: z.string().min(1, "SKU is required"),

        media_assets: z.array(mediaItemSchema).min(1, "Variant image is required"),
        description: z.string().min(10, "Variant description is required"),
        weight_g: z.coerce.number().min(1, "Weight is required"),
        length_cm: z.coerce.number().min(1, "Length is required"),
        width_cm: z.coerce.number().min(1, "Width is required"),
        height_cm: z.coerce.number().min(1, "Height is required"),
        scale: z.string().min(1, "Scale is required"),
        material: z.string().min(1, "Material is required"),
        included_items: z.string().min(1, "Included items are required"),
    }).refine(
        (data) => {
            const cost = Number(data.cost_price) || 0;
            const retail = Number(data.price) || 0;
            if (data.cost_price === undefined || data.price === undefined) return true;
            return retail > cost;
        },
        {
            message: "Retail price must be greater than cost price",
            path: ["price"],
        }
    )).min(1, "At least one variant is required"),
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
}).refine(data => new Date(data.start_date) <= new Date(data.end_date), {
    message: "Start Date must be before or equal to End Date",
    path: ["start_date"]
});

const preorderSchema = baseSchema.extend({
    type_code: z.literal("PREORDER"),
    release_date: z.string().min(1, "Release date is required"),

    variants: z.array(z.object({
        option_name: z.string().min(1, "Option Name is required"),
        cost_price: z.coerce.number().min(0).optional(),
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

const auctionSchema = baseSchema.extend({
    type_code: z.literal("AUCTION"),
    variants: z.array(z.object({
        option_name: z.string().min(1, "Option Name is required"),
        cost_price: z.coerce.number().min(0).optional(),
        price: z.coerce.number().min(0, "Price can be 0 for auctions").optional(),
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
    }).refine(
        (data) => {
            const cost = Number(data.cost_price) || 0;
            const retail = Number(data.price) || 0;
            if (data.cost_price === undefined || data.price === undefined) return true;
            if (retail === 0 && cost === 0) return true;
            return retail > cost;
        },
        {
            message: "Retail price must be greater than cost price (unless both are 0)",
            path: ["price"],
        }
    )).min(1, "At least one variant is required"),
});

const formSchema = z.discriminatedUnion("type_code", [
    retailSchema,
    blindboxSchema,
    preorderSchema,
    auctionSchema
]);

type ProductFormValues = z.infer<typeof formSchema>;

const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

// Helper to get type gradient
const getTypeGradient = (type: string) => {
    switch (type) {
        case 'RETAIL': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
        case 'BLINDBOX': return 'bg-gradient-to-r from-purple-500 to-pink-500';
        case 'PREORDER': return 'bg-gradient-to-r from-orange-500 to-amber-500';
        case 'AUCTION': return 'bg-gradient-to-r from-red-500 to-rose-500';
        default: return 'bg-neutral-500';
    }
};

const StrictNumericInput = ({ field, ...props }: { field: any } & React.ComponentProps<typeof Input>) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        field.onChange(val);
    };

    return (
        <Input
            {...props}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={field.value ?? ""}
            onChange={handleChange}
            onKeyDown={(e) => {
                if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
            }}
        />
    );
};

const FormattedNumberInput = ({ field, placeholder = "0" }: { field: any, placeholder?: string }) => (
    <div className="space-y-1">
        <div className="relative">
            <StrictNumericInput
                field={field}
                placeholder={placeholder}
                className="font-mono pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none">VND</span>
        </div>
        {Number(field.value) > 0 && <div className="text-xs font-medium text-blue-600">{formatPrice(Number(field.value))}</div>}
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
    const isAuction = product.type_code === 'AUCTION';
    const bb = product.product_blindboxes;
    const pre = product.product_variants?.[0]?.product_preorder_configs;

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

                        {(isRetail || isPreorder || isAuction) && (
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
                                            <Calendar className="w-3 h-3" /> Sale Period: {bb.start_time ? new Date(bb.start_time).toLocaleDateString() : 'N/A'} - {bb.end_time ? new Date(bb.end_time).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    <Badge className="bg-white text-purple-700 hover:bg-white border-purple-200 shadow-sm">{bb.target_margin || 0}% Target Margin</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-white/60 p-3 rounded-lg border border-purple-100/50 shadow-inner">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-purple-400">Ticket Price</label>
                                        <div className="text-2xl font-bold text-purple-900">{formatPrice(Number(bb.price))}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-purple-400">Total Pool Value Range</label>
                                        <div className="text-sm font-bold text-purple-800 mt-1">
                                            {formatPrice(Number(bb.min_value))} - {formatPrice(Number(bb.max_value))}
                                        </div>
                                    </div>
                                </div>

                                {bb.tier_config && (
                                    <div className="bg-white/80 rounded-lg border border-purple-100 overflow-hidden text-[11px]">
                                        <Table>
                                            <TableHeader className="bg-purple-100/50">
                                                <TableRow className="h-8 hover:bg-transparent">
                                                    <TableHead className="h-8 py-0 font-bold text-purple-900">Zone / Tier Name</TableHead>
                                                    <TableHead className="h-8 py-0 font-bold text-purple-900">Chance</TableHead>
                                                    <TableHead className="h-8 py-0 font-bold text-purple-900 text-center">Good</TableHead>
                                                    <TableHead className="h-8 py-0 font-bold text-purple-900 text-center">Defect</TableHead>
                                                    <TableHead className="h-8 py-0 font-bold text-purple-900">Value Range</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(() => {
                                                    const displayTiers = typeof bb.tier_config === 'string' ? JSON.parse(bb.tier_config) : bb.tier_config;

                                                    return (displayTiers || []).map((tier: any, idx: number) => (
                                                        <TableRow key={idx} className="h-8 border-purple-50">
                                                            <TableCell className="py-1 font-semibold">{tier.name || `Zone ${idx + 1}`}</TableCell>
                                                            <TableCell className="py-1 text-purple-700 font-bold whitespace-nowrap">{tier.probability}%</TableCell>
                                                            <TableCell className="py-1 text-center font-bold text-blue-600">
                                                                {tier.stock_good ?? 0}
                                                            </TableCell>
                                                            <TableCell className="py-1 text-center font-bold text-orange-600">
                                                                {tier.stock_defect ?? 0}
                                                            </TableCell>
                                                            <TableCell className="py-1">
                                                                {formatPrice(tier.min || tier.value_min)} - {formatPrice(tier.max || tier.value_max)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ));
                                                })()}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
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
        mode: "onTouched",
        defaultValues: {
            name: "", description: "", media_items: [], type_code: "RETAIL",

            variants: [{ option_name: "Standard", cost_price: 0, price: 0, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10, scale: "", material: "", included_items: "" }],
            price: 0, min_value_allow: 0, max_value_allow: 0, target_margin: 20, start_date: "", end_date: "",
            full_price: 0, deposit_amount: 0, release_date: "", max_slots: 100,
        },
    });

    const { fields, append, remove, update } = useFieldArray({ control: form.control, name: "variants" });
    const watchedType = form.watch("type_code");
    const watchedStartDate = form.watch("start_date");
    const watchedEndDate = form.watch("end_date");

    // --- BLINDBOX DATE AUTO-CORRECTION ---
    useEffect(() => {
        if (watchedType === "BLINDBOX" && watchedStartDate && watchedEndDate) {
            const start = new Date(watchedStartDate);
            const end = new Date(watchedEndDate);

            if (start > end) {
                // Swap dates
                form.setValue("start_date", watchedEndDate);
                form.setValue("end_date", watchedStartDate);

                toast({
                    title: "Dates Adjusted",
                    description: "The sale start date was after the end date, so they have been automatically swapped to ensure a valid range.",
                    variant: "default",
                });
            }
        }
    }, [watchedType, watchedStartDate, watchedEndDate, form, toast]);

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

            if (p.type_code === 'RETAIL' || p.type_code === 'AUCTION') {
                formValues.variants = p.product_variants?.map((v: any) => ({
                    option_name: v.option_name, price: Number(v.price), cost_price: Number(v.cost_price || 0), sku: v.sku, media_assets: v.media_assets || [], description: v.description || "",
                    weight_g: v.weight_g || 200, length_cm: v.length_cm || 10, width_cm: v.width_cm || 10, height_cm: v.height_cm || 10
                })) || [{ option_name: "Standard", price: 0, cost_price: 0, sku: `SKU-${Date.now()}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 }];
            } else if (p.type_code === 'BLINDBOX') {
                const bb = p.product_blindboxes?.[0];
                if (bb) {
                    formValues.price = Number(bb.price);
                    formValues.min_value_allow = Number(bb.min_value);
                    formValues.max_value_allow = Number(bb.max_value);
                    formValues.target_margin = Number(bb.target_margin);
                    formValues.start_date = bb.start_time ? new Date(bb.start_time).toISOString().split('T')[0] : "";
                    formValues.end_date = bb.end_time ? new Date(bb.end_time).toISOString().split('T')[0] : "";
                }
            } else if (p.type_code === 'PREORDER') {
                const pre = p.product_variants?.[0]?.product_preorder_configs;
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
    const [magicWriteState, setMagicWriteState] = useState<{
        isOpen: boolean;
        target: 'MAIN' | 'VARIANT';
        variantIndex?: number;
        targetName?: string;
        imageUrl?: string;
        richContext?: any; // <--- Added Rich Context
    }>({ isOpen: false, target: 'MAIN' });

    // --- AI BLINDBOX PRICING ---
    const [isAnalyzingPrice, setIsAnalyzingPrice] = useState(false);
    const [pricingSuggestion, setPricingSuggestion] = useState<any>(null);

    const handleSuggestBlindboxPrice = async () => {
        const minValue = form.getValues('min_value_allow');
        const maxValue = form.getValues('max_value_allow');
        const currentPrice = form.getValues('price');

        if (!minValue || !maxValue || Number(minValue) >= Number(maxValue)) {
            return toast({
                title: "Lỗi Nhập liệu",
                description: "Vui lòng nhập Min/Max hợp lệ (Min phải nhỏ hơn Max).",
                variant: "destructive"
            });
        }

        setIsAnalyzingPrice(true);
        try {
            const { inventoryAnalyticsService } = await import('@/services/inventory-analytics.service');
            const res = await inventoryAnalyticsService.analyzeBlindboxRisk({
                minValue: Number(minValue),
                maxValue: Number(maxValue),
                suggestedPrice: Number(currentPrice) || undefined
            });
            if (res.success && res.data) {
                setPricingSuggestion(res.data);
                // Cập nhật giá vé theo đề xuất AI
                form.setValue('price', res.data.recommendedTicketPrice);
                toast({ title: "Phân tích Rủi ro Xong", description: "Đã cập nhật giá bán vé theo chuyên gia AI!" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Lỗi Phân tích", description: "Hệ thống AI đang quá tải, vui lòng thử lại sau.", variant: "destructive" });
        } finally {
            setIsAnalyzingPrice(false);
        }
    };



    const [generatingIndex, setGeneratingIndex] = useState<number | null>(null); // Track which variant is generating
    const [loadingAI, setLoadingAI] = useState(false); // Track global AI generation (for non-variant fields)
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

    // 2.5 Auto-Generate for Blindbox Description
    const handleAutoGenerateBlindboxDescription = async () => {
        const values = form.getValues();
        const name = values.name;
        const mainImage = values.media_items?.[0]?.url;

        if (!name) {
            return toast({ title: "Validation Error", description: "Product Name is required.", variant: "destructive" });
        }

        const brandName = brands.find(b => b.value === values.brand_id)?.label;
        const catName = categories.find(c => c.value === values.category_id)?.label;
        const seriesName = series.find(s => s.value === values.series_id)?.label;

        setLoadingAI(true);
        try {
            const text = await productsService.generateAiDescription({
                productName: name,
                imageUrl: mainImage,
                richContext: {
                    type: "Blindbox / Mystery Box",
                    brand: brandName,
                    category: catName,
                    series: seriesName,
                    price: formatPrice(Number(values.price || 0)),
                    value_range: `${formatPrice(Number(values.min_value_allow || 0))} - ${formatPrice(Number(values.max_value_allow || 0))}`,
                }
            });
            form.setValue("description", text);
            toast({ title: "Magic Write", description: "Blindbox description generated!" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to generate description.", variant: "destructive" });
        } finally {
            setLoadingAI(false);
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

    const onSubmit = async (data: ProductFormValues, targetStatus: string = 'ACTIVE') => {
        setLoading(true);
        try {
            const mediaUrlsAsString = data.media_items?.map((m: MediaItem) => m.url) || [];
            let payload: any = {
                name: data.name, description: data.description || "",
                media_urls: mediaUrlsAsString,
                brand_id: data.brand_id, category_id: data.category_id, series_id: data.series_id,
                type_code: data.type_code, status_code: targetStatus
            };

            if (data.type_code === "RETAIL" || data.type_code === "AUCTION") {
                payload.variants = data.variants.map((v: any) => {
                    const variant: any = {
                        option_name: v.option_name,
                        price: v.price || 0,
                        sku: v.sku,
                        media_assets: v.media_assets,
                        description: v.description,
                        stock_available: 0,
                        weight_g: v.weight_g,
                        length_cm: v.length_cm,
                        width_cm: v.width_cm,
                        height_cm: v.height_cm,
                        scale: v.scale,
                        material: v.material,
                        included_items: v.included_items ? v.included_items.split(',').map((s: string) => s.trim()) : []
                    };

                    if (data.type_code === "RETAIL") {
                        variant.cost_price = v.cost_price || 0;
                    }

                    return variant;
                });
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
                                <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="space-y-8">

                                    {/* SECTION 1: BASIC INFO */}
                                    <div className="bg-gradient-to-br from-blue-50/40 to-indigo-50/40 p-6 rounded-xl border border-blue-100/50 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Info className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900">1. Core Identity</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-12">
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem className="bg-white p-4 rounded-lg border shadow-sm border-blue-100">
                                                        <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-blue-800">Product Name <span className="text-red-500">*</span></FormLabel>
                                                        <FormControl><Input placeholder="E.g. Gundam RX-78-2 Ver.Ka" {...field} className="text-base font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>

                                            {/* Media Items Restored */}
                                            <div className="md:col-span-12">
                                                <FormField control={form.control} name="media_items" render={({ field }) => (
                                                    <FormItem className="bg-white p-4 rounded-lg border shadow-sm border-blue-100">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-blue-800">Primary Product Image <span className="text-red-500">*</span></FormLabel>
                                                            <span className="text-[10px] text-neutral-400">Recommended size: 1000x1000px</span>
                                                        </div>
                                                        <FormControl>
                                                            <VariantMediaManager value={field.value} onChange={(vals) => {
                                                                if (vals.length > 1) { field.onChange([vals[vals.length - 1]]); } else { field.onChange(vals); }
                                                            }} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: CLASSIFICATION */}
                                    <div className="bg-gradient-to-br from-emerald-50/40 to-teal-50/40 p-6 rounded-xl border border-emerald-100/50 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Layers className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">2. Classification</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField control={form.control} name="brand_id" render={({ field }) => (
                                                <FormItem className="bg-white p-4 rounded-lg border shadow-sm border-emerald-100">
                                                    <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Brand <span className="text-red-500">*</span></FormLabel>
                                                    <SmartCreatableSelect options={brands} value={field.value} onChange={field.onChange} onCreate={handleCreateBrand} label="Brand" />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="category_id" render={({ field }) => (
                                                <FormItem className="bg-white p-4 rounded-lg border shadow-sm border-emerald-100">
                                                    <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Category <span className="text-red-500">*</span></FormLabel>
                                                    <SmartCreatableSelect options={categories} value={field.value} onChange={field.onChange} onCreate={handleCreateCategory} label="Category" />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="series_id" render={({ field }) => (
                                                <FormItem className="bg-white p-4 rounded-lg border shadow-sm border-emerald-100">
                                                    <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Series <span className="text-red-500">*</span></FormLabel>
                                                    <SmartCreatableSelect options={series} value={field.value} onChange={field.onChange} onCreate={handleCreateSeries} label="Series" />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    {/* SECTION 3: TYPE & DETAILS */}
                                    <div className="bg-neutral-50/50 p-6 rounded-xl border border-neutral-200/50 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                                                <Layers className="w-4 h-4 text-neutral-600" />
                                            </div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">3. Product Configuration</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                            <FormField control={form.control} name="type_code" render={({ field }) => (
                                                <FormItem className="md:col-span-12 bg-white p-4 rounded-lg border shadow-sm border-neutral-200">
                                                    <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-neutral-800">Product Offering Type <span className="text-red-500">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                                                        <FormControl><SelectTrigger className="border-none shadow-none p-0 h-auto focus:ring-0 text-base font-semibold"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="RETAIL">Retail Product</SelectItem>
                                                            <SelectItem value="BLINDBOX">Blind Box Set</SelectItem>
                                                            <SelectItem value="PREORDER">Pre-order Item</SelectItem>
                                                            <SelectItem value="AUCTION">Auction Item</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* DYNAMIC FIELDS based on Type */}
                                        <div className="space-y-6">

                                            {/* (MOVED TO BOTTOM) BLINDBOX DESCRIPTION FIELD */}

                                            {/* RETAIL OR AUCTION VARIANTS */}
                                            {/* RETAIL VARIANTS */}
                                            {watchedType === "RETAIL" && (
                                                <div className="space-y-5 bg-gradient-to-br from-amber-50/30 to-orange-50/30 p-6 rounded-xl border border-amber-100/50">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                                                <Layers className="w-4 h-4 text-amber-600" />
                                                            </div>
                                                            <h4 className="font-bold text-sm uppercase tracking-wider text-amber-900">Retail Variants</h4>
                                                        </div>
                                                        <Button type="button" size="sm" variant="outline" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => append({ option_name: "", price: 0, cost_price: 0, sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100)}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10 })}><Plus className="w-4 h-4 mr-2" />Add Variant</Button>
                                                    </div>
                                                    <div className="space-y-6">
                                                        {fields.map((field, index) => (
                                                            <div key={field.id} className="bg-white p-5 rounded-lg border shadow-sm border-amber-100 relative group overflow-hidden">
                                                                {/* Accent Strip */}
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />

                                                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>

                                                                <div className="grid grid-cols-12 gap-4">
                                                                    {/* Row 1: Basic Stats */}
                                                                    <div className="col-span-3">
                                                                        <FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500 font-bold">Variant Name <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Variant Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <FormField control={form.control} name={`variants.${index}.cost_price`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500 font-bold">Cost Price <span className="text-red-500">*</span></FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500 font-bold">Retail Price <span className="text-red-500">*</span></FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
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
                                                                    <div className="col-span-2">
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs text-neutral-500 font-bold opacity-0">&nbsp;</FormLabel>
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="outline" className="w-full relative overflow-hidden font-bold">
                                                                                        <ImageIcon className="w-4 h-4 mr-2" /> Media <span className="text-red-500">*</span>
                                                                                        {form.watch(`variants.${index}.media_assets`)?.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-[400px]" align="end">
                                                                                    <FormField control={form.control} name={`variants.${index}.media_assets`} render={({ field }) => (
                                                                                        <VariantMediaManager value={field.value} onChange={field.onChange} />
                                                                                    )} />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </FormItem>
                                                                    </div>



                                                                    <div className="col-span-12 grid grid-cols-4 gap-4 bg-amber-50/40 p-4 rounded-lg border border-amber-100/50">
                                                                        <FormField control={form.control} name={`variants.${index}.weight_g`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-amber-800 font-bold tracking-tighter">Weight (g) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-amber-200 focus:ring-amber-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                        <FormField control={form.control} name={`variants.${index}.length_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-amber-800 font-bold tracking-tighter">Length (cm) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-amber-200 focus:ring-amber-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                        <FormField control={form.control} name={`variants.${index}.width_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-amber-800 font-bold tracking-tighter">Width (cm) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-amber-200 focus:ring-amber-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                        <FormField control={form.control} name={`variants.${index}.height_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-amber-800 font-bold tracking-tighter">Height (cm) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-amber-200 focus:ring-amber-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                    </div>

                                                                    {/* Row 3: Extra Info */}
                                                                    <div className="col-span-12 grid grid-cols-3 gap-4">
                                                                        <FormField control={form.control} name={`variants.${index}.scale`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs text-neutral-500 font-bold">Scale <span className="text-red-500">*</span></FormLabel>
                                                                                <FormControl>
                                                                                    <SmartCreatableStringSelect
                                                                                        options={scaleSuggestions}
                                                                                        value={field.value}
                                                                                        onChange={field.onChange}
                                                                                        placeholder="1/144"
                                                                                        label="Scale"
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                        <FormField control={form.control} name={`variants.${index}.material`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs text-neutral-500 font-bold">Material <span className="text-red-500">*</span></FormLabel>
                                                                                <FormControl>
                                                                                    <SmartCreatableStringSelect
                                                                                        options={materialSuggestions}
                                                                                        value={field.value}
                                                                                        onChange={field.onChange}
                                                                                        placeholder="PVC, ABS"
                                                                                        label="Material"
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )} />
                                                                        <FormField control={form.control} name={`variants.${index}.included_items`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500 font-bold">Included Items <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Base, Weapon..." {...field} className="h-8 text-xs bg-white" /></FormControl><FormMessage /></FormItem>)} />
                                                                    </div>

                                                                    {/* Variant Description (Moved to Bottom) */}
                                                                    <div className="col-span-12 mt-2">
                                                                        <FormField control={form.control} name={`variants.${index}.description`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <div className="flex justify-between items-center mb-1">
                                                                                    <FormLabel className="text-xs text-neutral-500 font-bold">Variant Description <span className="text-red-500">*</span></FormLabel>
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
                                                                                <FormControl><Textarea placeholder="Generated description based on details..." {...field} value={field.value || ""} className="min-h-[80px] text-xs bg-neutral-50" /></FormControl>
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
                                                <div className="space-y-6 bg-gradient-to-br from-purple-50/30 to-pink-50/30 p-6 rounded-xl border border-purple-100/50">

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* 1. Ticket Price */}
                                                        <div className="bg-white p-4 rounded-lg border shadow-sm border-purple-100 flex flex-col justify-center">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                                    <Tag className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <h4 className="text-[10px] uppercase font-bold tracking-wider text-purple-900">Pricing Configuration</h4>
                                                            </div>
                                                            <FormField control={form.control} name="price" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs font-bold">Ticket Price <span className="text-red-500">*</span></FormLabel>
                                                                    <FormControl><FormattedNumberInput field={field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>

                                                        {/* 2. Value Ranges */}
                                                        <div className="bg-white p-4 rounded-lg border shadow-sm border-purple-100">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                        <Layers className="w-4 h-4 text-blue-600" />
                                                                    </div>
                                                                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-blue-900">Value Specs (Probabilities)</h4>
                                                                </div>
                                                                <Button 
                                                                    type="button" 
                                                                    onClick={handleSuggestBlindboxPrice}
                                                                    disabled={isAnalyzingPrice}
                                                                    className="h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md shadow-pink-500/20 gap-1 rounded-xl text-xs px-3"
                                                                >
                                                                    {isAnalyzingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
                                                                    AI Analyze & Suggest Price
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <FormField control={form.control} name="min_value_allow" render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold">Min Value (Common) <span className="text-red-500">*</span></FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                                <FormField control={form.control} name="max_value_allow" render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold">Max Value (Secret) <span className="text-red-500">*</span></FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                            </div>

                                                            {/* AI Risk Output Box */}
                                                            {pricingSuggestion && (
                                                                <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <h5 className="text-[11px] uppercase font-bold text-indigo-800 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Chuyên gia Định giá (AI Actuary)</h5>
                                                                            <p className="text-xs text-indigo-600 mt-1">{pricingSuggestion.explanation}</p>
                                                                        </div>
                                                                        <div className="text-right ml-4 shrink-0">
                                                                            <p className="text-[10px] text-indigo-400">Kỳ Vọng Toán Học (EV)</p>
                                                                            <p className="font-bold text-indigo-900">{formatPrice(pricingSuggestion.expectedValue)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                                                        <div className="bg-white p-2 rounded border border-indigo-50 flex items-center justify-between">
                                                                            <span className="text-neutral-500">Break-even (Hòa Vốn):</span>
                                                                            <span className="font-medium text-amber-600">{formatPrice(pricingSuggestion.breakEvenPoint)}</span>
                                                                        </div>
                                                                        <div className="bg-white p-2 rounded border border-indigo-50 flex items-center justify-between">
                                                                            <span className="text-neutral-500">Khuyến nghị Giá vé:</span>
                                                                            <span className="font-medium text-green-600">{formatPrice(pricingSuggestion.recommendedTicketPrice)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Campaign Schedule */}
                                                    <div className="bg-white p-4 rounded-lg border shadow-sm border-purple-100">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                                    <Info className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <FormLabel className="text-xs font-bold">Blindbox Description <span className="text-red-500">*</span></FormLabel>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-purple-600 gap-1 hover:bg-purple-50"
                                                                onClick={() => handleAutoGenerateBlindboxDescription()}
                                                                disabled={loadingAI}
                                                            >
                                                                {loadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                <span className="text-xs font-bold">Smart Write</span>
                                                            </Button>
                                                        </div>
                                                        <FormField control={form.control} name="description" render={({ field }) => (
                                                            <FormControl><Textarea placeholder="Describe your blindbox set, theme, and potential rewards..." {...field} className="min-h-[100px] text-xs bg-neutral-50 border-none focus-visible:ring-0 p-0" /></FormControl>
                                                        )} />
                                                        <FormMessage />
                                                    </div>

                                                    <div className="bg-white p-4 rounded-lg border shadow-sm border-purple-100">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                                                                <Calendar className="w-4 h-4 text-pink-600" />
                                                            </div>
                                                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-pink-900">Campaign Schedule</h4>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold">Sale Start <span className="text-red-500">*</span></FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold">Sale End <span className="text-red-500">*</span></FormLabel><FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        </div>
                                                    </div>
                                                </div>

                                            )}

                                            {/* PREORDER FIELDS */}
                                            {watchedType === "PREORDER" && (
                                                <div className="space-y-6 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 p-6 rounded-xl border border-blue-100/50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                        <FormField control={form.control} name="release_date" render={({ field }) => (
                                                            <FormItem className="bg-white p-4 rounded-lg border shadow-sm border-blue-100">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                                    <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-blue-800">Target Release Date</FormLabel>
                                                                </div>
                                                                <FormControl><Input type="date" min={new Date().toISOString().split("T")[0]} {...field} className="border-none shadow-none p-0 h-auto focus-visible:ring-0 text-base font-semibold" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />

                                                        <div className="bg-blue-100/50 p-4 rounded-lg border border-blue-200 shadow-inner flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <Box className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-blue-900 leading-tight">Pre-order Hub</p>
                                                                    <p className="text-xs text-blue-700 font-medium">Manage versions & deposits</p>
                                                                </div>
                                                            </div>
                                                            <Button type="button" size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm" onClick={() => append({ option_name: "", price: 0, deposit_amount: 0, slot_limit: 50, max_qty_per_user: 2, sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100)}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10, scale: "", material: "", included_items: "" })}><Plus className="w-4 h-4 mr-2" />Add Version</Button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="space-y-6">
                                                            {fields.map((field, index) => (
                                                                <div key={field.id} className="bg-white p-5 rounded-lg border shadow-sm border-blue-100 relative group overflow-hidden">
                                                                    {/* Accent Strip */}
                                                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />

                                                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors z-10" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>

                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                                            <div className="md:col-span-12">
                                                                                <FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (
                                                                                    <FormItem className="bg-neutral-50/50 p-4 rounded-lg border border-neutral-100">
                                                                                        <FormLabel className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Version Name <span className="text-red-500">*</span></FormLabel>
                                                                                        <FormControl><Input placeholder="e.g. Deluxe Edition" {...field} className="text-base font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0" /></FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )} />
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-12 gap-4">
                                                                            <div className="col-span-6">
                                                                                <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                                                                                    <FormItem className="bg-neutral-50/30 p-3 rounded-lg border border-dashed border-neutral-200">
                                                                                        <FormLabel className="text-[9px] uppercase font-bold text-neutral-400">SKU Reference</FormLabel>
                                                                                        <div className="flex gap-2">
                                                                                            <FormControl><Input placeholder="SKU" {...field} readOnly className="border-none shadow-none p-0 h-auto focus-visible:ring-0 font-mono text-xs bg-transparent" /></FormControl>
                                                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-neutral-400" onClick={() => handleGenSku(index)}><RefreshCw className="w-3 h-3" /></Button>
                                                                                        </div>
                                                                                    </FormItem>
                                                                                )} />
                                                                            </div>
                                                                            <div className="col-span-6 flex items-center justify-end">
                                                                                <Popover>
                                                                                    <PopoverTrigger asChild>
                                                                                        <Button variant="outline" size="sm" className="relative font-bold border-blue-200 text-blue-700 hover:bg-blue-50">
                                                                                            <ImageIcon className="w-4 h-4 mr-2" /> Variant Media <span className="text-red-500 ml-1">*</span>
                                                                                            {form.watch(`variants.${index}.media_assets`)?.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
                                                                                        </Button>
                                                                                    </PopoverTrigger>
                                                                                    <PopoverContent className="w-[400px]" align="end">
                                                                                        <FormField control={form.control} name={`variants.${index}.media_assets`} render={({ field }) => (<VariantMediaManager value={field.value} onChange={field.onChange} />)} />
                                                                                    </PopoverContent>
                                                                                </Popover>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/40 p-4 rounded-lg border border-blue-100/50">
                                                                            <FormField control={form.control} name={`variants.${index}.price`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[9px] uppercase font-bold text-blue-800">Full Price <span className="text-red-500">*</span></FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.deposit_amount`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[9px] uppercase font-bold text-blue-800">Deposit <span className="text-red-500">*</span></FormLabel><FormControl><FormattedNumberInput field={field} /></FormControl><FormMessage /></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.slot_limit`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[9px] uppercase font-bold text-neutral-500">Slots <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.max_qty_per_user`} render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[9px] uppercase font-bold text-neutral-500">Max/User <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                                                        </div>

                                                                        <div className="grid grid-cols-4 gap-4 bg-blue-50/40 p-4 rounded-lg border border-blue-100/50">
                                                                            <FormField control={form.control} name={`variants.${index}.weight_g`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-blue-800 font-bold tracking-tighter">Weight (g) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-blue-200 focus:ring-blue-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.length_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-blue-800 font-bold tracking-tighter">Length (cm) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-blue-200 focus:ring-blue-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.width_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-blue-800 font-bold tracking-tighter">Width (cm) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-blue-200 focus:ring-blue-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                            <FormField control={form.control} name={`variants.${index}.height_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-blue-800 font-bold tracking-tighter">Height (cm) <span className="text-red-500">*</span></FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-blue-200 focus:ring-blue-500" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                                                                        </div>

                                                                        <div className="grid grid-cols-12 gap-4">
                                                                            <div className="col-span-12 grid grid-cols-3 gap-4">
                                                                                <FormField control={form.control} name={`variants.${index}.scale`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold text-neutral-500">Scale <span className="text-red-500">*</span></FormLabel><FormControl><SmartCreatableStringSelect options={scaleSuggestions} value={field.value} onChange={field.onChange} placeholder="1/144" label="Scale" /></FormControl><FormMessage /></FormItem>)} />
                                                                                <FormField control={form.control} name={`variants.${index}.material`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold text-neutral-500">Material <span className="text-red-500">*</span></FormLabel><FormControl><SmartCreatableStringSelect options={materialSuggestions} value={field.value} onChange={field.onChange} placeholder="PVC, ABS" label="Material" /></FormControl><FormMessage /></FormItem>)} />
                                                                                <FormField control={form.control} name={`variants.${index}.included_items`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold text-neutral-500">Included <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Base..." {...field} className="h-8 text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-span-12">
                                                                            <FormField control={form.control} name={`variants.${index}.description`} render={({ field }) => (
                                                                                <FormItem className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                                                                    <div className="flex justify-between items-center mb-1">
                                                                                        <FormLabel className="text-[10px] uppercase font-bold text-neutral-500">Description <span className="text-red-500">*</span></FormLabel>
                                                                                        <Button type="button" variant="ghost" size="sm" className="h-6 text-blue-600 gap-1 hover:bg-blue-50" onClick={() => handleAutoGenerateVariantDescription(index)} disabled={generatingIndex === index}>
                                                                                            {generatingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                                            <span className="text-[10px] font-bold">Smart Write</span>
                                                                                        </Button>
                                                                                    </div>
                                                                                    <FormControl><Textarea placeholder="Details..." {...field} value={field.value || ""} className="min-h-[60px] text-xs bg-transparent border-none focus-visible:ring-0 p-0" /></FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AUCTION FIELDS (Specialized from Retail) */}
                                            {watchedType === "AUCTION" && (
                                                <div className="space-y-6 bg-gradient-to-br from-teal-50/30 to-emerald-50/30 p-6 rounded-xl border border-teal-100/50">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                                                <Layers className="w-4 h-4 text-teal-600" />
                                                            </div>
                                                            <h4 className="font-bold text-sm uppercase tracking-wider text-teal-900">Auction Base Variants</h4>
                                                        </div>                                                        <Button type="button" size="sm" variant="outline" className="bg-white border-teal-200 text-teal-700 hover:bg-teal-50" onClick={() => append({ option_name: "Standard", price: 0, sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 100)}`, media_assets: [], description: "", weight_g: 200, length_cm: 10, width_cm: 10, height_cm: 10, scale: "", material: "", included_items: "" })}><Plus className="w-4 h-4 mr-2" />Add Variant</Button>
                                                    </div>
                                                    <div className="space-y-6">
                                                        {fields.map((field, index) => (
                                                            <div key={field.id} className="bg-white p-5 rounded-lg border shadow-sm border-teal-100 relative group overflow-hidden">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-teal-400" />
                                                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors z-10" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>

                                                                <div className="grid grid-cols-12 gap-4">
                                                                    <div className="col-span-6">
                                                                        <FormField control={form.control} name={`variants.${index}.option_name`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500 font-bold">Variant Name <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="Variant Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                                    </div>
                                                                    <div className="col-span-4">
                                                                        <FormField control={form.control} name={`variants.${index}.sku`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs text-neutral-500">SKU Reference</FormLabel>
                                                                                <div className="flex gap-1">
                                                                                    <FormControl><Input placeholder="SKU" {...field} readOnly className="bg-neutral-100 font-mono text-xs" /></FormControl>
                                                                                    <Button type="button" variant="outline" size="icon" onClick={() => handleGenSku(index)}><RefreshCw className="w-3 h-3" /></Button>
                                                                                </div>
                                                                            </FormItem>
                                                                        )} />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs text-neutral-500 font-bold opacity-0">&nbsp;</FormLabel>
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="outline" className="w-full relative overflow-hidden font-bold border-teal-200 text-teal-700 hover:bg-teal-50">
                                                                                        <ImageIcon className="w-4 h-4 mr-2" /> Media <span className="text-red-500">*</span>
                                                                                        {form.watch(`variants.${index}.media_assets`)?.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-[400px]" align="end">
                                                                                    <FormField control={form.control} name={`variants.${index}.media_assets`} render={({ field }) => (<VariantMediaManager value={field.value} onChange={field.onChange} />)} />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </FormItem>
                                                                    </div>

                                                                    <div className="col-span-12 grid grid-cols-4 gap-4 bg-teal-50/40 p-4 rounded-lg border border-teal-100/50">
                                                                        <FormField control={form.control} name={`variants.${index}.weight_g`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-teal-800 font-bold tracking-tighter">Weight (g)</FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-teal-200 focus:ring-teal-500" /></FormControl></FormItem>)} />
                                                                        <FormField control={form.control} name={`variants.${index}.length_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-teal-800 font-bold tracking-tighter">Length (cm)</FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-teal-200 focus:ring-teal-500" /></FormControl></FormItem>)} />
                                                                        <FormField control={form.control} name={`variants.${index}.width_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-teal-800 font-bold tracking-tighter">Width (cm)</FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-teal-200 focus:ring-teal-500" /></FormControl></FormItem>)} />
                                                                        <FormField control={form.control} name={`variants.${index}.height_cm`} render={({ field }) => (<FormItem className="space-y-0 text-center"><FormLabel className="text-[9px] uppercase text-teal-800 font-bold tracking-tighter">Height (cm)</FormLabel><FormControl><StrictNumericInput field={field} className="h-8 text-xs bg-white text-center border-teal-200 focus:ring-teal-500" /></FormControl></FormItem>)} />
                                                                    </div>

                                                                    {/* Row 3: Extra Info (Consistency with RETAIL) */}
                                                                    <div className="col-span-12 grid grid-cols-3 gap-4">
                                                                        <FormField control={form.control} name={`variants.${index}.scale`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-xs text-neutral-500 font-bold">Scale</FormLabel>
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
                                                                                <FormLabel className="text-xs text-neutral-500 font-bold">Material</FormLabel>
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
                                                                        <FormField control={form.control} name={`variants.${index}.included_items`} render={({ field }) => (<FormItem><FormLabel className="text-xs text-neutral-500 font-bold">Included Items</FormLabel><FormControl><Input placeholder="Base, Weapon..." {...field} className="h-8 text-xs bg-white" /></FormControl></FormItem>)} />
                                                                    </div>

                                                                    {/* Variant Description */}
                                                                    <div className="col-span-12 mt-2">

                                                                        <FormField control={form.control} name={`variants.${index}.description`} render={({ field }) => (
                                                                            <FormItem>
                                                                                <div className="flex justify-between items-center mb-1">
                                                                                    <FormLabel className="text-xs text-neutral-500 font-bold">Variant Description <span className="text-red-500">*</span></FormLabel>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-6 text-purple-600 gap-1 hover:bg-purple-50"
                                                                                        onClick={() => handleAutoGenerateVariantDescription(index)}
                                                                                        disabled={generatingIndex === index}
                                                                                    >
                                                                                        {generatingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                                        <span className="text-xs">Smart Write</span>
                                                                                    </Button>
                                                                                </div>
                                                                                <FormControl><Textarea placeholder="Details..." {...field} className="min-h-[80px] text-xs bg-neutral-50" /></FormControl>
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
                                        </div>
                                    </div>


                                    {/* FOOTER ACTIONS */}
                                    <div className="p-4 border-t bg-neutral-50 flex justify-end gap-3 shrink-0">
                                        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                                        
                                        {watchedType === "BLINDBOX" && !isEditMode && (
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    form.handleSubmit((d) => onSubmit(Math.random() > 10 ? d : d, 'DRAFT'), (errors) => {
                                                        const firstError = Object.values(errors)[0] as any;
                                                        toast({ title: "Validation Error", description: firstError?.message || "Please check the form.", variant: "destructive" });
                                                    })();
                                                }}
                                                disabled={loading}
                                                className="min-w-[120px] bg-purple-600 hover:bg-purple-700"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept & Save Draft"}
                                            </Button>
                                        )}

                                        <Button
                                            type="button"
                                            onClick={() => {
                                                form.handleSubmit((d) => onSubmit(d, 'ACTIVE'), (errors) => {
                                                    const firstError = Object.values(errors)[0] as any;
                                                    toast({
                                                        title: "Validation Error",
                                                        description: firstError?.message || "Please check the form for missing required fields.",
                                                        variant: "destructive"
                                                    });
                                                })();
                                            }}
                                            disabled={loading}
                                            className="min-w-[120px]"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? "Update Product" : "Publish Active")}
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
                )
                }
            </DialogContent>
        </Dialog>
    );
}
