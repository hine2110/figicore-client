import { Edit, Trash2, Box, Package, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProductListProps {
    products: any[];
    onEdit: (product: any) => void;
    onDelete: (id: number) => void;
    onView: (product: any) => void;
}

export function ProductList({ products, onEdit, onDelete, onView }: ProductListProps) {
    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400 bg-white/50 rounded-2xl border border-dashed border-neutral-200">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-neutral-600">No products found</p>
                <p className="text-sm">Try adjusting your filters or create a new product.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {products.map((product) => {
                // Determine display price
                let displayPrice = 0;
                if (product.type_code === 'RETAIL') {
                    displayPrice = product.product_variants?.[0]?.price || 0;
                } else if (product.type_code === 'BLINDBOX') {
                    displayPrice = product.product_blindboxes?.[0]?.price || product.product_variants?.[0]?.price || 0;
                } else if (product.type_code === 'PREORDER') {
                    displayPrice = product.product_preorders?.[0]?.deposit_amount || product.product_variants?.[0]?.price || 0;
                }

                // Determine Image
                const imageUrl = Array.isArray(product.media_urls) && product.media_urls.length > 0
                    ? product.media_urls[0]
                    : (typeof product.media_urls === 'string' ? product.media_urls : null);

                const isActive = product.status_code === 'ACTIVE';

                return (
                    <Card
                        key={product.product_id}
                        className="group relative bg-white border border-neutral-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                        onClick={() => onView(product)}
                    >
                        {/* IMAGE SECTION */}
                        <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                            {/* ACTIVE/INACTIVE INDICATOR */}
                            {!isActive && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 shadow-sm border-neutral-200">Inactive</Badge>
                                </div>
                            )}

                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => (e.currentTarget.src = "")}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                    <Package className="w-12 h-12 opacity-50" />
                                </div>
                            )}

                            {/* TYPE BADGE (Floating) */}
                            <div className="absolute top-3 left-3 z-20">
                                <Badge className={`
                                    shadow-sm border-0 font-medium tracking-wide text-[10px] uppercase px-2 py-0.5
                                    ${product.type_code === 'RETAIL' ? "bg-white/90 text-green-700 backdrop-blur-md" :
                                        product.type_code === 'BLINDBOX' ? "bg-white/90 text-purple-700 backdrop-blur-md" :
                                            "bg-white/90 text-orange-700 backdrop-blur-md"}
                                `}>
                                    {product.type_code}
                                </Badge>
                            </div>

                            {/* HOVER ACTIONS ADDED */}
                            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                <Button
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-white/90 text-neutral-700 hover:text-blue-600 hover:bg-white shadow-sm backdrop-blur-md"
                                    onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-white/90 text-neutral-700 hover:text-red-600 hover:bg-white shadow-sm backdrop-blur-md"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-neutral-100">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(product.product_id); }} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Product
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* CONTENT SECTION */}
                        <CardContent className="p-4 space-y-3">
                            <div className="space-y-1">
                                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider truncate">
                                    {product.brands?.name || product.brand?.name || "Unknown Brand"}
                                </div>
                                <h3 className="font-semibold text-neutral-900 leading-snug line-clamp-2 min-h-[2.5rem] text-[15px] group-hover:text-blue-600 transition-colors" title={product.name}>
                                    {product.name}
                                </h3>
                            </div>

                            <div className="flex items-end justify-between pt-1 border-t border-dashed border-neutral-100 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-neutral-400 font-medium uppercase">Price</span>
                                    <span className="text-base font-bold text-neutral-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(displayPrice)}
                                    </span>
                                </div>
                                {product.status_code === 'ACTIVE' ? (
                                    <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-[10px] border-green-200 text-green-700 bg-green-50">
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="rounded-full px-2 py-0 h-5 text-[10px] border-neutral-200 text-neutral-500 bg-neutral-50">
                                        Inactive
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
