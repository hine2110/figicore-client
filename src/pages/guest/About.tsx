import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import {
    Heart,
    Users,
    Award,
    Shield,
    Truck,
    Star,
} from 'lucide-react';

export function About() {
    const features = [
        {
            icon: Shield,
            title: 'Authenticity Guaranteed',
            description: '100% genuine products from official distributors',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: Truck,
            title: 'Fast Worldwide Shipping',
            description: 'Quick and secure delivery to your doorstep',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            icon: Heart,
            title: 'Passionate Community',
            description: 'Join thousands of collectors worldwide',
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
        },
        {
            icon: Star,
            title: 'Premium Service',
            description: 'Dedicated support for all customers',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
    ];

    const stats = [
        { value: '12,000+', label: 'Happy Collectors' },
        { value: '50,000+', label: 'Orders Fulfilled' },
        { value: '500+', label: 'Unique Products' },
        { value: '4.9/5.0', label: 'Customer Rating' },
    ];

    return (
        <GuestLayout activePage="about">
            <div className="bg-white">
                {/* Header Section */}
                <section className="py-20 text-center container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight text-gray-900">About FigiCore</h1>
                    <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-light">
                        Your premier destination for art toys, blind boxes, and collectible figures.
                        We're passionate about bringing joy to collectors worldwide through authentic,
                        high-quality products and exceptional service.
                    </p>
                </section>

                {/* Mission Banner - Gradient */}
                <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <Heart className="w-16 h-16 mx-auto mb-8 text-white/90" />
                        <h2 className="text-3xl font-bold mb-6 tracking-tight">Our Mission</h2>
                        <p className="text-xl md:text-2xl text-blue-50 max-w-4xl mx-auto font-light leading-relaxed">
                            "To create a trusted platform where collectors can discover, purchase, and trade
                            authentic art toys and collectibles while building a vibrant community of enthusiasts."
                        </p>
                    </div>
                </section>

                {/* Why Choose Us */}
                <section className="py-24 container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16 tracking-tight text-gray-900">Why Choose Us</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div key={index} className="text-center group p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div className={`w-20 h-20 rounded-full ${feature.bgColor} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className={`w-10 h-10 ${feature.color}`} />
                                    </div>
                                    <h3 className="font-bold text-xl mb-3 text-gray-900">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Impact Stats */}
                <section className="bg-gray-50 py-24 border-y border-gray-200">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-16 tracking-tight text-gray-900">Our Impact</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <p className="text-4xl md:text-5xl font-bold text-blue-600 mb-3 tracking-tight">{stat.value}</p>
                                    <p className="text-gray-600 font-medium">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-24 container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16 tracking-tight text-gray-900">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="bg-blue-50/50 p-10 rounded-3xl border border-blue-100 hover:shadow-lg transition-shadow">
                            <Award className="w-12 h-12 text-blue-600 mb-6" />
                            <h3 className="font-bold text-2xl mb-4 text-gray-900">Quality First</h3>
                            <p className="text-gray-600 leading-relaxed">
                                We source only authentic products from official distributors and trusted partners,
                                ensuring every item meets our high standards.
                            </p>
                        </div>

                        <div className="bg-purple-50/50 p-10 rounded-3xl border border-purple-100 hover:shadow-lg transition-shadow">
                            <Users className="w-12 h-12 text-purple-600 mb-6" />
                            <h3 className="font-bold text-2xl mb-4 text-gray-900">Community Driven</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Our collectors are at the heart of everything we do. We listen, adapt, and grow
                                together with our passionate community.
                            </p>
                        </div>

                        <div className="bg-emerald-50/50 p-10 rounded-3xl border border-emerald-100 hover:shadow-lg transition-shadow">
                            <Shield className="w-12 h-12 text-emerald-600 mb-6" />
                            <h3 className="font-bold text-2xl mb-4 text-gray-900">Trust & Transparency</h3>
                            <p className="text-gray-600 leading-relaxed">
                                We believe in open communication, fair pricing, and secure transactions.
                                Your trust is our most valuable asset.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Ready to Join Our Community?</h2>
                        <p className="text-xl text-amber-100 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                            Start your collecting journey today and discover amazing art toys,
                            blind boxes, and exclusive releases.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 h-14 px-10 text-lg border-0">
                                Sign Up Now
                            </Button>
                            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-10 text-lg bg-transparent">
                                Browse Products
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </GuestLayout>
    );
}
