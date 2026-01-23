import { Download, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LOGS = [
    { id: 1, action: 'User Login', user: 'admin@figicore.com', ip: '192.168.1.1', time: '2026-01-22 10:45:00', status: 'Success' },
    { id: 2, action: 'Update Inventory', user: 'manager@figicore.com', ip: '192.168.1.4', time: '2026-01-22 10:30:15', status: 'Success' },
    { id: 3, action: 'Failed Login', user: 'unknown', ip: '45.33.22.11', time: '2026-01-22 09:15:22', status: 'Failed' },
    { id: 4, action: 'System Config Change', user: 'admin@figicore.com', ip: '192.168.1.1', time: '2026-01-21 16:20:00', status: 'Success' },
];

export default function AuditLogs() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Audit Logs</h1>
                    <p className="text-neutral-500">Track all system activities and security events.</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Export Logs
                </Button>
            </div>

            <Card className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex gap-4 bg-neutral-50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="Search logs..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <Button variant="outline" className="bg-white">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">IP Address</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {LOGS.map(log => (
                            <tr key={log.id} className="hover:bg-neutral-50">
                                <td className="px-6 py-4 font-mono text-neutral-500">{log.time}</td>
                                <td className="px-6 py-4 font-medium text-neutral-900">{log.action}</td>
                                <td className="px-6 py-4">{log.user}</td>
                                <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={`${log.status === 'Success' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
                                        {log.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
