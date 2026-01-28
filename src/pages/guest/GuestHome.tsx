import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowRight, Shield, Truck, Award } from 'lucide-react';
import { productsService } from '@/services/products.service';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BANNERS = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2670&fit=crop",
        title: "Curated Art Toys for Discerning Collectors",
        subtitle: "Discover rare figures, exclusive blind boxes, and limited editions.",
        action: "Explore Collection",
        link: "/guest/shop"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1920&q=80&fit=crop", // Darker moody image
        title: "Exclusive Blind Box Drops",
        subtitle: "Experience the thrill of the unknown. New series arriving weekly.",
        action: "View Blind Boxes",
        link: "/guest/shop?type=BLINDBOX"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1566576912906-60034a605152?w=1920&q=80&fit=crop",
        title: "Join the FigiCore Community",
        subtitle: "Connect with thousands of collectors worldwide. Trade, chat, and showcase.",
        action: "Join Now",
        link: "/guest/signup"
    }
];

export function GuestHome() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productsService.getProducts({});
                const list = Array.isArray(data) ? data : (data as any)?.data || [];
                setProducts(list.slice(0, 8));
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const getDisplayPrice = (product: any) => {
        let price = product.product_variants?.[0]?.price || 0;
        if (product.type_code === 'BLINDBOX') price = product.product_blindboxes?.[0]?.price || 0;
        if (product.type_code === 'PREORDER') price = product.product_preorders?.[0]?.deposit_amount || 0;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    // Animation Variants
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <GuestLayout activePage="home">
            <div className="bg-[#fcfcfc] min-h-screen font-sans text-neutral-800">

                {/* HERO CAROUSEL SECTION */}
                <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-neutral-900 text-white">
                    {/* Background Images with Crossfade */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url('${BANNERS[currentSlide].image}')` }}
                            />
                            {/* Dark Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Content */}
                    <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center pt-20">
                        <motion.div
                            key={`text-${currentSlide}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="max-w-4xl"
                        >
                            <Badge className="mb-6 bg-white/10 text-white border-white/20 px-4 py-1 text-xs tracking-[0.2em] uppercase backdrop-blur-md shadow-lg">
                                FigiCore Exclusive
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight leading-tight text-white drop-shadow-lg">
                                {BANNERS[currentSlide].title}
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
                                {BANNERS[currentSlide].subtitle}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {/* Primary Action */}
                                <Button
                                    size="lg"
                                    className="bg-white text-black hover:bg-gray-200 px-8 h-14 rounded-full font-bold tracking-wide transition-transform hover:scale-105"
                                    onClick={() => navigate(BANNERS[currentSlide].link)}
                                >
                                    {BANNERS[currentSlide].action}
                                </Button>

                                {/* Secondary Action (FIXED CONTRAST) */}
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/40 bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-black px-8 h-14 rounded-full font-medium transition-all"
                                    onClick={() => navigate('/guest/signup')}
                                >
                                    Join Community
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Carousel Indicators (Dots) */}
                    <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-3">
                        {BANNERS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/80"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* PRODUCT GRID */}
                <div className="container mx-auto px-4 py-20">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-light text-neutral-900">Latest Arrivals</h2>
                            <p className="text-neutral-500 mt-2 font-light">Fresh from the studio to your shelf.</p>
                        </div>
                        <Button variant="ghost" onClick={() => navigate('/guest/shop')}>View All <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[4/5] bg-neutral-100 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {products.map((product) => (
                                <motion.div key={product.product_id} variants={itemVariants}>
                                    <Card
                                        className="group border-0 bg-transparent shadow-none cursor-pointer"
                                        onClick={() => navigate(`/guest/product/${product.product_id}`)}
                                    >
                                        <div className="aspect-[4/5] relative bg-neutral-100 rounded-2xl overflow-hidden mb-4">
                                            {product.media_urls?.[0] ? (
                                                <img
                                                    src={product.media_urls[0]}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package className="w-10 h-10" /></div>
                                            )}

                                            {/* Type Badge */}
                                            <div className="absolute top-3 left-3">
                                                <Badge className={`border-0 text-[10px] font-bold tracking-wide uppercase px-2 py-1 backdrop-blur-md shadow-sm
                                                    ${product.type_code === 'BLINDBOX' ? "bg-purple-900/90 text-white" :
                                                        product.type_code === 'PREORDER' ? "bg-orange-600/90 text-white" :
                                                            "bg-white/90 text-neutral-900"}`}>
                                                    {product.type_code}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                                                {product.brands?.name || "FigiCore"}
                                            </div>
                                            <h3 className="text-base font-medium text-neutral-900 mb-1 truncate group-hover:underline decoration-neutral-300 underline-offset-4">
                                                {product.name}
                                            </h3>
                                            <div className="text-lg font-bold text-neutral-900">
                                                {getDisplayPrice(product)}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* TRUST SIGNALS */}
                <div className="bg-neutral-50 border-t border-neutral-100 py-20">
                    <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {[
                            { icon: Shield, title: "Authenticity Guaranteed", desc: "Every item is verified by our experts." },
                            { icon: Truck, title: "Global Shipping", desc: "Secure packaging and insured delivery." },
                            { icon: Award, title: "Premium Service", desc: "Dedicated support for collectors." }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <item.icon className="w-6 h-6 text-neutral-900" />
                                </div>
                                <h3 className="font-bold text-neutral-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-neutral-500 max-w-xs">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
