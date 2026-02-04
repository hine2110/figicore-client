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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { io } from 'socket.io-client';
import { useToast } from "@/components/ui/use-toast";
// import { useQueryClient } from "@tanstack/react-query"; // Not installed yet

// Helper for Audio Feedback
const playNotificationSound = (orderCode: string) => {
    try {
        // 1. Play "Ding" Sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch((err) => console.warn("Audio blocked. User must interact with page first.", err));

        // 2. Voice Notification
        setTimeout(() => {
            if ('speechSynthesis' in window) {
                const text = `Bạn có đơn hàng mới. Mã đơn: ${orderCode.split('-')[1] || 'mới'}`; // Read partial code
                const utterance = new SpeechSynthesisUtterance(text);

                // --- VOICE SELECTION LOGIC ---
                const voices = window.speechSynthesis.getVoices();

                // Try to find a specific Vietnamese Female voice
                const vnVoice = voices.find(v =>
                    v.lang.includes('vi') &&
                    (v.name.includes('Google') || v.name.includes('HoaiMy') || v.name.includes('Female'))
                );

                // Fallback to any Vietnamese voice if specific one not found
                if (vnVoice) {
                    utterance.voice = vnVoice;
                } else {
                    const anyVnVoice = voices.find(v => v.lang.includes('vi'));
                    if (anyVnVoice) utterance.voice = anyVnVoice;
                }

                utterance.rate = 1.0; // Normal speed
                utterance.pitch = 1.1; // Slightly higher pitch (more feminine)
                utterance.volume = 1;

                window.speechSynthesis.speak(utterance);
            }
        }, 800);
    } catch (error) {
        console.error("Audio Notification Error:", error);
    }
};

export default function WarehouseLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { toast } = useToast();
    // const queryClient = useQueryClient();

    useEffect(() => {
        // Connect to WebSocket Namespace
        const socket = io('http://localhost:3000/events');

        socket.on('connect', () => {
            console.log('✅ Connected to Warehouse Events');
        });

        socket.on('warehouse:new_order', (data: any) => {
            // 1. Play Sound & TTS
            playNotificationSound(data.order_code);

            // 2. Refresh Data
            // queryClient.invalidateQueries({ queryKey: ['warehouse-orders'] }); 
            // queryClient.invalidateQueries({ queryKey: ['orders'] });
            // TODO: Implement Real Refresh when Dashboard is connected to API

            // 2. Show Toast
            toast({
                title: "🔔 New Order Received!",
                description: `Order #${data.order_code} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.total_amount)}`,
                className: "bg-orange-600 text-white border-orange-700",
                duration: 10000,
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

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
                    <div className="p-4 border-t border-neutral-800 space-y-1">
                        <Link to="/warehouse/profile">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800"
                            >
                                <Box className="w-5 h-5 mr-3" />
                                My Profile
                            </Button>
                        </Link>
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
