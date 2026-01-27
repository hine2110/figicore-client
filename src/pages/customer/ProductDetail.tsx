import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Truck, RotateCcw, ShoppingCart, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsService } from '@/services/products.service';
import { Product, ProductVariant } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
// import { useCartStore } from '@/store/useCartStore';

// import { useCartStore } from '@/store/useCartStore';

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // 1. Initial Fetch
    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await productsService.getOne(Number(id));
                setProduct(data);

                // Default Variant Selection
                if (data.type_code === 'RETAIL' && data.product_variants?.length > 0) {
                    setSelectedVariant(data.product_variants[0]);
                } else if (data.product_variants?.length > 0) {
                    setSelectedVariant(data.product_variants[0]);
                }
            } catch (error) {
                console.error("Failed to fetch product", error);
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [id]);

    // 2. Scroll Fix
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // 3. Gallery Logic (Reactive)
    const activeMedia = useMemo(() => {
        if (!product) return [];

        // Common Images
        const commonImages: any[] = Array.isArray(product.media_urls)
            ? product.media_urls.map((url: string) => ({ type: 'IMAGE', url, source: 'CLOUDINARY' }))
            : [];

        // Variant Images
        let variantAssets: any[] = [];
        if (selectedVariant?.media_assets) {
            const raw = typeof selectedVariant.media_assets === 'string'
                ? JSON.parse(selectedVariant.media_assets)
                : selectedVariant.media_assets;

            const parsed = Array.isArray(raw) ? raw : [];
            variantAssets = parsed.map(a => typeof a === 'string' ? { type: 'IMAGE', url: a, source: 'CLOUDINARY' } : a);
        }

        const combined = [...variantAssets, ...commonImages];
        return combined.length > 0 ? combined : [{ type: 'IMAGE', url: "https://via.placeholder.com/800x800?text=No+Image", source: 'CLOUDINARY' }];
    }, [product, selectedVariant]);

    // Reset gallery index when variant changes
    useEffect(() => {
        setSelectedImage(0);
    }, [selectedVariant]);

    // --- HELPER FUNCTIONS ---
    const formatPrice = (amount: number | string) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
    };

    const handleNext = () => {
        setSelectedImage((prev) => (prev + 1) % activeMedia.length);
    };

    const handlePrev = () => {
        setSelectedImage((prev) => (prev - 1 + activeMedia.length) % activeMedia.length);
    };

    const handleAddToCart = () => {
        if (!product) return;
        const payload: any = {
            product_id: product.product_id,
            quantity
        };

        if (product.type_code === 'RETAIL') {
            if (!selectedVariant) return alert("Please select an option");
            payload.variant_id = selectedVariant.variant_id;
        } else {
            if (product.product_variants?.[0]) {
                payload.variant_id = product.product_variants[0].variant_id;
            }
        }
        console.log("Adding to cart:", payload);
        // useCartStore.getState().addToCart(payload);
    };

    const handleBuyNow = () => {
        if (!product) return;
        const payload: any = {
            product_id: product.product_id,
            quantity
        };

        if (product.type_code === 'RETAIL') {
            if (!selectedVariant) return alert("Please select an option");
            payload.variant_id = selectedVariant.variant_id;
        } else {
            if (product.product_variants?.[0]) {
                payload.variant_id = product.product_variants[0].variant_id;
            }
        }
        console.log("Buying now...", payload);
        // Validation passed, add to cart + navigate
        // useCartStore.getState().addToCart(payload);
        // navigate('/customer/checkout'); 
    };

    // --- LOADING STATE ---
    if (loading || !product) {
        return (
            <CustomerLayout activePage="products">
                <div className="bg-white min-h-screen container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <Skeleton className="w-full aspect-square rounded-lg" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    </div>
                </div>
            </CustomerLayout>
        );
    }

    // --- DATA PREP ---
    const currentMedia = activeMedia[selectedImage] || activeMedia[0];
    const specs = product.specifications || {};
    const hasSpecs = specs && Object.keys(specs).length > 0;
    const features = Array.isArray(specs.features) ? specs.features : [];

    // --- RENDER CONTENT ---
    return (
        <CustomerLayout activePage="products">
            <div className="bg-white min-h-screen pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="container mx-auto px-4 py-8 max-w-6xl"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* LEFT: GALLERY */}
                        <div className="space-y-6">
                            <div className="aspect-square w-full bg-neutral-100 rounded-3xl overflow-hidden relative group flex items-center justify-center shadow-sm">
                                <AnimatePresence mode="wait">
                                    {currentMedia?.type === 'VIDEO' ? (
                                        <motion.div
                                            key={currentMedia.url}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-full h-full"
                                        >
                                            {currentMedia.source === 'YOUTUBE' ? (
                                                <iframe
                                                    src={currentMedia.url.replace("watch?v=", "embed/")}
                                                    className="w-full h-full"
                                                    allow="autoplay; encrypted-media"
                                                    allowFullScreen
                                                    title="Product Video"
                                                />
                                            ) : (
                                                <video src={currentMedia.url} controls className="w-full h-full object-cover" />
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.img
                                            key={currentMedia?.url}
                                            src={currentMedia?.url}
                                            alt={product.name}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4 }}
                                            whileHover={{ scale: 1.05 }}
                                            className="w-full h-full object-cover cursor-zoom-in"
                                        />
                                    )}
                                </AnimatePresence>

                                {activeMedia.length > 1 && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 z-20"
                                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 z-20"
                                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            <div className="grid grid-cols-5 gap-4">
                                {activeMedia.map((media: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={cn(
                                            "aspect-square bg-neutral-50 border-2 rounded-2xl overflow-hidden transition-all relative",
                                            selectedImage === index
                                                ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2 opacity-100"
                                                : "border-transparent hover:border-neutral-300 opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        {media.type === 'VIDEO' ? (
                                            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                                                <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-neutral-600 border-b-4 border-b-transparent ml-0.5"></div>
                                            </div>
                                        ) : (
                                            <img src={media.thumbnail || media.url} alt="thumb" className="w-full h-full object-cover" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: INFO */}
                        <div className="flex flex-col sticky top-24 h-fit pt-2">
                            <div className="flex items-center gap-3 mb-6">
                                <Badge variant="outline" className="border-neutral-200 text-neutral-500 font-medium px-3 py-1 text-xs uppercase tracking-widest">
                                    {product.categories?.name || product.type_code}
                                </Badge>
                                {product.type_code === 'RETAIL' && (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-xs font-bold uppercase tracking-wide">In Stock</Badge>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 tracking-tighter leading-tight">
                                {product.name}
                            </h1>

                            <p className="text-sm font-bold text-neutral-500 mb-10 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-neutral-300 inline-block" />
                                {product.brands?.name || product.series?.name || "Figicore Collection"}
                            </p>

                            {/* PRICING SECTION */}
                            <div className="mb-10">
                                {product.type_code === 'BLINDBOX' ? (
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Badge className="bg-purple-600 px-3 py-1 rounded-full text-xs tracking-wider font-semibold">BLIND BOX</Badge>
                                            <span className="text-sm font-medium text-purple-600 uppercase">Random Design</span>
                                        </div>
                                        <p className="text-4xl font-bold text-neutral-900">
                                            {formatPrice(product.product_blindboxes?.price || 0)}
                                        </p>
                                    </div>
                                ) : product.type_code === 'PREORDER' ? (
                                    <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Badge className="bg-orange-600 px-3 py-1 rounded-full text-xs tracking-wider font-semibold">PRE-ORDER</Badge>
                                            <span className="text-sm text-orange-700 flex items-center gap-1 font-medium">
                                                <Calendar className="w-4 h-4" /> Release: {product.product_preorders?.release_date ? new Date(product.product_preorders.release_date).toLocaleDateString() : 'TBA'}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-neutral-900">{formatPrice(product.product_preorders?.deposit_amount || 0)}</span>
                                            <span className="text-sm font-medium bg-white px-2 py-1 rounded border">Deposit</span>
                                        </div>
                                        <p className="text-sm text-neutral-500 mt-3">Full Price: <span className="font-semibold">{formatPrice(product.product_preorders?.full_price || 0)}</span></p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-4xl font-bold text-neutral-900 tracking-tighter">
                                            {selectedVariant ? formatPrice(selectedVariant.price) : 'Select Option'}
                                        </p>
                                        {selectedVariant && (
                                            <p className="text-xs text-neutral-400 mt-2 font-mono uppercase tracking-widest">SKU: {selectedVariant.sku}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* VARIANT SELECTOR */}
                            {product.type_code === 'RETAIL' && product.product_variants && (
                                <div className="mb-10">
                                    <p className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">Select Version</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {product.product_variants.map((variant) => (
                                            <div
                                                key={variant.variant_id}
                                                onClick={() => setSelectedVariant(variant)}
                                                className={cn(
                                                    "cursor-pointer p-4 border rounded-xl transition-all relative overflow-hidden",
                                                    selectedVariant?.variant_id === variant.variant_id
                                                        ? "border-neutral-900 bg-neutral-900 text-white shadow-lg"
                                                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                                )}
                                            >
                                                <span className="block text-sm font-bold mb-1">{variant.option_name}</span>
                                                <span className={cn("text-xs", selectedVariant?.variant_id === variant.variant_id ? "text-neutral-300" : "text-neutral-500")}>
                                                    {formatPrice(variant.price)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className="space-y-6 mt-6">
                                <div className="flex flex-col gap-4">
                                    {/* Row 1: Quantity & Add to Cart */}
                                    <div className="flex gap-4 h-12">
                                        <div className="w-32 flex items-center border border-neutral-200 rounded-lg overflow-hidden shrink-0">
                                            <Button variant="ghost" className="h-full px-3" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                                            <span className="flex-1 text-center font-medium">{quantity}</span>
                                            <Button variant="ghost" className="h-full px-3" onClick={() => setQuantity(quantity + 1)}>+</Button>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="flex-1 h-full font-semibold border-neutral-300 hover:bg-neutral-50"
                                            onClick={handleAddToCart}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            Add to Cart
                                        </Button>
                                    </div>

                                    {/* Row 2: Buy Now (Full Width) */}
                                    <Button
                                        size="lg"
                                        className={cn(
                                            "w-full h-12 text-lg font-bold shadow-md transition-transform active:scale-[0.98]",
                                            product.type_code === 'PREORDER' ? "bg-orange-600 hover:bg-orange-700" :
                                                product.type_code === 'BLINDBOX' ? "bg-purple-600 hover:bg-purple-700" :
                                                    "bg-neutral-900 hover:bg-neutral-800"
                                        )}
                                        onClick={handleBuyNow}
                                    >
                                        {product.type_code === 'PREORDER' ? "Pre-order Now" : "Buy Now"}
                                    </Button>
                                </div>
                                <div className="flex justify-between pt-6 border-t border-neutral-100 text-xs font-medium text-neutral-500">
                                    <div className="flex gap-2"><Shield className="w-4 h-4 text-neutral-900" /> Authentic Guarantee</div>
                                    <div className="flex gap-2"><Truck className="w-4 h-4 text-neutral-900" /> Express Shipping</div>
                                    <div className="flex gap-2"><RotateCcw className="w-4 h-4 text-neutral-900" /> 14-Day Returns</div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-neutral-100">
                                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-3">Description</h4>
                                <p className="text-neutral-600 leading-relaxed font-light">{product.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* SPECS SECTION */}
                    {hasSpecs && (
                        <div className="mt-32 bg-neutral-50 py-20 -mx-4 px-4">
                            <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-20">
                                {features.length > 0 && (
                                    <div>
                                        <h3 className="text-3xl font-bold text-neutral-900 mb-10">Product Features</h3>
                                        <ul className="space-y-6">
                                            {features.map((feature: string, index: number) => (
                                                <li key={index} className="flex items-start gap-5">
                                                    <div className="w-2 h-2 rounded-full bg-neutral-900 mt-2.5 shrink-0" />
                                                    <span className="text-neutral-700 text-lg">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-3xl font-bold text-neutral-900 mb-10">Specifications</h3>
                                    <div className="space-y-4">
                                        {Object.entries(specs).filter(([key]) => key !== 'features').map(([key, value]) => (
                                            <div key={key} className="flex justify-between py-4 border-b border-neutral-200">
                                                <span className="text-neutral-500 capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                                                <span className="text-neutral-900 font-bold">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </CustomerLayout>
    );
}
