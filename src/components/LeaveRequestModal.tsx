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
            console.error("Lỗi lấy lịch sử:", error);
            toast({ title: "Lỗi", description: "Không thể tải lịch sử xin nghỉ", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.start_date || !formData.end_date) {
            toast({ title: "Lỗi", description: "Vui lòng chọn ngày bắt đầu và kết thúc", variant: "destructive" });
            return;
        }

        const now = new Date();
        const leaveStartDate = new Date(formData.start_date);
        const diffInHours = (leaveStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (formData.type_code === 'SICK' && diffInHours < 6) {
            toast({
                title: "Lỗi thời gian",
                description: "Nghỉ ốm phải được báo trước ít nhất 6 tiếng.",
                variant: "destructive"
            });
            return;
        } else if (formData.type_code !== 'SICK' && diffInHours < 24) {
            toast({
                title: "Lỗi thời gian",
                description: "Nghỉ phép thông thường phải được báo trước ít nhất 24 tiếng.",
                variant: "destructive"
            });
            return;
        }

        if (formData.type_code === 'SICK' && !file) {
            toast({ title: "Thiếu bằng chứng", description: "Vui lòng tải lên ảnh giấy khám bệnh/giấy tờ liên quan.", variant: "destructive" });
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

            toast({ title: "Thành công", description: "Đã gửi đơn xin nghỉ phép!" });

            // Reset form và chuyển sang tab lịch sử
            setFormData({ type_code: 'STANDARD', start_date: '', end_date: '', reason: '' });
            setFile(null);
            setActiveTab('history');

        } catch (error: any) {
            console.error("Lỗi khi gửi đơn:", error);
            toast({
                title: "Thất bại",
                description: error.response?.data?.message || "Có lỗi xảy ra khi gửi đơn.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã duyệt</Badge>;
            case 'REJECTED': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Từ chối</Badge>;
            default: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Quản lý nghỉ phép</DialogTitle>
                    <DialogDescription>
                        Tạo đơn xin nghỉ mới hoặc theo dõi trạng thái các đơn đã gửi.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Tạo đơn xin nghỉ</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử của tôi</TabsTrigger>
                    </TabsList>

                    {/* TAB: TẠO ĐƠN */}
                    <TabsContent value="create">
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Loại nghỉ phép</Label>
                                <Select
                                    value={formData.type_code}
                                    onValueChange={(val) => setFormData({ ...formData, type_code: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại phép" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">Nghỉ phép thông thường</SelectItem>
                                        <SelectItem value="SICK">Nghỉ ốm (Cần giấy tờ)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-neutral-500">
                                    *Hệ thống sẽ tự động tính toán số ngày Phép Năm (có lương) còn lại của bạn.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Từ ngày</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Đến ngày</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Lý do (Không bắt buộc)</Label>
                                <Input
                                    placeholder="Vd: Về quê có việc gia đình..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            {/* CONDITIONAL UPLOAD: Chỉ hiện khi chọn Nghỉ Ốm */}
                            {formData.type_code === 'SICK' && (
                                <div className="space-y-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                                    <Label className="text-blue-800 flex items-center gap-2">
                                        <UploadCloud className="w-4 h-4" />
                                        Bằng chứng (Giấy khám bệnh / Đơn thuốc)
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
                                {loading ? "Đang gửi..." : "Gửi đơn xin nghỉ"}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* TAB: LỊCH SỬ */}
                    <TabsContent value="history">
                        <div className="py-4 space-y-3 max-h-[350px] overflow-y-auto pr-2">
                            {loading && history.length === 0 ? (
                                <p className="text-center text-sm text-neutral-500 py-4">Đang tải lịch sử...</p>
                            ) : history.length === 0 ? (
                                <p className="text-center text-sm text-neutral-500 py-4">Bạn chưa có đơn xin nghỉ nào.</p>
                            ) : (
                                history.map((item) => (
                                    <div key={item.request_id} className="p-3 border rounded-lg bg-neutral-50 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-neutral-500" />
                                                    {item.type_code === 'SICK' ? 'Nghỉ ốm' : 'Nghỉ thông thường'}
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
                                                <span className="font-medium">Lý do:</span> {item.reason}
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