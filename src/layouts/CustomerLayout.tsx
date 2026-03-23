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
import { NotificationBell } from './CustomerLayout/components/NotificationBell';
import { AIChatBox } from '@/components/customer/AIChatBox';
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
    hideFooter?: boolean;
    darkNav?: boolean;
}

export default function CustomerLayout({ children, activePage = 'home', hideFooter = false, darkNav = false }: CustomerLayoutProps) {
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
        <div className={`min-h-screen flex flex-col ${darkNav ? 'bg-[#0A0A0B]' : 'bg-white'}`}>
            {/* Top Navigation */}
            <header className={`sticky top-0 z-50 border-b transition-colors duration-500 ${darkNav ? 'bg-[#0A0A0B]/80 backdrop-blur-md border-white/5 text-white' : 'bg-white border-gray-200'}`}>
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <div
                                className="cursor-pointer flex items-center"
                                onClick={() => navigate('/customer/home')}
                            >
                                <img src="/logo.png?v=8" alt="Figi Logo" className="h-12 w-auto object-contain" />
                            </div>

                            <nav className="hidden md:flex items-center gap-6">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => navigate(item.path)}
                                        className={`text-sm font-medium transition-colors ${activePage === item.id
                                            ? (darkNav ? 'text-amber-500' : 'text-gray-900')
                                            : (darkNav ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`relative ${darkNav ? 'text-gray-300 hover:text-white hover:bg-white/5' : ''}`}
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
                                    <Button variant="ghost" size="icon" className={darkNav ? 'text-gray-300 hover:text-white hover:bg-white/5' : ''}>
                                        <User className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className={darkNav ? 'bg-zinc-900 border-white/10 text-white' : ''}>
                                    <DropdownMenuLabel className={darkNav ? 'text-gray-400' : ''}>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator className={darkNav ? 'bg-white/5' : ''} />
                                    <DropdownMenuItem onClick={() => navigate('/customer/profile')} className={darkNav ? 'focus:bg-white/5 focus:text-white' : ''}>
                                        <User className="w-4 h-4 mr-2" />
                                        Profile
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => navigate('/customer/wallet')} className={darkNav ? 'focus:bg-white/5 focus:text-white' : ''}>
                                        <Wallet className="w-4 h-4 mr-2" />
                                        Wallet
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className={darkNav ? 'bg-white/5' : ''} />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            import('@/store/useAuthStore').then(({ useAuthStore }) => {
                                                useAuthStore.getState().logout();
                                                useCartStore.getState().clearCart();
                                                navigate('/guest/login');
                                            });
                                        }}
                                        className={darkNav ? 'focus:bg-white/5 focus:text-white text-red-400' : ''}
                                    >
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={`md:hidden ${darkNav ? 'text-gray-300 hover:text-white hover:bg-white/5' : ''}`}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className={`md:hidden py-4 border-t ${darkNav ? 'border-white/5' : ''}`}>
                            <nav className="flex flex-col gap-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.path)}
                                        className={`text-left px-4 py-2 text-sm font-medium transition-colors ${activePage === item.id
                                            ? (darkNav ? 'text-amber-500 bg-white/5' : 'text-gray-900 bg-gray-50')
                                            : (darkNav ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
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
            <AIChatBox />
            {!hideFooter && (
                <footer className="bg-gray-50 border-t border-gray-200 mt-16">
                    <div className="container mx-auto px-4 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <img src="/logo.png" alt="Figi Logo" className="h-10 w-auto object-contain mb-4" />
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
                        <div className="border-t border-gray-200 mt-8 pt-8 flex items-center justify-center gap-2 text-sm text-gray-600">
                            <img src="/logo.png" alt="Figi Logo" className="h-5 w-auto object-contain opacity-80" />
                            <p>© 2026 FigiCore. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
}

