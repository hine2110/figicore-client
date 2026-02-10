import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, Smartphone, DollarSign, Grid, AlertCircle, Filter, UserPlus, X, RotateCcw, Gift, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { searchProducts, createPosOrder, getCurrentSession, searchCustomer, getCategories, syncActiveOrder, getActiveOrder } from '@/services/posService';
import { productsService } from '@/services/products.service';
import type { PosProduct, PosCartItem, PosProductVariant } from '@/types/pos.types';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import RegisterCustomerModal from './RegisterCustomerModal';
import { PosProductCard } from './components/PosProductCard';
import { PosCartItem as CartItemComponent } from './components/PosCartItem';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';




// Mock Categories - removed
// const CATEGORIES = ['All'];

export default function StaffPOS() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [products, setProducts] = useState<PosProduct[]>([]);
    const [cart, setCart] = useState<PosCartItem[]>(() => {
        const saved = localStorage.getItem('pos_cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(() => {
        const saved = localStorage.getItem('pos_selected_customer');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    // Advanced Filters State
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name_asc');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);



    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Check for active session and restore order on mount
    useEffect(() => {
        const init = async () => {
            await checkSession();
            await fetchCategories();
            await fetchBrands();
            await restoreActiveOrder();
        };
        init();
    }, []);

    const restoreActiveOrder = async () => {
        try {
            const activeOrder = await getActiveOrder();
            if (activeOrder && activeOrder.status_code === 'PENDING' && activeOrder.order_items) {
                const restoredCart = activeOrder.order_items.map((item: any) => ({
                    variant_id: item.variant_id,
                    sku: item.product_variants.sku,
                    product_name: item.product_variants.products.name,
                    option_name: item.product_variants.option_name,
                    price: Number(item.unit_price),
                    quantity: item.quantity,
                    thumbnail: item.product_variants.thumbnail || item.product_variants.products.thumbnail,
                }));
                setCart(restoredCart);
                if (activeOrder.users) {
                    setSelectedCustomer(activeOrder.users);
                }
                toast({
                    title: 'Cart Restored',
                    description: 'Your previous pending session has been recovered.',
                });
            }
        } catch (error) {
            console.error("Failed to restore active order", error);
        }
    };

    // Real-time Sync with Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            syncCartWithServer();
        }, 300);

        return () => clearTimeout(timer);
    }, [cart, selectedCustomer]);

    const syncCartWithServer = async () => {
        if (!hasSession) return;

        try {
            await syncActiveOrder({
                user_id: selectedCustomer?.user_id || undefined,
                items: cart.map(item => ({
                    variant_id: item.variant_id,
                    quantity: item.quantity
                })),
                discount_amount: 0 // Will implement discount sync if needed later
            });
        } catch (error) {
            console.error("Sync failed", error);
        }
    };

    // Persistence: Save cart and customer to localStorage
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('pos_selected_customer', JSON.stringify(selectedCustomer));
    }, [selectedCustomer]);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await productsService.getEntities('brands');
            if (response.success) {
                setBrands(response.data);
            }
        } catch (error) {
            console.error("Failed to load brands", error);
        }
    };

    // Load products when search term or filters change
    useEffect(() => {
        loadProducts();
    }, [searchTerm, selectedCategory, selectedBrand, sortBy, minPrice, maxPrice]);

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
            const cat = Array.isArray(categories) ? categories.find(c => c.name === selectedCategory) : null;
            const response = await searchProducts({
                q: searchTerm || undefined,
                category_id: cat?.id?.toString(),
                brand_id: selectedBrand !== 'all' ? selectedBrand : undefined,
                sort: sortBy,
                min_price: minPrice ? Number(minPrice) : undefined,
                max_price: maxPrice ? Number(maxPrice) : undefined
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

    const addToCart = (product: PosProduct, variant: PosProductVariant) => {
        if (!hasSession) {
            toast({
                title: 'No Active Session',
                description: 'Please open a shift first',
                variant: 'destructive',
            });
            return;
        }

        // 1. Check current local stock (OptimisticUI)
        const currentProduct = products.find(p => p.product_id === product.product_id);
        const currentVariant = currentProduct?.variants.find(v => v.variant_id === variant.variant_id);
        const availableStock = currentVariant ? currentVariant.current_stock : variant.current_stock;

        if (availableStock < 1) {
            toast({
                title: 'Out of Stock',
                description: 'Product is currently unavailable',
                variant: 'destructive',
            });
            return;
        }

        // 2. Decrement Local Stock
        setProducts(prev => prev.map(p => {
            if (p.product_id === product.product_id) {
                return {
                    ...p,
                    variants: p.variants.map(v =>
                        v.variant_id === variant.variant_id
                            ? { ...v, current_stock: v.current_stock - 1 }
                            : v
                    )
                };
            }
            return p;
        }));

        // 3. Update Cart
        setCart(prev => {
            const existing = prev.find(item => item.variant_id === variant.variant_id);
            if (existing) {
                return prev.map(item =>
                    item.variant_id === variant.variant_id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                variant_id: variant.variant_id,
                sku: variant.sku,
                product_name: product.product_name,
                option_name: variant.option_name,
                price: variant.price,
                quantity: 1,
                thumbnail: variant.thumbnail || product.thumbnail,
            }];
        });
    };

    const updateQuantity = (variantId: number, delta: number) => {
        const cartItem = cart.find(i => i.variant_id === variantId);
        if (!cartItem) return;

        // Prevent going below 1 (handled by UI mostly, but safe guard)
        if (delta < 0 && cartItem.quantity <= 1) return;

        // Find current stock info
        let remainingStock = 0;
        let productFound = false;

        for (const p of products) {
            const v = p.variants.find(v => v.variant_id === variantId);
            if (v) {
                remainingStock = v.current_stock;
                productFound = true;
                break;
            }
        }

        // Check availability for increment
        if (delta > 0) {
            if (remainingStock < delta) {
                toast({
                    title: 'Out of Stock',
                    description: `Only ${remainingStock} available`,
                    variant: 'destructive',
                });
                return;
            }
        }

        // Update Local Stock (Decrement if adding, Increment if removing)
        setProducts(prev => prev.map(p => {
            const vExists = p.variants.some(v => v.variant_id === variantId);
            if (vExists) {
                return {
                    ...p,
                    variants: p.variants.map(v =>
                        v.variant_id === variantId
                            ? { ...v, current_stock: v.current_stock - delta }
                            : v
                    )
                };
            }
            return p;
        }));

        // Update Cart
        setCart(prev => prev.map(item => {
            if (item.variant_id === variantId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };


    const removeFromCart = (variantId: number) => {
        const itemToRemove = cart.find(item => item.variant_id === variantId);
        if (!itemToRemove) return;

        // Restore Stock
        setProducts(prev => prev.map(p => {
            const vExists = p.variants.some(v => v.variant_id === variantId);
            if (vExists) {
                return {
                    ...p,
                    variants: p.variants.map(v =>
                        v.variant_id === variantId
                            ? { ...v, current_stock: v.current_stock + itemToRemove.quantity }
                            : v
                    )
                };
            }
            return p;
        }));

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
            setSelectedCustomer(null);
            localStorage.removeItem('pos_cart');
            localStorage.removeItem('pos_selected_customer');
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

    const handleClearCart = async () => {
        // Restore All Stock
        setProducts(prev => prev.map(p => {
            // Check if any variant of this product is in cart
            const pInCart = cart.some(c => p.variants.some(v => v.variant_id === c.variant_id));
            if (!pInCart) return p;

            return {
                ...p,
                variants: p.variants.map(v => {
                    const cartItem = cart.find(c => c.variant_id === v.variant_id);
                    if (cartItem) {
                        return { ...v, current_stock: v.current_stock + cartItem.quantity };
                    }
                    return v;
                })
            };
        }));

        setCart([]);
        setSelectedCustomer(null);
        localStorage.removeItem('pos_cart');
        localStorage.removeItem('pos_selected_customer');

        // Sync with server (empty items = delete pending order)
        try {
            await syncActiveOrder({ items: [] });
        } catch (e) {
            console.error("Clear sync failed", e);
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

    const clearFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setSelectedBrand('all');
        setSortBy('name_asc');
        setSelectedCategory('All');
        setSearchTerm('');
    };

    const isFiltered = minPrice || maxPrice || selectedBrand !== 'all' || sortBy !== 'name_asc' || selectedCategory !== 'All' || searchTerm;

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
        <div className="flex flex-col h-screen bg-neutral-50 gap-4 p-4 overflow-hidden">
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Side: Products Section (68% width) */}
                <div className="flex-[2.1] flex flex-col bg-transparent overflow-hidden gap-4 pb-4">
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

                            {isFiltered && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-8 text-neutral-500 hover:text-red-600 hover:bg-red-50 gap-2 font-medium"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset Filters
                                </Button>
                            )}
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
                            <div className="flex gap-2 min-w-0 max-w-[60%]">
                                <div className="flex gap-2 items-center">
                                    <Button
                                        variant={selectedCategory === 'All' ? 'default' : 'outline'}
                                        onClick={() => setSelectedCategory('All')}
                                        size="sm"
                                        className={`h-10 px-4 transition-all whitespace-nowrap flex-shrink-0 ${selectedCategory === 'All'
                                            ? 'bg-neutral-900 text-white shadow-md'
                                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                                            }`}
                                    >
                                        All
                                    </Button>
                                </div>

                                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={isFiltered && (minPrice || maxPrice || selectedBrand !== 'all' || sortBy !== 'name_asc' || selectedCategory !== 'All') ? "default" : "outline"}
                                            size="icon"
                                            className={cn(
                                                "h-10 w-10 border-neutral-200 flex-shrink-0 transition-all",
                                                isFiltered && (minPrice || maxPrice || selectedBrand !== 'all' || sortBy !== 'name_asc' || selectedCategory !== 'All')
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                    : "text-neutral-500 hover:bg-neutral-50"
                                            )}
                                        >
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0 rounded-2xl border-neutral-200 shadow-2xl overflow-hidden" align="end">
                                        <div className="bg-neutral-900 p-4 text-white">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <Filter className="w-4 h-4 text-indigo-400" />
                                                Advanced Filters
                                            </h3>
                                        </div>
                                        <div className="p-5 space-y-6 bg-white">
                                            {/* Category Filter */}
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Category</Label>
                                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                    <SelectTrigger className="h-10 rounded-xl border-neutral-200 bg-neutral-50">
                                                        <SelectValue placeholder="All Categories" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem key="cat-all" value="All">All Categories</SelectItem>
                                                        {categories.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.name}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Sorting */}
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Sort By</Label>
                                                <Select value={sortBy} onValueChange={setSortBy}>
                                                    <SelectTrigger className="h-10 rounded-xl border-neutral-200 bg-neutral-50">
                                                        <SelectValue placeholder="Sort by..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                                                        <SelectItem value="newest">Newest First</SelectItem>
                                                        <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                                                        <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Brand Filter */}
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Brand</Label>
                                                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                                                    <SelectTrigger className="h-10 rounded-xl border-neutral-200 bg-neutral-50">
                                                        <SelectValue placeholder="All Brands" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem key="brand-all" value="all">All Brands</SelectItem>
                                                        {brands.map(brand => (
                                                            <SelectItem key={brand.brand_id} value={brand.brand_id.toString()}>
                                                                {brand.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Price Range */}
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Price Range (₫)</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={minPrice}
                                                        onChange={(e) => setMinPrice(e.target.value)}
                                                        className="h-10 rounded-xl bg-neutral-50 border-neutral-200 font-medium"
                                                    />
                                                    <span className="text-neutral-300">—</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={maxPrice}
                                                        onChange={(e) => setMaxPrice(e.target.value)}
                                                        className="h-10 rounded-xl bg-neutral-50 border-neutral-200 font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <Separator className="bg-neutral-100" />

                                            <Button
                                                variant="outline"
                                                className="w-full h-11 rounded-xl font-bold text-neutral-600 hover:bg-neutral-50 border-neutral-200"
                                                onClick={() => {
                                                    setMinPrice('');
                                                    setMaxPrice('');
                                                    setSelectedBrand('all');
                                                    setSortBy('name_asc');
                                                }}
                                            >
                                                Reset Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
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
                                        <PosProductCard
                                            key={product.product_id}
                                            product={product}
                                            onAddToCart={addToCart}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                {/* Right Side: Cart (32% width) */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden max-w-[420px] mb-4">
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
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-neutral-400 hover:text-red-500"
                                onClick={handleClearCart}
                                disabled={cart.length === 0 && !selectedCustomer}
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Clear
                            </Button>
                        </div>
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
                                        <p className="font-bold text-sm text-neutral-900 leading-none mb-1">{selectedCustomer.full_name}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-medium">
                                            <span className="text-neutral-500 font-mono">{selectedCustomer.phone}</span>
                                            <span className="text-neutral-300">•</span>
                                            <div className="flex items-center gap-1 text-amber-600">
                                                <Gift className="w-3 h-3" />
                                                <span>{Number(selectedCustomer.loyalty_points || 0).toLocaleString('vi-VN')} pts</span>
                                            </div>
                                            <span className="text-neutral-300">•</span>
                                            <div className="flex items-center gap-1 text-indigo-600">
                                                <Wallet className="w-3 h-3" />
                                                <span>{Number(selectedCustomer.wallet_balance || 0).toLocaleString('vi-VN')}₫</span>
                                            </div>
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

                    {/* Cart Items Area */}
                    <div className="flex-1 min-h-0 bg-neutral-50/50 p-4">
                        <ScrollArea className="h-full">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-neutral-100">
                                        <ShoppingCart className="w-10 h-10 text-neutral-300" />
                                    </div>
                                    <h3 className="font-bold text-xl text-neutral-900 mb-2">Cart is Empty</h3>
                                    <p className="text-neutral-500 max-w-[200px] leading-relaxed">Start scanning or selecting products to build an order.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 pb-4">
                                    {cart.map(item => (
                                        <CartItemComponent
                                            key={item.variant_id}
                                            item={item}
                                            onUpdateQuantity={updateQuantity}
                                            onRemove={removeFromCart}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl border-t border-neutral-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 rounded-t-3xl mx-1 mb-1">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-neutral-600 text-sm">
                                <span>Subtotal</span>
                                <span className="font-medium text-neutral-900">{cartTotal.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <div className="flex justify-between text-neutral-600 text-sm">
                                <span>Tax (8%)</span>
                                <span>{taxAmount.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <Separator className="my-1.5 bg-neutral-200/60" />
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-neutral-900">Total</span>
                                <div className="text-right">
                                    <span className="font-bold text-2xl text-neutral-900 block leading-none tracking-tight">{finalTotal.toLocaleString('vi-VN')}₫</span>
                                    {cart.length > 0 && <span className="text-[10px] font-medium text-neutral-400 mt-1 block">{cart.length} items</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Button
                                variant="outline"
                                className="h-10 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-medium"
                                disabled={cart.length === 0 || checkoutLoading}
                                onClick={() => handleCheckout('CASH')}
                            >
                                <DollarSign className="w-4 h-4 mr-1.5 text-green-600" />
                                Cash
                            </Button>
                            <Button
                                variant="outline"
                                className="h-10 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-medium"
                                disabled={cart.length === 0 || checkoutLoading}
                                onClick={() => handleCheckout('WALLET')}
                            >
                                <Smartphone className="w-4 h-4 mr-1.5 text-purple-600" />
                                Wallet
                            </Button>
                        </div>
                        <Button
                            className="w-full h-12 text-base font-bold bg-neutral-900 hover:bg-cyan-600 shadow-lg shadow-neutral-900/20 transition-all active:scale-[0.98]"
                            disabled={cart.length === 0 || checkoutLoading}
                            onClick={() => handleCheckout('QR_BANK')}
                        >
                            {checkoutLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </div>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4 mr-2" />
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
