import { useState, useEffect } from 'react';
import { Download, Search, Loader2, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';

export default function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await adminService.getAuditLogs({ page, limit });
            if (response.success) {
                setLogs(response.items);
                setTotal(response.total);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">PII Access Audit Logs</h1>
                    <p className="text-neutral-500">Track which staff members accessed sensitive customer data.</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
            </div>

            <Card className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-neutral-100 flex gap-4 bg-neutral-50/50 backdrop-blur-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Accessor (Staff)</th>
                                <th className="px-6 py-4">Target (Customer)</th>
                                <th className="px-6 py-4">Fields Viewed</th>
                                <th className="px-6 py-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                                            <span>Loading audit logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.log_id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                                            {format(new Date(log.accessed_at), 'yyyy-MM-dd HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-neutral-900">{log.accessor?.full_name || 'System'}</p>
                                                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{log.accessor?.role_code || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-neutral-900">{log.target?.full_name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-neutral-400 truncate max-w-[120px]">{log.target?.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {log.fields_viewed.split(',').map((field: string) => (
                                                    <Badge key={field} variant="outline" className="text-[10px] py-0 h-5 bg-neutral-50 text-neutral-600 border-neutral-200">
                                                        {field.trim()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
                                                {log.ip_address || 'Unknown'}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && total > 0 && (
                    <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={total}
                        itemsPerPage={limit}
                        onPageChange={setPage}
                    />
                )}
            </Card>
        </div>
    );
}

