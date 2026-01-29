import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productsService } from '@/services/products.service';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Star } from 'lucide-react';

// --- MOCK BANNERS (Refined Copy) ---
const BANNERS = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2670&fit=crop",
        title: "Empire of Models",
        subtitle: "The ultimate destination for authentic collectible figures.",
        action: "Explore Gallery",
        link: "/guest/browse"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1920&q=80&fit=crop",
        title: "Next Gen Mecha",
        subtitle: "Precision engineering meets artistic vision.",
        action: "View New Arrivals",
        link: "/guest/browse?category=RETAIL"
    }
];

export function GuestHome() {
    const navigate = useNavigate();
    const [latestProducts, setLatestProducts] = useState<any[]>([]);

    const [preorderProducts, setPreorderProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Carousel Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % BANNERS.length), 6000);
        return () => clearInterval(timer);
    }, []);

    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [retail, preorder] = await Promise.all([
                    productsService.getProducts({ limit: 8, type_code: 'RETAIL' }),
                    productsService.getProducts({ limit: 4, type_code: 'PREORDER' })
                ]);

                const getList = (res: any) => Array.isArray(res) ? res : (res as any)?.data || [];
                setLatestProducts(getList(retail).slice(0, 8));
                setPreorderProducts(getList(preorder).slice(0, 4));
            } catch (error) {
                console.error("Failed to load home data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ------------------------------------------
    // ROBUST PRICE HELPERS
    // ------------------------------------------
    const safeNumber = (val: any) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const getRetailPrice = (product: any) => {
        return safeNumber(product.product_variants?.[0]?.price);
    };

    const getPreorderDeposit = (product: any) => {
        const pre = product.product_preorders || {};
        return safeNumber(pre.deposit_amount);
    };

    const getPreorderFullPrice = (product: any) => {
        const pre = product.product_preorders || {};
        return safeNumber(pre.full_price);
    };



    // --- SUB-COMPONENTS ---

    const HeroSection = () => (
        <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-neutral-900 text-white">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${BANNERS[currentSlide].image}')` }} />
                    <div className="absolute inset-0 bg-black/40" /> {/* Subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-90" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-end pb-32 items-start">
                <motion.div
                    key={`text-${currentSlide}`}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-3xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px w-16 bg-white/60"></div>
                        <span className="text-sm font-medium tracking-[0.2em] uppercase text-white/90">FigiCore Premium Experience</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-serif font-medium mb-8 leading-[1.1] text-white drop-shadow-md">
                        {BANNERS[currentSlide].title}
                    </h1>
                    <p className="text-lg md:text-2xl text-white/80 mb-12 font-light leading-relaxed max-w-xl">
                        {BANNERS[currentSlide].subtitle}
                    </p>
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-neutral-200 rounded-none h-16 px-10 text-lg tracking-wide font-medium transition-all"
                        onClick={() => navigate(BANNERS[currentSlide].link)}
                    >
                        {BANNERS[currentSlide].action}
                    </Button>
                </motion.div>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-12 right-12 flex gap-3 z-20">
                {BANNERS.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-1 transition-all duration-500 ${currentSlide === idx ? "w-16 bg-white" : "w-8 bg-white/30"}`}
                    />
                ))}
            </div>
        </div>
    );



    const isOutOfStock = (product: any) => {
        if (product.type_code === 'RETAIL') {
            if (!product.product_variants || product.product_variants.length === 0) return true;
            return product.product_variants.reduce((sum: number, v: any) => sum + v.stock_available, 0) === 0;
        }
        return false;
    };

    const ProductCardMinimal = ({ product }: { product: any }) => (
        <div
            className="group cursor-pointer flex flex-col gap-6"
            onClick={() => navigate(`/guest/product/${product.product_id}`)}
        >
            <div className="aspect-[3/4] overflow-hidden bg-neutral-100 relative shadow-sm hover:shadow-xl transition-all duration-500">
                {product.media_urls?.[0] ? (
                    <img
                        src={product.media_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package className="w-10 h-10" /></div>
                )}

                {/* Minimal Overlay Badge */}
                {product.type_code !== 'RETAIL' && (
                    <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur text-black border-0 text-[10px] uppercase tracking-wider rounded-none px-3 py-1">
                            {product.type_code}
                        </Badge>
                    </div>
                )}

                {/* Out of Stock Overlay */}
                {isOutOfStock(product) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="text-yellow-400 font-black uppercase tracking-widest text-xs border-2 border-yellow-400 px-3 py-1.5 transform -rotate-12">HẾT HÀNG</span>
                    </div>
                )}
            </div>

            <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                    {product.brands?.name || "FigiCore"}
                </div>
                <h3 className="text-lg font-serif text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-1">
                    {product.name}
                </h3>
                <div className="text-base font-medium text-neutral-900">
                    {formatPrice(getRetailPrice(product))}
                </div>
            </div>
        </div >
    );

    const PreOrderCard = ({ product }: { product: any }) => {
        return (
            <div
                className="group relative aspect-[4/5] overflow-hidden bg-neutral-800 cursor-pointer border border-neutral-800 hover:border-amber-900/50 transition-colors"
                onClick={() => navigate(`/guest/product/${product.product_id}`)}
            >
                {product.media_urls?.[0] && (
                    <img
                        src={product.media_urls[0]}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105 saturate-50 group-hover:saturate-100"
                    />
                )}
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                        <Badge className="bg-amber-700 text-white border-0 mb-2 hover:bg-amber-600 rounded-none px-3 tracking-wider text-[10px]">PRE-ORDER</Badge>
                        <div className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">
                            {product.brands?.name || "FigiCore"}
                        </div>
                        <h3 className="text-2xl font-serif text-white mb-3 leading-tight">{product.name}</h3>

                        <div className="space-y-1">
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-light text-amber-500">
                                    {formatPrice(getPreorderDeposit(product))}
                                </span>
                                <span className="text-xs text-neutral-400 uppercase tracking-wide">Deposit</span>
                            </div>

                            <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                                <p className="text-white/60 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100 font-light">
                                    Full Price: {formatPrice(getPreorderFullPrice(product))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <GuestLayout activePage="home">
            <div className="bg-white min-h-screen font-sans text-neutral-800 pb-0">

                <HeroSection />

                {/* SECTION 1: NEW ARRIVALS */}
                <section className="py-32 container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 text-center md:text-left">
                        <div className="max-w-xl mx-auto md:mx-0">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2 block">Curated Selection</span>
                            <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-4">Latest Acquisitions</h2>
                            <p className="text-neutral-500 font-light text-lg">Detailed craftsmanship. Exclusive designs. Fresh from the studio to your personal gallery.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-transparent border-neutral-200 text-neutral-900 hover:bg-neutral-900 hover:text-white rounded-none px-8 h-12 uppercase tracking-wider text-xs font-bold transition-all mx-auto md:mx-0"
                            onClick={() => navigate('/guest/browse')}
                        >
                            View All Collection
                        </Button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-neutral-100 animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                            {latestProducts.map(p => <ProductCardMinimal key={p.product_id} product={p} />)}
                        </div>
                    )}
                </section>



                {/* SECTION 3: PRE-ORDER SPOTLIGHT (Dark Mode) */}
                <section className="py-32 bg-[#050505] text-white">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8 border-b border-white/10 pb-8">
                            <div>
                                <div className="text-amber-600 font-bold tracking-[0.2em] uppercase text-xs mb-4 flex items-center gap-2">
                                    <Star className="w-3 h-3 fill-current" /> Future Masterpieces
                                </div>
                                <h2 className="text-4xl md:text-6xl font-serif text-white mb-2">Pre-Order Center</h2>
                            </div>
                            <Button
                                variant="outline"
                                className="bg-transparent border-white/30 text-white hover:bg-white hover:text-black rounded-none px-8 h-12 uppercase tracking-wider text-xs font-bold transition-all"
                                onClick={() => navigate('/guest/browse?category=PREORDER')}
                            >
                                View All Pre-Orders
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
                            {preorderProducts.map(p => <PreOrderCard key={p.product_id} product={p} />)}

                            {/* Fillers if empty */}
                            {!loading && preorderProducts.length === 0 && (
                                <div className="col-span-4 text-center py-32 text-neutral-600 font-serif italic text-2xl">
                                    No upcoming pre-orders available.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* SECTION 3: MEMBERSHIP CTA */}
                <section className="py-40 container mx-auto px-6 text-center bg-neutral-50 border-t border-neutral-100">
                    <h2 className="text-4xl md:text-6xl font-serif text-neutral-900 mb-8">Unlock the Full Experience</h2>
                    <p className="text-neutral-500 max-w-2xl mx-auto mb-12 text-xl font-light leading-relaxed">
                        Join <span className="text-neutral-900 font-medium">FigiCore</span> to access exclusive <strong>Blind Box</strong> collections, earn loyalty points, and participate in member-only auctions.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Button size="lg" className="bg-neutral-900 text-white hover:bg-black rounded-none px-12 h-16 text-lg tracking-wide uppercase" onClick={() => navigate('/guest/register')}>
                            Become a Member
                        </Button>
                        <Button size="lg" variant="outline" className="border-neutral-300 text-neutral-900 hover:bg-neutral-200 rounded-none px-12 h-16 text-lg tracking-wide uppercase" onClick={() => navigate('/guest/login')}>
                            Sign In
                        </Button>
                    </div>
                </section>

            </div>
        </GuestLayout>
    );
}
