import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Banknote, Calendar, ChevronRight, AlertTriangle, CheckCircle2, FileText, ReceiptText } from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';
import { FileSignature } from 'lucide-react';

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

    const sigCanvas = useRef<any>(null);
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [isConfirmedMoney, setIsConfirmedMoney] = useState(false);

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

    const handleSignPayroll = async () => {
        if (!isConfirmedMoney) {
            toast({ title: "Chú ý", description: "Vui lòng tích chọn xác nhận đã nhận đủ tiền.", variant: "destructive" });
            return;
        }
        if (sigCanvas.current?.isEmpty()) {
            toast({ title: "Chú ý", description: "Vui lòng ký tên trước khi xác nhận.", variant: "destructive" });
            return;
        }

        setActionLoading(true);
        try {
            // Lấy chuỗi base64 của chữ ký
            const signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');

            await axiosInstance.post(`/payroll/my-payrolls/${selectedPayroll.payroll_id}/sign`, {
                signature_data: signatureData
            });

            toast({ title: "Tuyệt vời!", description: "Bạn đã ký nhận lương thành công." });
            setIsSignModalOpen(false);
            setIsViewModalOpen(false);
            fetchPayrolls();
        } catch (error: any) {
            console.error("LỖI KÝ NHẬN:", error); // In ra console để dễ debug

            const errorMsg = error.response?.data?.message;
            // Nếu lỗi từ class-validator trả về mảng, nối nó thành chuỗi
            const displayMsg = Array.isArray(errorMsg)
                ? errorMsg.join(', ')
                : (errorMsg || "Lỗi kết nối máy chủ. Vui lòng kiểm tra Console (F12).");

            toast({ title: "Lỗi", description: displayMsg, variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickSign = async () => {
        if (!isConfirmedMoney) {
            toast({ title: "Chú ý", description: "Vui lòng tích chọn xác nhận đã nhận đủ tiền.", variant: "destructive" });
            return;
        }

        setActionLoading(true);
        try {
            // Tự động tạo một hình ảnh Canvas ẩn chứa chữ "Đã ký xác nhận"
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Tạo nền trong suốt hoặc màu nhạt
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Vẽ chữ ký (Style giống chữ viết tay/in đậm)
                ctx.font = 'italic bold 32px "Times New Roman", serif';
                ctx.fillStyle = '#4f46e5'; // Màu xanh indigo
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Đã ký xác nhận (Ký nhanh)', canvas.width / 2, canvas.height / 2 - 15);

                // Thêm timestamp để tăng tính minh bạch
                ctx.font = '14px Arial';
                ctx.fillStyle = '#64748b'; // Màu xám
                ctx.fillText(`Timestamp: ${new Date().toLocaleString('vi-VN')}`, canvas.width / 2, canvas.height / 2 + 25);
            }

            // Lấy chuỗi base64
            const quickSignatureData = canvas.toDataURL('image/png');

            // Gửi thẳng lên API như chữ ký vẽ bình thường
            await axiosInstance.post(`/payroll/my-payrolls/${selectedPayroll.payroll_id}/sign`, {
                signature_data: quickSignatureData
            });

            toast({ title: "Tuyệt vời!", description: "Bạn đã ký nhận nhanh thành công." });
            setIsSignModalOpen(false);
            setIsViewModalOpen(false);
            fetchPayrolls();
        } catch (error: any) {
            console.error("LỖI KÝ NHẬN:", error); // In ra console để dễ debug

            const errorMsg = error.response?.data?.message;
            // Nếu lỗi từ class-validator trả về mảng, nối nó thành chuỗi
            const displayMsg = Array.isArray(errorMsg)
                ? errorMsg.join(', ')
                : (errorMsg || "Lỗi kết nối máy chủ. Vui lòng kiểm tra Console (F12).");

            toast({ title: "Lỗi", description: displayMsg, variant: "destructive" });
        } finally {
            setActionLoading(false);
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
                    <DialogTitle className="sr-only">Chi tiết phiếu lương</DialogTitle>
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
                                {selectedPayroll.payment_start_date && (
                                    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-indigo-900">
                                            <Calendar className="w-5 h-5" />
                                            <span className="font-semibold">Lịch nhận lương dự kiến:</span>
                                        </div>
                                        <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-sm text-center">
                                            {new Date(selectedPayroll.payment_start_date).toLocaleDateString('vi-VN')} - {new Date(selectedPayroll.payment_end_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                )}
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

                                {/* Khu vực hiển thị chữ ký (Nếu đã ký) */}
                                {selectedPayroll.signature_data && (
                                    <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col items-center justify-center gap-2">
                                        <span className="text-sm font-semibold text-emerald-900">
                                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                            Chữ ký xác nhận của bạn
                                        </span>
                                        <div className="bg-white border border-emerald-200 rounded-lg p-2 shadow-sm">
                                            <img
                                                src={selectedPayroll.signature_data}
                                                alt="Chữ ký của bạn"
                                                className="max-h-24 object-contain"
                                            />
                                        </div>
                                        {selectedPayroll.signed_at && (
                                            <span className="text-xs text-emerald-600 font-medium">
                                                Thời gian ký: {new Date(selectedPayroll.signed_at).toLocaleString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                )}

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

                            {/* Footer: Các nút hành động */}
                            <div className="p-4 border-t bg-white flex flex-col gap-3">
                                {selectedPayroll.status_code === 'SENT_FOR_REVIEW' && (
                                    <div className="w-full flex flex-col gap-3">
                                        {/* Thêm dòng nhắc nhở này */}
                                        {selectedPayroll.payment_start_date && (
                                            <p className="text-sm text-center text-slate-500 italic">
                                                * Lịch chuyển khoản đã được lên. Bạn cần <b className="text-emerald-600">"Xác nhận đúng"</b> để mở khóa chức năng Ký nhận.
                                            </p>
                                        )}
                                        <div className="flex justify-end gap-3">
                                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsDisputeModalOpen(true)}>
                                                <AlertTriangle className="w-4 h-4 mr-2" /> Có sai sót (Khiếu nại)
                                            </Button>
                                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmPayroll} disabled={actionLoading}>
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Xác nhận đúng
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* NÚT MỚI: Ký nhận lương (Dựa trên cờ can_sign server trả về) */}
                                {selectedPayroll.status_code === 'APPROVED' && (
                                    <div className="flex flex-col gap-2">
                                        {selectedPayroll.can_sign ? (
                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg" onClick={() => setIsSignModalOpen(true)}>
                                                <FileSignature className="w-5 h-5 mr-2" /> Ký Nhận Lương
                                            </Button>
                                        ) : (
                                            <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-lg text-sm border border-slate-200">
                                                {selectedPayroll.payment_start_date ? (
                                                    <span>Chưa đến hoặc đã qua thời gian ký nhận. <br />(Mở cổng từ {new Date(selectedPayroll.payment_start_date).toLocaleDateString()} đến {new Date(selectedPayroll.payment_end_date).toLocaleDateString()})</span>
                                                ) : (
                                                    <span>Đang chờ Quản lý thiết lập thời gian chuyển khoản...</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedPayroll.status_code !== 'SENT_FOR_REVIEW' && selectedPayroll.status_code !== 'APPROVED' && (
                                    <div className="flex justify-end">
                                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
                                    </div>
                                )}
                            </div>
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

            {/* Modal Vẽ Chữ Ký Điện Tử */}
            <Dialog open={isSignModalOpen} onOpenChange={(open) => { setIsSignModalOpen(open); if (!open) setIsConfirmedMoney(false); }}>
                <DialogContent className="sm:max-w-[500px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-center font-bold text-indigo-900 uppercase">Ký Nhận Điện Tử</DialogTitle>
                        <DialogDescription className="text-center">
                            Biên lai lương Tháng {selectedPayroll?.month}/{selectedPayroll?.year}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-center">
                            <p className="text-sm mb-1">Số tiền thực lãnh</p>
                            <p className="text-3xl font-bold font-mono">{formatCurrency(selectedPayroll?.final_salary || 0)}</p>
                        </div>

                        {/* Ràng buộc trách nhiệm */}
                        <label className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                            <input
                                type="checkbox"
                                className="mt-1 w-5 h-5 accent-red-600 rounded"
                                checked={isConfirmedMoney}
                                onChange={(e) => setIsConfirmedMoney(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-red-900">
                                Tôi xác nhận đã nhận đủ số tiền trên vào tài khoản ngân hàng. Chữ ký này có giá trị pháp lý tương đương biên nhận.
                            </span>
                        </label>

                        {/* Khung vẽ chữ ký */}
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Chữ ký của bạn:</p>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 relative">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="blue"
                                    canvasProps={{ className: "w-full h-[200px] cursor-crosshair" }}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute bottom-2 right-2 text-xs h-7 text-slate-500 hover:text-red-600"
                                    onClick={() => sigCanvas.current?.clear()}
                                >
                                    Xóa ký lại
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center w-full gap-3">
                        {/* Nút Ký Nhanh */}
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                            onClick={handleQuickSign}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "⚡ Ký nhanh (Tự động)"}
                        </Button>

                        {/* Các nút Hủy & Gửi chữ ký vẽ */}
                        <div className="flex w-full sm:w-auto gap-2">
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsSignModalOpen(false)}>Hủy</Button>
                            <Button className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSignPayroll} disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSignature className="w-4 h-4 mr-2" />}
                                Gửi Chữ Ký Vẽ
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}