import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsService } from '@/services/products.service';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function GuestProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<any>(null);
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

    return (
        <GuestLayout activePage="products">
            <div className="bg-white min-h-screen pb-20">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* LEFT: GALLERY */}
                        <div className="space-y-6">
                            <div className="aspect-square bg-neutral-100 rounded-3xl overflow-hidden relative group">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={currentMedia.url}
                                        src={currentMedia.url}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="w-full h-full object-cover"
                                    />
                                </AnimatePresence>
                                {activeMedia.length > 1 && (
                                    <>
                                        <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedImage(prev => (prev - 1 + activeMedia.length) % activeMedia.length)}><ChevronLeft className="w-5 h-5" /></Button>
                                        <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedImage(prev => (prev + 1) % activeMedia.length)}><ChevronRight className="w-5 h-5" /></Button>
                                    </>
                                )}
                            </div>
                            <div className="grid grid-cols-5 gap-4">
                                {activeMedia.map((m: any, i: number) => (
                                    <div key={i} onClick={() => setSelectedImage(i)} className={cn("aspect-square rounded-xl overflow-hidden border-2 cursor-pointer", selectedImage === i ? "border-black" : "border-transparent")}>
                                        <img src={m.url} className="w-full h-full object-cover" />
                                    </div>
                                ))}
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
                                    <div className="text-3xl font-bold text-neutral-900">{formatPrice(product.product_blindboxes?.[0]?.price || 0)}</div>
                                ) : product.type_code === 'PREORDER' ? (
                                    <div>
                                        <div className="text-3xl font-bold text-orange-600">{formatPrice(product.product_preorders?.[0]?.deposit_amount || 0)} <span className="text-sm font-medium text-neutral-500">Deposit</span></div>
                                        <div className="text-sm text-neutral-400">Full Price: {formatPrice(product.product_preorders?.[0]?.full_price)}</div>
                                    </div>
                                ) : (
                                    <div className="text-3xl font-bold text-neutral-900">{selectedVariant ? formatPrice(selectedVariant.price) : 'Select Option'}</div>
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

                            <div className="border-t pt-8">
                                <h3 className="font-bold mb-4">Description</h3>
                                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
