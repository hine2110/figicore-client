import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productsService } from '@/services/products.service';
import { Button } from '@/components/ui/button';

export function BannerCarousel() {
    const navigate = useNavigate();
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Fetch Banners
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await productsService.getPublicBanners();
                const fetchedBanners = Array.isArray(res) ? res : (res as any)?.data || [];
                setBanners(fetchedBanners);
            } catch (error) {
                console.error("Failed to load banners", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    // Carousel Timer
    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % banners.length), 6000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (loading) {
        return (
            <div className="container mx-auto px-6 max-w-7xl relative z-20 mb-20 mt-12">
                <div className="w-full h-[300px] md:h-[400px] rounded-[3rem] bg-white/40 animate-pulse" />
            </div>
        );
    }

    if (banners.length === 0) return null;

    const currentBanner = banners[currentSlide];

    return (
        <div className="container mx-auto px-6 max-w-7xl relative z-20 mb-20 mt-12">
            <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] group">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        className="absolute inset-0"
                    >
                        {currentBanner?.image_url ? (
                            <div 
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
                                style={{ backgroundImage: `url('${currentBanner.image_url}')` }} 
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black" />
                        )}
                        {/* Subtle overlay to make text readable */}
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Banner Content */}
                <div className="relative z-10 h-full flex flex-col justify-end items-start p-10 md:p-16">
                    <motion.div
                        key={`text-${currentSlide}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-xl"
                    >
                        {currentBanner?.title && (
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg leading-tight">
                                {currentBanner.title}
                            </h2>
                        )}
                        
                        {currentBanner?.subtitle && (
                            <p className="text-sm md:text-base text-white/90 mb-8 font-light leading-relaxed max-w-md">
                                {currentBanner.subtitle}
                            </p>
                        )}

                        <Button
                            className="bg-white text-black hover:bg-zinc-200 text-xs tracking-widest uppercase px-8 h-12 rounded-full transition-all active:scale-95 shadow-xl font-bold"
                            onClick={() => {
                                if (currentBanner?.target_url) {
                                    navigate(currentBanner.target_url);
                                }
                            }}
                        >
                            {currentBanner?.action || "Discover More"}
                        </Button>
                    </motion.div>
                </div>

                {/* Indicators */}
                {banners.length > 1 && (
                    <div className="absolute bottom-8 right-10 flex items-center gap-2 z-20">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-1.5 rounded-full transition-all duration-700 ${currentSlide === idx ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
