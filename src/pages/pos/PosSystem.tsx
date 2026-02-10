import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Smartphone, DollarSign, Package, Grid, AlertCircle, Filter, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { searchProducts, createPosOrder, getCurrentSession } from '@/services/posService';
import type { PosProduct, PosCartItem } from '@/types/pos.types';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import RegisterCustomerModal from './RegisterCustomerModal';
import { searchCustomer } from '@/services/posService';



// Mock Categories - will be replaced with real categories from API later
const CATEGORIES = ['All'];

export default function StaffPOS() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [products, setProducts] = useState<PosProduct[]>([]);
    const [cart, setCart] = useState<PosCartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    // Customer State
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);



    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Check for active session on mount
    useEffect(() => {
        checkSession();
    }, []);

    // Load products when search term or category changes
    useEffect(() => {
        loadProducts();
    }, [searchTerm, selectedCategory]);

    const checkSession = async () => {
        try {
            const response = await getCurrentSession();
            if (response.data) {
                setHasSession(true);
            } else {
                setHasSession(false);
                toast({
                    title: 'No Active Session',
                    description: 'Please open a shift before using POS',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Session check failed:', error);
            setHasSession(false);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await searchProducts({
                q: searchTerm || undefined,
            });
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to load products:', error);
            toast({
                title: 'Error',
                description: 'Failed to load products',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };



    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const isRetail = product.product_type === 'RETAIL';
        return matchesCategory && isRetail;
    });

    const addToCart = (product: PosProduct) => {
        if (!hasSession) {
            toast({
                title: 'No Active Session',
                description: 'Please open a shift first',
                variant: 'destructive',
            });
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.variant_id === product.variant_id);
            if (existing) {
                if (existing.quantity + 1 > product.current_stock) {
                    toast({
                        title: 'Out of Stock',
                        description: `Only ${product.current_stock} available`,
                        variant: 'destructive',
                    });
                    return prev;
                }
                return prev.map(item =>
                    item.variant_id === product.variant_id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                variant_id: product.variant_id,
                sku: product.sku,
                product_name: product.product_name,
                option_name: product.option_name,
                price: product.price,
                quantity: 1,
                thumbnail: product.thumbnail,
            }];
        });
    };

    const updateQuantity = (variantId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.variant_id === variantId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                const product = products.find(p => p.variant_id === variantId);
                if (product && newQuantity > product.current_stock) {
                    toast({
                        title: 'Out of Stock',
                        description: `Only ${product.current_stock} available`,
                        variant: 'destructive',
                    });
                    return item;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeFromCart = (variantId: number) => {
        setCart(prev => prev.filter(item => item.variant_id !== variantId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = cartTotal * 0.08;
    const finalTotal = cartTotal + taxAmount;

    const handleCheckout = async (paymentMethod: string) => {
        if (!hasSession) {
            toast({
                title: 'No Active Session',
                description: 'Please open a shift first',
                variant: 'destructive',
            });
            return;
        }

        if (cart.length === 0) {
            toast({
                title: 'Empty Cart',
                description: 'Please add items to cart',
                variant: 'destructive',
            });
            return;
        }

        setCheckoutLoading(true);
        try {
            const orderData = {
                items: cart.map(item => ({
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                })),
                payment_method_code: paymentMethod,
                user_id: selectedCustomer?.user_id || undefined,
            };

            const response = await createPosOrder(orderData);

            toast({
                title: 'Success',
                description: `Order ${response.data.order_code} created successfully`,
            });

            setCart([]);
            loadProducts();
            // Reset customer after successful order if needed, or keep for next order? 
            // Usually POS keeps customer for multiple orders or resets? Let's keep it for now or reset?
            // User didn't specify, but often you reset. Let's reset for safety.
            setSelectedCustomer(null);
        } catch (error: any) {
            console.error('Checkout failed:', error);
            toast({
                title: 'Checkout Failed',
                description: error.response?.data?.message || 'Failed to create order',
                variant: 'destructive',
            });
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleSearchCustomer = async (term: string) => {
        setCustomerSearchTerm(term);
        if (term.length < 2) {
            setCustomerSearchResults([]);
            return;
        }

        setIsSearchingCustomer(true);
        try {
            const response = await searchCustomer(term);
            if (response.success) {
                setCustomerSearchResults(response.data);
            }
        } catch (error) {
            console.error('Customer search failed:', error);
        } finally {
            setIsSearchingCustomer(false);
        }
    };

    const handleSelectCustomer = (customer: any) => {
        setSelectedCustomer(customer);
        setCustomerSearchTerm('');
        setCustomerSearchResults([]);
    };

    const handleRemoveCustomer = () => {
        setSelectedCustomer(null);
    };

    if (!hasSession) {
        return (
            <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
                <Card className="p-8 text-center max-w-md bg-white shadow-xl border-neutral-200">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-neutral-900">No Active Session</h2>
                    <p className="text-neutral-600 mb-8">
                        The POS terminal is currently locked. Please start a new session to begin processing sales.
                    </p>
                    <Button onClick={() => navigate('/pos/schedule')} className="w-full h-11 text-base bg-neutral-900 hover:bg-neutral-800">
                        Go to Schedule & Open Shift
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-50 p-4 gap-4 overflow-hidden">
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Side: Products Section (68% width) */}
                <div className="flex-[2.1] flex flex-col bg-transparent overflow-hidden gap-4">
                    {/* Header Bar */}
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">
                                    <Grid className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-neutral-900">Sales Terminal</h1>
                                    <p className="text-xs text-neutral-500 font-medium">Station #01 • Main Hall • <span className="text-green-600">Online</span></p>
                                </div>
                            </div>
                        </div>



                        {/* Product Filter & Search */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                    placeholder="Scan barcode or search product name..."
                                    className="pl-9 h-10 bg-neutral-50 border-neutral-200 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                {CATEGORIES.slice(0, 4).map(cat => (
                                    <Button
                                        key={cat}
                                        variant={selectedCategory === cat ? 'default' : 'outline'}
                                        onClick={() => setSelectedCategory(cat)}
                                        size="sm"
                                        className={`h-10 px-4 transition-all ${selectedCategory === cat
                                            ? 'bg-neutral-900 text-white shadow-md'
                                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                                            }`}
                                    >
                                        {cat}
                                    </Button>
                                ))}
                                <Button variant="outline" size="icon" className="h-10 w-10 border-neutral-200 text-neutral-500">
                                    <Filter className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-4">
                        <ScrollArea className="h-full pr-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                                    <div className="w-10 h-10 border-4 border-neutral-200 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                                    <p>Loading catalog...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredProducts.map(product => (
                                        <Card
                                            key={product.variant_id}
                                            className="group cursor-pointer border-neutral-200 shadow-sm hover:shadow-lg hover:border-cyan-400 transition-all duration-300 flex flex-col overflow-hidden bg-white"
                                            onClick={() => addToCart(product)}
                                        >
                                            <div className="aspect-square bg-neutral-50 relative overflow-hidden p-4 flex items-center justify-center">
                                                {product.thumbnail ? (
                                                    <img
                                                        src={product.thumbnail}
                                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                                        alt={product.product_name}
                                                    />
                                                ) : (
                                                    <Package className="w-12 h-12 text-neutral-300 opacity-50" />
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-white/95 text-neutral-900 font-bold shadow-sm border border-neutral-100 hover:bg-white text-xs">
                                                        {product.price.toLocaleString('vi-VN')}₫
                                                    </Badge>
                                                </div>
                                                {product.current_stock > 0 && (
                                                    <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                                                        {product.current_stock <= 5 ? (
                                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] w-full justify-center">
                                                                Low Stock: {product.current_stock}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] w-full justify-center">
                                                                In Stock: {product.current_stock}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                {product.current_stock === 0 && (
                                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                                        <Badge variant="destructive" className="font-bold">OUT OF STOCK</Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 flex flex-col flex-1 gap-1">
                                                <h3 className="font-semibold text-neutral-900 text-sm line-clamp-2 leading-snug" title={product.product_name}>
                                                    {product.product_name}
                                                </h3>
                                                <p className="text-xs text-neutral-500 font-mono mt-auto">{product.sku}</p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                {/* Right Side: Cart (32% width) */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden max-w-[420px]">
                    <div className="p-5 border-b border-neutral-100 bg-white flex justify-between items-center z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neutral-100 rounded-lg">
                                <ShoppingCart className="w-5 h-5 text-neutral-700" />
                            </div>
                            <div>
                                <h2 className="font-bold text-neutral-900">Current Order</h2>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <span>{cart.length} items</span>
                                    <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                                    <span className="font-medium text-indigo-600 flex items-center gap-1">
                                        Cashier: {user?.full_name || 'Staff'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-400 hover:text-red-500"
                            onClick={() => setCart([])}
                            disabled={cart.length === 0}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Clear
                        </Button>
                    </div>

                    {/* Customer Selection Section */}
                    <div className="bg-neutral-50 p-4 border-b border-neutral-200">
                        {selectedCustomer ? (
                            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        {selectedCustomer.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-neutral-900">{selectedCustomer.full_name}</p>
                                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                                            <span>{selectedCustomer.phone}</span>
                                            {selectedCustomer.customers?.current_rank_code && (
                                                <Badge variant="secondary" className={`px-1 py-0 h-4 text-[10px] border ${selectedCustomer.customers.current_rank_code === 'GOLD' ? 'bg-yellow-200 text-yellow-900 border-yellow-500' :
                                                        selectedCustomer.customers.current_rank_code === 'DIAMOND' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                                                            selectedCustomer.customers.current_rank_code === 'SILVER' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                                'bg-orange-200 text-orange-900 border-orange-400'
                                                    }`}>
                                                    {selectedCustomer.customers.current_rank_code}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={handleRemoveCustomer}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <Input
                                        placeholder="Search customer (Name/Phone)..."
                                        className="pl-9 h-10 bg-white border-neutral-200 focus:ring-2 focus:ring-indigo-500/20"
                                        value={customerSearchTerm}
                                        onChange={(e) => handleSearchCustomer(e.target.value)}
                                    />
                                    {isSearchingCustomer && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {customerSearchResults.length > 0 && (
                                    <div className="bg-white rounded-lg border border-neutral-200 shadow-lg max-h-48 overflow-y-auto absolute w-[calc(100%-2rem)] z-50 mt-1">
                                        {customerSearchResults.map(customer => (
                                            <div
                                                key={customer.user_id}
                                                className="p-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0 flex justify-between items-center"
                                                onClick={() => handleSelectCustomer(customer)}
                                            >
                                                <div>
                                                    <p className="font-medium text-sm text-neutral-900">{customer.full_name}</p>
                                                    <p className="text-xs text-neutral-500">{customer.phone}</p>
                                                </div>
                                                {customer.customers?.current_rank_code && (
                                                    <Badge variant="outline" className="text-[10px] h-5">{customer.customers.current_rank_code}</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 h-9"
                                    onClick={() => setRegisterModalOpen(true)}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add New Customer
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart className="w-10 h-10 text-neutral-300" />
                                </div>
                                <h3 className="font-semibold text-neutral-900 mb-1">Cart is Empty</h3>
                                <p className="text-sm text-neutral-500 max-w-[200px]">Scan a barcode or select products from the grid to start a sale</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.variant_id} className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm group hover:border-blue-300 transition-colors flex gap-3">
                                        <div className="w-16 h-16 bg-neutral-50 rounded-lg flex-shrink-0 overflow-hidden border border-neutral-100">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.product_name} />
                                            ) : (
                                                <Package className="w-full h-full p-4 text-neutral-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="text-sm font-medium text-neutral-900 truncate flex-1" title={item.product_name}>{item.product_name}</h3>
                                                    <span className="font-bold text-sm">{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                                                </div>
                                                <p className="text-xs text-neutral-500 truncate">{item.option_name}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 h-7 w-fit">
                                                    <button
                                                        className="w-7 h-full flex items-center justify-center hover:bg-neutral-200 rounded-l-lg text-neutral-600 active:scale-95 transition-transform"
                                                        onClick={() => updateQuantity(item.variant_id, -1)}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs font-bold w-8 text-center bg-white h-full flex items-center justify-center border-x border-neutral-200">{item.quantity}</span>
                                                    <button
                                                        className="w-7 h-full flex items-center justify-center hover:bg-neutral-200 rounded-r-lg text-neutral-600 active:scale-95 transition-transform"
                                                        onClick={() => updateQuantity(item.variant_id, 1)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    className="text-neutral-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeFromCart(item.variant_id)}
                                                    title="Remove Item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border-t border-neutral-200 p-5 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-20">
                        <div className="space-y-1.5 mb-4 text-sm">
                            <div className="flex justify-between text-neutral-600">
                                <span>Subtotal</span>
                                <span className="font-medium">{cartTotal.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <div className="flex justify-between text-neutral-600">
                                <span>Tax (8%)</span>
                                <span>{taxAmount.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-lg text-neutral-900">Total</span>
                                <div className="text-right">
                                    <span className="font-bold text-2xl text-blue-600 block leading-none">{finalTotal.toLocaleString('vi-VN')}₫</span>
                                    {cart.length > 0 && <span className="text-xs text-neutral-400">{cart.length} items</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <Button
                                variant="outline"
                                className="h-12 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700"
                                disabled={cart.length === 0 || checkoutLoading}
                                onClick={() => handleCheckout('CASH')}
                            >
                                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                <span className="font-medium">Cash</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700"
                                disabled={cart.length === 0 || checkoutLoading}
                                onClick={() => handleCheckout('WALLET')}
                            >
                                <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
                                <span className="font-medium">Wallet</span>
                            </Button>
                        </div>
                        <Button
                            className="w-full h-14 text-lg font-bold bg-neutral-900 hover:bg-cyan-600 shadow-lg shadow-neutral-900/20 transition-all active:scale-[0.98]"
                            disabled={cart.length === 0 || checkoutLoading}
                            onClick={() => handleCheckout('QR_BANK')}
                        >
                            {checkoutLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </div>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Charge {finalTotal.toLocaleString('vi-VN')}₫
                                </>
                            )}
                        </Button>
                    </div>
                </div>


            </div>
            <RegisterCustomerModal
                open={registerModalOpen}
                onClose={() => setRegisterModalOpen(false)}
                onSuccess={(newCustomer) => {
                    handleSelectCustomer(newCustomer);
                    setRegisterModalOpen(false);
                }}
            />
        </div>
    );
}
