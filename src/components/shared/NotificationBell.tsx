import { useState, useEffect } from 'react';
import { Bell, BellRing, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { axiosInstance } from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/useAuthStore';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const res = await axiosInstance.get('/notifications');
                setNotifications(res.data);
                setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };

        fetchNotifications();

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com';
        const socket = io(`${baseUrl}/events`);

        socket.on(`user:${user.user_id}:new_notification`, (newNotif: any) => {
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => { socket.disconnect(); };
    }, [user]);

    const handleOpenNotif = async (notif: any) => {
        setOpen(false); // Close dropdown

        if (notif.target_url) {
            navigate(notif.target_url);
        } else {
            setSelectedNotif(notif);
        }

        // Mark as read
        if (!notif.is_read) {
            try {
                await axiosInstance.patch(`/notifications/${notif.notification_id}/read`);
                setNotifications(prev =>
                    prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleReadAll = async () => {
        try {
            await axiosInstance.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };



    if (!user) return null;

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        {unreadCount > 0 ? (
                            <BellRing className="w-5 h-5 text-gray-700 animate-[wiggle_1s_ease-in-out_infinite]" />
                        ) : (
                            <Bell className="w-5 h-5 text-gray-700" />
                        )}
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-96 p-0 overflow-hidden rounded-xl shadow-2xl border border-gray-100"
                    sideOffset={8}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
                        <span className="font-semibold text-sm text-gray-900">Notifications</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={handleReadAll}
                                    className="text-xs text-blue-600 h-auto p-0"
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Bell className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.notification_id}
                                    onClick={() => handleOpenNotif(n)}
                                    className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${!n.is_read ? 'bg-blue-50/60' : ''}`}
                                >
                                    {/* Unread Dot */}
                                    <div className="flex-shrink-0 mt-1.5">
                                        <div className={`w-2 h-2 rounded-full ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                            {n.content}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(n.created_at).toLocaleString('vi-VN', {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
                                </button>
                            ))
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Full Detail Modal */}
            <Dialog open={!!selectedNotif} onOpenChange={() => setSelectedNotif(null)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl">
                    {/* Modal Header */}
                    <div className="relative px-6 pt-6 pb-4 border-b bg-gradient-to-b from-blue-50 to-white">
                        <div className="flex items-center gap-3 pr-8">
                            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                                <BellRing className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-0.5">Notification</p>
                                <h3 className="text-base font-bold text-gray-900 leading-snug">
                                    {selectedNotif?.title}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="px-6 py-5">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {selectedNotif?.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-4 border-t pt-3">
                            {selectedNotif?.created_at && new Date(selectedNotif.created_at).toLocaleString('vi-VN', {
                                weekday: 'short', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 pb-5 flex justify-end">
                        <Button
                            className="px-8 flex-1 sm:flex-none bg-black text-white hover:bg-gray-800 rounded-xl h-11 text-sm font-semibold"
                            onClick={() => setSelectedNotif(null)}
                        >
                            Dismiss
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
