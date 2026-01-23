import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PENDING_REGISTRATIONS = [
    { id: 1, name: 'David Lee', email: 'david@example.com', type: 'Staff Registration', date: '2 hours ago', status: 'Pending' },
    { id: 2, name: 'Emma Wilson', email: 'emma@example.com', type: 'Manager Access Request', date: '5 hours ago', status: 'Pending' },
];

export default function ProfileApproval() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Access Approvals</h1>
                    <p className="text-neutral-500">Review and approve new access requests.</p>
                </div>
            </div>

            <div className="space-y-4">
                {PENDING_REGISTRATIONS.map(req => (
                    <Card key={req.id} className="p-6 border-neutral-200 flex items-center justify-between">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-900">{req.type}</h3>
                                <p className="text-sm text-neutral-500 mb-1">Requested by <span className="text-neutral-900 font-medium">{req.name}</span> ({req.email})</p>
                                <span className="text-xs text-neutral-400">{req.date}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <XCircle className="w-4 h-4 mr-2" /> Deny
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                            </Button>
                        </div>
                    </Card>
                ))}

                {PENDING_REGISTRATIONS.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
                        <CheckCircle2 className="w-12 h-12 mb-4 text-green-200" />
                        <p>All caught up! No pending approvals.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
