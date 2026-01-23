import { GuestLayout } from '@/layouts/GuestLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, TruckIcon, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function GuestHome() {
    const navigate = useNavigate();

    const featuredProducts = [
        {
            id: '1',
            name: 'Molly Chess Series',
            price: 149.99,
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
            category: 'Art Toy',
            badge: 'Limited Edition',
            edition: 'Edition of 500',
        },
        {
            id: '2',
            name: 'Skullpanda Dark Night',
            price: 189.00,
            image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop',
            category: 'Art Toy',
            badge: 'New Arrival',
            edition: 'Signature Series',
        },
        {
            id: '3',
            name: 'Labubu Macaron Series',
            price: 124.99,
            image: 'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=400&h=400&fit=crop',
            category: 'Blind Box',
            edition: 'Set of 12',
        },
        {
            id: '4',
            name: 'CRYBABY Tears Series',
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop',
            category: 'Exclusive',
            badge: 'Rare',
            edition: 'Collector\'s Edition',
        },
    ];

    const collections = [
        {
            name: 'Art Toys',
            count: '64',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
        },
        {
            name: 'Blind Box',
            count: '48',
            image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=600&fit=crop'
        },
        {
            name: 'Limited Editions',
            count: '23',
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop'
        },
    ];

    return (
        <GuestLayout activePage="home">
            <div className="bg-white">
                {/* Hero Section */}
                <section className="relative bg-gray-50 border-b border-gray-200 overflow-hidden">
                    <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
                        <div className="max-w-3xl animate-in slide-in-from-bottom-5 duration-700 fade-in">
                            <Badge className="mb-6 bg-gray-900 text-white border-0 text-xs font-medium tracking-widest px-3 py-1 uppercase">
                                Collectible Figures
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-light mb-8 text-gray-900 tracking-tight leading-tight">
                                Curated Art Toys for Discerning Collectors
                            </h1>
                            <p className="text-xl text-gray-500 mb-10 font-light leading-relaxed max-w-2xl">
                                Discover rare and limited-edition collectible figures. Each piece is carefully selected for its craftsmanship and artistic value.
                            </p>
                            <div className="flex gap-4">
                                <Button
                                    size="lg"
                                    className="bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl px-8 h-12 text-base"
                                    onClick={() => navigate('/guest/browse')}
                                >
                                    Explore Collection
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-gray-200 text-gray-900 hover:bg-white hover:border-gray-900 transition-all px-8 h-12 text-base bg-white"
                                    onClick={() => navigate('/guest/about')}
                                >
                                    Learn More
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gray-100 to-transparent hidden lg:block pointer-events-none" />
                </section>

                {/* Collections */}
                <section className="container mx-auto px-4 py-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tight">Shop by Collection</h2>
                        <p className="text-gray-500 font-light text-lg">Carefully curated series from renowned artists</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {collections.map((collection, index) => (
                            <Card
                                key={index}
                                className="group cursor-pointer overflow-hidden border-0 rounded-none shadow-none relative h-96"
                                onClick={() => navigate('/guest/browse')}
                            >
                                <div className="absolute inset-0 bg-gray-100">
                                    <img
                                        src={collection.image}
                                        alt={collection.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-3xl font-light mb-2">{collection.name}</h3>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                        <span className="text-sm font-medium tracking-wide">{collection.count} PIECES</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Featured Products */}
                <section className="bg-white py-24 border-t border-gray-100">
                    <div className="container mx-auto px-4">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tight">Featured Collection</h2>
                                <p className="text-gray-500 font-light text-lg">Handpicked exclusive pieces</p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-gray-200 text-gray-900 hover:border-gray-900 hidden sm:flex"
                                onClick={() => navigate('/guest/browse')}
                            >
                                View All
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                            {featuredProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    className="group border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer"
                                    onClick={() => navigate(`/guest/product/${product.id}`)}
                                >
                                    <div className="aspect-square relative bg-gray-50 overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {product.badge && (
                                            <Badge className="absolute top-3 left-3 bg-gray-900 text-white border-0 text-xs font-light tracking-wide rounded-full px-3">
                                                {product.badge}
                                            </Badge>
                                        )}

                                        {/* Hover Actions */}
                                        <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <Button
                                                className="w-full bg-white/90 backdrop-blur text-gray-900 hover:bg-gray-900 hover:text-white border-0 shadow-lg font-medium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/guest/product/${product.id}`);
                                                }}
                                            >
                                                Quick View
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.category}</div>
                                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg font-semibold text-gray-900">${product.price}</p>
                                            {product.edition && (
                                                <span className="text-xs text-gray-400">{product.edition}</span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <div className="mt-8 text-center sm:hidden">
                            <Button
                                variant="outline"
                                className="w-full border-gray-200 text-gray-900"
                                onClick={() => navigate('/guest/browse')}
                            >
                                View All Collection
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Trust Indicators */}
                <section className="bg-gray-50 border-y border-gray-200 py-20">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                            <div className="text-center group">
                                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6 group-hover:border-gray-900 transition-colors duration-300">
                                    <Shield className="w-7 h-7 text-gray-900" />
                                </div>
                                <h3 className="font-medium text-lg text-gray-900 mb-3">Authenticity Guaranteed</h3>
                                <p className="text-gray-500 font-light leading-relaxed max-w-xs mx-auto">
                                    Every piece is verified and authenticated by our expert team. 100% genuine products.
                                </p>
                            </div>

                            <div className="text-center group">
                                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6 group-hover:border-gray-900 transition-colors duration-300">
                                    <TruckIcon className="w-7 h-7 text-gray-900" />
                                </div>
                                <h3 className="font-medium text-lg text-gray-900 mb-3">Secure Shipping</h3>
                                <p className="text-gray-500 font-light leading-relaxed max-w-xs mx-auto">
                                    Premium packaging and insured delivery worldwide. Your items arrive safely.
                                </p>
                            </div>

                            <div className="text-center group">
                                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6 group-hover:border-gray-900 transition-colors duration-300">
                                    <Award className="w-7 h-7 text-gray-900" />
                                </div>
                                <h3 className="font-medium text-lg text-gray-900 mb-3">Collector Community</h3>
                                <p className="text-gray-500 font-light leading-relaxed max-w-xs mx-auto">
                                    Join a trusted network of serious collectors. Access exclusive member benefits.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="container mx-auto px-4 py-32">
                    <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
                        <div className="relative z-10 p-12 md:p-24 text-center">
                            <h2 className="text-3xl md:text-5xl font-light mb-6 tracking-tight text-white">
                                Begin Your Collection Today
                            </h2>
                            <p className="text-gray-200 font-light mb-10 max-w-xl mx-auto leading-relaxed text-lg">
                                Create an account to access exclusive releases, track your portfolio, and join our community of collectors.
                            </p>
                            <Button
                                size="lg"
                                className="bg-white text-gray-900 hover:bg-gray-100 transition-colors h-14 px-10 text-lg border-0"
                                onClick={() => navigate('/guest/signup')}
                            >
                                Create Free Account
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </GuestLayout>
    );
}
