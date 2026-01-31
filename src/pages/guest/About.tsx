import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import {
    Heart,
    Shield,
    Truck,
    Star,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function About() {
    const navigate = useNavigate();
    const features = [
        {
            icon: Shield,
            title: 'Authenticity Guaranteed',
            description: 'Every item is verified genuine from official distributors.',
            color: 'text-neutral-900',
            bgColor: 'bg-neutral-100',
        },
        {
            icon: Truck,
            title: 'Global Shipping',
            description: 'Secure, tracked delivery to collectors worldwide.',
            color: 'text-neutral-900',
            bgColor: 'bg-neutral-100',
        },
        {
            icon: Heart,
            title: 'For Collectors',
            description: 'Built by enthusiasts, for the enthusiast community.',
            color: 'text-neutral-900',
            bgColor: 'bg-neutral-100',
        },
        {
            icon: Star,
            title: 'Premium Service',
            description: 'Dedicated support to ensure your satisfaction.',
            color: 'text-neutral-900',
            bgColor: 'bg-neutral-100',
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
            <div className="bg-white">
                {/* HERO SECTION */}
                <section className="relative py-32 bg-neutral-900 text-white overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1920&q=80&fit=crop')] bg-cover bg-center" />
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-serif font-medium mb-6 tracking-tight"
                        >
                            The Art of Collecting
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed"
                        >
                            FigiCore is your premier destination for curated art toys, blind boxes, and limited edition figures. We bridge the gap between art and play.
                        </motion.p>
                    </div>
                </section>

                {/* MISSION STATEMENT */}
                <section className="py-24 container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <Sparkles className="w-12 h-12 mx-auto mb-8 text-amber-500" />
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-8">Our Mission</h2>
                        <p className="text-2xl md:text-3xl text-neutral-600 font-light leading-relaxed italic">
                            "To create a trusted sanctuary where collectors can discover authentic masterpieces, connecting with the stories and artists behind every figure."
                        </p>
                    </div>
                </section>

                {/* WHY CHOOSE US */}
                <section className="py-24 bg-neutral-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-4">Why Collectors Choose Us</h2>
                            <p className="text-neutral-500">The FigiCore Standard of Excellence</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div key={index} className="text-center group p-8 bg-white rounded-xl border border-neutral-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
                                        <div className={`w-16 h-16 rounded-full ${feature.bgColor} flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-50 transition-colors`}>
                                            <Icon className={`w-8 h-8 ${feature.color} group-hover:text-amber-600 transition-colors`} />
                                        </div>
                                        <h3 className="font-bold text-lg mb-3 text-neutral-900">{feature.title}</h3>
                                        <p className="text-neutral-500 text-sm leading-relaxed">{feature.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* IMPACT STATS */}
                <section className="py-20 border-y border-neutral-100">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center border-r last:border-0 border-neutral-100">
                                    <p className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-2">{stat.value}</p>
                                    <p className="text-neutral-500 text-sm uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* VALUES SECTION */}
                <section className="py-24 container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100">
                                <img src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80" alt="Collector" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-xl shadow-xl border border-neutral-100 hidden md:block">
                                <p className="font-serif text-2xl font-bold text-neutral-900">100%</p>
                                <p className="text-neutral-500 text-sm">Authentic Products</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div>
                                <h2 className="text-4xl font-serif font-bold text-neutral-900 mb-6">Built on Passion & Integrigy</h2>
                                <p className="text-lg text-neutral-600 leading-relaxed font-light">
                                    We believe that collecting is more than just acquiring objects; it's about preserving art and culture. That's why we uphold the strictest standards for provenance and quality.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { title: 'Quality First', desc: 'Rigorous inspection of every item.' },
                                    { title: 'Community Driven', desc: 'Supporting artists and collectors alike.' },
                                    { title: 'Transparent Pricing', desc: 'Fair market value, no hidden fees.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1">
                                            <CheckCircle2 className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900">{item.title}</h3>
                                            <p className="text-neutral-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                size="lg"
                                className="bg-neutral-900 text-white hover:bg-black px-8"
                                onClick={() => navigate('/guest/about')}
                            >
                                Read Our Story
                            </Button>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 bg-amber-500 text-white text-center">
                    <div className="container mx-auto px-4">
                        <h2 className="text-4xl font-serif font-bold mb-6">Start Your Collection Today</h2>
                        <p className="text-xl text-amber-100 mb-10 max-w-2xl mx-auto">
                            Join our community of passionate collectors and get early access to exclusive drops.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                className="bg-white text-amber-600 hover:bg-neutral-100 h-14 px-10 text-lg border-0"
                                onClick={() => navigate('/guest/register')}
                            >
                                Join Now
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-white text-white hover:bg-white/10 h-14 px-10 text-lg bg-transparent"
                                onClick={() => navigate('/guest/browse')}
                            >
                                Browse Shop
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </GuestLayout>
    );
}
