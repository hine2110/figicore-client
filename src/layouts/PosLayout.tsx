import { Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ClipboardList,
    LogOut,
    Menu,
    ScanBarcode,
    Users,
    Banknote,
    CalendarClock,
    User
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
<<<<<<< HEAD
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
=======
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
>>>>>>> main

export default function PosLayout() {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
<<<<<<< HEAD
        { name: 'Dashboard', path: '/pos/dashboard', icon: LayoutDashboard },
        { name: 'Sales Counter', path: '/pos/counter', icon: ScanBarcode },
        { name: 'Order Queue', path: '/pos/orders', icon: ClipboardList },
        // { name: 'Schedule', path: '/pos/schedule', icon: CalendarDays }, // Replaced by Submenu
=======
        {
            name: 'Dashboard',
            path: '/pos/dashboard',
            icon: LayoutDashboard,
            //description: 'Overview & Analytics'
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
        {
            name: 'Work Schedule',
            path: '/pos/schedule',
            icon: CalendarClock,
            description: 'View Shifts'
        },
        {
            name: 'My Profile',
            path: '/pos/profile',
            icon: User,
            description: 'Account Settings'
        },
>>>>>>> main
    ];

    const [isScheduleOpen, setIsScheduleOpen] = useState(true);

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

<<<<<<< HEAD
            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-40 w-56 bg-neutral-900 text-neutral-300 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Brand */}
                    <div className="h-14 flex items-center px-6 border-b border-neutral-800">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">P</div>
                        <span className="font-bold text-lg text-white">POS System</span>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                            <Avatar>
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
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-neutral-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            )
                        })}

                        {/* WORK SCHEDULE SUBMENU */}
                        <Collapsible open={isScheduleOpen} onOpenChange={setIsScheduleOpen} className="space-y-1">
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:text-white group">
                                <div className="flex items-center gap-3 text-neutral-300 group-hover:text-white">
                                    <CalendarDays className="w-5 h-5" />
                                    Work Schedule
                                </div>
                                {isScheduleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-1 pl-10 pr-2">
                                <Link
                                    to="/pos/schedule"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/pos/schedule')
                                        ? 'bg-blue-600 text-white'
                                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                        }`}
                                >
                                    My Schedule
                                </Link>
                                <Link
                                    to="/pos/timesheets"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/pos/timesheets')
                                        ? 'bg-blue-600 text-white'
                                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                        }`}
                                >
                                    My Timesheets
                                </Link>
                            </CollapsibleContent>
                        </Collapsible>
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-800 space-y-1">
                        <Link to="/pos/profile">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800"
                            >
                                <ScanBarcode className="w-5 h-5 mr-3" />
                                My Profile
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => logout()}
=======
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
                            className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${active
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                                : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
                                }`}
>>>>>>> main
                        >
                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${active ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`} />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">{item.name}</span>
                                <span className={`text-[10px] uppercase tracking-wider font-medium ${active ? 'text-cyan-100' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
                                    {item.description}
                                </span>
                            </div>
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
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:w-64 md:flex-col border-r border-neutral-200 bg-neutral-950">
                <NavContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md hover:bg-neutral-100"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="p-4 md:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
