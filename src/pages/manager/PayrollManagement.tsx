import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlayCircle, Send, CheckCircle, AlertCircle, Banknote, Eye, RotateCcw, AlertTriangle, Trash2, Calendar, FileSignature, Filter, QrCode } from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';
import EmployeeDetailSheet from '@/features/admin/components/EmployeeDetailSheet';
import { Input } from '@/components/ui/input';
import { employeesService } from "@/services/employees.service";
export default function PayrollManagement() {
    const { toast } = useToast();

    // Filter by Month / Year
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1 + '');
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear() + '');

    const [roleFilter, setRoleFilter] = useState('ALL');
    const [disputeFilter, setDisputeFilter] = useState('ALL');

    // === UPDATE: Use User_ID to select even those without payroll run ===
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    const [mergedData, setMergedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
    const [viewPayroll, setViewPayroll] = useState<any>(null);

    const [paymentTarget, setPaymentTarget] = useState<any>(null);
    // === NEW: States for Smart Payroll Modal ===
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);
    const [runTargetUsers, setRunTargetUsers] = useState<number[]>([]);
    const [runStart, setRunStart] = useState('');
    const [runEnd, setRunEnd] = useState('');
    const [runLoading, setRunLoading] = useState(false);

    // Quick Adjustment Form
    const [adjustTitle, setAdjustTitle] = useState('');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [isAddition, setIsAddition] = useState(true);
    const [adjustLoading, setAdjustLoading] = useState(false);
    const [swipedItemId, setSwipedItemId] = useState<number | null>(null);

    // Date settings for existing slips
    const [paymentStart, setPaymentStart] = useState('');
    const [paymentEnd, setPaymentEnd] = useState('');
    const [windowLoading, setWindowLoading] = useState(false);

    // === NEW: State for Hide Completed Filter and Animation ===
    const [hideCompleted, setHideCompleted] = useState(false);
    const [slideOutId, setSlideOutId] = useState<number | null>(null);

    const [paymentEmployeeInfo, setPaymentEmployeeInfo] = useState<any>(null);
    const [isFetchingBankInfo, setIsFetchingBankInfo] = useState(false);

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
            setSelectedUserIds([]);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load payroll data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

    useEffect(() => {
        if (viewPayroll) {
            setPaymentStart(viewPayroll.payment_start_date ? viewPayroll.payment_start_date.split('T')[0] : '');
            setPaymentEnd(viewPayroll.payment_end_date ? viewPayroll.payment_end_date.split('T')[0] : '');
        }
    }, [viewPayroll]);

    const uniqueRoles = Array.from(new Set(mergedData.map(d => d.users?.role_code).filter(Boolean)));

    const filteredData = useMemo(() => {
        return mergedData.filter(row => {
            if (roleFilter !== 'ALL' && row.users?.role_code !== roleFilter) return false;
            if (disputeFilter === 'PENDING') {
                if (row.payroll?.status_code !== 'DISPUTED') return false;
            }
            if (disputeFilter === 'RESOLVED') {
                const hasDisputes = row.payroll?.payroll_disputes?.length > 0;
                const isDraft = row.payroll?.status_code === 'DRAFT';
                if (!(hasDisputes && isDraft)) return false;
            }

            // === NEW: Filter out completed statuses (APPROVED: Transferred, PAID: Signed) ===
            if (hideCompleted) {
                if (row.payroll?.status_code === 'APPROVED' || row.payroll?.status_code === 'PAID') {
                    return false;
                }
            }
            return true;
        });
    }, [mergedData, roleFilter, disputeFilter]);

    // === CHECKBOX SELECTION LOGIC ===
    const handleSelectRow = (userId: number) => {
        setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allValidIds = filteredData.filter(r => !r.payroll || r.payroll.status_code !== 'PAID').map(r => r.user_id);
            setSelectedUserIds(allValidIds);
        } else {
            setSelectedUserIds([]);
        }
    };

    // === OPEN PAYROLL RUN MODAL ===
    const openRunModal = (userIds: number[]) => {
        setRunTargetUsers(userIds);
        setIsRunModalOpen(true);
        setViewPayroll(null); // Close detail if open
    };

    // === CONSOLIDATED API: CALCULATE PAYROLL + SET DATES ===
    const submitRunPayroll = async () => {
        if (!runStart || !runEnd) return toast({ title: "Error", description: "Please schedule the expected payment date", variant: "destructive" });
        if (new Date(runStart) > new Date(runEnd)) return toast({ title: "Error", description: "Invalid payment schedule", variant: "destructive" });

        setRunLoading(true);
        try {
            await Promise.all(runTargetUsers.map(userId =>
                axiosInstance.post('/payroll/run-payroll', {
                    userId: userId,
                    month: Number(selectedMonth),
                    year: Number(selectedYear),
                    payment_start_date: new Date(runStart).toISOString(),
                    payment_end_date: new Date(runEnd).toISOString()
                })
            ));
            toast({ title: "Success", description: `Calculated payroll and scheduled for ${runTargetUsers.length} employees.` });
            setIsRunModalOpen(false);
            setSelectedUserIds([]);
            fetchData();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to run payroll", variant: "destructive" });
        } finally {
            setRunLoading(false);
        }
    };

    // === NEW: Open Payment Modal and call API to get QR Code from Profile ===
    const handleOpenPaymentModal = async (payroll: any) => {
        setPaymentTarget(payroll);
        setIsFetchingBankInfo(true);
        try {
            // Get exact profile info like EmployeeDetailSheet
            const empData = await employeesService.getEmployeeById(payroll.user_id);
            setPaymentEmployeeInfo(empData);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch bank info from Profile", variant: "destructive" });
        } finally {
            setIsFetchingBankInfo(false);
        }
    };

    const handleUpdateStatus = async (payrollId: number, newStatus: string, successMessage: string, userId?: number) => {
        setActionLoading(payrollId);
        try {
            await axiosInstance.patch(`/payroll/${payrollId}/status`, { status_code: newStatus });
            toast({ title: "Success", description: successMessage });
            setViewPayroll(null);
            setPaymentTarget(null);

            // NEW LOGIC: Start Animation if filter is on and manager just clicked Transferred (APPROVED)
            if (hideCompleted && newStatus === 'APPROVED' && userId) {
                // 1. Wait 0.5s for eyes to catch status change
                setTimeout(() => {
                    // 2. Add CSS class to slide card right and fade out
                    setSlideOutId(userId);

                    // 3. Wait for slide animation (0.5s) before fetching data to remove from DOM
                    setTimeout(() => {
                        setSlideOutId(null);
                        fetchData();
                        setActionLoading(null);
                    }, 500);
                }, 500);
            } else {
                fetchData();
                setActionLoading(null);
            }
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to update", variant: "destructive" });
            setActionLoading(null);
        }
    };
    const handleSetPaymentWindow = async () => {
        if (!paymentStart || !paymentEnd) return toast({ title: "Error", description: "Please select both start and end dates", variant: "destructive" });
        setWindowLoading(true);
        try {
            await axiosInstance.patch(`/payroll/${viewPayroll.payroll_id}/payment-window`, {
                payment_start_date: new Date(paymentStart).toISOString(),
                payment_end_date: new Date(paymentEnd).toISOString()
            });
            toast({ title: "Success", description: "Payment window set successfully." });
            fetchData();
            setViewPayroll({ ...viewPayroll, payment_start_date: paymentStart, payment_end_date: paymentEnd });
        } catch (error) { toast({ title: "Error", description: "Failed to set window", variant: "destructive" }); }
        finally { setWindowLoading(false); }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const renderActions = (row: any) => {
        const { user_id, payroll } = row;
        const isActionLoading = actionLoading === user_id || actionLoading === payroll?.payroll_id;

        if (isActionLoading) {
            return <Button disabled size="sm" variant="outline"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</Button>;
        }

        if (!payroll) {
            return (
                <Button size="sm" className="bg-slate-800 hover:bg-slate-900" onClick={() => openRunModal([user_id])}>
                    <PlayCircle className="w-4 h-4 mr-2" /> Run Payroll
                </Button>
            );
        }

        const ViewButton = () => (
            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => setViewPayroll({ ...payroll, empInfo: row })}>
                <Eye className="w-4 h-4 mr-1" /> Details
            </Button>
        );

        const hasDisputed = payroll.payroll_disputes && payroll.payroll_disputes.length > 0;

        switch (payroll.status_code) {
            case 'DRAFT':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        {hasDisputed ? (
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleUpdateStatus(payroll.payroll_id, 'PENDING_APPROVAL', 'Dispute resolved & Payroll confirmed!')}>
                                <Send className="w-4 h-4 mr-2" /> Send & Confirm
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleUpdateStatus(payroll.payroll_id, 'SENT_FOR_REVIEW', 'Sent for employee review.')}>
                                <Send className="w-4 h-4 mr-2" /> Send Review
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openRunModal([user_id])}>
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                );
            case 'SENT_FOR_REVIEW':
                return <div className="flex gap-2 items-center"><ViewButton /><span className="text-xs text-neutral-500 italic"><Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Awaiting review</span></div>;
            case 'DISPUTED':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        <Button size="sm" variant="destructive" onClick={() => openRunModal([user_id])}>
                            <AlertCircle className="w-4 h-4 mr-2" /> Recalculate
                        </Button>
                    </div>
                );
            case 'PENDING_APPROVAL':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleOpenPaymentModal(payroll)}>
                            <Banknote className="w-4 h-4 mr-2" /> Play Now
                        </Button>
                    </div>
                );
            case 'APPROVED':
                return (
                    <div className="flex gap-2">
                        <ViewButton />
                        <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Awaiting Signature
                        </Badge>
                    </div>
                );
            case 'PAID':
                return <div className="flex gap-2"><ViewButton /><Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Completed</Badge></div>;
            default:
                return <ViewButton />;
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case undefined: return <Badge variant="outline" className="text-slate-500">Not Ran</Badge>;
            case 'DRAFT': return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300">Draft</Badge>;
            case 'SENT_FOR_REVIEW': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">Awaiting Feedback</Badge>;
            case 'DISPUTED': return <Badge variant="destructive">Disputed</Badge>;
            case 'PENDING_APPROVAL': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">Ready to Pay</Badge>;
            case 'PAID': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">Paid</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const handleAddAdjustment = async () => {
        if (!adjustTitle || !adjustAmount) return toast({ title: "Error", description: "Please enter data", variant: "destructive" });
        setAdjustLoading(true);
        try {
            const res = await axiosInstance.post(`/payroll/${viewPayroll.payroll_id}/adjust`, {
                title: adjustTitle, amount: Number(adjustAmount), isAddition: isAddition
            });
            setViewPayroll({ ...res.data, empInfo: viewPayroll.empInfo });
            toast({ title: "Success", description: "Adjustment added." });
            setAdjustTitle(''); setAdjustAmount(''); fetchData();
        } catch (error) { toast({ title: "Error", description: "Failed to add adjustment", variant: "destructive" }); }
        finally { setAdjustLoading(false); }
    };

    const handleDeleteItem = async (payrollId: number, itemId: number) => {
        try {
            const res = await axiosInstance.delete(`/payroll/${payrollId}/items/${itemId}`);
            setViewPayroll({ ...res.data, empInfo: viewPayroll.empInfo });
            toast({ title: "Success", description: "Item removed." });
            setSwipedItemId(null); fetchData();
        } catch (error) { toast({ title: "Error", description: "Failed to remove item", variant: "destructive" }); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Payroll Settlement</h1>
                    <p className="text-neutral-500 text-sm mt-1">Calculate, handle disputes, and process payments.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px] bg-white"><Filter className="w-4 h-4 mr-2 text-slate-400" /><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Roles</SelectItem>
                            {uniqueRoles.map((r: any) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={disputeFilter} onValueChange={setDisputeFilter}>
                        <SelectTrigger className="w-[180px] bg-white"><AlertTriangle className="w-4 h-4 mr-2 text-slate-400" /><SelectValue placeholder="Dispute Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="PENDING">Unresolved Disputes</SelectItem>
                            <SelectItem value="RESOLVED">Resolved / Ready to Send</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[120px] bg-white"><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => <SelectItem key={m} value={m + ''}>Month {m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px] bg-white"><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>
                            {[2025, 2026, 2027].map(y => <SelectItem key={y} value={y + ''}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* BULK ACTION BAR (APPEARS WHEN TICKED) */}
            {selectedUserIds.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="text-indigo-800 font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Selected {selectedUserIds.length} employees
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => openRunModal(selectedUserIds)}>
                        <PlayCircle className="w-4 h-4 mr-2" /> Bulk Run Payroll
                    </Button>
                </div>
            )}

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-neutral-50">
                                <TableRow>
                                    <TableHead className="w-12 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredData.filter(r => !r.payroll || r.payroll.status_code !== 'PAID').length}
                                            className="w-4 h-4 cursor-pointer accent-indigo-600 rounded border-gray-300"
                                        />
                                    </TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                    <TableHead className="text-right">Final Pay</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-neutral-400">No matching data found.</TableCell></TableRow>
                                ) : (
                                    filteredData.map((row) => {
                                        const isSelectable = !row.payroll || row.payroll.status_code !== 'PAID';
                                        return (
                                            <TableRow key={row.user_id} className={selectedUserIds.includes(row.user_id) ? "bg-indigo-50/30" : ""}>
                                                <TableCell className="text-center">
                                                    {isSelectable && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUserIds.includes(row.user_id)}
                                                            onChange={() => handleSelectRow(row.user_id)}
                                                            className="w-4 h-4 cursor-pointer accent-indigo-600 rounded border-gray-300"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="cursor-pointer group inline-block" onClick={() => setSelectedEmpId(row.user_id)}>
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
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* MODAL: RUN PAYROLL AND SCHEDULE (CONSOLIDATED) */}
            <Dialog open={isRunModalOpen} onOpenChange={setIsRunModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Confirm Payroll Run</DialogTitle>
                        <DialogDescription>
                            Calculating payroll for {runTargetUsers.length} employees (Period: Month {selectedMonth}/{selectedYear}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                            <Calendar className="w-5 h-5 shrink-0" />
                            <p>Please <b>schedule the expected payment date</b> before generating the slipts. Employees will see this date on their slips.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="grid gap-1.5 flex-1">
                                <label className="text-xs font-semibold text-slate-600">From Date</label>
                                <Input type="date" value={runStart} onChange={(e) => setRunStart(e.target.value)} />
                            </div>
                            <span className="mt-5 text-slate-400">-</span>
                            <div className="grid gap-1.5 flex-1">
                                <label className="text-xs font-semibold text-slate-600">To Date</label>
                                <Input type="date" value={runEnd} onChange={(e) => setRunEnd(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRunModalOpen(false)}>Cancel</Button>
                        <Button onClick={submitRunPayroll} disabled={runLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {runLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                            Start Payroll Run
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payroll History & Dispute Details Modal */}
            <Dialog open={!!viewPayroll} onOpenChange={(open) => !open && setViewPayroll(null)}>
                {/* ADD flex flex-col max-h-[90vh] to limit Modal height */}
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-slate-50 flex flex-col max-h-[90vh]">
                    <DialogTitle className="sr-only">Payroll Details</DialogTitle>

                    {viewPayroll && (
                        <>
                            {/* HEADER - Fixed, non-scrollable */}
                            <div className="p-6 text-white bg-slate-800 shrink-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold uppercase tracking-wider">Payroll Details</h2>
                                        <p className="opacity-90">{viewPayroll.empInfo?.users?.full_name} • Month {viewPayroll.month}/{viewPayroll.year}</p>
                                    </div>
                                    <div className="text-right">{getStatusBadge(viewPayroll.status_code)}</div>
                                </div>
                            </div>

                            {/* BODY - Scrollable area for info and forms */}
                            <div className="flex-1 overflow-y-auto flex flex-col">
                                <div className="p-6 shrink-0">
                                    {/* Alert block if there are disputes */}
                                    {viewPayroll.status_code === 'DISPUTED' && viewPayroll.payroll_disputes?.[0] && (
                                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                                                <AlertTriangle className="w-5 h-5" /> Employee Dispute:
                                            </div>
                                            <p className="text-sm text-red-900 whitespace-pre-wrap font-medium">"{viewPayroll.payroll_disputes[0].content}"</p>
                                            <p className="text-xs text-red-500 mt-2 italic">Please check payroll/timesheet config and click "Recalculate".</p>
                                        </div>
                                    )}

                                    {/* --- FIX 3: Display & Edit expected payment date --- */}
                                    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-indigo-900">
                                            <Calendar className="w-5 h-5" />
                                            <span className="font-semibold">Payment Schedule:</span>
                                        </div>

                                        {(viewPayroll.status_code === 'DRAFT' || viewPayroll.status_code === 'DISPUTED') ? (
                                            <div className="flex gap-2 items-center">
                                                <Input type="date" value={paymentStart} onChange={(e) => setPaymentStart(e.target.value)} className="bg-white w-[130px] text-sm h-8" />
                                                <span className="text-slate-400">-</span>
                                                <Input type="date" value={paymentEnd} onChange={(e) => setPaymentEnd(e.target.value)} className="bg-white w-[130px] text-sm h-8" />
                                                <Button size="sm" onClick={handleSetPaymentWindow} disabled={windowLoading} className="h-8">Save</Button>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-sm text-center">
                                                {viewPayroll.payment_start_date ? `${new Date(viewPayroll.payment_start_date).toLocaleDateString('en-US')} - ${new Date(viewPayroll.payment_end_date).toLocaleDateString('en-US')}` : 'Not scheduled'}
                                            </span>
                                        )}
                                    </div>


                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50/50">
                                            <span className="font-semibold text-slate-700">Total System Hours</span>
                                            <span className="font-bold font-mono text-indigo-600">{viewPayroll.total_work_hours} h</span>
                                        </div>

                                        <div className="p-2">
                                            {viewPayroll.payroll_items?.map((item: any) => (
                                                <div key={item.item_id} className="relative overflow-hidden border-b border-slate-50 last:border-0 rounded-lg">
                                                    <div
                                                        className="absolute right-0 top-0 bottom-0 w-16 bg-red-500 flex items-center justify-center text-white cursor-pointer hover:bg-red-600 transition-colors"
                                                        onClick={() => handleDeleteItem(viewPayroll.payroll_id, item.item_id)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </div>
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
                                                        <span className={`font-mono font-medium ${item.is_addition ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(item.amount)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 bg-slate-100 text-slate-900 flex justify-between items-center border-t border-slate-200">
                                            <span className="font-bold uppercase tracking-wider">Total Final Pay</span>
                                            <span className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(viewPayroll.final_salary)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature display area (If signed) */}
                                {viewPayroll.signature_data && (
                                    <div className="mb-6 mx-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col items-center justify-center gap-2 shrink-0">
                                        <span className="text-sm font-semibold text-emerald-900"><CheckCircle className="w-4 h-4 inline mr-1" /> Employee has signed</span>
                                        <div className="bg-white border border-emerald-200 rounded-lg p-2 shadow-sm">
                                            <img src={viewPayroll.signature_data} alt="Digital Signature" className="max-h-24 object-contain" />
                                        </div>
                                        {viewPayroll.signed_at && (
                                            <span className="text-xs text-emerald-600 font-medium">Signed at: {new Date(viewPayroll.signed_at).toLocaleString('en-US')}</span>
                                        )}
                                    </div>
                                )}

                                {/* Add Adjustment Form */}
                                {(viewPayroll.status_code === 'DISPUTED' || viewPayroll.status_code === 'DRAFT') && (
                                    <div className="p-6 bg-indigo-50/50 border-t border-indigo-100 flex flex-col gap-3 shrink-0">
                                        <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                                            <Banknote className="w-4 h-4" /> Add Manual Adjustment:
                                        </span>
                                        <div className="flex gap-2">
                                            <Input placeholder="Reason" value={adjustTitle} onChange={(e) => setAdjustTitle(e.target.value)} className="bg-white flex-1 text-sm" />
                                            <Input type="number" placeholder="Amount" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="bg-white w-28 font-mono text-sm" />
                                            <Select value={isAddition ? 'true' : 'false'} onValueChange={(v) => setIsAddition(v === 'true')}>
                                                <SelectTrigger className="w-20 bg-white font-bold"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true" className="text-emerald-600 font-bold">Plus</SelectItem>
                                                    <SelectItem value="false" className="text-red-600 font-bold">Minus</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleAddAdjustment} disabled={adjustLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">Add</Button>
                                        </div>
                                        <p className="text-xs text-indigo-600/70 italic">* This amount will be applied directly to the payroll slip and change the final pay total.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* BANK TRANSFER MODAL */}
            <Dialog open={!!paymentTarget} onOpenChange={(o) => {
                if (!o) {
                    setPaymentTarget(null);
                    setPaymentEmployeeInfo(null);
                }
            }}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" /> Bank Transfer Information</DialogTitle>
                        <DialogDescription>Scan the QR code or transfer to the account below for payroll payment.</DialogDescription>
                    </DialogHeader>

                    {paymentTarget && (
                        <div className="py-4 space-y-4">
                            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-center">
                                <p className="text-sm">Amount to transfer:</p>
                                <p className="text-3xl font-bold font-mono">{formatCurrency(paymentTarget.final_salary)}</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center min-h-[260px] justify-center">
                                {isFetchingBankInfo ? (
                                    <div className="flex flex-col items-center text-slate-500">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-600" />
                                        <p className="text-sm">Loading QR from employee profile...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Get from paymentEmployeeInfo instead of paymentTarget.employeeInfo */}
                                        {(paymentEmployeeInfo as any)?.bank_qr_code_url ? (
                                            <div className="mb-4 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                <img src={(paymentEmployeeInfo as any).bank_qr_code_url} alt="QR Code" className="w-48 h-48 object-contain" />
                                            </div>
                                        ) : (
                                            <div className="mb-4 w-48 h-48 bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                                                <QrCode className="w-10 h-10 mb-2 opacity-50" />
                                                <span className="text-xs">No QR code provided by staff</span>
                                            </div>
                                        )}

                                        <div className="w-full space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                                <span className="text-slate-500">Bank:</span>
                                                <span className="font-semibold">{(paymentEmployeeInfo as any)?.bank_name || <span className="text-red-500 italic">Not set</span>}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-200 pb-2">
                                                <span className="text-slate-500">Account Holder:</span>
                                                <span className="font-semibold uppercase">{(paymentEmployeeInfo as any)?.bank_account_name || <span className="text-red-500 italic">Not set</span>}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Account Number:</span>
                                                <span className="font-semibold font-mono text-indigo-700">{(paymentEmployeeInfo as any)?.bank_account_no || <span className="text-red-500 italic">Not set</span>}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentTarget(null)}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isFetchingBankInfo}
                            onClick={() => handleUpdateStatus(paymentTarget.payroll_id, 'APPROVED', 'Payment confirmed successfully! Electronic signature portal for employee is now open.', paymentTarget.user_id)}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Payment Confirmed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EmployeeDetailSheet
                employeeId={selectedEmpId}
                open={!!selectedEmpId}
                onOpenChange={(open) => !open && setSelectedEmpId(null)}
                onUpdateSuccess={fetchData}
            />
        </div>
    );
}