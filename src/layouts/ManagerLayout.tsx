import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Megaphone,
    CalendarClock,
    RotateCcw,
    MessageSquare,
    PackageSearch,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ManagerLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const navItems = [
        { name: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { name: 'Team Management', path: '/manager/team', icon: Users },
        { name: 'Sales & Reports', path: '/manager/reports', icon: BarChart3 },
        { name: 'Inventory Overview', path: '/manager/inventory', icon: PackageSearch },
        { name: 'Campaigns', path: '/manager/campaigns', icon: Megaphone },
        { name: 'Return Approvals', path: '/manager/returns', icon: RotateCcw },
        { name: 'Shift Schedule', path: '/manager/shifts', icon: CalendarClock },
        { name: 'Feedback', path: '/manager/feedback', icon: MessageSquare },
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
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-neutral-900 text-neutral-300 transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'tranneutral-x-0' : '-tranneutral-x-full lg:tranneutral-x-0'}
        `}>
                <div className="h-full flex flex-col">
                    {/* Brand */}
                    <div className="h-16 flex items-center px-6 border-b border-neutral-800">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">M</div>
                        <span className="font-bold text-lg text-white">FigiManager</span>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user?.avatarUrl} />
                                <AvatarFallback className="bg-indigo-600 text-white">
                                    {user?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
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
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                            ? 'bg-indigo-600 text-white'
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
                {/* Header */}
                <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-8 justify-between lg:justify-end">
                    <div className="lg:hidden w-8"></div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right">
                            <p className="font-semibold text-neutral-900">Store Performance</p>
                            <p className="text-xs text-green-600 font-medium">+12% vs last week</p>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
