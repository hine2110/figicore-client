import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Box,
    PackageCheck,
    RotateCcw,
    LogOut,
    Truck,
    Menu,
    X,
    CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function WarehouseLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const navItems = [
        { name: 'Dashboard', path: '/warehouse/dashboard', icon: LayoutDashboard },
        { name: 'Inventory', path: '/warehouse/inventory', icon: Box },
        { name: 'Imports', path: '/warehouse/imports', icon: Truck },
        { name: 'Packing', path: '/warehouse/packing', icon: PackageCheck },
        { name: 'Returns', path: '/warehouse/returns', icon: RotateCcw },
        { name: 'Schedule', path: '/warehouse/schedule', icon: CalendarDays },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-neutral-50">
            {/* Mobile Sidebar Toggle */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-40 w-56 bg-neutral-900 text-neutral-300 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Brand */}
                    <div className="h-14 flex items-center px-6 border-b border-neutral-800">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">W</div>
                        <span className="font-bold text-lg text-white">Warehouse</span>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user?.avatar_url || undefined} />
                                <AvatarFallback className="bg-orange-600 text-white">
                                    {user?.full_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                                <p className="text-xs text-neutral-500 capitalize">{user?.role_code}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)} // Close on mobile click
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                        ? 'bg-orange-600 text-white'
                                        : 'hover:bg-neutral-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-800">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => logout()}
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Log Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header (Optional, mostly for title/breadcrumbs) */}
                <header className="bg-white border-b border-neutral-200 h-14 flex items-center px-8 justify-between lg:justify-end">
                    <div className="lg:hidden w-8"></div> {/* Spacer for toggle button */}
                    <div className="text-sm text-neutral-500">
                        Section: <span className="font-semibold text-orange-600">Warehouse Ops</span>
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
