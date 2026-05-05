import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    CheckCircle2, XCircle, Clock, FileText, Image as ImageIcon,
    User, Loader2, Filter, AlertTriangle, CheckSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { axiosInstance } from '@/lib/axiosInstance';

// --- Types ---
interface Correction {
    correction_id: number;
    timesheet_id: number;
    user_id: number;
    reason: string;
    evidence_url: string | null;
    status_code: string;
    manager_note: string | null;
    created_at: string;
    timesheets: {
        status_code: string;
        real_work_hours: number;
        work_schedules: {
            date: string;
            shift_code: string;
        }
    };
    employees?: {
        users?: { full_name: string; email: string; }
    }
}

export default function CorrectionApprovals() {
    const { toast } = useToast();
    const [corrections, setCorrections] = useState<Correction[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');

    // Evidence Modal State
    const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
    const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Correction | null>(null);
    const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

    // Review Form State
    const [adjustedHours, setAdjustedHours] = useState<string>('');
    const [adjustedStatus, setAdjustedStatus] = useState<string>('COMPLETED');
    const [managerNote, setManagerNote] = useState<string>('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchCorrections = async () => {
        setLoading(true);
        try {
            const params = statusFilter === 'ALL' ? {} : { status: statusFilter };
            const res = await axiosInstance.get('/timesheet-corrections', { params });
            setCorrections(res.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load correction requests", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCorrections(); }, [statusFilter]);

    const openEvidence = (url: string) => {
        setSelectedEvidenceUrl(url);
        setEvidenceModalOpen(true);
    };

    const handleOpenReview = (item: Correction, action: 'APPROVED' | 'REJECTED') => {
        setSelectedItem(item);
        setReviewAction(action);
        // Khởi tạo form
        setManagerNote('');
        if (action === 'APPROVED') {
            // Mặc định lấy số giờ cũ hoặc gợi ý số giờ chuẩn nếu có thể (tạm thời để trống hoặc lấy giờ hiện tại)
            setAdjustedHours(item.timesheets.real_work_hours ? item.timesheets.real_work_hours.toString() : '');
            setAdjustedStatus('COMPLETED'); // Mặc định khi sếp duyệt thì ca đó thường sẽ về COMPLETED
        }
        setReviewModalOpen(true);
    };

    const submitReview = async () => {
        if (!selectedItem) return;

        if (reviewAction === 'APPROVED' && (!adjustedHours || isNaN(Number(adjustedHours)))) {
            toast({ title: "Error", description: "Please enter a valid number of hours.", variant: "destructive" });
            return;
        }

        setSubmitLoading(true);
        try {
            // Chuẩn bị payload theo ReviewCorrectionDto
            const payload: any = {
                status_code: reviewAction,
                manager_note: managerNote || undefined
            };

            if (reviewAction === 'APPROVED') {
                payload.adjusted_hours = parseFloat(adjustedHours);
                payload.adjusted_status = adjustedStatus;
            }

            await axiosInstance.patch(`/timesheet-corrections/${selectedItem.correction_id}/review`, payload);
            toast({ title: "Success", description: `Correction request has been ${reviewAction === 'APPROVED' ? 'approved' : 'rejected'}.` });
            setReviewModalOpen(false);
            fetchCorrections();
        } catch (error: any) {
            toast({
                title: "Thất bại",
                description: error.response?.data?.message || "Có lỗi xảy ra khi xử lý.",
                variant: "destructive"
            });
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- Helpers ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
            case 'REJECTED': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
            default: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Attendance Correction Approval</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">Handle attendance appeals (Forgotten check-out, lateness, etc.)</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700">Status:</span>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Lọc" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="ALL">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchCorrections} className="ml-auto bg-white">Refresh</Button>
                </div>
            </Card>

            {/* Bảng dữ liệu */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
                    ) : corrections.length === 0 ? (
                        <div className="text-center py-12 text-neutral-400 text-sm">No correction requests found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-neutral-50">
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Faulty Shift</TableHead>
                                    <TableHead>System Data</TableHead>
                                    <TableHead className="w-[250px]">Reason & Evidence</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {corrections.map((item) => (
                                    <TableRow key={item.correction_id}>
                                        <TableCell>
                                            <div className="font-medium text-sm text-neutral-900">{item.employees?.users?.full_name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-sm">Shift {item.timesheets.work_schedules.shift_code}</div>
                                            <div className="text-xs text-neutral-500">
                                                {format(new Date(item.timesheets.work_schedules.date), 'dd/MM/yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="mb-1">{item.timesheets.status_code}</Badge>
                                            <div className="text-xs text-neutral-600 mt-1">Recorded: {item.timesheets.real_work_hours}h</div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-neutral-700 line-clamp-2">{item.reason}</p>
                                            {item.evidence_url && (
                                                <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" onClick={() => openEvidence(item.evidence_url!)}>
                                                    <ImageIcon className="w-3 h-3 mr-1" /> View Image
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">{getStatusBadge(item.status_code)}</TableCell>
                                        <TableCell className="text-right">
                                            {item.status_code === 'PENDING' ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => handleOpenReview(item, 'APPROVED')}>
                                                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" className="h-8" onClick={() => handleOpenReview(item, 'REJECTED')}>
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
                    )}
                </CardContent>
            </Card>

            {/* Modal Phê Duyệt / Từ Chối */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{reviewAction === 'APPROVED' ? 'Approve & Adjust Hours' : 'Reject Request'}</DialogTitle>
                        <DialogDescription>
                            {reviewAction === 'APPROVED'
                                ? 'The system will update the work hours and status for this shift based on your input.'
                                : 'Please provide a reason for the rejection so the employee is informed.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {reviewAction === 'APPROVED' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>New Actual Work Hours (h) <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            placeholder="Ex: 4"
                                            value={adjustedHours}
                                            onChange={(e) => setAdjustedHours(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Status <span className="text-red-500">*</span></Label>
                                        <Select value={adjustedStatus} onValueChange={setAdjustedStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="COMPLETED">Completed (COMPLETED)</SelectItem>
                                                <SelectItem value="LATE">Late (LATE)</SelectItem>
                                                <SelectItem value="EARLY_LEAVE">Early Leave (EARLY_LEAVE)</SelectItem>
                                                <SelectItem value="MISSING">Missing Check-out (MISSING)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md border border-blue-100 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>You are adjusting from <b>{selectedItem?.timesheets.real_work_hours}h</b> ({selectedItem?.timesheets.status_code}) to <b>{adjustedHours || '?'}h</b> ({adjustedStatus}).</span>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label>Manager Note {reviewAction === 'REJECTED' && <span className="text-red-500">*</span>}</Label>
                            <Textarea
                                placeholder="Enter feedback for employee..."
                                value={managerNote}
                                onChange={(e) => setManagerNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
                        <Button
                            variant={reviewAction === 'APPROVED' ? 'default' : 'destructive'}
                            onClick={submitReview}
                            disabled={submitLoading}
                        >
                            {submitLoading ? "Processing..." : "Confirm Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Xem Ảnh */}
            <Dialog open={evidenceModalOpen} onOpenChange={setEvidenceModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader><DialogTitle>Correction Evidence</DialogTitle></DialogHeader>
                    <div className="flex justify-center p-2 bg-neutral-100 rounded-md border">
                        {selectedEvidenceUrl && <img src={selectedEvidenceUrl || undefined} alt="Evident" className="max-w-full max-h-[60vh] object-contain rounded" />}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}