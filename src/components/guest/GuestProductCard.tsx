import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        price: number;
        originalPrice?: number;
        image: string;
        category: string;
        rating: number;
        reviews: number;
        isNew?: boolean;
    };
}

export default function GuestProductCard({ product }: ProductCardProps) {
    const navigate = useNavigate();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Simulate auth check redirect
        navigate('/guest/login');
    };

    return (
        <Link to={`/guest/product/${product.id}`} className="group relative block overflow-hidden rounded-xl bg-white border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.isNew && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        New
                    </span>
                )}
                {product.originalPrice && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        Sale
                    </span>
                )}

                {/* Quick Action Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 tranneutral-y-full transition-transform duration-300 group-hover:tranneutral-y-0">
                    <Button
                        onClick={handleAddToCart}
                        className="w-full bg-white/90 text-neutral-900 hover:bg-blue-600 hover:text-white backdrop-blur-sm shadow-sm font-medium"
                        size="sm"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>
            </div>

            <div className="p-4">
                <p className="text-xs text-neutral-500 mb-1 font-medium">{product.category}</p>
                <h3 className="text-neutral-900 font-semibold truncate group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>

                <div className="mt-2 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-neutral-700">{product.rating}</span>
                    <span className="text-xs text-neutral-400">({product.reviews})</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg font-bold text-neutral-900">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                        <span className="text-sm text-neutral-400 line-through">${product.originalPrice.toFixed(2)}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
