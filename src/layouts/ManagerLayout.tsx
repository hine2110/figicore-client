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
    ChevronDown,
    ChevronRight,
    TicketPercent,
    Bell,
    DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/shared/NotificationBell";


// --- Types ---
type SubNavItem = { name: string; path: string };
type NavItem =
    | { name: string; path: string; icon: React.FC<{ className?: string }>; children?: never }
    | { name: string; icon: React.FC<{ className?: string }>; children: SubNavItem[]; path?: never };

export default function ManagerLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Attendance & Shifts": true });
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { toast } = useToast();
    const [unreadReturns, setUnreadReturns] = useState(0);

    // Socket Listener for Real-Time Notifications
    useEffect(() => {
        if (user?.role_code !== 'MANAGER') return; // Only connect for managers if needed

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const socketUrl = `${baseUrl}/events`;
        const socket = io(socketUrl);

        socket.on('connect', () => console.log('✅ Manager Connected to Events Socket'));

        socket.on('manager:new_return_request', (data) => {
            console.log("🔔 Received new return request:", data);
            setUnreadReturns(prev => prev + 1);
            toast({
                title: "New Return Request!",
                description: `Return #${data.return_id} from ${data.users?.full_name || 'a customer'} requires your approval.`,
                className: "bg-orange-600 text-white border-orange-700"
            });
        });

        return () => { socket.disconnect(); };
    }, [user, toast]);

    const navItems: NavItem[] = [
        { name: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { name: 'Team Management', path: '/manager/team', icon: Users },
        { name: 'Sales & Reports', path: '/manager/reports', icon: BarChart3 },
        { name: 'Inventory Overview', path: '/manager/inventory', icon: PackageSearch },
        { name: 'Campaigns', path: '/manager/campaigns', icon: Megaphone },
        { name: 'Promotions & Vouchers', path: '/manager/vouchers', icon: TicketPercent },
        { name: 'Return Approvals', path: '/manager/returns', icon: RotateCcw },
        {
            name: 'Attendance & Shifts',
            icon: CalendarClock,
            children: [
                { name: 'Schedules', path: '/manager/shifts' },
                { name: 'Timesheets', path: '/manager/timesheets' },
                { name: 'Leave Request', path: '/manager/leave-approvals' },
                { name: 'Correction Approvals', path: '/manager/correction-approvals' }
                
            ],
        },
        {
            name: 'Payroll',
            icon: DollarSign,
            children: [
                { name: 'Salary Configuration', path: '/manager/payroll' },
                { name: 'Payroll Management', path: '/manager/payroll-management' },
                { name: 'My Payroll', path: '/manager/my-payroll' },

            ],
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    const isParentActive = (children: SubNavItem[]) =>
        children.some((child) => location.pathname === child.path);

    const toggleMenu = (name: string) => {
        setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
    };

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
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
                <div className="h-full flex flex-col">
                    {/* Brand */}
                    <div className="h-16 flex items-center px-6 border-b border-neutral-800">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">M</div>
                        <span className="font-bold text-lg text-white">FigiManager</span>
                    </div>

                    {/* User Info & Profile Link */}
                    <div className="p-4 border-b border-neutral-800">
                        <Link to="/manager/profile" onClick={() => setIsSidebarOpen(false)} className="group flex items-center gap-3 w-full p-2 -m-2 rounded-lg hover:bg-neutral-800 transition-colors">
                            <Avatar>
                                <AvatarImage src={user?.avatar_url || ''} />
                                <AvatarFallback className="bg-indigo-600 text-white">
                                    {user?.full_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden flex-1 text-left">
                                <p className="text-sm font-medium text-white truncate group-hover:text-indigo-400 transition-colors">{user?.full_name}</p>
                                <p className="text-xs text-neutral-500 capitalize">{user?.role_code?.replace('_', ' ').toLowerCase()}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            // --- Parent item with sub-menu ---
                            if (item.children) {
                                const isExpanded = openMenus[item.name] ?? false;
                                const parentActive = isParentActive(item.children);
                                return (
                                    <div key={item.name}>
                                        {/* Accordion Toggle Button */}
                                        <button
                                            onClick={() => toggleMenu(item.name)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${parentActive
                                                ? 'text-white bg-neutral-800'
                                                : 'hover:bg-neutral-800 hover:text-white'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="flex-1 text-left">{item.name}</span>
                                            {isExpanded
                                                ? <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                                : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                                        </button>

                                        {/* Sub-items */}
                                        {isExpanded && (
                                            <div className="mt-1 ml-4 pl-3 border-l border-neutral-700 space-y-1">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.path}
                                                        to={child.path}
                                                        onClick={() => setIsSidebarOpen(false)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(child.path)
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
                                                            }`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // --- Flat item ---
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path!}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                        ? 'bg-indigo-600 text-white'
                                        : 'hover:bg-neutral-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
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
                <header className="bg-white border-b border-neutral-200 h-16 flex items-center px-4 lg:px-8 justify-between lg:justify-end">
                    <div className="lg:hidden w-8"></div>
                    <div className="flex items-center gap-6">
                        {/* Notification Bell */}
                        <NotificationBell />

                        <div className="text-sm text-right hidden sm:block">
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
