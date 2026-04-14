import { Loader2, ShieldCheck, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const fetchOnlineUsers = async () => {
    const res = await api.get('/dashboard/recent-activity');
    return res.data;
};

export default function AuditLogs() {
    const { data: onlineUsers, isLoading: loadingOnline } = useQuery({
        queryKey: ['online_users'],
        queryFn: fetchOnlineUsers,
        refetchInterval: 15000,
    });

    return (
        <div className="space-y-6">
            {/* Active Sessions Banner */}
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 to-slate-900/60 backdrop-blur-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
                        <h1 className="text-sm font-black uppercase tracking-widest text-indigo-300">Tài khoản đang Online</h1>
                    </div>
                    <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px] font-mono">
                        {loadingOnline ? '...' : onlineUsers?.length || 0} phiên
                    </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {loadingOnline ? (
                        <div className="flex items-center gap-2 text-indigo-400/60 col-span-full py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-mono">Đang đồng bộ phiên mạng...</span>
                        </div>
                    ) : onlineUsers?.length === 0 ? (
                        <span className="text-xs text-indigo-400/40 font-mono col-span-full py-4">Chưa có phiên nào đăng nhập</span>
                    ) : onlineUsers?.map((u: any, i: number) => (
                        <div
                            key={i}
                            className={`rounded-xl border p-3 space-y-2 transition-all hover:scale-[1.02] ${
                                u.is_suspicious
                                    ? 'bg-red-950/40 border-red-500/30'
                                    : 'bg-white/5 border-indigo-500/20 hover:border-indigo-400/40'
                            }`}
                        >
                            {/* Header row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        u.is_suspicious ? 'bg-red-400 animate-ping' : 'bg-green-400 shadow-[0_0_6px_#4ade80]'
                                    }`} />
                                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{u.user}</span>
                                </div>
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                    u.role === 'SUPER_ADMIN' ? 'bg-rose-500/20 text-rose-400' :
                                    u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' :
                                    u.role === 'STAFF' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-indigo-500/20 text-indigo-400'
                                }`}>{u.role}</span>
                            </div>
                            {/* Detail rows */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Wifi className="w-3 h-3 text-indigo-400 shrink-0" />
                                    <span className="text-[10px] font-mono text-neutral-400 truncate">{u.email}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-3 h-3 text-neutral-500 shrink-0" />
                                        <code className="text-[9px] font-mono text-neutral-500">{u.ip}</code>
                                    </div>
                                    <span className="text-[9px] font-mono text-neutral-600 shrink-0">{u.login_time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
