import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ProfileRequest {
  request_id: number;
  user_id: number;
  changed_data: Record<string, any>;
  status_code: string;
  created_at: string;
  users: {
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
    role_code: string;
    employees?: {
        employee_code: string;
    }
  };
}

export default function ProfileApproval() {
    const [requests, setRequests] = useState<ProfileRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        try {
            await adminService.resolveRequest(id, action);
            toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            fetchRequests(); // Refresh list
        } catch (error) {
            toast.error("Failed to process request");
            console.error(error);
        }
    };

    const renderChanges = (changedData: Record<string, any>) => {
        return Object.entries(changedData)
            .filter(([key]) => key !== 'avatar_url')
            .map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-sm text-neutral-600">
                <span className="font-semibold capitalize">{key.replace('_', ' ')}:</span>
                <span>{String(value)}</span>
            </div>
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Access Approvals</h1>
                    <p className="text-neutral-500">Review and approve new access requests.</p>
                </div>
                <Button variant="outline" onClick={fetchRequests} disabled={loading}>
                    Refresh
                </Button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-neutral-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
                        <CheckCircle2 className="w-12 h-12 mb-4 text-green-200" />
                        <p>All caught up! No pending approvals.</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <Card key={req.request_id} className="p-6 border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-3 rounded-full text-blue-600 mt-1">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-neutral-900">Profile Update</h3>
                                        <Badge variant="outline">{req.users.role_code}</Badge>
                                        {req.users.employees?.employee_code && (
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {req.users.employees.employee_code}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-500 mb-2">
                                        Requested by <span className="text-neutral-900 font-medium">{req.users.full_name}</span> ({req.users.email})
                                    </p>
                                    <div className="bg-neutral-50 p-3 rounded-md border border-neutral-100 flex flex-col gap-1">
                                        {renderChanges(req.changed_data)}
                                    </div>
                                    <span className="text-xs text-neutral-400 mt-2 block">
                                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                                <Button 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleAction(req.request_id, 'reject')}
                                >
                                    <XCircle className="w-4 h-4 mr-2" /> Deny
                                </Button>
                                <Button 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAction(req.request_id, 'approve')}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
