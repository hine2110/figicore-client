import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Banknote, Calendar, ChevronRight, AlertTriangle, CheckCircle2, FileText, ReceiptText } from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';

export default function MyPayroll() {
    const { toast } = useToast();
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Dispute State
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [disputeContent, setDisputeContent] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/payroll/my-payrolls');
            setPayrolls(res.data || []);
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể tải danh sách phiếu lương.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayrolls(); }, []);

    const openViewModal = (payroll: any) => {
        setSelectedPayroll(payroll);
        setIsViewModalOpen(true);
    };

    const handleConfirmPayroll = async () => {
        if (!selectedPayroll) return;
        setActionLoading(true);
        try {
            await axiosInstance.patch(`/payroll/my-payrolls/${selectedPayroll.payroll_id}/confirm`);
            toast({ title: "Đã xác nhận!", description: "Phiếu lương của bạn đã được chốt và gửi đến Quản lý để thanh toán." });
            setIsViewModalOpen(false);
            fetchPayrolls(); // Refresh list
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.response?.data?.message || "Không thể xác nhận", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendDispute = async () => {
        if (!disputeContent.trim()) {
            toast({ title: "Lỗi", description: "Vui lòng nhập lý do thắc mắc.", variant: "destructive" });
            return;
        }
        setActionLoading(true);
        try {
            await axiosInstance.post('/payroll-disputes', {
                payroll_id: selectedPayroll.payroll_id,
                content: disputeContent
            });
            toast({ title: "Đã gửi khiếu nại", description: "Thắc mắc của bạn đã được gửi. Quản lý sẽ xem xét và phản hồi lại." });
            setIsDisputeModalOpen(false);
            setIsViewModalOpen(false);
            fetchPayrolls();
        } catch (error: any) {
            toast({ title: "Thất bại", description: error.response?.data?.message || "Lỗi hệ thống", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getStatusUI = (statusCode: string) => {
        switch (statusCode) {
            case 'SENT_FOR_REVIEW': return { label: 'Cần bạn xác nhận', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200' };
            case 'PENDING_APPROVAL': return { label: 'Chờ sếp thanh toán', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200' };
            case 'DISPUTED': return { label: 'Đang khiếu nại', color: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200' };
            case 'PAID': return { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' };
            default: return { label: statusCode, color: 'bg-gray-100 text-gray-800' };
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Sổ Lương Của Tôi</h1>
                <p className="text-neutral-500 text-sm mt-1">Xem chi tiết phiếu lương hàng tháng và báo cáo sai sót nếu có.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : payrolls.length === 0 ? (
                <div className="text-center py-16 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <ReceiptText className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                    <p className="text-neutral-500 font-medium">Bạn chưa có phiếu lương nào được phát hành.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {payrolls.map((payroll) => {
                        const statusUI = getStatusUI(payroll.status_code);
                        return (
                            <Card
                                key={payroll.payroll_id}
                                className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${payroll.status_code === 'SENT_FOR_REVIEW' ? 'border-l-yellow-400 bg-yellow-50/30' : 'border-l-transparent'}`}
                                onClick={() => openViewModal(payroll)}
                            >
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center font-bold">
                                            <span className="text-xs uppercase font-medium">Tháng</span>
                                            <span className="text-lg leading-none">{payroll.month}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-neutral-900">Lương Tháng {payroll.month}/{payroll.year}</h3>
                                                <Badge variant="outline" className={statusUI.color}>{statusUI.label}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {payroll.total_work_hours} giờ làm</span>
                                                <span className="flex items-center gap-1 font-medium text-emerald-600"><Banknote className="w-3.5 h-3.5" /> Thực lãnh: {formatCurrency(payroll.final_salary)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal Chi Tiết Tờ Phiếu Lương (Payslip) */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-slate-50">
                    {selectedPayroll && (
                        <>
                            {/* Header (Màu nền phụ thuộc trạng thái) */}
                            <div className={`p-6 text-white ${selectedPayroll.status_code === 'SENT_FOR_REVIEW' ? 'bg-amber-600' : 'bg-slate-800'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold uppercase tracking-wider">Phiếu Lương</h2>
                                        <p className="opacity-90">Kỳ lương: Tháng {selectedPayroll.month}/{selectedPayroll.year}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none shadow-none">
                                            {getStatusUI(selectedPayroll.status_code).label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Body: Chi tiết lương */}
                            <div className="p-6">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50/50">
                                        <span className="font-semibold text-slate-700">Tổng giờ công ghi nhận</span>
                                        <span className="font-bold font-mono">{selectedPayroll.total_work_hours} giờ</span>
                                    </div>

                                    {/* List các khoản cộng / trừ */}
                                    <div className="p-2">
                                        {selectedPayroll.payroll_items?.map((item: any) => (
                                            <div key={item.item_id} className="flex justify-between items-center py-3 px-3 hover:bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {item.is_addition ? (
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">+</div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">-</div>
                                                    )}
                                                    <span className="text-sm text-slate-700">{item.title}</span>
                                                </div>
                                                <span className={`font-mono font-medium ${item.is_addition ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tổng thực lãnh */}
                                    <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                                        <span className="font-bold uppercase tracking-wider">Thực Lãnh</span>
                                        <span className="text-xl font-bold font-mono text-emerald-400">
                                            {formatCurrency(selectedPayroll.final_salary)}
                                        </span>
                                    </div>
                                </div>

                                {/* Lời nhắc nhở */}
                                {selectedPayroll.status_code === 'SENT_FOR_REVIEW' && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <p>Vui lòng kiểm tra kỹ các khoản lương. Nếu có sai sót, hãy bấm <b>"Khiếu nại"</b>. Nếu đã chính xác, vui lòng <b>"Xác nhận"</b> để quản lý tiến hành thanh toán.</p>
                                    </div>
                                )}
                                {selectedPayroll.status_code === 'DISPUTED' && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <p>Bạn đã gửi khiếu nại cho phiếu lương này. Hệ thống đang tạm khóa phiếu lương cho đến khi Quản lý xử lý xong.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer: Các nút hành động (Chỉ hiện khi SENT_FOR_REVIEW) */}
                            {selectedPayroll.status_code === 'SENT_FOR_REVIEW' && (() => {
                                // Kiểm tra xem nhân viên đã từng khiếu nại phiếu lương này chưa
                                const hasDisputed = selectedPayroll.payroll_disputes && selectedPayroll.payroll_disputes.length > 0;

                                return (
                                    <div className="p-4 border-t bg-white flex flex-col gap-3">
                                        {hasDisputed && (
                                            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                                <p>Bạn đã sử dụng quyền khiếu nại <b>1 lần duy nhất</b> cho phiếu lương này. Quản lý đã xử lý và gửi lại bản cuối cùng. Vui lòng kiểm tra và bấm Xác nhận.</p>
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-3">
                                            {/* ẨN NÚT KHIẾU NẠI NẾU ĐÃ TỪNG KHIẾU NẠI */}
                                            {!hasDisputed && (
                                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsDisputeModalOpen(true)}>
                                                    <AlertTriangle className="w-4 h-4 mr-2" /> Có sai sót (Khiếu nại)
                                                </Button>
                                            )}
                                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmPayroll} disabled={actionLoading}>
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Xác nhận đúng
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}
                            {selectedPayroll.status_code !== 'SENT_FOR_REVIEW' && (
                                <div className="p-4 border-t bg-white flex justify-end">
                                    <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal Gửi Khiếu Nại (Dispute) */}
            <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Báo cáo sai sót phiếu lương
                        </DialogTitle>
                        <DialogDescription>
                            Ghi rõ khoản tiền nào bị tính sai (Ví dụ: Thiếu giờ làm ngày 15/03, phạt đi trễ không đúng,...).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Nhập chi tiết vấn đề bạn gặp phải..."
                            className="min-h-[120px]"
                            value={disputeContent}
                            onChange={(e) => setDisputeContent(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDisputeModalOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={handleSendDispute} disabled={actionLoading}>
                            Gửi khiếu nại
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}