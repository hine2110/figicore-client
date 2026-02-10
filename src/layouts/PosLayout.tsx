import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ClipboardList,
    LogOut,
    Menu,
    ScanBarcode,
    Users,
    Clock
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function PosLayout() {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { name: 'Analytics', path: '/pos/dashboard', icon: LayoutDashboard },
        { name: 'Sales', path: '/pos/counter', icon: ScanBarcode },
        { name: 'Orders', path: '/pos/orders', icon: ClipboardList },
        { name: 'Customers', path: '/pos/customers', icon: Users },
        { name: 'Sessions', path: '/pos/schedule', icon: Clock },
    ];

    const isActive = (path: string) => location.pathname === path;

    const NavContent = () => (
        <div className="h-full flex flex-col bg-neutral-950 text-neutral-300">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-neutral-800 shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-cyan-900/20">
                    P
                </div>
                <span className="font-bold text-lg text-white tracking-tight">FigiPOS</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${active
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                                : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-neutral-800 shrink-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <Avatar className="h-9 w-9 border border-neutral-700">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-neutral-700">
                            {user?.full_name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                        <p className="text-xs text-neutral-500 capitalize">{user?.role_code}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 h-9"
                    onClick={() => logout()}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-neutral-50 font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200">
                <NavContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-3 left-4 z-50">
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 bg-neutral-950 border-neutral-800">
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen transition-all duration-300">
                {/* Header */}


                <div className="p-8 flex-1 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
