import {
    ShoppingCart,
    User,
    Menu,
    X,
    Wallet,
    Gavel,
    Home
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { io } from 'socket.io-client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerLayoutProps {
    children: React.ReactNode;
    activePage?: string;
}

export default function CustomerLayout({ children, activePage = 'home' }: CustomerLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { items, fetchCart } = useCartStore(); // Use Cart Store
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const { user } = useAuthStore();
    const { toast } = useToast();

    // Initial Cart Fetch
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Listen for Real-time Notifications
    useEffect(() => {
        if (!user?.user_id) return;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const socket = io(`${baseUrl}/events`);

        socket.on(`customer:notify:${user.user_id}`, (data: { title: string, content: string }) => {
            toast({
                title: data.title,
                description: data.content,
                duration: 10000, // 10 seconds to read
                className: data.title.includes('WARNING') ? 'bg-red-50 border-red-500 text-red-900 border-l-4 shadow-xl' : 'bg-green-50 border-green-500 text-green-900 border-l-4 shadow-xl'
            });
        });

        return () => { socket.disconnect(); };
    }, [user?.user_id, toast]);

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: '/customer/home' },
        { id: 'products', label: 'Products', path: '/customer/retail' },
        { id: 'blind-box', label: 'Blind Box', path: '/customer/blindbox' },
        { id: 'pre-order', label: 'Pre-Order', path: '/customer/preorder' },
        { id: 'auction', label: 'Auction', icon: Gavel, path: '/customer/auctions' },
    ];

    const handleNavClick = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <div
                                className="font-semibold text-xl cursor-pointer"
                                onClick={() => navigate('/customer/home')}
                            >
                                FigiCore
                            </div>

                            <nav className="hidden md:flex items-center gap-6">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => navigate(item.path)}
                                        className={`text-sm font-medium transition-colors ${activePage === item.id
                                            ? 'text-gray-900'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">


                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                onClick={() => navigate('/customer/cart')}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                        {cartCount}
                                    </Badge>
                                )}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <User className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/customer/profile')}>
                                        <User className="w-4 h-4 mr-2" />
                                        Profile
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => navigate('/customer/wallet')}>
                                        <Wallet className="w-4 h-4 mr-2" />
                                        Wallet
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                        import('@/store/useAuthStore').then(({ useAuthStore }) => {
                                            useAuthStore.getState().logout();
                                            useCartStore.getState().clearCart();
                                            navigate('/guest/login');
                                        });
                                    }}>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t">
                            <nav className="flex flex-col gap-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.path)}
                                        className={`text-left px-4 py-2 text-sm font-medium transition-colors ${activePage === item.id
                                            ? 'text-gray-900 bg-gray-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 mt-16">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="font-semibold text-lg mb-4">FigiCore</div>
                            <p className="text-sm text-gray-600">
                                Your trusted platform for collectible figures, art toys, and exclusive merchandise.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4">Shop</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>All Products</li>
                                <li>Blind Box</li>
                                <li>Pre-Orders</li>
                                <li>Auctions</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4">Support</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>Help Center</li>
                                <li>Shipping Info</li>
                                <li>Returns</li>
                                <li>Contact Us</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4">Account</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li onClick={() => navigate('/customer/orders')} className="cursor-pointer">My Orders</li>
                                <li onClick={() => navigate('/customer/cart')} className="cursor-pointer">Wishlist</li>
                                <li onClick={() => navigate('/customer/wallet')} className="cursor-pointer">Wallet</li>
                                <li>Settings</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
                        © 2026 FigiCore. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
