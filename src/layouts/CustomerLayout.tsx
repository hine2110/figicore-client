import {
    ShoppingCart,
    Heart,
    User,
    Search,
    Menu,
    X,
    Wallet,
    Package,
    Gavel,
    Home
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: '/customer/home' },
        { id: 'products', label: 'Products', path: '/customer/shop' },
        { id: 'blind-box', label: 'Blind Box', path: '/customer/shop' },
        { id: 'pre-order', label: 'Pre-Order', path: '/customer/shop' },
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
                            <div className="relative hidden lg:block">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-10 w-64"
                                />
                            </div>

                            <Button variant="ghost" size="icon" className="relative">
                                <Heart className="w-5 h-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                onClick={() => navigate('/customer/cart')}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                    3
                                </Badge>
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
                                    <DropdownMenuItem onClick={() => navigate('/customer/orders')}>
                                        <Package className="w-4 h-4 mr-2" />
                                        Orders
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/customer/wallet')}>
                                        <Wallet className="w-4 h-4 mr-2" />
                                        Wallet
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/guest/login')}>Logout</DropdownMenuItem>
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
