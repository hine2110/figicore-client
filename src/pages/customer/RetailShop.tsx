import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';

import {
    Package,
    ChevronLeft,
    ChevronRight,
    Filter,
    ShoppingCart,
    Eye,
    Search,
    ArrowUpDown
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { productsService } from '@/services/products.service';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RetailShop() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data States
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Filter States
    const [searchText, setSearchText] = useState(searchParams.get('search') || '');
    const [priceRange, setPriceRange] = useState<number[]>([
        Number(searchParams.get('min_price')) || 0,
        Number(searchParams.get('max_price')) || 0
    ]);
    const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'created_at_desc');

    // Derived URL Filters
    const selectedBrand = searchParams.get('brand_id') || 'all';
    const selectedCategory = searchParams.get('category_id') || 'all';
    const selectedSeries = searchParams.get('series_id') || 'all';
    const selectedType = 'RETAIL'; // Hardcoded

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Initial Load: Metadata
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [b, c] = await Promise.all([
                    productsService.getEntities('brands'),
                    productsService.getEntities('categories'),
                ]);
                setBrands(Array.isArray(b) ? b : (b as any).data || []);
                setCategories(Array.isArray(c) ? c : (c as any).data || []);
            } catch (e) {
                console.error("Failed to load metadata", e);
            }
        };
        loadMetadata();
    }, []);

    // Sync Filters to URL (Debounced)
    useEffect(() => {
        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams);

            if (searchText) params.set('search', searchText);
            else params.delete('search');

            if (priceRange[0] > 0) params.set('min_price', String(priceRange[0]));
            else params.delete('min_price');

            if (priceRange[1] > 0) params.set('max_price', String(priceRange[1]));
            else params.delete('max_price');

            if (sortBy !== 'created_at_desc') params.set('sort', sortBy);
            else params.delete('sort');

            // Removed type_code handling from params since it's hardcoded for this page

            setSearchParams(params, { replace: true });
        }, 600);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText, priceRange, sortBy]);

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params: any = {
                    limit: 1000,
                    sort: searchParams.get('sort') || 'created_at_desc',
                    search: searchParams.get('search') || undefined,
                    brand_id: searchParams.get('brand_id') !== 'all' ? Number(searchParams.get('brand_id')) : undefined,
                    category_id: searchParams.get('category_id') !== 'all' ? Number(searchParams.get('category_id')) : undefined,
                    series_id: searchParams.get('series_id') !== 'all' ? Number(searchParams.get('series_id')) : undefined,
                    type_code: selectedType, // Hardcoded
                    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
                    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
                };

                const res = await productsService.getProducts(params);
                setProducts(Array.isArray(res) ? res : (res as any).data || []);
                setCurrentPage(1);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchParams]);

    // Update Filter Helper
    const updateFilter = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            value === 'all' ? newParams.delete(key) : newParams.set(key, value);
            return newParams;
        }, { replace: true });
    };

    // Pagination Logic
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return products.slice(start, start + ITEMS_PER_PAGE);
    }, [products, currentPage]);

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    // Scroll to top on page change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const getDisplayPrice = (product: any) => {
        if (!product.product_variants || product.product_variants.length === 0) return 'Contact';

        // Find Lowest Price
        const prices = product.product_variants.map((v: any) => Number(v.price));
        const minPrice = Math.min(...prices);

        // Optional: Add "From" prefix if multiple prices exist

        return formatPrice(minPrice);
    };

    const hasActiveFilters = useMemo(() => {
        return searchText ||
            selectedBrand !== 'all' ||
            selectedCategory !== 'all' ||
            selectedSeries !== 'all' ||
            priceRange[0] > 0 ||
            priceRange[1] > 0;
    }, [searchText, selectedBrand, selectedCategory, selectedSeries, priceRange]);

    const clearFilters = () => {
        setPriceRange([0, 0]);
        setSearchText('');
        setSearchParams(prev => {
            const newParams = new URLSearchParams();
            if (prev.get('sort')) newParams.set('sort', prev.get('sort')!);
            return newParams;
        });
    };

    const pageTitle = 'Retail Collection';

    return (
        <CustomerLayout activePage="products">
            <div className="min-h-screen bg-[#F2F2F7] pb-20 font-sans relative overflow-hidden transition-colors duration-500">
                {/* Ambient Background (iOS 26 Style) */}
                {/* Ambient Background (iOS 26 Style) - Optimized */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] ambient-glow-blue rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '8s' }} />
                    <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] ambient-glow-purple rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '10s' }} />
                    <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] ambient-glow-orange rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '12s' }} />
                </div>

                {/* Noise Texture Removed */}

                {/* --- HEADER & FILTERS (Floating Glass Bar) --- */}
                <div className="sticky top-20 z-40 px-4 mb-24">
                    <div className="max-w-7xl mx-auto">
                        <div className="backdrop-blur-2xl bg-white/75 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] p-4 pl-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:bg-white/85 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] group">

                            {/* Title Section */}
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                    {pageTitle}
                                </h1>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search collection..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="w-full h-11 pl-11 pr-4 rounded-2xl bg-slate-100/50 border-0 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all hover:bg-white/80 focus:bg-white"
                                    />
                                </div>

                                {/* Filters Trigger */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className={`h-11 px-5 rounded-2xl border-0 bg-slate-100/50 hover:bg-white/80 transition-all ${hasActiveFilters ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}>
                                            <Filter className="w-4 h-4 mr-2" />
                                            Filters
                                            {hasActiveFilters && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-80 p-5 backdrop-blur-3xl bg-white/80 border-white/40 rounded-[2rem] shadow-[0_24px_64px_rgba(0,0,0,0.08)] mt-2">
                                        <div className="space-y-6">
                                            {/* Price Range */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium text-slate-900">Price Range</h4>
                                                <div className="flex gap-3">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₫</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="Min"
                                                            className="h-10 pl-7 rounded-xl bg-slate-50 border-0 focus:bg-white transition-colors"
                                                            value={priceRange[0] || ''}
                                                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                        />
                                                    </div>
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₫</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="Max"
                                                            className="h-10 pl-7 rounded-xl bg-slate-50 border-0 focus:bg-white transition-colors"
                                                            value={priceRange[1] || ''}
                                                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Brand Filter */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium text-slate-900">Brand</h4>
                                                <Select
                                                    value={searchParams.get('brand_id') || 'all'}
                                                    onValueChange={(val) => updateFilter('brand_id', val)}
                                                >
                                                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-0 focus:bg-white transition-colors">
                                                        <SelectValue placeholder="All Brands" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl bg-white/90 max-h-60">
                                                        <SelectItem value="all">All Brands</SelectItem>
                                                        {brands.map((b: any) => <SelectItem key={b.brand_id} value={String(b.brand_id)}>{b.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Category Filter */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium text-slate-900">Category</h4>
                                                <Select
                                                    value={searchParams.get('category_id') || 'all'}
                                                    onValueChange={(val) => updateFilter('category_id', val)}
                                                >
                                                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-0 focus:bg-white transition-colors">
                                                        <SelectValue placeholder="All Categories" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl bg-white/90 max-h-60">
                                                        <SelectItem value="all">All Categories</SelectItem>
                                                        {categories.map((c: any) => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Clear Filters */}
                                            {hasActiveFilters && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full h-10 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={clearFilters}
                                                >
                                                    Reset Filters
                                                </Button>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Sort */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-slate-100/50">
                                            <ArrowUpDown className="w-5 h-5 text-slate-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 backdrop-blur-xl bg-white/90 shadow-xl mt-2">
                                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => setSortBy('created_at_desc')}>Newest First</DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => setSortBy('price_asc')}>Price: Low to High</DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => setSortBy('price_desc')}>Price: High to Low</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- PRODUCT GRID (Glass Cards) --- */}
                <div className="container mx-auto px-4 relative z-10 max-w-7xl pt-4">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="space-y-4">
                                    <div className="aspect-[4/5] bg-white/40 backdrop-blur-md rounded-3xl animate-pulse" />
                                    <div className="space-y-2 px-2">
                                        <div className="h-4 bg-white/40 w-3/4 animate-pulse rounded-full" />
                                        <div className="h-3 bg-white/40 w-1/2 animate-pulse rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-24 h-24 bg-white/40 backdrop-blur-lg rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/30">
                                <Package className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-2xl text-slate-900 mb-2">No treasures found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-light">
                                Try adjusting your filters to discover something amazing.
                            </p>
                            <Button onClick={clearFilters} variant="outline" className="rounded-full px-8 h-12 border-slate-200 bg-white/50 backdrop-blur-md hover:bg-white text-slate-700">
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {paginatedProducts.map(product => {
                                    // Image Swap Logic
                                    const mainImage = product.media_urls?.[0];
                                    // Try to find a secondary image for hover effect
                                    const hoverImage = product.media_urls?.[1] || product.product_variants?.[0]?.media_assets?.[0]?.url;

                                    return (
                                        <div
                                            key={product.product_id}
                                            className="group relative flex flex-col gap-3 cursor-pointer gpu-layer"
                                            onClick={() => navigate(`/customer/product/${product.product_id}`)}
                                        >
                                            {/* Glass Card Image */}
                                            <div className="aspect-[4/5] relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white/30 transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group-hover:-translate-y-2 group-hover:bg-white/60">
                                                {mainImage ? (
                                                    <img
                                                        src={mainImage}
                                                        alt={product.name}
                                                        className={cn( // @ts-ignore
                                                            "w-full h-full object-cover transition-all duration-700 ease-out",
                                                            hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105" // If no swap, just zoom
                                                        )}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package className="w-10 h-10" />
                                                    </div>
                                                )}

                                                {/* Hover Image (Absolute, starts hidden, fades in) */}
                                                {hoverImage && (
                                                    <img
                                                        src={hoverImage}
                                                        alt={product.name + " hover"}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-105"
                                                        loading="lazy"
                                                    />
                                                )}

                                                {/* Floating Badge */}
                                                {Number(product.product_variants?.[0]?.stock_available || 0) <= 0 ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                        <span className="bg-black/80 text-yellow-400 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg backdrop-blur-sm">
                                                            SOLD OUT
                                                        </span>
                                                    </div>
                                                ) : product.status_code === 'IN_STOCK' && (
                                                    <div className="absolute top-3 left-3">
                                                        <div className="bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20">
                                                            IN STOCK
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Hover Actions with Glass Effect */}
                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                                    <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center text-slate-800 shadow-lg hover:bg-white hover:scale-110 transition-all border border-white/50">
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button className="h-10 w-10 rounded-full bg-slate-900/80 backdrop-blur-xl flex items-center justify-center text-white shadow-lg hover:bg-slate-900 hover:scale-110 transition-all border border-white/10">
                                                        <ShoppingCart className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="px-2 space-y-1">
                                                <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                                                    {product.brands?.name || 'FigiCore'}
                                                </div>

                                                <h3 className="text-base font-medium leading-tight text-slate-800 line-clamp-2 min-h-[2.5rem]">
                                                    {product.name}
                                                </h3>

                                                <div className="text-lg font-semibold text-slate-900/90 pt-1">
                                                    {getDisplayPrice(product)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination (Glass Buttons) */}
                            {totalPages > 1 && (
                                <div className="mt-20 flex justify-center items-center gap-6">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-full w-14 h-14 border-0 bg-white/50 backdrop-blur-md hover:bg-white hover:shadow-lg disabled:opacity-30 transition-all"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <span className="text-sm font-semibold text-slate-500 font-mono tracking-widest bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                                        PAGE {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="rounded-full w-14 h-14 border-0 bg-white/50 backdrop-blur-md hover:bg-white hover:shadow-lg disabled:opacity-30 transition-all"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
