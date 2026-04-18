import { useState, useMemo } from 'react';
import { 
    Loader2, 
    Search, 
    History, 
    ArrowUpRight 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fetchRecentActivity = async () => {
    const res = await api.get('/dashboard/recent-activity');
    return res.data;
};

export default function AuditLogs() {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: activity, isLoading: loadingActivity } = useQuery({
        queryKey: ['audit_logs_activity'],
        queryFn: fetchRecentActivity,
        refetchInterval: 30000, // Sync every 30s
    });

    // Filter activity based on search query
    const filteredActivity = useMemo(() => {
        if (!activity) return [];
        if (!searchQuery) return activity;
        const lowQuery = searchQuery.toLowerCase();
        return activity.filter((log: any) => 
            log.user.toLowerCase().includes(lowQuery) || 
            log.email.toLowerCase().includes(lowQuery) ||
            log.ip.toLowerCase().includes(lowQuery) ||
            log.role.toLowerCase().includes(lowQuery)
        );
    }, [activity, searchQuery]);

    return (
        <div className="min-h-full space-y-8 animate-in fade-in duration-500 font-outfit">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">System Audit Logs</h1>
                    <p className="text-neutral-500 font-medium">Giám sát và kiểm soát bảo mật hệ thống</p>
                </div>
            </div>

            {/* Main Content - Professional Table */}
            <Card className="bg-white border-neutral-200 shadow-sm rounded-[2rem] overflow-hidden group">
                <CardHeader className="p-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 w-full sm:w-auto">
                        <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-neutral-400" />
                            Security & Access Logs
                        </CardTitle>
                        <CardDescription className="text-neutral-500 font-medium">Nhật ký truy cập hệ thống thời gian thực</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search telemetry logs..." 
                            className="bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 w-full transition-all" 
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto px-8 pb-8">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                                    <th className="px-4 py-6 text-left">Người dùng</th>
                                    <th className="px-4 py-6 text-center">Vai trò</th>
                                    <th className="px-4 py-6 text-left">IP Address</th>
                                    <th className="px-4 py-6 text-left">Timestamp</th>
                                    <th className="px-4 py-6 text-right">Integrity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {loadingActivity ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-200" />
                                            <p className="mt-4 text-xs font-bold text-neutral-300 uppercase tracking-widest">Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : filteredActivity.length > 0 ? (
                                    filteredActivity.map((log: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-neutral-50/50 transition-all">
                                            <td className="px-4 py-5 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-400 group-hover:bg-neutral-200 transition-colors">
                                                    {log.user.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-neutral-900 group-hover:text-neutral-900">{log.user}</div>
                                                    <div className="text-[11px] text-neutral-400 font-medium">{log.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-center">
                                                <Badge variant="outline" className="bg-white border-neutral-200 text-neutral-500 rounded-lg font-bold text-[10px] uppercase h-6 px-2">{log.role}</Badge>
                                            </td>
                                            <td className="px-4 py-5 font-mono text-[11px] text-neutral-400 font-medium">{log.ip}</td>
                                            <td className="px-4 py-5 text-[11px] text-neutral-500 font-medium italic">{log.login_time}</td>
                                            <td className="px-4 py-5 text-right">
                                                <Badge className={cn("rounded-full px-3 text-[10px] font-bold border-none", log.is_suspicious ? "bg-rose-50 text-rose-600 shadow-sm" : "bg-emerald-50 text-emerald-600 shadow-sm ")}>
                                                    <ArrowUpRight className={cn("w-3 h-3 mr-1", log.is_suspicious && "rotate-90")} />
                                                    {log.is_suspicious ? 'RISK' : 'SECURE'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center font-bold text-neutral-300 text-sm">
                                            No records found matching your query.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
