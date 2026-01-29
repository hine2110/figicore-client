import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, Package } from 'lucide-react';
import { productsService } from '@/services/products.service';
import { useSearchParams } from 'react-router-dom';

export function Browse() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');

    // State Management
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: categoryParam || 'all',
        sort: 'featured'
    });
    const [totalCount, setTotalCount] = useState(0);

    // Categories for pills
    const categories = [
        { label: 'All Collections', value: 'all' },
        { label: 'Retail Products', value: 'RETAIL' },
        // { label: 'Blind Box', value: 'BLINDBOX' }, // Hidden as per request
        { label: 'Pre-Orders', value: 'PREORDER' }
    ];

    // Scroll to top on page load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params: any = {
                    limit: 48 // Show all 48 products
                };

                // Apply filters
                if (filters.search) params.search = filters.search;
                if (filters.category && filters.category !== 'all') params.type_code = filters.category;

                // Apply backend sorting (only for newest and name)
                if (filters.sort === 'newest') params.sort = 'newest';
                if (filters.sort === 'name') params.sort = 'name';

                const response = await productsService.getProducts(params);
                let productList = Array.isArray(response) ? response : response?.data || [];

                // Client-side price sorting
                if (filters.sort === 'price_asc' || filters.sort === 'price_desc') {
                    productList = [...productList].sort((a, b) => {
                        const priceA = getProductPrice(a);
                        const priceB = getProductPrice(b);
                        return filters.sort === 'price_asc' ? priceA - priceB : priceB - priceA;
                    });
                }

                setProducts(productList);
                setTotalCount(productList.length);
            } catch (error) {
                console.error('Failed to fetch products:', error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [filters]);

    // Helper to get product price for sorting
    const getProductPrice = (product: any): number => {
        if (product.type_code === 'RETAIL') {
            return product.product_variants?.[0]?.price || 0;
        } else if (product.type_code === 'BLINDBOX') {
            return product.product_blindboxes?.price || 0;
        } else if (product.type_code === 'PREORDER') {
            return product.product_preorders?.deposit_amount || 0;
        }
        return 0;
    };

    // Format price helper
    const formatPrice = (product: any) => {
        let price = 0;

        if (product.type_code === 'RETAIL') {
            price = product.product_variants?.[0]?.price || 0;
        } else if (product.type_code === 'BLINDBOX') {
            price = product.product_blindboxes?.price || 0;
        } else if (product.type_code === 'PREORDER') {
            price = product.product_preorders?.deposit_amount || 0;
        }

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Get product subtitle
    const getProductSubtitle = (product: any) => {
        if (product.type_code === 'BLINDBOX') return 'Blind Box';
        if (product.type_code === 'PREORDER') return 'Pre-Order';
        return product.series?.name || product.categories?.name || 'Collectible';
    };

    // Handle filter changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const handleCategoryChange = (category: string) => {
        setFilters(prev => ({ ...prev, category }));
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, sort: e.target.value }));
    };

    return (
        <GuestLayout activePage="browse">
            <div className="bg-white min-h-screen">
                {/* Header */}
                <section className="border-b border-gray-100 bg-white">
                    <div className="container mx-auto px-4 py-16 text-center">
                        <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">
                            Browse Collection
                        </h1>
                        <p className="text-gray-500 font-light text-xl max-w-2xl mx-auto">
                            Explore our complete catalog of {totalCount} collectible figures
                        </p>
                    </div>
                </section>

                {/* Filters */}
                <section className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            <div className="flex-1 relative w-full">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by name, brand, or series..."
                                    value={filters.search}
                                    onChange={handleSearchChange}
                                    className="pl-12 h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 w-full rounded-xl transition-all"
                                />
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                                <div className="relative flex-1 lg:flex-none">
                                    <select
                                        value={filters.category}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="appearance-none h-11 pl-4 pr-10 border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-gray-900 focus:ring-gray-900 w-full lg:w-48 cursor-pointer transition-colors hover:border-gray-300"
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="RETAIL">Retail Products</option>
                                        <option value="BLINDBOX">Blind Box</option>
                                        <option value="PREORDER">Pre-Orders</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                                <div className="relative flex-1 lg:flex-none">
                                    <select
                                        value={filters.sort}
                                        onChange={handleSortChange}
                                        className="appearance-none h-11 pl-4 pr-10 border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-gray-900 focus:ring-gray-900 w-full lg:w-48 cursor-pointer transition-colors hover:border-gray-300"
                                    >
                                        <option value="featured">Sort: Featured</option>
                                        <option value="price_asc">Price: Low to High</option>
                                        <option value="price_desc">Price: High to Low</option>
                                        <option value="newest">Newest First</option>
                                        <option value="name">Name: A-Z</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
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
                                variant={filters.category === cat.value ? 'default' : 'outline'}
                                onClick={() => handleCategoryChange(cat.value)}
                                className={
                                    filters.category === cat.value
                                        ? 'whitespace-nowrap bg-gray-900 text-white hover:bg-gray-800 rounded-full h-9 px-6 text-sm'
                                        : 'whitespace-nowrap border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-white rounded-full h-9 px-6 text-sm'
                                }
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Products Grid */}
                <section className="container mx-auto px-4 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <p className="text-sm text-gray-500 font-medium">
                            {loading ? 'Loading...' : `${products.length} pieces available`}
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="space-y-4">
                                    <div className="aspect-square bg-gray-100 animate-pulse rounded-2xl" />
                                    <div className="h-4 bg-gray-100 animate-pulse rounded" />
                                    <div className="h-4 bg-gray-100 animate-pulse rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-32">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-serif text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                            {products.map((product) => (
                                <Card
                                    key={product.product_id}
                                    className="group border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer"
                                    onClick={() => navigate(`/guest/product/${product.product_id}`)}
                                >
                                    <div className="aspect-square relative bg-gray-50 overflow-hidden">
                                        {product.media_urls?.[0] ? (
                                            <img
                                                src={product.media_urls[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-16 h-16 text-gray-300" />
                                            </div>
                                        )}

                                        {/* Badge for type */}
                                        {product.type_code !== 'RETAIL' && (
                                            <Badge className="absolute top-3 left-3 bg-gray-900 text-white border-0 text-xs font-light tracking-wide rounded-full px-3">
                                                {product.type_code === 'BLINDBOX' ? 'Blind Box' : 'Pre-Order'}
                                            </Badge>
                                        )}

                                        {/* Out of Stock Overlay */}
                                        {(() => {
                                            const isOutOfStock = product.type_code === 'RETAIL' &&
                                                (!product.product_variants || product.product_variants.length === 0 ||
                                                    product.product_variants.reduce((sum: number, v: any) => sum + v.stock_available, 0) === 0);

                                            return isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                                    <span className="text-yellow-400 font-black uppercase tracking-widest text-xs border-2 border-yellow-400 px-3 py-1.5 transform -rotate-12">HẾT HÀNG</span>
                                                </div>
                                            );
                                        })()}

                                        {/* Hover Actions */}
                                        <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <Button className="w-full bg-white/90 backdrop-blur text-gray-900 hover:bg-gray-900 hover:text-white border-0 shadow-lg font-medium">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                            {product.brands?.name || 'FigiCore'}
                                        </div>
                                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatPrice(product)}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {getProductSubtitle(product)}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </GuestLayout>
    );
}
