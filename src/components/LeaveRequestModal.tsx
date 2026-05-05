import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, XCircle, Clock, UploadCloud, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { axiosInstance } from '@/lib/axiosInstance';

interface LeaveRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface LeaveHistory {
    request_id: number;
    type_code: string;
    start_date: string;
    end_date: string;
    reason: string;
    status_code: string;
    created_at: string;
}

export default function LeaveRequestModal({ open, onOpenChange }: LeaveRequestModalProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('create');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<LeaveHistory[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        type_code: 'STANDARD',
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [file, setFile] = useState<File | null>(null);

    // Fetch lịch sử khi mở tab "Lịch sử"
    useEffect(() => {
        if (open && activeTab === 'history') {
            fetchHistory();
        }
    }, [open, activeTab]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/leaves/me');
            setHistory(res.data || []);
        } catch (error: any) {
            console.error("Error fetching history:", error);
            toast({ title: "Error", description: "Cannot load leave history", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.start_date || !formData.end_date) {
            toast({ title: "Error", description: "Please select start and end dates", variant: "destructive" });
            return;
        }

        const now = new Date();
        const leaveStartDate = new Date(formData.start_date);
        const diffInHours = (leaveStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (formData.type_code === 'SICK' && diffInHours < 6) {
            toast({
                title: "Time error",
                description: "Sick leave must be reported at least 6 hours in advance.",
                variant: "destructive"
            });
            return;
        } else if (formData.type_code !== 'SICK' && diffInHours < 24) {
            toast({
                title: "Time error",
                description: "Standard leave must be reported at least 24 hours in advance.",
                variant: "destructive"
            });
            return;
        }

        if (formData.type_code === 'SICK' && !file) {
            toast({ title: "Missing evidence", description: "Please upload medical certificate/related documents.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            let evidence_url = undefined;

            // Xử lý upload ảnh (NẾU LÀ SICK) bằng API thực tế
            if (formData.type_code === 'SICK' && file) {
                const uploadData = new FormData();
                // 'file' là tên field khớp với FileInterceptor('file') trong upload.controller.ts
                uploadData.append('file', file);

                const uploadRes = await axiosInstance.post('/upload', uploadData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                // Trích xuất url từ response trả về của upload.service.ts
                evidence_url = uploadRes.data.url;
            }

            // Gửi đơn xin nghỉ
            await axiosInstance.post('/leaves', {
                ...formData,
                evidence_url
            });

            toast({ title: "Success", description: "Leave request submitted!" });

            // Reset form và chuyển sang tab lịch sử
            setFormData({ type_code: 'STANDARD', start_date: '', end_date: '', reason: '' });
            setFile(null);
            setActiveTab('history');

        } catch (error: any) {
            console.error("Error submitting request:", error);
            toast({
                title: "Failed",
                description: error.response?.data?.message || "An error occurred while submitting.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'REJECTED': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Leave Management</DialogTitle>
                    <DialogDescription>
                        Create a new leave request or track the status of submitted requests.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Create Request</TabsTrigger>
                        <TabsTrigger value="history">My History</TabsTrigger>
                    </TabsList>

                    {/* TAB: TẠO ĐƠN */}
                    <TabsContent value="create">
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Leave Type</Label>
                                <Select
                                    value={formData.type_code}
                                    onValueChange={(val) => setFormData({ ...formData, type_code: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">Standard Leave</SelectItem>
                                        <SelectItem value="SICK">Sick Leave (Requires document)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-neutral-500">
                                    *The system will automatically calculate your remaining paid Annual Leave days.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>From Date</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>To Date</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Reason (Optional)</Label>
                                <Input
                                    placeholder="Ex: Going home for family matters..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            {/* CONDITIONAL UPLOAD: Chỉ hiện khi chọn Nghỉ Ốm */}
                            {formData.type_code === 'SICK' && (
                                <div className="space-y-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                                    <Label className="text-blue-800 flex items-center gap-2">
                                        <UploadCloud className="w-4 h-4" />
                                        Evidence (Medical Certificate / Prescription)
                                    </Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="bg-white"
                                    />
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-4" disabled={loading}>
                                {loading ? "Submitting..." : "Submit Leave Request"}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* TAB: LỊCH SỬ */}
                    <TabsContent value="history">
                        <div className="py-4 space-y-3 max-h-[350px] overflow-y-auto pr-2">
                            {loading && history.length === 0 ? (
                                <p className="text-center text-sm text-neutral-500 py-4">Loading history...</p>
                            ) : history.length === 0 ? (
                                <p className="text-center text-sm text-neutral-500 py-4">You have no leave requests.</p>
                            ) : (
                                history.map((item) => (
                                    <div key={item.request_id} className="p-3 border rounded-lg bg-neutral-50 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-neutral-500" />
                                                    {item.type_code === 'SICK' ? 'Sick Leave' : 'Standard Leave'}
                                                </h4>
                                                <div className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(item.start_date), 'dd/MM/yyyy')} - {format(new Date(item.end_date), 'dd/MM/yyyy')}
                                                </div>
                                            </div>
                                            {getStatusBadge(item.status_code)}
                                        </div>
                                        {item.reason && (
                                            <div className="text-xs text-neutral-600 bg-white p-2 rounded border">
                                                <span className="font-medium">Reason:</span> {item.reason}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}