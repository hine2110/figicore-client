import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlayCircle, Send, CheckCircle, AlertCircle, Banknote, Eye, RotateCcw, AlertTriangle, Trash2 } from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';
import EmployeeDetailSheet from '@/features/admin/components/EmployeeDetailSheet';
import { Input } from '@/components/ui/input';

export default function PayrollManagement() {
    const { toast } = useToast();

    // Lọc theo Tháng / Năm
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1 + '');
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear() + '');

    const [mergedData, setMergedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // States cho Popups
    const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null); // Dùng cho EmployeeDetailSheet
    const [viewPayroll, setViewPayroll] = useState<any>(null); // Dùng cho Modal Chi tiết Lương

    // States cho Form Điều chỉnh Nóng
    const [adjustTitle, setAdjustTitle] = useState('');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [isAddition, setIsAddition] = useState(true);
    const [adjustLoading, setAdjustLoading] = useState(false);
    const [swipedItemId, setSwipedItemId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const empRes = await axiosInstance.get('/employees', { params: { limit: 100 } });
            const employees = empRes.data?.data || [];

            const payrollRes = await axiosInstance.get('/payroll/all', {
                params: { month: selectedMonth, year: selectedYear }
            });
            const payrolls = payrollRes.data || [];

            const combined = employees.map((emp: any) => {
                const existingPayroll = payrolls.find((p: any) => p.user_id === emp.user_id);
                return { ...emp, payroll: existingPayroll || null };
            });

            setMergedData(combined);
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể tải dữ liệu bảng lương", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

    const handleRunPayroll = async (userId: number) => {
        setActionLoading(userId);
        try {
            await axiosInstance.post('/payroll/run-payroll', {
                userId: userId,
                month: Number(selectedMonth),
                year: Number(selectedYear)
            });
            toast({ title: "Thành công", description: "Đã bóc tách & tạo bảng lương mới." });
            setViewPayroll(null); // Đóng modal nếu đang mở
            fetchData();
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.response?.data?.message || "Không thể chạy lương", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateStatus = async (payrollId: number, newStatus: string, successMessage: string) => {
        setActionLoading(payrollId);
        try {
            await axiosInstance.patch(`/payroll/${payrollId}/status`, { status_code: newStatus });
            toast({ title: "Thành công", description: successMessage });
            setViewPayroll(null); // Đóng modal nếu đang mở
            fetchData();
        } catch (error: any) {
            toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const renderActions = (row: any) => {
        const { user_id, payroll } = row;
        const isActionLoading = actionLoading === user_id || actionLoading === payroll?.payroll_id;

        if (isActionLoading) {
            return <Button disabled size="sm" variant="outline"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử lý</Button>;
        }

        if (!payroll) {
            return (
                <Button size="sm" className="bg-slate-800 hover:bg-slate-900" onClick={() => handleRunPayroll(user_id)}>
                    <PlayCircle className="w-4 h-4 mr-2" /> Chạy lương
                </Button>
            );
        }

        // Nút xem chi tiết (Luôn hiện nếu đã có phiếu lương)
        const ViewButton = () => (
            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => setViewPayroll({ ...payroll, empInfo: row })}>
                <Eye className="w-4 h-4 mr-1" /> Chi tiết
            </Button>
        );

        const hasDisputed = payroll.payroll_disputes && payroll.payroll_disputes.length > 0;

        switch (payroll.status_code) {
            case 'DRAFT':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        {hasDisputed ? (
                            // NÚT MỚI: Dành cho phiếu lương đã khiếu nại xong
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleUpdateStatus(payroll.payroll_id, 'PENDING_APPROVAL', 'Đã chốt cứng phiếu lương!')}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Chốt thanh toán
                            </Button>
                        ) : (
                            // NÚT CŨ: Dành cho phiếu lương mới chạy lần đầu
                            <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => handleUpdateStatus(payroll.payroll_id, 'SENT_FOR_REVIEW', 'Đã gửi cho nhân viên kiểm tra.')}>
                                <Send className="w-4 h-4 mr-2" /> Gửi
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleRunPayroll(user_id)}>
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                );
            case 'SENT_FOR_REVIEW':
                return (
                    <div className="flex gap-2 items-center">
                        <ViewButton />
                        <span className="text-xs text-neutral-500 italic"><Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Chờ chốt</span>
                    </div>
                );
            case 'DISPUTED':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        <Button size="sm" variant="destructive" onClick={() => handleRunPayroll(user_id)}>
                            <AlertCircle className="w-4 h-4 mr-2" /> Tính lại
                        </Button>
                    </div>
                );
            case 'PENDING_APPROVAL':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleUpdateStatus(payroll.payroll_id, 'PAID', 'Đã thanh toán thành công!')}>
                            <Banknote className="w-4 h-4 mr-2" /> Thanh toán
                        </Button>
                    </div>
                );
            case 'PAID':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã xong</Badge>
                    </div>
                );
            default:
                return <ViewButton />;
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case undefined: return <Badge variant="outline" className="text-slate-500">Chưa chạy</Badge>;
            case 'DRAFT': return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300">Bản Nháp</Badge>;
            case 'SENT_FOR_REVIEW': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">Chờ NV chốt</Badge>;
            case 'DISPUTED': return <Badge variant="destructive">Đang khiếu nại</Badge>;
            case 'PENDING_APPROVAL': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">Sẵn sàng CK</Badge>;
            case 'PAID': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">Đã thanh toán</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    // Hàm gọi API thêm điều chỉnh
    const handleAddAdjustment = async () => {
        if (!adjustTitle || !adjustAmount) return toast({ title: "Lỗi", description: "Vui lòng nhập lý do và số tiền", variant: "destructive" });
        setAdjustLoading(true);
        try {
            const res = await axiosInstance.post(`/payroll/${viewPayroll.payroll_id}/adjust`, {
                title: adjustTitle,
                amount: Number(adjustAmount),
                isAddition: isAddition
            });
            setViewPayroll({ ...res.data, empInfo: viewPayroll.empInfo }); // Cập nhật ngay lập tức UI Modal
            toast({ title: "Thành công", description: "Đã thêm khoản điều chỉnh vào phiếu lương." });
            setAdjustTitle(''); setAdjustAmount('');
            fetchData(); // Cập nhật lại bảng ngoài
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể thêm điều chỉnh", variant: "destructive" });
        } finally {
            setAdjustLoading(false);
        }
    };

    // Hàm gọi API xóa khoản tiền
    const handleDeleteItem = async (payrollId: number, itemId: number) => {
        try {
            const res = await axiosInstance.delete(`/payroll/${payrollId}/items/${itemId}`);
            setViewPayroll({ ...res.data, empInfo: viewPayroll.empInfo }); // Cập nhật ngay UI
            toast({ title: "Thành công", description: "Đã xóa khoản lương này." });
            setSwipedItemId(null); // Đóng thẻ
            fetchData(); // Cập nhật lại bảng cha bên ngoài
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể xóa khoản này", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Chốt Bảng Lương</h1>
                    <p className="text-neutral-500 text-sm mt-1">Tính toán, xử lý khiếu nại và thanh toán lương.</p>
                </div>

                <div className="flex gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[120px] bg-white"><SelectValue placeholder="Tháng" /></SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => <SelectItem key={m} value={m + ''}>Tháng {m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px] bg-white"><SelectValue placeholder="Năm" /></SelectTrigger>
                        <SelectContent>
                            {[2025, 2026, 2027].map(y => <SelectItem key={y} value={y + ''}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-neutral-50">
                                <TableRow>
                                    <TableHead>Nhân viên</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="text-right">Giờ công</TableHead>
                                    <TableHead className="text-right">Thực lãnh</TableHead>
                                    <TableHead className="text-center">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mergedData.map((row) => (
                                    <TableRow key={row.user_id}>
                                        <TableCell>
                                            <div
                                                className="cursor-pointer group inline-block"
                                                onClick={() => setSelectedEmpId(row.user_id)} // Click vào tên mở Profile Sheet
                                            >
                                                <div className="font-bold text-sm text-neutral-900 group-hover:text-indigo-600 transition-colors">
                                                    {row.users?.full_name}
                                                </div>
                                                <div className="text-xs text-neutral-500">{row.employee_code} • {row.users?.role_code}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{getStatusBadge(row.payroll?.status_code)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{row.payroll ? `${row.payroll.total_work_hours}h` : '-'}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {row.payroll ? <span className="text-emerald-600">{formatCurrency(row.payroll.final_salary)}</span> : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {renderActions(row)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal Chi tiết Phiếu lương & Khiếu nại */}
            <Dialog open={!!viewPayroll} onOpenChange={(open) => !open && setViewPayroll(null)}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-slate-50">
                    <DialogTitle className="sr-only">Chi tiết phiếu lương</DialogTitle>
                    {viewPayroll && (
                        <>
                            <div className="p-6 text-white bg-slate-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold uppercase tracking-wider">Chi Tiết Lương</h2>
                                        <p className="opacity-90">{viewPayroll.empInfo?.users?.full_name} • Tháng {viewPayroll.month}/{viewPayroll.year}</p>
                                    </div>
                                    <div className="text-right">{getStatusBadge(viewPayroll.status_code)}</div>
                                </div>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {/* Khối cảnh báo nếu có khiếu nại */}
                                {viewPayroll.status_code === 'DISPUTED' && viewPayroll.payroll_disputes?.[0] && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                                            <AlertTriangle className="w-5 h-5" /> Nhân viên khiếu nại:
                                        </div>
                                        <p className="text-sm text-red-900 whitespace-pre-wrap font-medium">
                                            "{viewPayroll.payroll_disputes[0].content}"
                                        </p>
                                        <p className="text-xs text-red-500 mt-2 italic">
                                            Vui lòng kiểm tra lại cấu hình lương/timesheet của nhân viên này và bấm "Tính lại".
                                        </p>
                                    </div>
                                )}

                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50/50">
                                        <span className="font-semibold text-slate-700">Tổng giờ công hệ thống</span>
                                        <span className="font-bold font-mono text-indigo-600">{viewPayroll.total_work_hours} giờ</span>
                                    </div>

                                    {/* Bóc tách các khoản (CÓ HIỆU ỨNG TRƯỢT XÓA) */}
                                    <div className="p-2">
                                        {viewPayroll.payroll_items?.map((item: any) => (
                                            <div key={item.item_id} className="relative overflow-hidden border-b border-slate-50 last:border-0 rounded-lg">

                                                {/* NÚT XÓA (Nằm ẩn bên dưới, ở góc phải) */}
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-16 bg-red-500 flex items-center justify-center text-white cursor-pointer hover:bg-red-600 transition-colors"
                                                    onClick={() => handleDeleteItem(viewPayroll.payroll_id, item.item_id)}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </div>

                                                {/* THẺ NỘI DUNG (Nằm trên, click để trượt sang trái) */}
                                                <div
                                                    className={`relative flex justify-between items-center py-3 px-3 bg-white transition-transform duration-300 ease-in-out cursor-pointer hover:bg-slate-50 ${swipedItemId === item.item_id ? '-translate-x-16' : 'translate-x-0'}`}
                                                    onClick={() => setSwipedItemId(swipedItemId === item.item_id ? null : item.item_id)}
                                                >
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
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-slate-100 text-slate-900 flex justify-between items-center border-t border-slate-200">
                                        <span className="font-bold uppercase tracking-wider">Tổng Thực Lãnh</span>
                                        <span className="text-xl font-bold font-mono text-emerald-600">
                                            {formatCurrency(viewPayroll.final_salary)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* --- THANH CÔNG CỤ ĐIỀU CHỈNH NÓNG --- */}
                            {(viewPayroll.status_code === 'DISPUTED' || viewPayroll.status_code === 'DRAFT') && (
                                <div className="p-4 bg-indigo-50/50 border-t border-indigo-100 flex flex-col gap-3">
                                    <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                                        <Banknote className="w-4 h-4" /> Thêm khoản điều chỉnh thủ công:
                                    </span>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Lý do (VD: Bù tiền phạt sai)"
                                            value={adjustTitle}
                                            onChange={(e) => setAdjustTitle(e.target.value)}
                                            className="bg-white flex-1 text-sm"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Số tiền"
                                            value={adjustAmount}
                                            onChange={(e) => setAdjustAmount(e.target.value)}
                                            className="bg-white w-28 font-mono text-sm"
                                        />
                                        <Select value={isAddition ? 'true' : 'false'} onValueChange={(v) => setIsAddition(v === 'true')}>
                                            <SelectTrigger className="w-20 bg-white font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true" className="text-emerald-600 font-bold">Plus</SelectItem>
                                                <SelectItem value="false" className="text-red-600 font-bold">Minus</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleAddAdjustment} disabled={adjustLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                                            {adjustLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Thêm'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-indigo-600/70 italic">
                                        * Khoản tiền này sẽ được áp dụng trực tiếp vào phiếu lương và thay đổi Tổng thực lãnh.
                                    </p>
                                </div>
                            )}
                            {/* -------------------------------------- */}


                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Tái sử dụng Sheet Chi tiết Nhân viên (Sửa lương/Phụ cấp/Xem Timesheet) */}
            <EmployeeDetailSheet
                employeeId={selectedEmpId}
                open={!!selectedEmpId}
                onOpenChange={(open) => !open && setSelectedEmpId(null)}
                onUpdateSuccess={fetchData}
            />
        </div>
    );
}