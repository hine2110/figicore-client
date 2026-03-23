import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, PackageOpen, Tag, Loader2, Radar, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { productsService } from "@/services/products.service";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (productId: string) => {
        setIsLoading(true);
        try {
            const prodData = await productsService.getOne(Number(productId)).then((res: any) => res.data || res);
            setProduct(prodData);
        } catch (error) {
            console.error("Failed to fetch product data", error);
            toast.error("Failed to load product details.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col h-full items-center justify-center space-y-4">
                <PackageOpen className="w-16 h-16 text-neutral-300" />
                <h2 className="text-xl font-bold text-neutral-700">Product Not Found</h2>
                <Button variant="outline" onClick={() => navigate('/admin/products')}>Back to Inventory</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>
                    <p className="text-neutral-500 flex items-center gap-2">
                        <Tag className="w-4 h-4" /> ID: {product.product_id} • Category: {product.categories?.name || 'N/A'}
                    </p>
                </div>
            </div>

            {/* Product General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-video w-full bg-neutral-100 rounded-xl overflow-hidden relative">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                    <PackageOpen className="w-12 h-12 text-neutral-300" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-neutral-900">Description</h4>
                            <p className="text-neutral-600 text-sm mt-1">{product.description || 'No description provided.'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Variants ({product.product_variants?.length || 0})</CardTitle>
                        <CardDescription>Current inventory and pricing for this product's variants.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {product.product_variants?.map((v: any) => (
                                <div key={v.variant_id} className="flex justify-between items-center p-3 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors">
                                    <div>
                                        <p className="flex items-center gap-2 font-medium text-neutral-900">
                                            {v.sku}
                                            {v.stock_available < 10 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">Low Stock</span>}
                                            {v.stock_available > 15 && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase">High Stock</span>}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-0.5">Stock: <strong className="text-neutral-900">{v.stock_available}</strong></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-neutral-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price)}</p>
                                    </div>
                                </div>
                            ))}
                            {(!product.product_variants || product.product_variants.length === 0) && (
                                <p className="text-sm text-neutral-500 italic text-center py-4">No variants defined.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
