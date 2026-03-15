import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, UploadCloud, MessageSquare, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { axiosInstance } from '@/lib/axiosInstance';

interface TimesheetCorrectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timesheetId: number | null;
    shiftInfo: string; // Truyền vào chuỗi hiển thị (VD: "12/03/2026 - MORNING")
}

interface CorrectionHistory {
    correction_id: number;
    reason: string;
    evidence_url: string | null;
    status_code: string;
    manager_note: string | null;
    created_at: string;
    timesheets: {
        work_schedules: {
            date: string;
            shift_code: string;
        }
    }
}

export default function TimesheetCorrectionModal({ open, onOpenChange, timesheetId, shiftInfo }: TimesheetCorrectionModalProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('create');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<CorrectionHistory[]>([]);

    // Form State
    const [reason, setReason] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            if (activeTab === 'history') fetchHistory();
            else if (timesheetId) setActiveTab('create');
        }
    }, [open, activeTab, timesheetId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/timesheet-corrections/me');
            setHistory(res.data || []);
        } catch (error: any) {
            console.error("Lỗi lấy lịch sử khiếu nại:", error);
            toast({ title: "Lỗi", description: "Không thể tải lịch sử khiếu nại", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!timesheetId) {
            toast({ title: "Lỗi", description: "Không tìm thấy thông tin ca làm.", variant: "destructive" });
            return;
        }

        if (!reason.trim()) {
            toast({ title: "Lỗi", description: "Vui lòng nhập lý do khiếu nại.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            let evidence_url = undefined;

            // Xử lý upload ảnh nếu có
            if (file) {
                const uploadData = new FormData();
                uploadData.append('file', file);

                const uploadRes = await axiosInstance.post('/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                evidence_url = uploadRes.data.url;
            }

            // Gửi khiếu nại
            await axiosInstance.post('/timesheet-corrections', {
                timesheet_id: timesheetId,
                reason,
                evidence_url
            });

            toast({ title: "Thành công", description: "Đã gửi yêu cầu khiếu nại!" });

            setReason('');
            setFile(null);
            setActiveTab('history');

        } catch (error: any) {
            console.error("Lỗi khi gửi đơn:", error);
            const errorMsg = Array.isArray(error.response?.data?.message)
                ? error.response.data.message.join(', ')
                : error.response?.data?.message || "Có lỗi xảy ra khi gửi đơn.";

            toast({ title: "Thất bại", description: errorMsg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã duyệt</Badge>;
            case 'REJECTED': return <Badge variant="destructive" className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Từ chối</Badge>;
            default: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Khiếu nại giờ làm (Timesheet)</DialogTitle>
                    <DialogDescription>
                        Báo lỗi nếu ca làm của bạn bị tính sai giờ hoặc sai trạng thái.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Gửi khiếu nại</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử của tôi</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create">
                        {timesheetId ? (
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="p-3 bg-orange-50 border border-orange-100 rounded-md flex items-start gap-2 text-orange-800">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-semibold">Ca làm đang chọn: </span>
                                        {shiftInfo}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Lý do khiếu nại <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        placeholder="Vd: Quên bấm check-out lúc 12:00, thực tế đã làm đủ ca..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <UploadCloud className="w-4 h-4 text-neutral-500" />
                                        Bằng chứng (Hình ảnh tin nhắn xin phép sếp, v.v...)
                                    </Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <Button type="submit" className="w-full mt-4" disabled={loading}>
                                    {loading ? "Đang gửi..." : "Gửi khiếu nại"}
                                </Button>
                            </form>
                        ) : (
                            <div className="py-10 text-center text-sm text-neutral-500">
                                Vui lòng đóng cửa sổ này và chọn nút "Khiếu nại" tại một ca làm cụ thể trong bảng lịch sử.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="py-4 space-y-3 max-h-[350px] overflow-y-auto pr-2">
                            {loading && history.length === 0 ? (
                                <p className="text-center text-sm text-neutral-500 py-4">Đang tải lịch sử...</p>
                            ) : history.length === 0 ? (
                                <p className="text-center text-sm text-neutral-500 py-4">Bạn chưa có khiếu nại nào.</p>
                            ) : (
                                history.map((item) => (
                                    <div key={item.correction_id} className="p-3 border rounded-lg bg-neutral-50 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    Ca {item.timesheets.work_schedules.shift_code}
                                                </h4>
                                                <div className="text-xs text-neutral-500 mt-1">
                                                    Ngày: {format(new Date(item.timesheets.work_schedules.date), 'dd/MM/yyyy')}
                                                </div>
                                            </div>
                                            {getStatusBadge(item.status_code)}
                                        </div>
                                        <div className="text-xs text-neutral-600 bg-white p-2 rounded border">
                                            <span className="font-medium">Lý do:</span> {item.reason}
                                        </div>
                                        {item.manager_note && (
                                            <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 flex gap-2 items-start">
                                                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span><span className="font-semibold">Sếp phản hồi:</span> {item.manager_note}</span>
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