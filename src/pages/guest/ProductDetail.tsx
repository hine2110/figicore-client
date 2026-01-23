import { useParams, Link } from "react-router-dom";
import { Star, Truck, Shield, RotateCcw, Minus, Plus, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUEST_PRODUCTS } from "@/lib/mockData";
import { useState } from "react";

export default function ProductDetail() {
    const { id } = useParams();
    const product = GUEST_PRODUCTS.find(p => p.id === id) || GUEST_PRODUCTS[0];
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        const message = `Added ${quantity}x ${product.name} to cart`;
        console.log(message);
        // Fallback for toast if not available
        alert(message);
    };

    return (
        <div className="bg-white min-h-screen py-10">
            <div className="container mx-auto px-4">

                {/* Breadcrumb */}
                <div className="text-sm text-neutral-500 mb-8 flex items-center gap-2">
                    <Link to="/guest/home" className="hover:text-blue-600">Home</Link>
                    <span>/</span>
                    <Link to="/guest/browse" className="hover:text-blue-600">Browse</Link>
                    <span>/</span>
                    <span className="text-neutral-900 font-medium truncate max-w-[200px]">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`aspect-square rounded-lg bg-neutral-50 border cursor-pointer hover:border-blue-500 transition-all ${i === 1 ? 'border-blue-600 ring-2 ring-blue-100' : 'border-neutral-200'}`}>
                                    <img src={product.image} alt="Thumbnail" className="w-full h-full object-cover rounded-lg opacity-80 hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">In Stock</span>
                            <span className="text-neutral-500 text-sm">{product.category}</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">{product.name}</h1>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1 text-amber-400">
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current text-amber-200" />
                            </div>
                            <span className="text-neutral-600 text-sm border-l border-neutral-300 pl-4">{product.reviews} Reviews</span>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-4xl font-bold text-neutral-900">${product.price.toFixed(2)}</span>
                            {product.originalPrice && (
                                <div className="flex flex-col">
                                    <span className="text-lg text-neutral-400 line-through">${product.originalPrice}</span>
                                    <span className="text-xs text-red-500 font-bold">Save ${(product.originalPrice - product.price).toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-neutral-600 leading-relaxed mb-8">
                            Experience premium quality with this meticulously crafted item. Designed for durability and style, it fits perfectly into your modern lifestyle. Features advanced materials and ergonomic design.
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-8 border-b border-neutral-100">
                            <div className="flex items-center border border-neutral-300 rounded-lg h-12 w-fit">
                                <button
                                    className="px-4 hover:bg-neutral-50 text-neutral-600 h-full"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-medium text-neutral-900">{quantity}</span>
                                <button
                                    className="px-4 hover:bg-neutral-50 text-neutral-600 h-full"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <Button
                                className="flex-1 h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-blue-200 shadow-lg"
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Add to Cart
                            </Button>

                            <Button variant="outline" className="h-12 w-12 p-0 border-neutral-300">
                                <Heart className="w-5 h-5 text-neutral-400 hover:text-red-500" />
                            </Button>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-neutral-600">
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-500" />
                                <span>Free Delivery</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-blue-500" />
                                <span>30 Days Return</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-500" />
                                <span>2 Year Warranty</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
