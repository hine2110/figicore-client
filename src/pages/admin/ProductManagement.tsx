import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductList } from '@/components/product/ProductList';
import { CreateProductModal } from '@/components/product/CreateProductModal';
import { productsService } from '@/services/products.service';
import { useToast } from '@/components/ui/use-toast';

export default function ProductManagement() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<any>(null);

    const { toast } = useToast();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await productsService.getProducts({ search });
            // Handle different API response structures just in case
            setProducts(Array.isArray(data) ? data : (data as any)?.data || []);
        } catch (error) {
            console.error("Failed to fetch products", error);
            // toast({ variant: "destructive", title: "Error", description: "Failed to load products." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [search]); // Re-fetch on search debouncing could be added here

    // Handlers
    const handleCreate = () => {
        setActiveProduct(null); // Clear edit state
        setIsModalOpen(true);
    };

    const handleEdit = (product: any) => {
        setActiveProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await productsService.delete(id);
            fetchProducts();
            // toast({ title: "Success", description: "Product deleted." });
        } catch (error) {
            console.error(error);
            alert("Failed to delete product");
        }
    };

    const handleSuccess = () => {
        fetchProducts();
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Product Management</h1>
                    <p className="text-neutral-500">Add, edit, and organize product catalog.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchProducts} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Product
                    </Button>
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-neutral-200 shrink-0">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Search products..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="text-neutral-600 gap-2">
                    <Filter className="w-4 h-4" /> Filter
                </Button>
            </div>

            {/* GRID CONTENT */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-10">
                {loading && products.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <ProductList
                        products={products}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            <CreateProductModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setActiveProduct(null);
                }}
                onSuccess={handleSuccess}
                productToEdit={activeProduct}
            />
        </div>
    );
}
