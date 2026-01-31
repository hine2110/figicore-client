import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Lock, Play, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsService } from '@/services/products.service';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function GuestProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<any>(null);
    const [similarProducts, setSimilarProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await productsService.getOne(Number(id));
                setProduct(data);

                // Fetch similar products
                const similar = await productsService.getSimilar(Number(id));
                setSimilarProducts(similar);

                if (data.type_code === 'RETAIL' && data.product_variants?.length > 0) {
                    setSelectedVariant(data.product_variants[0]);
                }
            } catch (error) {
                console.error("Failed to fetch product", error);
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
        window.scrollTo(0, 0);
    }, [id]);

    // Normalize Media Logic (Same as Customer)
    const activeMedia = useMemo(() => {
        if (!product) return [];
        const commonImages = Array.isArray(product.media_urls) ? product.media_urls.map((url: string) => ({ type: 'IMAGE', url })) : [];
        let variantAssets = [];
        if (selectedVariant?.media_assets) {
            const raw = typeof selectedVariant.media_assets === 'string' ? JSON.parse(selectedVariant.media_assets) : selectedVariant.media_assets;
            variantAssets = Array.isArray(raw) ? raw : [];
        }
        return [...variantAssets, ...commonImages].map(m => m.url ? m : { type: 'IMAGE', url: m });
    }, [product, selectedVariant]);

    useEffect(() => setSelectedImage(0), [selectedVariant]);

    const handleLoginRedirect = () => {
        navigate(`/guest/login?redirect=/product/${id}`);
    };

    const formatPrice = (p: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p));

    if (loading || !product) {
        return (
            <GuestLayout>
                <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </GuestLayout>
        );
    }

    const currentMedia = activeMedia[selectedImage] || { url: '', type: 'IMAGE' };

    // Helper function to convert YouTube URL to embed format
    const getYouTubeEmbedUrl = (url: string): string => {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) return url;

        let videoId = '';

        // Handle youtube.com/watch?v=VIDEO_ID
        if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
        }
        // Handle youtu.be/VIDEO_ID
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
        }
        // Handle youtube.com/embed/VIDEO_ID
        else if (url.includes('/embed/')) {
            return url; // Already in embed format
        }

        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    };

    return (
        <GuestLayout activePage="products">
            <div className="bg-white min-h-screen pb-20">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* LEFT: GALLERY */}
                        <div className="space-y-6">
                            <div className="aspect-square bg-neutral-100 rounded-3xl overflow-hidden relative group">
                                <AnimatePresence mode="wait">
                                    {currentMedia.type === 'VIDEO' ? (
                                        <motion.iframe
                                            key={currentMedia.url}
                                            src={getYouTubeEmbedUrl(currentMedia.url)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <motion.img
                                            key={currentMedia.url}
                                            src={currentMedia.url}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </AnimatePresence>
                                {activeMedia.length > 1 && (
                                    <>
                                        <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedImage(prev => (prev - 1 + activeMedia.length) % activeMedia.length)}><ChevronLeft className="w-5 h-5" /></Button>
                                        <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedImage(prev => (prev + 1) % activeMedia.length)}><ChevronRight className="w-5 h-5" /></Button>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-5 gap-4">
                                {activeMedia.map((m: any, i: number) => {
                                    // Get YouTube thumbnail if it's a video
                                    const getYouTubeThumbnail = (url: string) => {
                                        if (!url.includes('youtube.com') && !url.includes('youtu.be')) return url;
                                        const videoId = url.includes('watch?v=')
                                            ? url.split('watch?v=')[1]?.split('&')[0]
                                            : url.split('youtu.be/')[1]?.split('?')[0];
                                        return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : url;
                                    };

                                    const thumbnailUrl = m.type === 'VIDEO' ? getYouTubeThumbnail(m.url) : m.url;

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedImage(i)}
                                            className={cn(
                                                "aspect-square rounded-xl overflow-hidden border-2 cursor-pointer relative group",
                                                selectedImage === i ? "border-black" : "border-transparent"
                                            )}
                                        >
                                            <img src={thumbnailUrl} className="w-full h-full object-cover" />
                                            {m.type === 'VIDEO' && (
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                                    <Play className="w-8 h-8 text-white fill-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT: INFO */}
                        <div className="flex flex-col sticky top-24 h-fit">
                            <Badge variant="outline" className="w-fit mb-4">{product.type_code}</Badge>
                            <h1 className="text-4xl font-bold text-neutral-900 mb-2">{product.name}</h1>
                            <p className="text-lg text-neutral-500 mb-8">{product.brands?.name || "FigiCore Collection"}</p>

                            {/* PRICE DISPLAY */}
                            <div className="mb-8">
                                {product.type_code === 'BLINDBOX' ? (

                                    <div className="text-3xl font-bold text-neutral-900">{formatPrice(product.product_blindboxes?.price || 0)}</div>
                                ) : product.type_code === 'PREORDER' ? (
                                    <div>
                                        <div className="text-3xl font-bold text-orange-600">{formatPrice(Number(product.product_preorders?.deposit_amount) || 0)} <span className="text-sm font-medium text-neutral-500">Deposit</span></div>
                                        <div className="text-sm text-neutral-400">Full Price: {formatPrice(Number(product.product_preorders?.full_price) || 0)}</div>
                                    </div>
                                ) : (
                                    <div className="text-3xl font-bold text-neutral-900">{selectedVariant ? formatPrice(selectedVariant.price) : 'Select Option'}</div>
                                )}
                            </div>

                            {/* META INFO SECTION */}
                            <div className="border-y border-neutral-200 py-6 mb-8 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-500 uppercase tracking-wider">Brand</span>
                                    <span className="text-sm font-medium text-neutral-900">{product.brands?.name || 'FigiCore'}</span>
                                </div>

                                {product.series && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-500 uppercase tracking-wider">Series</span>
                                        <span className="text-sm font-medium text-neutral-900">{product.series.name}</span>
                                    </div>
                                )}

                                {product.categories && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-500 uppercase tracking-wider">Category</span>
                                        <span className="text-sm font-medium text-neutral-900">{product.categories.name}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-500 uppercase tracking-wider">Type</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {product.type_code === 'RETAIL' ? 'Retail Product' :
                                            product.type_code === 'BLINDBOX' ? 'Blind Box' : 'Pre-Order'}
                                    </Badge>
                                </div>

                                {product.type_code === 'RETAIL' && selectedVariant && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-500 uppercase tracking-wider">Stock</span>
                                        <span className={`text-sm font-medium ${selectedVariant.stock_available === 0 ? 'text-red-600' :
                                            selectedVariant.stock_available < 5 ? 'text-orange-600' :
                                                'text-green-600'
                                            }`}>
                                            {selectedVariant.stock_available === 0 ? 'Out of Stock' :
                                                selectedVariant.stock_available < 5 ? 'Low Stock' :
                                                    'In Stock'}
                                        </span>
                                    </div>
                                )}

                                {product.type_code === 'PREORDER' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-500 uppercase tracking-wider">Status</span>
                                        <Badge className="bg-orange-600 text-white text-xs">Pre-Order Available</Badge>
                                    </div>
                                )}
                            </div>

                            {/* VARIANTS (RETAIL ONLY) */}
                            {product.type_code === 'RETAIL' && product.product_variants && (
                                <div className="mb-8">
                                    <p className="text-sm font-bold mb-3 uppercase">Select Version</p>
                                    <div className="flex flex-wrap gap-3">
                                        {product.product_variants.map((v: any) => (
                                            <button
                                                key={v.variant_id}
                                                onClick={() => setSelectedVariant(v)}
                                                className={cn("px-4 py-3 rounded-lg border text-sm font-medium transition-all", selectedVariant?.variant_id === v.variant_id ? "border-black bg-black text-white" : "border-neutral-200 hover:border-neutral-400")}
                                            >
                                                {v.option_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* GUEST ACTIONS */}
                            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 mb-8 text-center">
                                <p className="font-medium text-neutral-900 mb-4">Log in to purchase this exclusive item.</p>
                                <Button size="lg" className="w-full bg-neutral-900 text-white hover:bg-black h-14 text-lg" onClick={handleLoginRedirect}>
                                    <Lock className="w-4 h-4 mr-2" /> Login to Buy
                                </Button>
                                <p className="text-xs text-neutral-400 mt-3">Members get free shipping and loyalty points.</p>
                            </div>
                        </div>
                    </div>

                    {/* SIMILAR PRODUCTS */}
                    {similarProducts.length > 0 && (
                        <div className="mt-24 border-t border-neutral-200 pt-16">
                            <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-10 text-center">You May Also Like</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {similarProducts.map((p) => (
                                    <div
                                        key={p.product_id}
                                        className="group cursor-pointer flex flex-col gap-4"
                                        onClick={() => navigate(`/guest/product/${p.product_id}`)}
                                    >
                                        <div className="aspect-square relative bg-neutral-100 overflow-hidden rounded-xl">
                                            {p.media_urls?.[0] ? (
                                                <img
                                                    src={p.media_urls[0]}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package className="w-8 h-8" /></div>
                                            )}

                                            {p.type_code !== 'RETAIL' && (
                                                <Badge className="absolute top-3 left-3 bg-white/90 text-black border-0 text-[10px] uppercase tracking-wider rounded-none px-2 py-1">
                                                    {p.type_code === 'BLINDBOX' ? 'Blind Box' : 'Pre-Order'}
                                                </Badge>
                                            )}

                                            {/* Out of Stock Overlay */}
                                            {(() => {
                                                const isOutOfStock = p.type_code === 'RETAIL' &&
                                                    (!p.product_variants || p.product_variants.length === 0 ||
                                                        p.product_variants.reduce((sum: number, v: any) => sum + v.stock_available, 0) === 0);

                                                return isOutOfStock && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                                        <span className="text-yellow-400 font-black uppercase tracking-widest text-xs border-2 border-yellow-400 px-3 py-1.5 transform -rotate-12">HẾT HÀNG</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                                                {p.brands?.name || "FigiCore"}
                                            </div>
                                            <h3 className="font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-1">
                                                {p.name}
                                            </h3>
                                            <div className="text-sm font-semibold text-neutral-900">
                                                {formatPrice(p.type_code === 'RETAIL' ? (p.product_variants?.[0]?.price || 0) :
                                                    p.type_code === 'BLINDBOX' ? (p.product_blindboxes?.price || 0) :
                                                        (p.product_preorders?.deposit_amount || 0))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
