import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Heart,
    Shield,
    Truck,
    Star,
    Sparkles,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function About() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Shield,
            title: 'Algorithmic Transparency',
            description: 'Public, verifiable drop rates for all Blind Box series, ensuring fair distribution for every collector.',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: Truck,
            title: 'Evidence-Based Fulfillment',
            description: 'A robust workflow requiring mandatory packing and unboxing video proofs at every stage of shipment.',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
        {
            icon: Heart,
            title: 'Unified Ecosystem',
            description: 'Seamlessly connecting auctions, retail, and blind boxes into a single, high-performance platform.',
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
        },
        {
            icon: Star,
            title: 'Secure Digital Escrow',
            description: 'Advanced closed-loop wallet system providing secure financial management and instantaneous transactions.',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
    ];

    const stats = [
        { value: '12K+', label: 'Happy Collectors' },
        { value: '50K+', label: 'Orders Fulfilled' },
        { value: '500+', label: 'Curated Items' },
        { value: '4.9', label: 'Customer Rating' },
    ];

    return (
        <GuestLayout activePage="about">
            <div className="min-h-screen bg-[#F2F2F7] relative overflow-hidden font-sans">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] ambient-glow-blue rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] ambient-glow-purple rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '10s' }} />
                </div>

                <div className="container mx-auto px-4 relative z-10 pt-16 pb-24 max-w-7xl space-y-24">

                    {/* HERO SECTION */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-[3rem] overflow-hidden bg-white/60 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 md:p-20 text-center"
                    >
                        <div className="max-w-3xl mx-auto space-y-8">
                            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-slate-200 text-slate-600 px-4 py-1.5 text-xs tracking-[0.2em] uppercase font-bold shadow-sm">
                                FIGI SHOP
                            </Badge>

                            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-tight">
                                The Art of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Collecting</span>
                            </h1>

                            <p className="text-xl text-slate-500 font-light leading-relaxed">
                                FigiCore is a specialized ecosystem designed for the modern collector. We bridge the gap between high-end digital commerce and the tangible joy of unboxing authentic masterpieces.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Button
                                    size="lg"
                                    className="h-14 px-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-lg font-medium"
                                    onClick={() => navigate('/guest/browse')}
                                >
                                    Explore Collection
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-8 rounded-full border-slate-200 text-slate-700 hover:bg-white/80 hover:border-slate-300 text-lg font-medium"
                                    onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Read Our Story
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* STATS SECTION */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2rem] p-8 text-center hover:bg-white/60 transition-colors duration-300 shadow-sm"
                            >
                                <p className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 tracking-tight">{stat.value}</p>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* STORY / MISSION */}
                    <div id="story" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative aspect-square lg:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <img
                                src="https://res.cloudinary.com/dy7w4q9n9/image/upload/v1776364071/figicore_products/ybqn2qxohqlbav1hewwf.webp"
                                alt="Collector"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-10 text-white">
                                <Badge className="bg-white/20 backdrop-blur-md text-white border-0 mb-4 hover:bg-white/30">PASSION PROJECT</Badge>
                                <p className="text-2xl font-bold">Curated with Love</p>
                            </div>
                        </motion.div>

                        <div className="space-y-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-8">
                                    <Sparkles className="w-8 h-8 text-amber-600" />
                                </div>
                                <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">The Passion Behind the Tech</h2>
                                <p className="text-xl text-slate-600 leading-relaxed font-light mb-6">
                                    FigiCore was born from a simple collective frustration: the lack of transparency and security in the high-end figure market. What started as a passion project for Gundam and Art Toy enthusiasts has evolved into a robust technical ecosystem.
                                </p>
                                <p className="text-lg text-slate-500 leading-relaxed font-light mb-8">
                                    Our vision is to build a unified sanctuary where technology serves integrity—where every auction is fair, every blind box is transparent, and every collector can verify the authenticity of their treasures with absolute certainty.
                                </p>

                                <div className="space-y-6">
                                    {[
                                        { title: 'Verified Authenticity', desc: 'Direct sourcing from official global distributors.' },
                                        { title: 'Technical Integrity', desc: 'Secure real-time auction engine and closed-loop encryption.' },
                                        { title: 'Collector-First UX', desc: 'Transparent drop rates and mandatory video evidence.' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-5 items-start">
                                            <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                                                <p className="text-slate-500 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* VALUES / FEATURES */}
                    <div>
                        <div className="text-center mb-16 px-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Collectors Choose Us</h2>
                            <p className="text-slate-500 text-lg">The FigiCore Standard of Excellence</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group p-8 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/40 hover:bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition-all duration-300"
                                    >
                                        <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className={`w-8 h-8 ${feature.color}`} />
                                        </div>
                                        <h3 className="font-bold text-xl mb-3 text-slate-900">{feature.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CTA SECTION */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative rounded-[3rem] overflow-hidden bg-slate-900 text-white p-12 md:p-24 text-center shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/20 blur-[100px] rounded-full" />
                        <div className="absolute bottom-0 left-0 p-32 bg-purple-500/20 blur-[100px] rounded-full" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Start Your Collection Today</h2>
                            <p className="text-xl text-slate-400 font-light">
                                Join our community of passionate collectors and get early access to exclusive drops.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    size="lg"
                                    className="h-14 px-10 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-lg font-bold"
                                    onClick={() => navigate('/guest/register')}
                                >
                                    Join Now
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-10 rounded-full border-white text-white hover:bg-white/10 hover:text-white text-lg font-bold bg-transparent"
                                    onClick={() => navigate('/guest/browse')}
                                >
                                    Browse Shop
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </GuestLayout>
    );
}
