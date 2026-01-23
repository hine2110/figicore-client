import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerShop() {
    const navigate = useNavigate();

    const products = [
        {
            id: '1',
            name: 'Molly Chess Series',
            price: '$149.99',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
            category: 'Art Toy',
            tag: 'Limited Edition',
            description: 'Edition of 500'
        },
        {
            id: '2',
            name: 'Skullpanda Dark Night',
            price: '$189.00',
            image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop',
            category: 'Art Toy',
            tag: 'New Arrival',
            description: 'Signature Series'
        },
        {
            id: '3',
            name: 'Labubu Macaron Series',
            price: '$124.99',
            image: 'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=400&h=400&fit=crop',
            category: 'Blind Box',
            description: 'Set of 12'
        },
        {
            id: '4',
            name: 'CRYBABY Tears Series',
            price: '$299.99',
            image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop',
            category: 'Exclusive',
            tag: 'Rare',
            description: 'Collector\'s Edition'
        },
        {
            id: '5',
            name: 'Dimoo Zodiac Series',
            price: '$159.99',
            image: 'https://images.unsplash.com/photo-1566576912906-60034a605152?w=400&h=400&fit=crop',
            category: 'Art Toy',
            description: 'Full Set'
        },
    ];

    return (
        <CustomerLayout activePage="products">
            <div className="bg-white min-h-screen pb-20">
                <div className="container mx-auto px-4 py-12">
                    <div className="mb-8">
                        <h1 className="text-3xl font-light text-gray-900 mb-2">Shop Collection</h1>
                        <p className="text-gray-500">Discover unique collectible figures</p>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search by name, artist, or series..." className="pl-10 h-10 w-full" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                            <Button variant="outline" className="whitespace-nowrap h-10 border-gray-200">All Categories</Button>
                            <Button variant="outline" className="whitespace-nowrap h-10 border-gray-200">Sort: Featured</Button>
                            <Button variant="outline" className="whitespace-nowrap h-10 border-gray-200 gap-2">
                                <Filter className="w-4 h-4" /> Filters
                            </Button>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 mb-12 flex-wrap">
                        <Badge className="bg-gray-900 text-white hover:bg-gray-800 cursor-pointer px-4 py-1.5 h-8">All Collections</Badge>
                        <Badge variant="outline" className="border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 cursor-pointer px-4 py-1.5 h-8">Art Toys</Badge>
                        <Badge variant="outline" className="border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 cursor-pointer px-4 py-1.5 h-8">Blind Box</Badge>
                        <Badge variant="outline" className="border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 cursor-pointer px-4 py-1.5 h-8">Limited Editions</Badge>
                        <Badge variant="outline" className="border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 cursor-pointer px-4 py-1.5 h-8">Pre-Orders</Badge>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {products.map((product) => (
                            <div key={product.id} className="group">
                                <div className="aspect-square relative mb-4 bg-gray-50 rounded-lg overflow-hidden cursor-pointer" onClick={() => navigate(`/guest/product/${product.id}`)}>
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {product.tag && (
                                        <Badge className="absolute top-3 left-3 bg-gray-900 text-white border-0 text-xs font-light tracking-wide rounded-full px-3">
                                            {product.tag}
                                        </Badge>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.category}</div>
                                    <h3 className="font-medium text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate(`/guest/product/${product.id}`)}>{product.name}</h3>

                                    <p className="text-xs text-gray-500 mb-3">{product.description}</p>

                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-900">{product.price}</p>
                                        <Button variant="outline" size="sm" className="h-8 text-xs border-gray-300" onClick={() => navigate(`/guest/product/${product.id}`)}>
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
