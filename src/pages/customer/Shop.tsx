import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    Package,
    X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productsService } from '@/services/products.service';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";



export default function CustomerShop() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data States
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [series, setSeries] = useState<any[]>([]);

    // Filter States
    const [searchText, setSearchText] = useState(searchParams.get('search') || '');
    const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get('brand_id') || 'all');
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category_id') || 'all');
    const [selectedSeries, setSelectedSeries] = useState<string>(searchParams.get('series_id') || 'all');
    const [selectedType, setSelectedType] = useState<string>(searchParams.get('type_code') || 'all');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState<string>('created_at_desc');

    const [isFilterOpen, setIsFilterOpen] = useState(false); // Mobile filter toggle

    // Initial Load: Metadata
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [b, c, s] = await Promise.all([
                    productsService.getEntities('brands'),
                    productsService.getEntities('categories'),
                    productsService.getEntities('series') // Ensure endpoint exists or handle error
                ]);
                setBrands(Array.isArray(b) ? b : (b as any).data || []);
                setCategories(Array.isArray(c) ? c : (c as any).data || []);
                setSeries(Array.isArray(s) ? s : (s as any).data || []);
            } catch (e) {
                console.error("Failed to load metadata", e);
            }
        };
        loadMetadata();
    }, []);

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params: any = {
                    limit: 50, // Default limit
                    sort: sortBy
                };

                if (searchText) params.search = searchText;
                if (selectedBrand !== 'all') params.brand_id = Number(selectedBrand);
                if (selectedCategory !== 'all') params.category_id = Number(selectedCategory);
                if (selectedSeries !== 'all') params.series_id = Number(selectedSeries);
                if (selectedType !== 'all') params.type_code = selectedType;

                if (priceRange.min) params.min_price = Number(priceRange.min);
                if (priceRange.max) params.max_price = Number(priceRange.max);

                const res = await productsService.getProducts(params);
                setProducts(Array.isArray(res) ? res : (res as any).data || []);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce fetch
        const timeout = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timeout);
    }, [searchText, selectedBrand, selectedCategory, selectedSeries, selectedType, priceRange, sortBy]);

    // Update URL Params
    useEffect(() => {
        const params: any = {};
        if (searchText) params.search = searchText;
        if (selectedBrand !== 'all') params.brand_id = selectedBrand;
        if (selectedCategory !== 'all') params.category_id = selectedCategory;
        if (selectedSeries !== 'all') params.series_id = selectedSeries;
        if (selectedType !== 'all') params.type_code = selectedType;
        setSearchParams(params);
    }, [searchText, selectedBrand, selectedCategory, selectedSeries, selectedType, setSearchParams]);

    // Formatters
    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const getDisplayPrice = (product: any) => {
        if (product.type_code === 'PREORDER') {
            const dep = Number(product.product_preorders?.deposit_amount || 0);
            return isNaN(dep) ? 'Contact for Price' : `Dep: ${formatPrice(dep)}`;
        }
        if (product.type_code === 'BLINDBOX') {
            const p = Number(product.product_blindboxes?.price || 0);
            return isNaN(p) ? 'Contact for Price' : formatPrice(p);
        }
        // Retail
        const p = Number(product.product_variants?.[0]?.price || 0);
        return isNaN(p) ? 'Contact for Price' : formatPrice(p);
    };

    return (
        <CustomerLayout activePage="products">
            <div className="bg-[#fcfcfc] min-h-screen pb-20 font-sans text-neutral-800">
                <div className="container mx-auto px-4 py-8">

                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-light text-neutral-900 mb-2">Collection</h1>
                            <p className="text-neutral-500">Curated figures and collectibles.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="md:hidden w-full flex items-center justify-between"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            Filters <Filter className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* --- SIDEBAR FILTERS --- */}
                        <div className={`lg:w-64 space-y-6 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>

                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Search</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <Input
                                        placeholder="Keywords..."
                                        className="pl-9 bg-white"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Price Range</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Min"
                                        type="number"
                                        className="bg-white"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="Max"
                                        type="number"
                                        className="bg-white"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}

                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Type</label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="All Basic Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="RETAIL">Retail</SelectItem>
                                        <SelectItem value="BLINDBOX">Blind Box</SelectItem>
                                        <SelectItem value="PREORDER">Pre-order</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Brand</label>
                                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="All Brands" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Brands</SelectItem>
                                        {brands.map(b => (
                                            <SelectItem key={b.brand_id} value={String(b.brand_id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Category</label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c.category_id} value={String(c.category_id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Series</label>
                                <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="All Series" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Series</SelectItem>
                                        {series.map(s => (
                                            <SelectItem key={s.series_id} value={String(s.series_id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear Filters */}
                            <Button
                                variant="ghost"
                                className="w-full text-neutral-500 hover:text-red-500"
                                onClick={() => {
                                    setSearchText('');
                                    setSelectedBrand('all');
                                    setSelectedCategory('all');
                                    setSelectedSeries('all');
                                    setSelectedType('all');
                                    setPriceRange({ min: '', max: '' });
                                }}
                            >
                                <X className="w-4 h-4 mr-2" /> Clear All Filters
                            </Button>

                        </div>

                        {/* --- PRODUCT GRID --- */}
                        <div className="flex-1">
                            {/* Sort Bar */}
                            <div className="flex justify-end mb-6">
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px] bg-white">
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at_desc">Newest Arrivals</SelectItem>
                                        <SelectItem value="created_at_asc">Oldest</SelectItem>
                                        {/* Requires backend sort logic for price IF backend supports it. Assuming standard sort names */}
                                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className="bg-white rounded-xl aspect-[3/4] animate-pulse border border-neutral-100"></div>
                                    ))}
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100 border-dashed">
                                    <Package className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                                    <h3 className="text-lg font-medium text-neutral-900">No products found</h3>
                                    <p className="text-neutral-500">Try adjusting your filters.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map(product => (
                                        <Card
                                            key={product.product_id}
                                            className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden cursor-pointer flex flex-col bg-white"
                                            onClick={() => navigate(`/customer/product/${product.product_id}`)}
                                        >
                                            <div className="aspect-[3/3.5] relative bg-neutral-100 overflow-hidden">
                                                {product.media_urls?.[0] ? (
                                                    <img
                                                        src={product.media_urls[0]}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-300"><Package className="w-8 h-8" /></div>
                                                )}
                                                {product.type_code !== 'RETAIL' && (
                                                    <div className="absolute top-2 left-2">
                                                        <Badge variant="secondary" className="bg-white/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                            {product.type_code}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1">{product.brands?.name || 'FigiCore'}</div>
                                                <h3 className="font-medium text-neutral-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors" title={product.name}>
                                                    {product.name}
                                                </h3>
                                                <div className="mt-auto pt-3 border-t border-neutral-50 flex items-center justify-between">
                                                    <span className="font-bold text-neutral-900">
                                                        {getDisplayPrice(product)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
