import { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, User, ScanLine, Smartphone, DollarSign, Archive, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { STAFF_INVENTORY } from '@/lib/staffMockData';

// Mock Categories
const CATEGORIES = ['All', 'Art Toys', 'Blind Box', 'Figures', 'Merchandise'];

export default function StaffPOS() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number; image: string }[]>([]);


    // Filter products
    const filteredProducts = STAFF_INVENTORY.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            // Fallback image if missing in mock
            const img = product.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop';
            return [...prev, { id: product.id, name: product.name, price: product.price || 99.99, quantity: 1, image: img }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
            {/* Left Column: Product Catalog */}
            <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                {/* Header / Search */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-neutral-900 text-white p-2 rounded-lg">
                                <Grid className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-900 leading-none">POS Terminal</h1>
                                <p className="text-xs text-neutral-500">Station #01 • Main Hall</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 h-9">
                            <ScanLine className="w-4 h-4" />
                            Scan Mode
                        </Button>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input
                                placeholder="Search inventory..."
                                className="pl-9 h-10 bg-neutral-50 border-neutral-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {CATEGORIES.slice(0, 3).map(cat => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? 'default' : 'outline'}
                                    onClick={() => setSelectedCategory(cat)}
                                    size="sm"
                                    className="h-10 px-4"
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <ScrollArea className="flex-1 rounded-xl">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                        {filteredProducts.map(product => (
                            <Card
                                key={product.id}
                                className="group cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden border-neutral-200"
                                onClick={() => addToCart(product)}
                            >
                                <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                            <Archive className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-neutral-900 font-bold shadow-sm">
                                            ${product.price}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-3">
                                    <div className="mb-2">
                                        <h3 className="font-medium text-neutral-900 text-sm line-clamp-1 truncate" title={product.name}>{product.name}</h3>
                                        <p className="text-xs text-neutral-500 font-mono truncate">{product.sku}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Badge variant="outline" className="text-[10px] h-5">{product.category}</Badge>
                                        <span className={`text-[10px] font-bold ${product.currentStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {product.currentStock > 0 ? `${product.currentStock} left` : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        )
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Column: Cart */}
            <div className="w-full lg:w-[400px] flex flex-col h-full bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
                    <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Current Order
                    </h2>
                    <Button variant="ghost" size="sm" className="h-8 text-neutral-500 hover:text-red-600" onClick={() => setCart([])} disabled={cart.length === 0}>
                        Clear
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400">
                            <ShoppingCart className="w-16 h-16 mb-4 opacity-10" />
                            <p className="font-medium">Cart is empty</p>
                            <p className="text-sm">Scan item or select from list</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 group">
                                <div className="w-14 h-14 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
                                    {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between mb-1">
                                        <h3 className="text-sm font-medium text-neutral-900 truncate">{item.name}</h3>
                                        <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                                            <button className="w-7 h-7 flex items-center justify-center hover:bg-neutral-50 text-neutral-600 border-r border-neutral-100" onClick={() => updateQuantity(item.id, -1)}><Minus className="w-3 h-3" /></button>
                                            <span className="text-xs font-semibold w-8 text-center">{item.quantity}</span>
                                            <button className="w-7 h-7 flex items-center justify-center hover:bg-neutral-50 text-neutral-600 border-l border-neutral-100" onClick={() => updateQuantity(item.id, 1)}><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <button className="text-neutral-300 hover:text-red-500 transition-colors p-1" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 bg-neutral-50 border-t border-neutral-200 space-y-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-neutral-600">
                            <span>Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                            <span>Tax (8%)</span>
                            <span>${(cartTotal * 0.08).toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-lg font-bold text-neutral-900">
                            <span>Total</span>
                            <span>${(cartTotal * 1.08).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="w-full text-xs h-9">
                            <User className="w-3 h-3 mr-2" /> Customer
                        </Button>
                        <Button variant="outline" className="w-full text-xs h-9">
                            Discount
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Button className="w-full h-11 text-base bg-neutral-900 hover:bg-neutral-800 shadow-lg shadow-neutral-900/10" disabled={cart.length === 0}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Card Payment
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="w-full h-10 border-neutral-300 text-neutral-700" disabled={cart.length === 0}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Cash
                            </Button>
                            <Button variant="outline" className="w-full h-10 border-neutral-300 text-neutral-700" disabled={cart.length === 0}>
                                <Smartphone className="w-4 h-4 mr-2" />
                                Wallet
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
