import { GuestLayout } from '@/layouts/GuestLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

export function Browse() {
    const products = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        name: [
            'Molly Chess Series',
            'Skullpanda Dark Night',
            'Labubu Macaron Series',
            'CRYBABY Tears Edition',
            'Dimoo Space Explorer',
            'The Monsters Paradise',
            'HACIPUPU Golden Era',
            'Pucky Milk Babies'
        ][i % 8],
        price: [149.99, 189.00, 124.99, 299.99, 159.00, 174.99, 139.99, 119.99][i % 8],
        image: [
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop',
        ][i % 8],
        category: ['Art Toy', 'Blind Box', 'Limited Edition', 'Exclusive'][i % 4],
        edition: ['Edition of 500', 'Set of 12', 'Signature Series', 'Collector\'s Edition'][i % 4],
        badge: i < 3 ? ['Limited Edition', 'New Arrival', 'Rare'][i] : undefined,
    }));

    const categories = ['All Collections', 'Art Toys', 'Blind Box', 'Limited Editions', 'Exclusive Releases', 'Best Sellers', 'Coming Soon'];

    return (
        <GuestLayout activePage="browse">
            <div className="bg-white min-h-screen">
                {/* Header */}
                <section className="border-b border-gray-100 bg-white">
                    <div className="container mx-auto px-4 py-16 text-center">
                        <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">Browse Collection</h1>
                        <p className="text-gray-500 font-light text-xl max-w-2xl mx-auto">Explore our complete catalog of collectible figures</p>
                    </div>
                </section>

                {/* Filters */}
                <section className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            <div className="flex-1 relative w-full">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by name, artist, or series..."
                                    className="pl-12 h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 w-full rounded-xl transition-all"
                                />
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                                <div className="relative flex-1 lg:flex-none">
                                    <select className="appearance-none h-11 pl-4 pr-10 border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-gray-900 focus:ring-gray-900 w-full lg:w-48 cursor-pointer transition-colors hover:border-gray-300">
                                        <option>All Categories</option>
                                        <option>Art Toys</option>
                                        <option>Blind Box</option>
                                        <option>Limited Edition</option>
                                        <option>Exclusive</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                                <div className="relative flex-1 lg:flex-none">
                                    <select className="appearance-none h-11 pl-4 pr-10 border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-gray-900 focus:ring-gray-900 w-full lg:w-48 cursor-pointer transition-colors hover:border-gray-300">
                                        <option>Sort: Featured</option>
                                        <option>Price: Low to High</option>
                                        <option>Price: High to Low</option>
                                        <option>Newest First</option>
                                        <option>Name: A-Z</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                                <Button
                                    variant="outline"
                                    className="h-11 px-4 border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-900 hover:bg-white rounded-xl"
                                >
                                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                                    Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Category Pills */}
                <section className="container mx-auto px-4 py-8 border-b border-gray-100">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map((cat, index) => (
                            <Button
                                key={index}
                                variant={index === 0 ? 'default' : 'outline'}
                                className={
                                    index === 0
                                        ? 'whitespace-nowrap bg-gray-900 text-white hover:bg-gray-800 rounded-full h-9 px-6 text-sm'
                                        : 'whitespace-nowrap border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-white rounded-full h-9 px-6 text-sm'
                                }
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Products Grid */}
                <section className="container mx-auto px-4 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <p className="text-sm text-gray-500 font-medium">{products.length} pieces available</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        {products.map((product) => (
                            <Card key={product.id} className="group border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
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
                                        <Button className="w-full bg-white/90 backdrop-blur text-gray-900 hover:bg-gray-900 hover:text-white border-0 shadow-lg font-medium">
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

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-20">
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-900 hover:bg-gray-50 w-24">
                            Previous
                        </Button>
                        <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800 w-10 h-10 p-0 rounded-lg">
                            1
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-900 hover:bg-gray-50 w-10 h-10 p-0 rounded-lg">
                            2
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-900 hover:bg-gray-50 w-10 h-10 p-0 rounded-lg">
                            3
                        </Button>
                        <span className="text-gray-400">...</span>
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-900 hover:bg-gray-50 w-24">
                            Next
                        </Button>
                    </div>
                </section>
            </div>
        </GuestLayout>
    );
}
