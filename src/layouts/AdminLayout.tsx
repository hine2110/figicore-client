import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    Gavel,
    FileText,
    Settings,
    ShieldAlert,
    History,
    RotateCcw,
    Menu,
    LogOut,
    Bell,
    Search
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminLayout() {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Accounts', path: '/admin/accounts', icon: Users },
        { name: 'Profile Approvals', path: '/admin/approvals', icon: ShieldAlert },
        { name: 'Products', path: '/admin/products', icon: ShoppingBag },
        { name: 'Orders Oversight', path: '/admin/orders', icon: FileText },
        { name: 'Auctions', path: '/admin/auctions', icon: Gavel },
        { name: 'Manual Refunds', path: '/admin/refunds', icon: RotateCcw },
        { name: 'System Settings', path: '/admin/settings', icon: Settings },
        { name: 'Audit Logs', path: '/admin/logs', icon: History },
    ];

    const isActive = (path: string) => location.pathname === path;

    const NavContent = () => (
        <div className="h-full flex flex-col bg-neutral-950 text-neutral-300">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-neutral-800 shrink-0">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm shadow-red-900/20">A</div>
                <span className="font-bold text-lg text-white tracking-tight">FigiAdmin</span>
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
                                    ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                                    : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-neutral-800 shrink-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <Avatar className="h-9 w-9 border border-neutral-700">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-red-900 text-white border-neutral-700">
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
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200 h-16 flex items-center px-8 justify-between">
                    <div className="flex items-center gap-4 w-full max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input
                                placeholder="Search system wide..."
                                className="pl-9 bg-neutral-50 border-neutral-200 focus-visible:ring-red-500 h-9"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative text-neutral-500 hover:text-neutral-900">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </Button>
                        <div className="h-6 w-px bg-neutral-200 mx-1"></div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || undefined} />
                                        <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/admin/profile" className="cursor-pointer font-medium">
                                        <div className="flex items-center">
                                            <span>My Profile</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()} className="text-red-600 cursor-pointer">
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <div className="p-8 flex-1 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
