import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ShoppingCart,
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
                    const res = await productsService.getProducts({ series_id: product.series_id, limit: 5 });
                    const list = Array.isArray(res) ? res : (res as any).data || [];
                    related = list.filter((p: any) => p.product_id !== product.product_id);
                }

                // 2. If not enough, try Brand
                if (related.length < 4 && product.brand_id) {
                    const res = await productsService.getProducts({ brand_id: product.brand_id, limit: 5 });
                    const list = Array.isArray(res) ? res : (res as any).data || [];
                    const brandRelated = list.filter((p: any) => p.product_id !== product.product_id);
                    related = [...related, ...brandRelated];
                }

                // 3. Last resort, Category
                if (related.length < 4 && product.category_id) {
                    const res = await productsService.getProducts({ category_id: product.category_id, limit: 5 });
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
    let originalPrice = 0;

    if (product.type_code === 'RETAIL') {
        if (selectedVariant) {
            displayPrice = formatPrice(Number(selectedVariant.price));
            originalPrice = Number(selectedVariant.price) * 1.2; // Fake original price for visual
        } else if (product.product_variants?.[0]) {
            displayPrice = formatPrice(Number(product.product_variants[0].price));
        }
    } else if (product.type_code === 'PREORDER') {
        const dep = Number(product.product_preorders?.deposit_amount || 0);
        displayPrice = `Deposit: ${formatPrice(dep)}`;
    } else if (product.type_code === 'BLINDBOX') {
        const p = Number(product.product_blindboxes?.price || 0);
        displayPrice = formatPrice(p);
    }

    // Handlers
    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleAddToCart = () => {
        if (!product) return;

        // Define types for payload components to avoid TS errors
        let price = 0;
        let variantId: number | null | undefined = null;
        let sku: string | null | undefined = null;

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
        } else if (product.type_code === 'PREORDER') {
            price = Number(product.product_preorders?.deposit_amount || 0);
        } else if (product.type_code === 'BLINDBOX') {
            price = Number(product.product_blindboxes?.price || 0);
        }

        const payload = {
            id: product.product_id.toString() + (variantId ? `-${variantId}` : ''),
            productId: product.product_id.toString(),
            name: product.name + (sku ? ` (${sku})` : ''),
            price: price,
            quantity: quantity,
            image: product.media_urls?.[0] || '',
            variantId: variantId
        };

        console.log("Adding to cart:", payload);
        useCartStore.getState().addToCart(payload);

        toast({
            title: "Added to cart",
            description: `${quantity} x ${product.name} has been added to your cart.`,
            className: "bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-2xl",
        });
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
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-blue-400/20 blur-[120px] rounded-full mix-blend-multiply opacity-60 gpu-accelerated" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/20 blur-[120px] rounded-full mix-blend-multiply opacity-60 gpu-accelerated" />
                </div>
                <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url(/noise.png)' }} />

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
                            <div className="aspect-square relative overflow-hidden rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_24px_64px_rgba(0,0,0,0.06)] group">
                                {product.media_urls?.[selectedImage] ? (
                                    <img
                                        src={product.media_urls[selectedImage]}
                                        alt={product.name}
                                        className="w-full h-full object-cover p-8 transition-transform duration-700 ease-out group-hover:scale-105 filter drop-shadow-2xl"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Package className="w-20 h-20 opacity-50" />
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="absolute top-6 left-6">
                                    <Badge className={cn(
                                        "backdrop-blur-md border-white/20 px-4 py-1.5 text-xs font-bold tracking-widest shadow-lg",
                                        product.status_code === 'IN_STOCK' ? "bg-emerald-500/90 hover:bg-emerald-600 text-white" : "bg-slate-900/90 text-white"
                                    )}>
                                        {product.status_code?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>

                            {/* Thumbnails (Floating Rail) */}
                            {product.media_urls && product.media_urls.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2 justify-center">
                                    {product.media_urls.map((url: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={cn(
                                                "relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2",
                                                selectedImage === idx
                                                    ? "ring-4 ring-blue-500/20 border-white scale-110 shadow-lg translate-y-[-4px]"
                                                    : "border-transparent opacity-60 hover:opacity-100 hover:scale-105 hover:bg-white/40"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
                                            <img src={url} alt="" className="w-full h-full object-cover relative z-10" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Product Info (Floating Panel) */}
                        <div className="space-y-10 py-4">

                            {/* Header */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg inline-block">
                                        {product.brands?.name || 'FigiCore'}
                                    </h3>
                                    {/* Share/Like Actions could go here */}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                                    {product.name}
                                </h1>
                                {/* Price Tag */}
                                <div className="flex items-baseline gap-4 pt-2">
                                    <span className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                        {displayPrice}
                                    </span>
                                    {originalPrice > 0 && product.type_code === 'RETAIL' && (
                                        <span className="text-lg text-slate-400 line-through decoration-slate-300">
                                            {formatPrice(originalPrice)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-lg text-slate-600 leading-relaxed font-light border-l-4 border-blue-500/30 pl-4 py-1">
                                    {product.description || "Experience the finest quality collectibles with FigiCore."}
                                </p>
                            </div>

                            <Separator className="bg-slate-200/50" />

                            {/* Selectors (Glass Container) */}
                            <div className="space-y-8 backdrop-blur-xl bg-white/40 border border-white/50 p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.02)]">

                                {/* Variants: Retail */}
                                {product.type_code === 'RETAIL' && product.product_variants && product.product_variants.length > 0 && (
                                    <div className="space-y-4">
                                        <span className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-1 h-4 bg-slate-900 rounded-full" />
                                            Select Model
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
                                                        "px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 border",
                                                        selectedVariant?.variant_id === variant.variant_id
                                                            ? "bg-slate-900 text-white shadow-xl scale-105 border-slate-900"
                                                            : "bg-white/50 text-slate-600 border-white hover:bg-white hover:shadow-md"
                                                    )}
                                                >
                                                    {variant.sku}
                                                    {variant.stock_quantity < 5 && (
                                                        <span className="ml-2 text-[10px] bg-red-500/20 text-red-200 px-1.5 py-0.5 rounded-md">Low Stock</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity & Actions */}
                                <div className="space-y-6 pt-2">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md rounded-2xl p-1.5 border border-white/50 shadow-sm">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleQuantityChange(-1)}
                                                disabled={quantity <= 1}
                                                className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                            <span className="w-8 text-center font-bold text-lg text-slate-900">{quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleQuantityChange(1)}
                                                className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="text-sm text-slate-500 font-medium">
                                            <span className="text-emerald-600 font-bold block">In Stock</span>
                                            Ready to ship
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Button
                                            size="lg"
                                            className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-[0_10px_30px_rgba(15,23,42,0.2)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.3)] hover:scale-[1.02] transition-all duration-300"
                                            onClick={handleAddToCart}
                                        >
                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                            Add to Cart
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="h-14 rounded-2xl border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900 font-bold text-lg transition-all"
                                            onClick={handleBuyNow}
                                        >
                                            Buy Now
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Signals */}
                            <div className="grid grid-cols-3 gap-4 pt-4">
                                {[
                                    { icon: ShieldCheck, label: "Authentic Guarantee" },
                                    { icon: Truck, label: "Express Shipping" },
                                    { icon: RefreshCcw, label: "7-Day Returns" }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white/30 backdrop-blur-sm border border-white/30 text-center gap-2 hover:bg-white/50 transition-colors">
                                        <item.icon className="w-6 h-6 text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-600">{item.label}</span>
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
                                <Link to="/customer/shop" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
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
