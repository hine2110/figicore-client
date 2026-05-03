import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ClipboardList,
    LogOut,
    Menu,
    ScanBarcode,
    Users,
    Banknote,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    ReceiptText,
    User,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Tách ra ngoài PosLayout để tránh re-render toàn bộ layout mỗi giây
function LiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="hidden md:flex flex-col">
            <span className="text-base font-bold text-neutral-800 tabular-nums tracking-tight leading-tight">{timeStr}</span>
            <span className="text-[11px] text-neutral-400 font-medium capitalize">{dateStr}</span>
        </div>
    );
}

export default function PosLayout() {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    // State cho Mobile Menu, Sub-menu Schedule và Collapsed Sidebar
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Danh sách menu chính (Đã tách Work Schedule ra để xử lý riêng)
    const navItems = [
        {
            name: 'Dashboard',
            path: '/pos/dashboard',
            icon: LayoutDashboard,
            description: 'Overview & Analytics'
        },
        {
            name: 'Sales Counter',
            path: '/pos/counter',
            icon: ScanBarcode,
            description: 'Process New Sales'
        },
        {
            name: 'Order History',
            path: '/pos/orders',
            icon: ClipboardList,
            description: 'View Transactions'
        },
        {
            name: 'Customers',
            path: '/pos/customers',
            icon: Users,
            description: 'Manage Members'
        },
        {
            name: 'Cash Session',
            path: '/pos/sessions',
            icon: Banknote,
            description: 'Open/Close Shift'
        },
        // Work Schedule được xử lý riêng bên dưới
        {
            name: 'My Profile',
            path: '/pos/profile',
            icon: User,
            description: 'Account Settings'
        },
        { name: 'My Payroll', path: '/pos/my-payroll', icon: ReceiptText, description: 'Salary & Payslips' },
    ];

    const isActive = (path: string) => location.pathname === path;

    // --- PHẦN NỘI DUNG SIDEBAR (Dùng chung cho Mobile & Desktop) ---
    const NavContent = () => (
        <div className="h-full flex flex-col bg-neutral-950 text-neutral-300">
            {/* 1. Brand Logo */}
            <div className={`h-16 flex items-center border-b border-neutral-800 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-cyan-900/20">
                    P
                </div>
                {!isSidebarCollapsed && <span className="font-bold text-lg text-white tracking-tight ml-3 animate-in fade-in duration-300">FigiPOS</span>}
            </div>

            {/* 2. User Info */}
            {!isSidebarCollapsed ? (
                <Link to="/pos/profile" className="p-4 border-b border-neutral-800 flex items-center justify-between hover:bg-neutral-900 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-neutral-700">
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-600 text-white">
                                {user?.full_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                            <p className="text-xs text-neutral-500 capitalize">{user?.role_code}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </Link>
            ) : (
                <div className="flex justify-center py-3 border-b border-neutral-800">
                    <Avatar className="h-8 w-8 border border-neutral-700">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                            {user?.full_name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            )}

            {/* 3. Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 [ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            title={isSidebarCollapsed ? item.name : ''}
                            className={`flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'
                            } ${isActive(item.path)
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-neutral-800 hover:text-white'
                            }`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!isSidebarCollapsed && (
                                <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span>{item.name}</span>
                                    <span className={`text-[10px] uppercase tracking-wider font-normal ${isActive(item.path) ? 'text-cyan-100' : 'text-neutral-500'}`}>
                                        {item.description}
                                    </span>
                                </div>
                            )}
                        </Link>
                    )
                })}

                {/* 4. WORK SCHEDULE SUBMENU (Collapsible - only show when sidebar is expanded) */}
                {!isSidebarCollapsed ? (
                    <Collapsible open={isScheduleOpen} onOpenChange={setIsScheduleOpen} className="space-y-1 pt-2 border-t border-neutral-800 mt-2">
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:text-white group text-neutral-300">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="w-5 h-5" />
                                <div className="flex flex-col items-start">
                                    <span>Work Schedule</span>
                                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-normal">Manage Shifts</span>
                                </div>
                            </div>
                            {isScheduleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-1 pl-4 pr-2">
                        {/* Sub-item: Register Shifts */}
                        <Link
                            to="/pos/shift-registration"
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-6 border-l-2 ${isActive('/pos/shift-registration')
                                ? 'border-blue-500 text-white bg-white/5'
                                : 'border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                }`}
                        >
                            Register Shifts
                        </Link>

                        <Link
                            to="/pos/schedule"
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-6 border-l-2 ${isActive('/pos/schedule')
                                ? 'border-blue-500 text-white bg-white/5'
                                : 'border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                        >
                            My Schedule
                        </Link>
                        <Link
                            to="/pos/timesheets"
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-6 border-l-2 ${isActive('/pos/timesheets')
                                ? 'border-blue-500 text-white bg-white/5'
                                : 'border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                        >
                            My Timesheets
                        </Link>
                    </CollapsibleContent>
                </Collapsible>
            ) : (
                <div className="pt-2 border-t border-neutral-800 mt-2 space-y-1">
                        <Link
                            to="/pos/schedule"
                            title="My Schedule"
                            className={`flex justify-center py-2.5 rounded-lg transition-colors ${isActive('/pos/schedule') ? 'bg-blue-600 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'}`}
                        >
                            <CalendarDays className="w-5 h-5" />
                        </Link>
                    </div>
                )}
            </nav>

            {/* 5. Footer Logout */}
            <div className={`p-4 border-t border-neutral-800 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : ''}`}>
                <Button
                    variant="ghost"
                    className={`w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 h-9 transition-all duration-300 ${isSidebarCollapsed ? 'px-0 justify-center' : 'justify-start'}`}
                    onClick={() => logout()}
                >
                    <LogOut className={`h-4 w-4 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
                    {!isSidebarCollapsed && <span>Logout</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50">
            {/* Desktop Sidebar (Hiện trên màn hình lớn) */}
            <aside className={`hidden md:flex md:flex-col border-r border-neutral-200 bg-neutral-950 shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
                <NavContent />
            </aside>

            {/* Mobile Sidebar (Nút Menu + Sheet) */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md hover:bg-neutral-100 border border-neutral-200"
                    >
                        <Menu className="h-5 w-5 text-neutral-700" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-r-neutral-800 bg-neutral-950">
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* POS Header */}
                <header className="h-14 bg-white border-b border-neutral-200 flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Toggle Button - chỉ hiện trên desktop */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="hidden md:flex h-9 w-9 text-neutral-400 hover:text-neutral-900 shrink-0"
                        >
                            {isSidebarCollapsed
                                ? <PanelLeftOpen className="w-5 h-5" />
                                : <PanelLeftClose className="w-5 h-5" />
                            }
                        </Button>
                        <div className="md:hidden w-8"></div> {/* Spacer for mobile menu button */}
                        {/* Real-time Clock */}
                        <LiveClock />
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="h-6 w-px bg-neutral-200 hidden sm:block"></div>
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-xs font-bold text-neutral-900">Shift Status</span>
                            <span className="text-[10px] text-green-600 font-bold uppercase">Active</span>
                        </div>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto ${location.pathname === '/pos/counter' ? 'p-0' : 'p-8'}`}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}