import { useState, useEffect } from "react";
import { Plus, Search, Filter, Loader2, Edit, Package, RefreshCw, Box, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateProductModal } from "@/components/product/CreateProductModal";
import { productsService } from "@/services/products.service";
import { cn } from "@/lib/utils";

import { Switch } from "@/components/ui/switch";

export default function Inventory() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await productsService.getProducts({ search });
            setProducts(Array.isArray(data) ? data : (data as any)?.data || []);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 500); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [search]);

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

    const handleToggleStatus = async (product: any) => {
        try {
            // Optimistic update
            const newStatus = product.status_code === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            setProducts(prev => prev.map(p => p.product_id === product.product_id ? { ...p, status_code: newStatus } : p));

            await productsService.toggleStatus(product.product_id);
        } catch (error) {
            console.error("Failed to toggle status", error);
            fetchProducts(); // Revert on failure
        }
    };



    const handleModalSuccess = () => {
        fetchProducts();
        setIsModalOpen(false);
    };

    const getDisplayPrice = (product: any) => {
        let price = 0;
        if (product.type_code === 'RETAIL') {
            price = product.product_variants?.[0]?.price || 0;
        } else if (product.type_code === 'BLINDBOX') {
            price = product.product_blindboxes?.[0]?.price || product.product_variants?.[0]?.price || 0;
        } else if (product.type_code === 'PREORDER') {
            // For Preorder, show Deposit Amount or Full Price, but prefer Deposit as it's the "entry" price
            price = product.product_preorders?.[0]?.deposit_amount ?? product.product_variants?.[0]?.price ?? 0;
        }
        return price;
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Product Inventory</h1>
                    <p className="text-neutral-500">Manage your catalog, stock, and pricing.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="icon" onClick={fetchProducts} disabled={loading} title="Refresh">
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                    <Button onClick={handleCreate} className="gap-2 flex-1 sm:flex-none">
                        <Plus className="w-4 h-4" /> Create Product
                    </Button>
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-neutral-200 shrink-0">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Search by name, SKU..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="text-neutral-600 gap-2 hidden sm:flex">
                    <Filter className="w-4 h-4" /> Filters
                </Button>
            </div>

            {/* PRODUCT GRID */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-10">
                {loading && products.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-neutral-500 border rounded-xl bg-neutral-50 border-dashed m-1">
                        <Box className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No products found</p>
                        <p className="text-sm">Try adjusting your search or create a new product.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => {
                            const imageUrl = Array.isArray(product.media_urls) && product.media_urls.length > 0
                                ? product.media_urls[0]
                                : (typeof product.media_urls === 'string' ? product.media_urls : null);

                            const price = getDisplayPrice(product);
                            const isActive = product.status_code === 'ACTIVE';

                            return (
                                <Card key={product.product_id} className={cn(
                                    "group overflow-hidden border-neutral-200 hover:shadow-lg transition-all flex flex-col relative",
                                    !isActive && "opacity-75 grayscale-[0.5]"
                                )}>
                                    {/* IMAGE AREA */}
                                    <div className="aspect-square bg-neutral-100 relative overflow-hidden shrink-0">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => (e.currentTarget.src = "")}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                <Package className="w-12 h-12" />
                                            </div>
                                        )}

                                        {/* TYPE BADGE */}
                                        <div className="absolute top-3 left-3">
                                            <Badge className={cn(
                                                "shadow-sm",
                                                product.type_code === 'RETAIL' ? "bg-green-600" :
                                                    product.type_code === 'BLINDBOX' ? "bg-purple-600" :
                                                        "bg-orange-600"
                                            )}>
                                                {product.type_code}
                                            </Badge>
                                        </div>


                                    </div>

                                    {/* CONTENT AREA */}
                                    <CardContent className="p-4 space-y-2 flex-1 relative">
                                        <div className="flex justify-between items-start">
                                            <div className="text-xs text-neutral-500 font-medium truncate flex-1">
                                                {product.brands?.name || product.brand?.name || "Unknown Brand"}
                                            </div>
                                            {/* Status Toggle on Card */}

                                        </div>

                                        <h3 className="font-bold text-neutral-900 leading-tight line-clamp-2 h-10 cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={() => handleView(product)} title={product.name}>
                                            {product.name}
                                        </h3>
                                        <div className="text-lg font-bold text-red-600 pt-1">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                                        </div>
                                    </CardContent>

                                    {/* FOOTER ACTIONS */}
                                    <CardFooter className="p-4 pt-0 flex justify-between items-center gap-2 shrink-0">
                                        <div className="flex items-center gap-2" title={isActive ? "Active" : "Inactive"}>
                                            <Switch
                                                checked={isActive}
                                                onCheckedChange={() => handleToggleStatus(product)}
                                                className="scale-90 data-[state=checked]:bg-green-600"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-neutral-600 hover:text-blue-600 hover:bg-blue-50"
                                                onClick={() => handleView(product)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> View
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-neutral-400 hover:text-blue-600 hover:bg-blue-50"
                                                onClick={() => handleEdit(product)}
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* PRODUCT MODAL */}
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