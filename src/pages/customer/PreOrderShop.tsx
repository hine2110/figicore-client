import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Package,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    ArrowUpDown,
    Lock
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

export default function PreOrderShop() {
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
    const selectedType = 'PREORDER'; // Hardcoded

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

            setSearchParams(params, { replace: true });
        }, 600);
        return () => clearTimeout(timeout);
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

    const updateFilter = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            value === 'all' ? newParams.delete(key) : newParams.set(key, value);
            return newParams;
        }, { replace: true });
    };

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

    return (
        <CustomerLayout activePage="pre-order">
            {/* DARK BACKGROUND */}
            <div className="min-h-screen bg-[#050505] pb-20 font-sans relative overflow-hidden transition-colors duration-500">

                {/* Ambient Effects */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-amber-500/5 blur-[120px] rounded-full opacity-50" />
                </div>

                <div className="container mx-auto px-4 relative z-10 max-w-7xl pt-12">

                    {/* 1. TYPOGRAPHIC HEADER */}
                    <div className="relative py-16 mb-12 text-center text-white">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10 space-y-6">
                            <h1 className="text-[60px] md:text-[120px] leading-[0.85] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/20 select-none uppercase font-sans drop-shadow-2xl">
                                THE VAULT
                            </h1>
                            <div className="flex items-center justify-center gap-4 opacity-80">
                                <div className="h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-amber-500/50" />
                                <p className="font-mono text-amber-500 text-xs md:text-sm tracking-[0.3em] uppercase glow-sm">
                                    // Secure Your Allocation
                                </p>
                                <div className="h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-amber-500/50" />
                            </div>
                        </div>
                    </div>

                    {/* 2. MINIMALIST FILTER BAR */}
                    <div className="sticky top-24 z-40 mb-16">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-full p-2 pl-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm font-mono uppercase tracking-wider">Access Granted</span>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH_DATABASE..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-900 border border-white/5 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-xs font-mono text-white placeholder-slate-600 transition-all outline-none uppercase"
                                    />
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className={`h-10 px-4 rounded-full border border-white/5 bg-slate-900 hover:bg-slate-800 transition-all ${hasActiveFilters ? 'text-amber-500 border-amber-500/30' : 'text-slate-400'}`}>
                                            <Filter className="w-3.5 h-3.5 mr-2" />
                                            <span className="text-xs font-mono uppercase">Filter</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-80 p-5 backdrop-blur-3xl bg-black/95 border-white/10 rounded-2xl shadow-2xl mt-2 text-white">
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest">Price Estimation</h4>
                                                <div className="flex gap-3">
                                                    <Input type="number" placeholder="MIN" className="h-9 bg-slate-900 border-white/10 text-white font-mono text-xs rounded-lg" value={priceRange[0] || ''} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} />
                                                    <Input type="number" placeholder="MAX" className="h-9 bg-slate-900 border-white/10 text-white font-mono text-xs rounded-lg" value={priceRange[1] || ''} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest">Manufacturer</h4>
                                                <Select value={searchParams.get('brand_id') || 'all'} onValueChange={(val) => updateFilter('brand_id', val)}>
                                                    <SelectTrigger className="w-full h-9 bg-slate-900 border-white/10 text-white font-mono text-xs rounded-lg"><SelectValue placeholder="ALL" /></SelectTrigger>
                                                    <SelectContent className="bg-black border-white/10 text-white">
                                                        <SelectItem value="all">ALL</SelectItem>
                                                        {brands.map((b: any) => <SelectItem key={b.brand_id} value={String(b.brand_id)}>{b.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest">Category</h4>
                                                <Select value={searchParams.get('category_id') || 'all'} onValueChange={(val) => updateFilter('category_id', val)}>
                                                    <SelectTrigger className="w-full h-9 bg-slate-900 border-white/10 text-white font-mono text-xs rounded-lg"><SelectValue placeholder="ALL" /></SelectTrigger>
                                                    <SelectContent className="bg-black border-white/10 text-white">
                                                        <SelectItem value="all">ALL</SelectItem>
                                                        {categories.map((c: any) => <SelectItem key={c.category_id} value={String(c.category_id)}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {hasActiveFilters && <Button variant="destructive" className="w-full h-9 text-xs font-mono rounded-lg" onClick={clearFilters}>RESET PARAMETERS</Button>}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-white/5 bg-slate-900 hover:bg-slate-800 text-slate-400">
                                            <ArrowUpDown className="w-3.5 h-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/10 text-white backdrop-blur-xl rounded-xl">
                                        <DropdownMenuItem className="text-xs font-mono uppercase hover:bg-white/10 cursor-pointer" onClick={() => setSortBy('created_at_desc')}>Newest Entry</DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs font-mono uppercase hover:bg-white/10 cursor-pointer" onClick={() => setSortBy('price_asc')}>Cost: Low - High</DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs font-mono uppercase hover:bg-white/10 cursor-pointer" onClick={() => setSortBy('price_desc')}>Cost: High - Low</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* 3. CONTAINMENT UNIT GRID */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="aspect-[4/5] bg-slate-900/50 rounded-none border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center text-slate-500 font-mono">
                            <Lock className="w-12 h-12 mb-4 opacity-50" />
                            <h3 className="text-lg text-white mb-2 uppercase tracking-widest">Vault Empty</h3>
                            <p className="text-xs">No matching artifacts found.</p>
                            <Button onClick={clearFilters} variant="link" className="text-amber-500 mt-4 text-xs tracking-widest uppercase">Clear Protocol</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {paginatedProducts.map(product => {
                                // Logic for price/display
                                const variants = product.product_variants || [];
                                // Find variant with lowest positive deposit, or fallback to first
                                // Find variant with lowest positive deposit, or fallback to first
                                const bestVariant = variants.reduce((prev: any, curr: any) => {
                                    const prevDep = Number(prev?.product_preorder_configs?.deposit_amount || 0);
                                    const currDep = Number(curr?.product_preorder_configs?.deposit_amount || 0);
                                    // If current has valid deposit and (prev is invalid OR current is cheaper), pick current
                                    return (currDep > 0 && (prevDep === 0 || currDep < prevDep)) ? curr : prev;
                                }, variants[0]);

                                const minDep = Number(bestVariant?.product_preorder_configs?.deposit_amount || 0);
                                const fullPrice = Number(bestVariant?.product_preorder_configs?.full_price || 0);
                                const mainImage = product.media_urls?.[0];
                                const hoverImage = product.media_urls?.[1] || product.product_variants?.[0]?.media_assets?.[0]?.url;

                                return (
                                    <div
                                        key={product.product_id}
                                        onClick={() => navigate(`/customer/product/${product.product_id}`)}
                                        className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-[2rem] border border-white/5 p-4 transition-all duration-500 hover:bg-zinc-900/60 hover:shadow-[0_0_50px_-10px_rgba(245,158,11,0.15)] cursor-pointer"
                                    >
                                        {/* Image Container */}
                                        <div className="aspect-[3/4] relative overflow-hidden bg-black/50 mb-4 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                                            {/* Top Indicators */}
                                            <div className="absolute top-2 left-2 flex gap-1 z-10">
                                                <Badge className="bg-amber-500/90 backdrop-blur-md text-black border-0 rounded-full text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wide">Pre-Order</Badge>
                                            </div>

                                            {mainImage ? (
                                                <img
                                                    src={mainImage}
                                                    alt={product.name}
                                                    className={cn( // @ts-ignore
                                                        "w-full h-full object-cover transition-all duration-700 ease-out brightness-[0.75] grayscale-[20%] group-hover:grayscale-0 group-hover:brightness-100",
                                                        hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                                                    )}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-800 bg-black"><Package className="w-8 h-8" /></div>
                                            )}

                                            {/* Hover Image */}
                                            {hoverImage && (
                                                <img
                                                    src={hoverImage}
                                                    alt={product.name + " hover"}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-105"
                                                    loading="lazy"
                                                />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col space-y-3">
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                                    {product.brands?.name || 'Unknown Manufacturer'}
                                                </div>
                                                <h3 className="text-white font-bold text-sm md:text-base leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                                                    {product.name}
                                                </h3>
                                            </div>

                                            <div className="flex-1" /> {/* Spacer */}

                                            {/* Pricing Grid */}
                                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 font-mono">
                                                <div>
                                                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Deposit</span>
                                                    <span className="text-lg text-white font-bold tracking-tight">{formatPrice(minDep)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Full Price</span>
                                                    <span className="text-xs text-slate-400 font-mono">{formatPrice(fullPrice)}</span>
                                                </div>
                                            </div>

                                            {/* ETA */}
                                            <div className="text-[9px] font-mono text-slate-600 text-center pt-2 uppercase">
                                                ETA: {bestVariant?.product_preorder_configs?.release_date ? new Date(bestVariant.product_preorder_configs.release_date).toLocaleDateString() : 'TBA'}
                                            </div>
                                        </div>


                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* 4. PAGINATION (Industrial Style) */}
                    {totalPages > 1 && (
                        <div className="my-20 flex justify-center items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-12 h-12 rounded-none border border-white/10 bg-black text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all disabled:opacity-20"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="px-6 py-3 bg-black border border-white/10 text-xs font-mono text-amber-500 tracking-[0.2em]">
                                PAGE {currentPage.toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-12 h-12 rounded-none border border-white/10 bg-black text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all disabled:opacity-20"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
