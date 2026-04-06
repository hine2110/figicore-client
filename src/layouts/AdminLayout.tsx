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
    Search,
    PanelLeftClose,
    PanelLeftOpen,
    Video
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/shared/NotificationBell";
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const isStudio = /\/admin\/(auctions|livestreams)\/\d+\/live/.test(location.pathname);

    // Auto-collapse on studio routes
    useEffect(() => {
        if (isStudio) {
            setIsSidebarCollapsed(true);
        }
    }, [isStudio]);

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Accounts', path: '/admin/accounts', icon: Users },
        { name: 'Profile Approvals', path: '/admin/approvals', icon: ShieldAlert },
        { name: 'Products', path: '/admin/products', icon: ShoppingBag },
        { name: 'Orders Oversight', path: '/admin/orders', icon: FileText },
        { name: 'Auctions', path: '/admin/auctions', icon: Gavel },
        { name: 'Livestreams', path: '/admin/livestreams', icon: Video },
        { name: 'Manual Refunds', path: '/admin/refunds', icon: RotateCcw },
        { name: 'System Settings', path: '/admin/settings', icon: Settings },
        { name: 'Audit Logs', path: '/admin/logs', icon: History },
    ];

    const isActive = (path: string) => location.pathname === path;

    const NavContent = () => (
        <div className="h-full flex flex-col bg-neutral-950 text-neutral-300">
            {/* Brand */}
            <div className={`h-16 flex items-center border-b border-neutral-800 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-red-900/20">A</div>
                {!isSidebarCollapsed && <span className="font-bold text-lg text-white tracking-tight ml-3 animate-in fade-in duration-500">FigiAdmin</span>}
            </div>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto py-6 px-3 space-y-1 ${isSidebarCollapsed ? 'items-center' : ''}`}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            title={isSidebarCollapsed ? item.name : ''}
                            className={`flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'
                            } ${active
                                    ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                                    : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
                                }`}
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} />
                            {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer Actions */}
            <div className={`p-4 border-t border-neutral-800 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : ''}`}>
                {!isSidebarCollapsed ? (
                    <div className="flex items-center gap-3 mb-4 px-2 animate-in fade-in duration-500">
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
                ) : (
                    <div className="flex justify-center mb-4">
                        <Avatar className="h-8 w-8 border border-neutral-700">
                            <AvatarFallback className="bg-red-900 text-white text-[10px]">
                                {user?.full_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}
                <Button
                    variant="ghost"
                    className={`w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 h-9 transition-all duration-300 ${isSidebarCollapsed ? 'px-0 justify-center' : 'justify-start'}`}
                    onClick={() => logout()}
                >
                    <LogOut className={`w-4 h-4 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
                    {!isSidebarCollapsed && <span>Sign Out</span>}
                </Button>
            </div>
        </div>
    );


    return (
        <div className="flex min-h-screen bg-neutral-50 font-sans">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:block fixed inset-y-0 left-0 z-40 border-r border-neutral-200 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'} ${isStudio ? 'opacity-0 pointer-events-none' : ''}`}>
                <NavContent />
            </aside>

            {/* Mobile Sidebar */}
            {!isStudio && (
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
            )}

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out ${isStudio ? 'lg:ml-0' : (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')}`}>
                {/* Header */}
                {!isStudio && (
                    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200 h-16 flex items-center px-8 justify-between">
                        <div className="flex items-center gap-6 w-full max-w-xl">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="hidden lg:flex h-9 w-9 text-neutral-400 hover:text-neutral-900 shrink-0"
                            >
                                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                            </Button>
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                    placeholder="Search system wide..."
                                    className="pl-9 bg-neutral-50 border-neutral-200 focus-visible:ring-red-500 h-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 px-4">
                            <NotificationBell />
                        </div>
                    </header>
                )}

                <div className={`${isStudio ? 'p-0 h-screen overflow-hidden' : 'p-8 flex-1 overflow-y-auto overflow-x-hidden'}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
