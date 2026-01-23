import { useState } from 'react';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Truck, RotateCcw, Heart, ShoppingCart } from 'lucide-react';

export default function ProductDetail() {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const product = {
        name: 'Molly Chess Series - Black Queen',
        price: 149.99,
        category: 'Art Toy',
        artist: 'Kenny Wong',
        edition: 'Limited Edition of 500',
        material: 'PVC, ABS',
        height: '12 cm',
        releaseDate: 'January 2026',
        description: 'An exquisite collectible figure from the acclaimed Chess Series. Each piece is meticulously crafted with attention to detail, representing the fusion of contemporary art and collectible culture. This limited edition features premium finishing and comes with a certificate of authenticity.',
        features: [
            'Hand-painted details with premium finish',
            'Certificate of authenticity included',
            'Original packaging with protective casing',
            'Numbered edition marking',
            'Display base included'
        ],
        images: [
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop', // Extra image for variety
        ]
    };

    return (
        <CustomerLayout activePage="products">
            <div className="bg-white min-h-screen">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden">
                                <img
                                    src={product.images[selectedImage]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {product.images.slice(0, 4).map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-square bg-neutral-50 border-2 rounded-lg overflow-hidden transition-all ${selectedImage === index
                                                ? 'border-neutral-900'
                                                : 'border-neutral-200 hover:border-neutral-300'
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${product.name} ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div>
                            <Badge className="mb-4 bg-neutral-900 text-white border-0 text-xs font-light tracking-wider hover:bg-neutral-800">
                                {product.category}
                            </Badge>
                            <h1 className="text-4xl font-light text-neutral-900 mb-3 tracking-tight">
                                {product.name}
                            </h1>
                            <p className="text-sm text-neutral-600 mb-6 font-light">by {product.artist}</p>

                            <div className="mb-8">
                                <p className="text-3xl font-light text-neutral-900">${product.price.toFixed(2)}</p>
                                <p className="text-sm text-neutral-600 mt-1 font-light">{product.edition}</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <p className="text-neutral-700 leading-relaxed font-light">
                                    {product.description}
                                </p>
                            </div>

                            <Separator className="my-8" />

                            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                                <div>
                                    <p className="text-neutral-600 mb-1 font-light">Material</p>
                                    <p className="font-medium text-neutral-900">{product.material}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-600 mb-1 font-light">Height</p>
                                    <p className="font-medium text-neutral-900">{product.height}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-600 mb-1 font-light">Release Date</p>
                                    <p className="font-medium text-neutral-900">{product.releaseDate}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-600 mb-1 font-light">Edition</p>
                                    <p className="font-medium text-neutral-900">{product.edition}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 border-neutral-300"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        -
                                    </Button>
                                    <span className="text-lg font-medium text-neutral-900 w-12 text-center">{quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 border-neutral-300"
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        +
                                    </Button>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        size="lg"
                                        className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors h-12"
                                    >
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Add to Cart
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="flex-1 border-neutral-300 text-neutral-900 hover:bg-neutral-50 h-12"
                                    >
                                        <Heart className="w-4 h-4 mr-2" />
                                        Wishlist
                                    </Button>
                                </div>
                            </div>

                            <Separator className="my-8" />

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-neutral-900 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-neutral-900 text-sm">Authenticity Guaranteed</p>
                                        <p className="text-xs text-neutral-600 font-light mt-1">
                                            Certificate of authenticity included with every purchase
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Truck className="w-5 h-5 text-neutral-900 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-neutral-900 text-sm">Secure Shipping</p>
                                        <p className="text-xs text-neutral-600 font-light mt-1">
                                            Premium packaging with insured worldwide delivery
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <RotateCcw className="w-5 h-5 text-neutral-900 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-neutral-900 text-sm">14-Day Returns</p>
                                        <p className="text-xs text-neutral-600 font-light mt-1">
                                            Return in original condition within 14 days
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Details Section */}
                    <div className="mt-20">
                        <Separator className="mb-12" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div>
                                <h2 className="text-2xl font-light text-neutral-900 mb-6 tracking-tight">Features</h2>
                                <ul className="space-y-3">
                                    {product.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 flex-shrink-0" />
                                            <span className="text-neutral-700 font-light">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h2 className="text-2xl font-light text-neutral-900 mb-6 tracking-tight">About the Artist</h2>
                                <p className="text-neutral-700 leading-relaxed font-light">
                                    Kenny Wong is a renowned artist and designer from Hong Kong, celebrated for creating the iconic Molly character. His work bridges the gap between fine art and collectible culture, earning international recognition in the contemporary art toy movement.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
