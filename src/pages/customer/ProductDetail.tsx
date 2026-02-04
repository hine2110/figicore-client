import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {

    Package,
    Minus,
    Plus,
    ChevronRight,
    ShieldCheck,
    Truck,
    RefreshCcw
} from 'lucide-react';
import { productsService } from '@/services/products.service';
import { Separator } from '@/components/ui/separator';
import { Product, ProductVariant } from '@/types/product';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from "@/components/ui/use-toast";

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [paymentMode, setPaymentMode] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await productsService.getOne(Number(id));
                // Ensure media_urls is an array
                if (data.media_urls && typeof data.media_urls === 'string') {
                    try {
                        data.media_urls = JSON.parse(data.media_urls);
                    } catch (e) {
                        data.media_urls = [];
                    }
                }
                setProduct(data);

                // Reset states
                setSelectedImage(0);
                setSelectedVariant(null);
                setQuantity(1);
                setPaymentMode('DEPOSIT');

            } catch (error) {
                console.error("Failed to fetch product", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    // Fetch Related Products
    useEffect(() => {
        if (!product) return;

        const loadRelated = async () => {
            try {
                // Hierarchical fallback strategy for related products
                let related: any[] = [];

                // 1. Try fetching by Series first (most relevant)
                if (product.series_id) {
                    const res = await productsService.getProducts({ series_id: product.series_id, type_code: product.type_code, limit: 5 });
                    const list = Array.isArray(res) ? res : (res as any).data || [];
                    related = list.filter((p: any) => p.product_id !== product.product_id);
                }

                // 2. If not enough, try Brand
                if (related.length < 4 && product.brand_id) {
                    const res = await productsService.getProducts({ brand_id: product.brand_id, type_code: product.type_code, limit: 5 });
                    const list = Array.isArray(res) ? res : (res as any).data || [];
                    const brandRelated = list.filter((p: any) => p.product_id !== product.product_id);
                    related = [...related, ...brandRelated];
                }

                // 3. Last resort, Category
                if (related.length < 4 && product.category_id) {
                    const res = await productsService.getProducts({ category_id: product.category_id, type_code: product.type_code, limit: 5 });
                    const list = Array.isArray(res) ? res : (res as any).data || [];
                    const catRelated = list.filter((p: any) => p.product_id !== product.product_id);
                    related = [...related, ...catRelated];
                }

                // Deduplicate and slice
                const uniqueRelated = Array.from(new Map(related.map((item: any) => [item.product_id, item])).values());
                setRelatedProducts(uniqueRelated.slice(0, 4));

            } catch (e) {
                console.error("Failed to load related products", e);
            }
        };
        loadRelated();
    }, [product]);


    // Variant Selection Logic
    useEffect(() => {
        if (product?.type_code === 'RETAIL' && product.product_variants?.length > 0 && !selectedVariant) {
            setSelectedVariant(product.product_variants[0]);
        }
    }, [product, selectedVariant]); // Added selectedVariant to dep array to avoid infinite loop if it changes

    // Format Price Helper
    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    if (loading) {
        return (
            <CustomerLayout activePage="products">
                <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800" />
                </div>
            </CustomerLayout>
        );
    }

    if (!product) return null;

    // Determine displayed price
    let displayPrice = 'Contact';
    // Removed originalPrice logic

    if (product.type_code === 'RETAIL') {
        if (selectedVariant) {
            displayPrice = formatPrice(Number(selectedVariant.price));
        } else if (product.product_variants?.[0]) {
            displayPrice = formatPrice(Number(product.product_variants[0].price));
        }
    } else if (product.type_code === 'PREORDER') {
        // Use selected variant if available, otherwise fallback to first variant or preorder config
        const variant = selectedVariant || product.product_variants?.[0];
        // For variants: price is full price, deposit_amount is deposit
        // Fallback to product_preorders only if no variants (shouldn't happen for valid products)
        const dep = Number(variant?.deposit_amount || product.product_preorders?.deposit_amount || 0);
        const full = Number(variant?.price || product.product_preorders?.full_price || 0);

        if (paymentMode === 'DEPOSIT') {
            displayPrice = formatPrice(dep);
        } else {
            displayPrice = formatPrice(full);
        }
    } else if (product.type_code === 'BLINDBOX') {
        const p = Number(product.product_blindboxes?.price || 0);
        displayPrice = formatPrice(p);
    }

    const renderStockStatus = () => {
        if (product.type_code === 'RETAIL') {
            const stock = selectedVariant?.stock_available || product.product_variants?.[0]?.stock_available || 0;
            if (stock <= 0) return null;

            if (stock < 20) {
                return (
                    <div className="text-sm font-medium">
                        <span className="text-orange-500 font-bold block">Low Stock</span>
                        Could run out soon
                    </div>
                );
            }
            return (
                <div className="text-sm font-medium">
                    <span className="text-emerald-600 font-bold block">In Stock</span>
                    Ready to ship
                </div>
            );
        }

        if (product.type_code === 'PREORDER') {
            const slots = product.product_variants?.[0]?.stock_available || 0;
            if (slots <= 0) return null;

            return (
                <div className="text-sm font-medium">
                    <span className="text-blue-600 font-bold block">Open for Pre-order</span>
                    {slots} slots remaining
                </div>
            );
        }

        // Blindbox - "không cần các logic này"
        return null;
    };

    // Determine Max Stock
    const maxStock = product.type_code === 'RETAIL'
        ? (selectedVariant?.stock_available || 0)
        : (product.type_code === 'PREORDER' ? (product.product_variants?.[0]?.stock_available || 0) : 999);

    // Handlers
    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => {
            const newValue = prev + delta;
            if (newValue > maxStock) return maxStock;
            if (newValue < 1) return 1;
            return newValue;
        });
    };

    const handleAddToCart = async () => {
        if (!product) return;

        // Define types for payload components to avoid TS errors
        let price = 0;
        let variantId: number | null | undefined = null;
        let sku: string | null | undefined = null;
        let finalId = product.product_id.toString();

        let nameSuffix = '';

        if (product.type_code === 'RETAIL') {
            if (!selectedVariant) {
                toast({
                    variant: "destructive",
                    title: "Selection Required",
                    description: "Please select a model/variant before adding to cart.",
                });
                return;
            }
            price = Number(selectedVariant.price);
            variantId = selectedVariant.variant_id;
            sku = selectedVariant.sku;
            finalId += variantId ? `-${variantId}` : '';
        } else if (product.type_code === 'PREORDER') {
            // Auto-select first variant for stock tracking
            if (product.product_variants?.length > 0) {
                variantId = product.product_variants[0].variant_id;
            }

            if (paymentMode === 'DEPOSIT') {
                price = Number(product.product_preorders?.deposit_amount || 0);
                finalId += '-DEP';
                nameSuffix = ' (Deposit Only)';
            } else {
                price = Number(product.product_preorders?.full_price || 0);
                finalId += '-FULL';
                nameSuffix = ' (Full Payment)';
            }
        } else if (product.type_code === 'BLINDBOX') {
            price = Number(product.product_blindboxes?.price || 0);
        }

        const payload = {
            id: finalId,
            productId: product.product_id.toString(),
            name: product.name + (sku ? ` (${sku})` : '') + nameSuffix,
            price: price,
            quantity: quantity,
            image: product.media_urls?.[0] || '',
            variantId: variantId
        };

        console.log("Adding to cart:", payload);
        try {
            await useCartStore.getState().addToCart(payload);
            toast({
                title: "Added to cart",
                description: `${quantity} x ${product.name} has been added to your cart.`,
                className: "bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-2xl",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to add",
                description: error.response?.data?.message || "Out of stock or server error"
            });
        }
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/customer/cart');
    };

    return (
        <CustomerLayout activePage="products">
            <div className="min-h-screen bg-[#F2F2F7] pb-20 font-sans relative overflow-hidden">
                {/* Ambient Background */}
                {/* Ambient Background */}
                {/* Ambient Background - Optimized for Low End */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                    <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] ambient-glow-blue rounded-full animate-breathe gpu-accelerated blob-optimized" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] ambient-glow-purple rounded-full animate-breathe gpu-accelerated blob-optimized" />
                </div>
                {/* Noise overlay removed for performance */}

                <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">

                    {/* Breadcrumbs (Glass Pill) */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 overflow-x-auto no-scrollbar">
                        <Link to="/customer/home" className="hover:text-slate-900 transition-colors whitespace-nowrap">Home</Link>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <Link to={
                            product.type_code === 'BLINDBOX' ? '/customer/blindbox' :
                                product.type_code === 'PREORDER' ? '/customer/preorder' :
                                    '/customer/retail'
                        } className="hover:text-slate-900 transition-colors whitespace-nowrap">
                            {product.type_code === 'BLINDBOX' ? 'Blind Box' :
                                product.type_code === 'PREORDER' ? 'Pre-Order' :
                                    'Retail Shop'}
                        </Link>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <span className="text-slate-900 font-medium truncate bg-white/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/40 shadow-sm">
                            {product.name}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">


                        {/* LEFT: Media Gallery (Glass Box) */}
                        <div className="space-y-6 lg:sticky lg:top-24">
                            <div className="aspect-square relative overflow-hidden rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_24px_64px_rgba(0,0,0,0.06)] group gpu-layer">
                                {(() => {
                                    // 1. Determine local active media list
                                    let activeMedia: { url: string, type: 'IMAGE' | 'VIDEO' }[] = [];

                                    // A. Product Level (Strings) -> Convert to Objects
                                    const productUrls = Array.isArray(product.media_urls) ? product.media_urls : [];
                                    productUrls.forEach((url: string) => {
                                        if (typeof url === 'string') {
                                            const isVideo = url.match(/\.(mp4|webm)$/i) || url.match(/(youtube\.com|youtu\.be)/i);
                                            activeMedia.push({ url, type: isVideo ? 'VIDEO' : 'IMAGE' });
                                        }
                                    });

                                    // B. Variant Level (Objects or Strings)
                                    if (selectedVariant && selectedVariant.media_assets) {
                                        let variantData: any[] = [];
                                        try {
                                            variantData = typeof selectedVariant.media_assets === 'string'
                                                ? JSON.parse(selectedVariant.media_assets)
                                                : selectedVariant.media_assets;
                                        } catch (e) {
                                            variantData = [];
                                        }

                                        if (Array.isArray(variantData)) {
                                            variantData.forEach((item: any) => {
                                                if (typeof item === 'string') {
                                                    // Legacy string format
                                                    const isVideo = item.match(/\.(mp4|webm)$/i) || item.match(/(youtube\.com|youtu\.be)/i);
                                                    activeMedia.push({ url: item, type: isVideo ? 'VIDEO' : 'IMAGE' });
                                                } else if (item && typeof item === 'object' && item.url) {
                                                    // New object format
                                                    activeMedia.push({
                                                        url: item.url,
                                                        type: item.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'
                                                    });
                                                }
                                            });
                                        }
                                    }

                                    // Deduplicate by URL
                                    const uniqueMedia = Array.from(new Map(activeMedia.map(m => [m.url, m])).values());
                                    const currentMedia = uniqueMedia[selectedImage] || uniqueMedia[0];
                                    const currentUrl = currentMedia?.url;
                                    const currentType = currentMedia?.type;

                                    // Helper to render content
                                    const renderContent = (url: string, type: string) => {
                                        if (!url) return (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Package className="w-20 h-20 opacity-50" />
                                            </div>
                                        );

                                        // Fallback detection if type isn't explicit
                                        const isVideo = type === 'VIDEO' || url.match(/\.(mp4|webm)$/i);
                                        const isYoutube = url.match(/(youtube\.com|youtu\.be)/i);

                                        if (isVideo && !isYoutube) {
                                            return (
                                                <video
                                                    src={url}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                    autoPlay
                                                    muted
                                                    loop
                                                />
                                            );
                                        }
                                        if (isYoutube) {
                                            // Simple embed conversion (basic)
                                            let embedUrl = url;
                                            if (url.includes('watch?v=')) embedUrl = url.replace('watch?v=', 'embed/');
                                            else if (url.includes('youtu.be/')) embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');

                                            // Ensure clean URL
                                            if (embedUrl.includes('&')) embedUrl = embedUrl.split('&')[0];

                                            return (
                                                <iframe
                                                    src={embedUrl}
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    title="Product Video"
                                                />
                                            );
                                        }

                                        return (
                                            <img
                                                src={url}
                                                alt={product.name}
                                                className="w-full h-full object-cover p-8 transition-transform duration-700 ease-out group-hover:scale-105 filter drop-shadow-2xl"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        );
                                    };

                                    return (
                                        <>
                                            {renderContent(currentUrl, currentType || 'IMAGE')}

                                            {/* Status Badge */}
                                            <div className="absolute top-6 left-6 pointer-events-none">
                                                <Badge className={cn(
                                                    "backdrop-blur-md border-white/20 px-4 py-1.5 text-xs font-bold tracking-widest shadow-lg",
                                                    product.status_code === 'IN_STOCK' ? "bg-emerald-500/90 hover:bg-emerald-600 text-white" : "bg-slate-900/90 text-white"
                                                )}>
                                                    {product.status_code?.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Thumbnails (Floating Rail) - Updated to use same list */}
                            {(() => {
                                // 1. Determine local active media list
                                let activeMedia: { url: string, type: 'IMAGE' | 'VIDEO' }[] = [];

                                // A. Product Level (Strings) -> Convert to Objects
                                const productUrls = Array.isArray(product.media_urls) ? product.media_urls : [];
                                productUrls.forEach((url: string) => {
                                    if (typeof url === 'string') {
                                        const isVideo = url.match(/\.(mp4|webm)$/i) || url.match(/(youtube\.com|youtu\.be)/i);
                                        activeMedia.push({ url, type: isVideo ? 'VIDEO' : 'IMAGE' });
                                    }
                                });

                                // B. Variant Level (Objects or Strings)
                                if (selectedVariant && selectedVariant.media_assets) {
                                    let variantData: any[] = [];
                                    try {
                                        variantData = typeof selectedVariant.media_assets === 'string'
                                            ? JSON.parse(selectedVariant.media_assets)
                                            : selectedVariant.media_assets;
                                    } catch (e) {
                                        variantData = [];
                                    }

                                    if (Array.isArray(variantData)) {
                                        variantData.forEach((item: any) => {
                                            if (typeof item === 'string') {
                                                // Legacy string format
                                                const isVideo = item.match(/\.(mp4|webm)$/i) || item.match(/(youtube\.com|youtu\.be)/i);
                                                activeMedia.push({ url: item, type: isVideo ? 'VIDEO' : 'IMAGE' });
                                            } else if (item && typeof item === 'object' && item.url) {
                                                // New object format
                                                activeMedia.push({
                                                    url: item.url,
                                                    type: item.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'
                                                });
                                            }
                                        });
                                    }
                                }

                                // Deduplicate by URL
                                const uniqueMedia = Array.from(new Map(activeMedia.map(m => [m.url, m])).values());

                                if (uniqueMedia.length <= 1) return null;

                                return (
                                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2 justify-center">
                                        {uniqueMedia.map((media, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImage(idx)}
                                                className={cn(
                                                    "relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2",
                                                    selectedImage === idx
                                                        ? "ring-4 ring-slate-900/20 border-white scale-110 shadow-lg translate-y-[-4px]"
                                                        : "border-transparent opacity-60 hover:opacity-100 hover:scale-105 hover:bg-white/40"
                                                )}
                                            >
                                                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
                                                {media.type === 'VIDEO' ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500">
                                                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                                            <div className="w-0 h-0 border-l-[10px] border-l-slate-900 border-y-[6px] border-y-transparent ml-1" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img src={media.url} alt="" className="w-full h-full object-cover relative z-10" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>


                        {/* RIGHT: Product Info (Floating Panel) */}
                        <div className="space-y-10 py-4">

                            {/* Header */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black tracking-[0.2em] text-blue-600 uppercase">
                                        {product.brands?.name || 'FigiCore'}
                                    </h3>
                                    {/* Share/Like Actions could go here */}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                    {product.name}
                                </h1>
                                {/* Price Tag */}
                                <div className="flex items-baseline gap-4 pt-2">
                                    <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                        {displayPrice}
                                    </span>
                                    {product.type_code === 'PREORDER' && (
                                        <span className="text-slate-500 font-medium text-lg">
                                            {paymentMode === 'DEPOSIT' ? '(Deposit)' : '(Full Price)'}
                                        </span>
                                    )}
                                </div>
                                <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed font-normal transition-all duration-300">
                                    {(selectedVariant?.description || product.description || "Experience the finest quality collectibles with FigiCore.")
                                        .split('\n')
                                        .map((line, i) => (
                                            <p key={i} className="mb-2">{line}</p>
                                        ))}
                                </div>
                            </div>

                            <Separator className="bg-slate-200" />

                            {/* Selectors - Glass Effect Restored */}
                            <div className="space-y-8 backdrop-blur-2xl bg-white/50 border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)]">

                                {/* PRE-ORDER PAYMENT SELECTOR */}
                                {product.type_code === 'PREORDER' && selectedVariant && (
                                    <div className="space-y-4">
                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                                            Payment Option
                                        </span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentMode('DEPOSIT')}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex flex-col items-center gap-1",
                                                    paymentMode === 'DEPOSIT'
                                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg ring-1 ring-slate-900 ring-offset-2"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                                                )}
                                            >
                                                <span className="font-bold">Deposit</span>
                                                <span className="opacity-90">{formatPrice(Number(selectedVariant.deposit_amount || 0))}</span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentMode('FULL')}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex flex-col items-center gap-1",
                                                    paymentMode === 'FULL'
                                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg ring-1 ring-slate-900 ring-offset-2"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                                                )}
                                            >
                                                <span className="font-bold">Full Payment</span>
                                                <span className="opacity-90">{formatPrice(Number(selectedVariant.price || 0))}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Variants: Retail & Preorder */}
                                {(product.type_code === 'RETAIL' || product.type_code === 'PREORDER') && product.product_variants && product.product_variants.length > 0 && (
                                    <div className="space-y-4">
                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                                            {product.type_code === 'PREORDER' ? 'Version / Scale' : 'Model'}
                                        </span>
                                        <div className="flex flex-wrap gap-3">
                                            {product.product_variants.map((variant: any) => (
                                                <button
                                                    key={variant.variant_id}
                                                    onClick={() => {
                                                        setSelectedVariant(variant);
                                                        setQuantity(1);
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border",
                                                        selectedVariant?.variant_id === variant.variant_id
                                                            ? "bg-slate-900 text-white border-slate-900 shadow-lg ring-1 ring-slate-900 ring-offset-2"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                                                    )}
                                                >
                                                    {product.type_code === 'PREORDER' ? variant.option_name : variant.sku}
                                                    {variant.stock_available < 5 && variant.stock_available > 0 && (
                                                        <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">Low Stock</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity & Actions */}
                                <div className="space-y-6 pt-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                        {/* Quantity Stepper */}
                                        <div className="inline-flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-sm w-fit">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleQuantityChange(-1)}
                                                disabled={quantity <= 1}
                                                className="h-9 w-9 rounded-md hover:bg-slate-100 text-slate-600"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </Button>
                                            <span className="w-10 text-center font-semibold text-slate-900 text-base tabular-nums">{quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleQuantityChange(1)}
                                                disabled={quantity >= maxStock}
                                                className="h-9 w-9 rounded-md hover:bg-slate-100 text-slate-600"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>

                                        {renderStockStatus()}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Button
                                            size="lg"
                                            disabled={
                                                (product.type_code === 'RETAIL' && (!selectedVariant || selectedVariant.stock_available <= 0)) ||
                                                (product.type_code === 'PREORDER' && (!selectedVariant || (selectedVariant.stock_available || 0) <= 0)) ||
                                                (product.type_code !== 'RETAIL' && product.type_code !== 'PREORDER' && product.status_code !== 'ACTIVE')
                                            }
                                            className="h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base tracking-wide shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0"
                                            onClick={handleAddToCart}
                                        >
                                            {((product.type_code === 'RETAIL' || product.type_code === 'PREORDER') && selectedVariant && (selectedVariant.stock_available || 0) <= 0) ? (
                                                'Out of Stock'
                                            ) : (
                                                <>
                                                    Add to Cart
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            disabled={
                                                (product.type_code === 'RETAIL' && (!selectedVariant || selectedVariant.stock_available <= 0)) ||
                                                (product.type_code === 'PREORDER' && (!selectedVariant || (selectedVariant.stock_available || 0) <= 0)) ||
                                                (product.type_code !== 'RETAIL' && product.type_code !== 'PREORDER' && product.status_code !== 'ACTIVE')
                                            }
                                            className="h-14 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-bold text-base tracking-wide transition-all hover:border-slate-300 disabled:opacity-50"
                                            onClick={handleBuyNow}
                                        >
                                            Buy Now
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Signals - Minimalist */}
                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                                {[
                                    { icon: ShieldCheck, label: "100% Authentic" },
                                    { icon: Truck, label: "Fast Shipping" },
                                    { icon: RefreshCcw, label: "Easy Returns" }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center gap-2 text-center group cursor-default">
                                        <div className="p-2.5 rounded-full bg-slate-50 text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors duration-300">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Related Products Section */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-32 relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">You Might Also Like</h2>
                                <Link to={
                                    product.type_code === 'BLINDBOX' ? '/customer/blindbox' :
                                        product.type_code === 'PREORDER' ? '/customer/preorder' :
                                            '/customer/retail'
                                } className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                                    View Collection <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((item) => (
                                    <div
                                        key={item.product_id}
                                        className="group relative flex flex-col gap-4 cursor-pointer"
                                        onClick={() => navigate(`/customer/product/${item.product_id}`)}
                                    >
                                        {/* Glass Card Image */}
                                        <div className="aspect-[4/5] relative overflow-hidden rounded-[2rem] bg-white/40 backdrop-blur-md shadow-sm border border-white/30 transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] group-hover:-translate-y-2 group-hover:bg-white/60">
                                            {item.media_urls?.[0] ? (
                                                <img
                                                    src={item.media_urls[0]}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Package className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-2">
                                            <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                            <p className="text-slate-500 text-sm mt-1">{item.brands?.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
