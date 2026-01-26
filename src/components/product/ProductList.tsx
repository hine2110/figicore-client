import { Edit, Trash2, Box, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProductListProps {
    products: any[];
    onEdit: (product: any) => void;
    onDelete: (id: number) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500 border rounded-xl bg-neutral-50 border-dashed">
                <Box className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Add a new product to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
                // Determine display price
                let displayPrice = 0;
                if (product.type_code === 'RETAIL') {
                    displayPrice = product.product_variants?.[0]?.price || 0;
                } else if (product.type_code === 'BLINDBOX') {
                    displayPrice = product.product_blindboxes?.[0]?.price || 0;
                } else if (product.type_code === 'PREORDER') {
                    // Preorder usually shows deposit, need to check business rule. 
                    // Let's show Full Price if available, or Deposit
                    // Based on modal logic: Preorder variant has full price
                    displayPrice = product.product_variants?.[0]?.price || 0;
                }


                // Determine Image
                const imageUrl = Array.isArray(product.media_urls) && product.media_urls.length > 0
                    ? product.media_urls[0]
                    : (typeof product.media_urls === 'string' ? product.media_urls : null);

                return (
                    <Card key={product.product_id} className="group overflow-hidden border-neutral-200 hover:shadow-lg transition-all">
                        {/* IMAGE SECTION */}
                        <div className="aspect-square bg-neutral-100 relative overflow-hidden">
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
                                <Badge className={
                                    product.type_code === 'RETAIL' ? "bg-green-600/90 hover:bg-green-600" :
                                        product.type_code === 'BLINDBOX' ? "bg-purple-600/90 hover:bg-purple-600" :
                                            "bg-orange-600/90 hover:bg-orange-600"
                                }>
                                    {product.type_code}
                                </Badge>
                            </div>

                            {/* STOCK BADGE */}
                            <div className="absolute top-3 right-3">
                                <Badge variant="secondary" className="bg-white/90 text-neutral-800 backdrop-blur-sm shadow-sm border font-mono">
                                    Stock: 0
                                </Badge>
                            </div>
                        </div>

                        {/* CONTENT SECTION */}
                        <CardContent className="p-4 space-y-2">
                            <div className="text-xs text-neutral-500 font-medium truncate">
                                {product.series?.name || product.categories?.name || "Uncategorized"}
                            </div>
                            <h3 className="font-bold text-neutral-900 leading-tight line-clamp-2 h-[2.5rem]" title={product.name}>
                                {product.name}
                            </h3>
                            <div className="text-lg font-bold text-red-600">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(displayPrice)}
                            </div>
                        </CardContent>

                        {/* FOOTER ACTIONS */}
                        <CardFooter className="p-4 pt-0 flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 border-neutral-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 group/btn"
                                onClick={() => onEdit(product)}
                            >
                                <Edit className="w-4 h-4 mr-2 group-hover/btn:text-blue-600 transition-colors" /> Edit
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-500 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(product.product_id)}>
                                        Confirm Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
