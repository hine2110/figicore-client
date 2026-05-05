import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Image as ImageIcon,
    User,
    Loader2,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { axiosInstance } from '@/lib/axiosInstance';

// --- Types ---
interface LeaveRequest {
    request_id: number;
    user_id: number;
    type_code: string;
    start_date: string;
    end_date: string;
    reason: string | null;
    evidence_url: string | null;
    status_code: string;
    created_at: string;
    employees?: {
        users?: {
            full_name: string;
            email: string;
        }
    }
}

export default function LeaveApprovals() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('PENDING'); // Default to showing pending requests

    // Evidence Modal State
    const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
    const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // If ALL is selected, do not pass status param
            const params = statusFilter === 'ALL' ? {} : { status: statusFilter };
            const res = await axiosInstance.get('/leaves', { params });
            setRequests(res.data || []);
        } catch (error: any) {
            console.error("Error fetching leave requests:", error);
            toast({ title: "Error", description: "Could not load leave requests", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const handleUpdateStatus = async (id: number, newStatus: 'APPROVED' | 'REJECTED') => {
        const actionName = newStatus === 'APPROVED' ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${actionName} this request?`)) return;

        try {
            await axiosInstance.patch(`/leaves/${id}/status`, { status_code: newStatus });
            toast({ title: "Success", description: `Leave request has been ${actionName}d.` });
            fetchRequests(); // Refresh data
        } catch (error: any) {
            console.error(`Error ${actionName} request:`, error);
            toast({
                title: "Failed",
                description: error.response?.data?.message || `An error occurred while ${actionName}ing the request.`,
                variant: "destructive"
            });
        }
    };

    const openEvidence = (url: string) => {
        setSelectedEvidenceUrl(url);
        setEvidenceModalOpen(true);
    };

    // --- Helpers ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'REJECTED': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'ANNUAL_PAID': return <span className="text-green-600 font-medium">Annual Paid Leave</span>;
            case 'UNPAID': return <span className="text-neutral-500 font-medium">Unpaid Leave</span>;
            case 'SICK': return <span className="text-orange-600 font-medium">Sick Leave</span>;
            case 'STANDARD': return <span className="text-blue-600 font-medium">Standard Leave</span>;
            default: return <span>{type}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        Leave Approval
                    </h1>
                    <p className="text-neutral-500 text-sm mt-0.5">
                        Manage and approve employee leave requests.
                    </p>
                </div>
            </div>

            {/* Control panel (Filters) */}
            <Card className="p-4 border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700">Status:</span>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="ALL">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchRequests} className="ml-auto bg-white">
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Data table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        Request List
                        {!loading && <Badge variant="secondary">{requests.length} requests</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-neutral-400 text-sm border border-dashed rounded-lg bg-neutral-50">
                            No leave requests match the selected filters.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-neutral-50">
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Time Range</TableHead>
                                        <TableHead>Reason & Evidence</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.request_id} className="hover:bg-neutral-50/50">
                                            {/* Employee */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-neutral-900">
                                                            {req.employees?.users?.full_name || `User #${req.user_id}`}
                                                        </div>
                                                        <div className="text-xs text-neutral-500">
                                                            {req.employees?.users?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Leave type */}
                                            <TableCell>
                                                {getTypeLabel(req.type_code)}
                                            </TableCell>

                                            {/* Time (Format for display only) */}
                                            <TableCell>
                                                <div className="text-sm">
                                                    <span className="font-medium">{format(new Date(req.start_date), 'dd/MM/yyyy')}</span>
                                                    <span className="mx-1 text-neutral-400">→</span>
                                                    <span className="font-medium">{format(new Date(req.end_date), 'dd/MM/yyyy')}</span>
                                                </div>
                                                <div className="text-xs text-neutral-400 mt-1">
                                                    Submitted at: {format(new Date(req.created_at), 'dd/MM HH:mm')}
                                                </div>
                                            </TableCell>

                                            {/* Reason & Evidence */}
                                            <TableCell className="max-w-[200px]">
                                                <p className="text-sm text-neutral-700 truncate" title={req.reason || 'No reason provided'}>
                                                    {req.reason || <span className="italic text-neutral-400">No reason provided</span>}
                                                </p>
                                                {req.evidence_url && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 mt-1 text-xs text-blue-600 flex items-center"
                                                        onClick={() => openEvidence(req.evidence_url as string)}
                                                    >
                                                        <ImageIcon className="w-3 h-3 mr-1" />
                                                        View Evidence
                                                    </Button>
                                                )}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="text-center">
                                                {getStatusBadge(req.status_code)}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                {req.status_code === 'PENDING' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                                                            onClick={() => handleUpdateStatus(req.request_id, 'APPROVED')}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8"
                                                            onClick={() => handleUpdateStatus(req.request_id, 'REJECTED')}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-neutral-400 italic">Processed</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Evidence Modal */}
            <Dialog open={evidenceModalOpen} onOpenChange={setEvidenceModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Leave Evidence</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-2 bg-neutral-100 rounded-md border">
                        {selectedEvidenceUrl ? (
                            <img
                                src={selectedEvidenceUrl}
                                alt="Evidence"
                                className="max-w-full max-h-[60vh] object-contain rounded"
                            />
                        ) : (
                            <p className="text-neutral-500 py-10">No image available</p>
                        )}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={() => setEvidenceModalOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}