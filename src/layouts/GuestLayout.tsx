import {
    Menu,
    X,
    Gavel,
    Home,
    LogIn,
    UserPlus
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

interface GuestLayoutProps {
    children: React.ReactNode;
    activePage?: string;
}

export function GuestLayout({ children, activePage = 'home' }: GuestLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: '/guest/home' },
        { id: 'products', label: 'Products', path: '/guest/browse' },
        { id: 'blind-box', label: 'Blind Box', path: '/guest/browse' },
        { id: 'auction', label: 'Auction', icon: Gavel, path: '/guest/browse' },
        { id: 'about', label: 'About', path: '/guest/about' },
    ];

    const handleNavClick = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            {/* Brand */}
                            <Link to="/guest/home" className="font-semibold text-xl tracking-tight text-gray-900 flex items-center gap-2">
                                FigiCore
                            </Link>

                            {/* Desktop Nav */}
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

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Desktop Auth Buttons */}
                            <div className="hidden md:flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-900"
                                    onClick={() => navigate('/guest/login')}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-gray-900 text-white hover:bg-black transition-colors px-5"
                                    onClick={() => navigate('/guest/register')}
                                >
                                    Register
                                </Button>
                            </div>

                            {/* Mobile Menu Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden text-gray-700"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                            <nav className="flex flex-col gap-1">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.path)}
                                        className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activePage === item.id
                                            ? 'text-gray-900 bg-gray-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon && <item.icon className="w-4 h-4" />}
                                            {item.label}
                                        </div>
                                    </button>
                                ))}

                                <div className="mt-4 px-4 grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleNavClick('/guest/login')}
                                        className="w-full justify-center"
                                    >
                                        <LogIn className="w-4 h-4 mr-2" /> Sign In
                                    </Button>
                                    <Button
                                        className="w-full justify-center bg-gray-900 text-white"
                                        onClick={() => handleNavClick('/guest/register')}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" /> Register
                                    </Button>
                                </div>
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
            <footer className="bg-gray-50 border-t border-gray-200 mt-16 text-gray-900">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        <div className="space-y-4">
                            <div className="font-semibold text-lg tracking-tight">FigiCore</div>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                                Your trusted platform for collectible figures, art toys, and exclusive merchandise.
                                Connecting collectors worldwide.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-gray-900">Shop</h3>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li onClick={() => navigate('/guest/browse')} className="hover:text-gray-900 cursor-pointer transition-colors">All Products</li>
                                <li onClick={() => navigate('/guest/browse')} className="hover:text-gray-900 cursor-pointer transition-colors">Blind Box</li>
                                <li onClick={() => navigate('/guest/browse')} className="hover:text-gray-900 cursor-pointer transition-colors">Auctions</li>
                                <li onClick={() => navigate('/guest/browse')} className="hover:text-gray-900 cursor-pointer transition-colors">New Arrivals</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-gray-900">Support</h3>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li className="hover:text-gray-900 cursor-pointer transition-colors">Help Center</li>
                                <li className="hover:text-gray-900 cursor-pointer transition-colors">Shipping Info</li>
                                <li className="hover:text-gray-900 cursor-pointer transition-colors">Returns</li>
                                <li className="hover:text-gray-900 cursor-pointer transition-colors">Contact Us</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-gray-900">Company</h3>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li onClick={() => navigate('/guest/about')} className="hover:text-gray-900 cursor-pointer transition-colors">About Us</li>
                                <li className="hover:text-gray-900 cursor-pointer transition-colors">Careers</li>
                                <li className="hover:text-gray-900 cursor-pointer transition-colors">Privacy Policy</li>
                                <li className="hover:text-gray-900 cursor-pointer transition-colors">Terms of Service</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
                        <p>© 2026 FigiCore. All rights reserved.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <span className="hover:text-gray-900 cursor-pointer">Twitter</span>
                            <span className="hover:text-gray-900 cursor-pointer">Instagram</span>
                            <span className="hover:text-gray-900 cursor-pointer">Discord</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
