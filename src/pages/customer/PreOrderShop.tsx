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
    Lock,
    X,
    Sparkles,
    Clock,
    CalendarDays,
    Flame
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { motion, AnimatePresence } from 'framer-motion';

export default function PreOrderShop() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data States
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isVisualSearch, setIsVisualSearch] = useState(false);

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
        // Check for visual search results first
        if (location.state?.isVisualSearch && location.state?.visualSearchData) {
            const filtered = location.state.visualSearchData.filter(
                (p: any) => p.type_code === 'PREORDER'
            );
            if (filtered.length > 0) {
                setProducts(filtered);
                setIsVisualSearch(true);
                setLoading(false);
                return;
            }
        }

        const fetchProducts = async () => {
            setLoading(true);
            setIsVisualSearch(false);
            try {
                const params: any = {
                    limit: 1000,
                    sort: searchParams.get('sort') || 'created_at_desc',
                    search: searchParams.get('search') || undefined,
                    brand_id: searchParams.get('brand_id') !== 'all' ? Number(searchParams.get('brand_id')) : undefined,
                    category_id: searchParams.get('category_id') !== 'all' ? Number(searchParams.get('category_id')) : undefined,
                    series_id: searchParams.get('series_id') !== 'all' ? Number(searchParams.get('series_id')) : undefined,
                    type_code: selectedType,
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
    }, [searchParams, location.state]);

    const updateFilter = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            value === 'all' ? newParams.delete(key) : newParams.set(key, value);
            return newParams;
        }, { replace: true });
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

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

    const isSearchingOrFiltering = hasActiveFilters || isVisualSearch;
    
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return products.slice(start, start + ITEMS_PER_PAGE);
    }, [products, currentPage]);

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.4 } }
    };

    return (
        <CustomerLayout activePage="pre-order">
            <div className="min-h-screen bg-[#F2F2F7] pb-20 font-sans relative overflow-hidden transition-colors duration-500">
                {/* AMBIENT BACKGROUND (RETAIL-SYNCED) */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] ambient-glow-blue rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '8s' }} />
                    <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] ambient-glow-purple rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '10s' }} />
                    <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] ambient-glow-orange rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '12s' }} />
                </div>

                <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl pt-8">
                    
                    {/* 1. COMPACT CAMPAIGN HEADER */}
                    <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-300/50 pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 shadow-sm">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest text-amber-600">Pre-Order Catalog</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                                Secure Your Slot
                            </h1>
                            <p className="text-slate-500 mt-2 max-w-md text-sm">Browse all upcoming campaigns and reserve your allocation before retail drop.</p>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex items-center gap-3 w-full md:w-auto bg-white/60 backdrop-blur-xl p-2 rounded-2xl border border-white/50 shadow-sm">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search models..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="w-full h-10 pl-9 pr-10 rounded-xl bg-slate-100/50 border-0 focus:ring-2 focus:ring-amber-500/20 text-sm transition-all focus:bg-white text-slate-700"
                                />
                                {searchText && (
                                    <button onClick={() => setSearchText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className={cn(
                                        "h-10 px-4 rounded-xl transition-all font-medium border border-transparent",
                                        hasActiveFilters ? "bg-amber-50 text-amber-600 border-amber-200" : "hover:bg-slate-100/80 text-slate-600"
                                    )}>
                                        <Filter className="w-4 h-4 mr-2" />
                                        Filters {hasActiveFilters && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80 p-5 backdrop-blur-3xl bg-white/90 border-white/40 rounded-[2rem] shadow-xl mt-2">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-slate-900">Brand</h4>
                                            <Select value={searchParams.get('brand_id') || 'all'} onValueChange={(val) => updateFilter('brand_id', val)}>
                                                <SelectTrigger className="w-full h-10 rounded-xl bg-slate-50 border-0"><SelectValue placeholder="All Brands" /></SelectTrigger>
                                                <SelectContent className="rounded-2xl border-white/20 bg-white"><SelectItem value="all">All Brands</SelectItem>
                                                    {brands.map((b: any) => <SelectItem key={b.brand_id} value={String(b.brand_id)}>{b.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {hasActiveFilters && (
                                            <Button variant="ghost" className="w-full h-10 rounded-xl text-amber-600 hover:bg-amber-50" onClick={clearFilters}>
                                                Clear All
                                            </Button>
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100/80">
                                        <ArrowUpDown className="w-4 h-4 text-slate-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/20 backdrop-blur-xl bg-white/90 shadow-xl mt-2">
                                    <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => setSortBy('created_at_desc')}>Newest First</DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => setSortBy('price_asc')}>Deposit: Low to High</DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => setSortBy('price_desc')}>Deposit: High to Low</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {isVisualSearch && (
                        <div className="mb-8 p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-xl border border-amber-200 shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <div>
                                    <p className="font-bold text-slate-800">Visual Search Results</p>
                                    <p className="text-sm text-slate-500">Found {products.length} pre-order matches.</p>
                                </div>
                            </div>
                            <Button onClick={() => { navigate(location.pathname, { replace: true, state: {} }); setIsVisualSearch(false); }} variant="outline" className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50">
                                Clear Search
                            </Button>
                        </div>
                    )}

                    {/* 2. TICKET-STYLE GRID FOR 20+ PRODUCTS */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-80 bg-white/40 rounded-[2rem] animate-pulse" />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Package className="w-16 h-16 text-slate-300 mb-4" />
                            <h3 className="font-semibold text-2xl text-slate-800">No campaigns active</h3>
                            <p className="text-slate-500 mt-2">Adjust your filters or check back later.</p>
                            <Button onClick={clearFilters} variant="outline" className="mt-6 rounded-full px-8 h-12">
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden" animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                        >
                            {paginatedProducts.map(p => {
                                const v = (p.product_variants || []).reduce((prev: any, curr: any) => {
                                    const pd = Number(prev?.product_preorder_configs?.deposit_amount || 0);
                                    const cd = Number(curr?.product_preorder_configs?.deposit_amount || 0);
                                    return (cd > 0 && (pd === 0 || cd < pd)) ? curr : prev;
                                }, (p.product_variants || [])[0]);
                                
                                const dep = Number(v?.product_preorder_configs?.deposit_amount || 0);
                                const full = Number(v?.product_preorder_configs?.full_price || 0);
                                const total = v?.product_preorder_configs?.total_slots || 0;
                                const sold = v?.product_preorder_configs?.sold_slots || 0;
                                const rem = total - sold;
                                const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
                                const isLow = pct >= 80;
                                
                                return (
                                    <motion.div
                                        variants={itemVariants}
                                        key={p.product_id}
                                        onClick={() => navigate(`/customer/product/${p.product_id}`)}
                                        className="group relative flex flex-col gap-3 cursor-pointer gpu-layer"
                                    >
                                        {/* Image Container with Hover Effect */}
                                        <div className="aspect-[4/5] relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white/30 transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(217,119,6,0.15)] group-hover:-translate-y-2 group-hover:border-amber-400/50">
                                            
                                            {/* Pre-Order Highlight Badge */}
                                            <div className="absolute top-3 left-3 z-20">
                                                <div className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-amber-400/20 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> Pre-Order
                                                </div>
                                            </div>

                                            {/* Sold Out Overlay */}
                                            {rem <= 0 && (
                                                <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                                    <span className="bg-black/80 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">
                                                        SOLD OUT
                                                    </span>
                                                </div>
                                            )}

                                            {p.media_urls?.[0] ? (
                                                <img
                                                    src={p.media_urls[0]}
                                                    alt={p.name}
                                                    className={cn( // @ts-ignore
                                                        "w-full h-full object-cover transition-all duration-700 ease-out",
                                                        p.media_urls?.[1] || p.product_variants?.[0]?.media_assets?.[0]?.url ? "group-hover:opacity-0" : "group-hover:scale-105"
                                                    )}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-10 h-10" /></div>
                                            )}

                                            {/* Hover Image */}
                                            {(p.media_urls?.[1] || p.product_variants?.[0]?.media_assets?.[0]?.url) && (
                                                <img
                                                    src={p.media_urls?.[1] || p.product_variants?.[0]?.media_assets?.[0]?.url}
                                                    alt={p.name + " hover"}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-105 group-hover:scale-110"
                                                    loading="lazy"
                                                />
                                            )}
                                        </div>

                                        {/* Minimal Content Container synced with Retail but tinted Amber */}
                                        <div className="px-2 space-y-2">
                                            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex justify-between items-center">
                                                <span>{p.brands?.name || 'Unknown'}</span>
                                            </div>
                                            
                                            <h3 className="text-base font-medium leading-tight text-slate-800 line-clamp-2 min-h-[2.5rem] group-hover:text-amber-700 transition-colors">
                                                {p.name}
                                            </h3>

                                            {/* Pricing layout adapted for Pre-Order */}
                                            <div className="pt-2">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Deposit</span>
                                                        <span className="text-lg font-bold text-slate-900 tracking-tight">{formatPrice(dep)}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Full Price</span>
                                                        <span className="text-xs font-medium text-slate-500">{formatPrice(full)}</span>
                                                    </div>
                                                </div>

                                                {/* SLOT PROGRESS BAR - Elegant Gold */}
                                                <div className="space-y-1.5 bg-amber-50/50 p-2 rounded-xl border border-amber-100/50">
                                                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                                                        <span className="text-slate-500">Slots</span>
                                                        <span className={cn(
                                                            rem <= 0 ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-amber-600'
                                                        )}>
                                                            {rem <= 0 ? 'SOLD OUT' : `${rem}/${total}`}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000 ease-out", isLow ? "bg-orange-500" : "bg-amber-500")}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-12 mb-8 flex justify-center items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-full w-12 h-12 bg-white/50 backdrop-blur-md">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <span className="text-sm font-semibold text-slate-500 bg-white/30 px-4 py-2 rounded-lg">
                                Page {currentPage} / {totalPages}
                            </span>
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-full w-12 h-12 bg-white/50 backdrop-blur-md">
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
