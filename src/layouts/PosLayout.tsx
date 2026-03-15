import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ClipboardList,
    LogOut,
    Menu,
    ScanBarcode,
    Users,
    Banknote,
    CalendarDays, // Icon cho Work Schedule
    ChevronDown,
    ChevronRight,
    ReceiptText,
    User
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function PosLayout() {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    // State cho Mobile Menu và Sub-menu Schedule
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(true);

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
            <div className="h-16 flex items-center px-6 border-b border-neutral-800 shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-cyan-900/20">
                    P
                </div>
                <span className="font-bold text-lg text-white tracking-tight">FigiPOS</span>
            </div>

            {/* 2. User Info */}
            <Link to="/pos/profile" className="p-4 border-b border-neutral-800 flex items-center justify-between hover:bg-neutral-900 transition-colors group cursor-pointer block">
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

            {/* 3. Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${isActive(item.path)
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-neutral-800 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <div className="flex flex-col">
                                <span>{item.name}</span>
                                {/* Giữ lại description như code cũ của bạn muốn */}
                                <span className={`text-[10px] uppercase tracking-wider font-normal ${isActive(item.path) ? 'text-cyan-100' : 'text-neutral-500'
                                    }`}>
                                    {item.description}
                                </span>
                            </div>
                        </Link>
                    )
                })}

                {/* 4. WORK SCHEDULE SUBMENU (Collapsible) */}
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
                        {/* Sub-item: My Schedule */}
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

                        {/* Sub-item: My Timesheets */}
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
            </nav>

            {/* 5. Footer Logout */}
            <div className="p-4 border-t border-neutral-800 shrink-0">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 h-9"
                    onClick={() => logout()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50">
            {/* Desktop Sidebar (Hiện trên màn hình lớn) */}
            <aside className="hidden md:flex md:w-64 md:flex-col border-r border-neutral-200 bg-neutral-950 shrink-0">
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
            <div className={`flex-1 overflow-y-auto relative w-full h-full ${location.pathname === '/pos/counter' ? 'p-0' : 'p-8'}`}>
                <Outlet />
            </div>
        </div>
    );
}