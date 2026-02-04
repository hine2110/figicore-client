import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateProductModal } from "@/components/product/CreateProductModal";
import { ProductList } from "@/components/product/ProductList";
import { productsService } from "@/services/products.service";
import { optionsService } from "@/services/options.service";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const ITEMS_PER_PAGE_OPTIONS = [8, 12, 24, 48];

export default function Inventory() {
    const { toast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Filter State
    const [filters, setFilters] = useState({
        brand_id: undefined as number | undefined,
        category_id: undefined as number | undefined,
        series_id: undefined as number | undefined,
        type_code: undefined as string | undefined
    });

    // Options for Filters
    const [brands, setBrands] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [series, setSeries] = useState<any[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isViewMode, setIsViewMode] = useState(false);

    // Initial Filter Options Fetch
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [b, c, s] = await Promise.all([
                    optionsService.getBrands(),
                    optionsService.getCategories(),
                    optionsService.getSeries()
                ]);
                setBrands(b);
                setCategories(c);
                setSeries(s);
            } catch (err) {
                console.error("Failed to load filter options", err);
            }
        };
        fetchOptions();
    }, []);

    // Search Debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    // Fetch Products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await productsService.getProducts({
                search: debouncedSearch,
                ...filters
            });
            setProducts(Array.isArray(data) ? data : (data as any)?.data || []);
        } catch (error) {
            console.error("Failed to fetch products", error);
            toast({ title: "Error", description: "Failed to load inventory data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when search or filters change
    useEffect(() => {
        fetchProducts();
        setCurrentPage(1); // Reset page on filter change
    }, [debouncedSearch, filters]);

    // Client-side Pagination Logic
    const displayedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return products.slice(startIndex, endIndex);
    }, [products, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(products.length / itemsPerPage);

    // Handlers
    const handleCreate = () => {
        setSelectedProduct(null);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (product: any) => {
        setSelectedProduct(product);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleView = (product: any) => {
        setSelectedProduct(product);
        setIsViewMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await productsService.delete(id);
            setProducts(prev => prev.filter(p => p.product_id !== id));
            toast({ title: "Deleted", description: "Product removed from inventory.", className: "bg-red-600 text-white border-none" });
        } catch (error) {
            console.error(error);
            toast({ title: "Delete Failed", description: "Could not remove product.", variant: "destructive" });
        }
    };

    const handleModalSuccess = () => {
        fetchProducts();
        setIsModalOpen(false);
        toast({ title: "Success", description: "Product saved successfully.", className: "bg-green-600 text-white border-none" });
    };

    const clearFilters = () => {
        setFilters({ brand_id: undefined, category_id: undefined, series_id: undefined, type_code: undefined });
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== undefined).length;

    return (
        <div className="flex flex-col h-screen bg-[#F5F5F7] overflow-hidden">

            {/* 1. FIXED HEADER */}
            <header className="px-6 py-5 shrink-0 bg-[#F5F5F7] z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory</h1>
                    <p className="text-neutral-500 font-medium">Manage catalog and pricing.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                    {/* Floating Search */}
                    <div className="relative w-full sm:w-[320px] shadow-sm group">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Search products..."
                            className="pl-10 h-11 rounded-full border-none bg-white shadow-[0_2px_10px_rgb(0,0,0,0.03)] focus:shadow-[0_4px_20px_rgb(0,0,0,0.08)] ring-0 focus-visible:ring-0 transition-all placeholder:text-neutral-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="secondary"
                                    className={cn(
                                        "h-11 rounded-full px-5 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:bg-neutral-50 text-neutral-700 font-medium border-none",
                                        activeFilterCount > 0 && "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    )}
                                >
                                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                                    Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[340px] p-5 rounded-2xl shadow-xl border-neutral-100" align="end">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-neutral-900">Filter Inventory</h4>
                                        {activeFilterCount > 0 && (
                                            <button onClick={clearFilters} className="text-xs text-red-500 hover:underline font-medium flex items-center">
                                                <X className="w-3 h-3 mr-1" /> Clear All
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider ml-1">Brand</label>
                                            <Select value={filters.brand_id?.toString()} onValueChange={(v) => setFilters(prev => ({ ...prev, brand_id: Number(v) }))}>
                                                <SelectTrigger className="h-10 rounded-xl bg-neutral-50 border-transparent focus:ring-0"><SelectValue placeholder="All Brands" /></SelectTrigger>
                                                <SelectContent>
                                                    {brands.map((b: any) => <SelectItem key={b.brand_id} value={b.brand_id.toString()}>{b.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider ml-1">Category</label>
                                            <Select value={filters.category_id?.toString()} onValueChange={(v) => setFilters(prev => ({ ...prev, category_id: Number(v) }))}>
                                                <SelectTrigger className="h-10 rounded-xl bg-neutral-50 border-transparent focus:ring-0"><SelectValue placeholder="Any" /></SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((c: any) => <SelectItem key={c.category_id} value={c.category_id.toString()}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider ml-1">Series</label>
                                            <Select value={filters.series_id?.toString()} onValueChange={(v) => setFilters(prev => ({ ...prev, series_id: Number(v) }))}>
                                                <SelectTrigger className="h-10 rounded-xl bg-neutral-50 border-transparent focus:ring-0"><SelectValue placeholder="Any" /></SelectTrigger>
                                                <SelectContent>
                                                    {series.map((s: any) => <SelectItem key={s.series_id} value={s.series_id.toString()}>{s.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider ml-1">Product Type</label>
                                            <Select value={filters.type_code} onValueChange={(v) => setFilters(prev => ({ ...prev, type_code: v }))}>
                                                <SelectTrigger className="h-10 rounded-xl bg-neutral-50 border-transparent focus:ring-0"><SelectValue placeholder="All Types" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="RETAIL">Retail</SelectItem>
                                                    <SelectItem value="BLINDBOX">Blindbox</SelectItem>
                                                    <SelectItem value="PREORDER">Preorder</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            className="h-11 rounded-full bg-black hover:bg-neutral-800 text-white shadow-md shadow-black/20 px-6 font-medium"
                            onClick={handleCreate}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Product
                        </Button>
                    </div>
                </div>
            </header>

            {/* 2. SCROLLABLE CONTENT */}
            <main className="flex-1 overflow-y-auto px-6 pb-6">
                {loading && products.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    </div>
                ) : (
                    <ProductList
                        products={displayedProducts}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                    />
                )}
            </main>

            {/* 3. FIXED PAGINATION FOOTER */}
            <footer className="shrink-0 bg-white/80 backdrop-blur-md border-t border-neutral-200 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-medium text-neutral-600 transition-all">
                <div className="flex items-center gap-4">
                    <span className="text-neutral-500">
                        Showing <span className="text-neutral-900">{products.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-neutral-900">{Math.min(currentPage * itemsPerPage, products.length)}</span> of <span className="text-neutral-900">{products.length}</span> items
                    </span>

                    <div className="h-4 w-px bg-neutral-300 hidden sm:block"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 uppercase font-bold hidden sm:inline">Per Page</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-16 rounded-lg border-neutral-200 bg-white text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {ITEMS_PER_PAGE_OPTIONS.map(opt => <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="px-2 text-neutral-900 font-semibold min-w-[3rem] text-center">
                        {currentPage} <span className="text-neutral-400 font-normal">/ {totalPages || 1}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages && products.length > 0}
                    >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </footer>

            {/* MODAL */}
            <CreateProductModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setSelectedProduct(null);
                }}
                onSuccess={handleModalSuccess}
                productToEdit={selectedProduct}
                isViewMode={isViewMode}
            />
        </div>
    );
}