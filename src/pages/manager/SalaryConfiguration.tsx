import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Search, Edit3, Loader2, DollarSign, Settings2, History, Gavel } from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';

export default function SalaryConfiguration() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form State
    const [newSalary, setNewSalary] = useState('');
    const [reasonCode, setReasonCode] = useState('NEW_HIRE');
    const [note, setNote] = useState('');

    // Allowance Modal State
    const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
    const [configs, setConfigs] = useState<any[]>([]);
    const [configLoading, setConfigLoading] = useState(false);

    // Config Form State
    const [configName, setConfigName] = useState('Phụ cấp chuyên cần');
    const [configAmount, setConfigAmount] = useState('1000000');
    const [configType, setConfigType] = useState('ALLOWANCE');

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Penalty Rules State
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [ruleLate, setRuleLate] = useState('50000');
    const [ruleEarlyLeave, setRuleEarlyLeave] = useState('50000');
    const [ruleLimit, setRuleLimit] = useState('3');
    const [ruleSpam, setRuleSpam] = useState('20000');
    const [savingRule, setSavingRule] = useState(false);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Tạm thời gọi API lấy danh sách nhân viên (có chứa base_salary hiện tại)
            const res = await axiosInstance.get('/employees', {
                params: { limit: 100, search: searchTerm }
            });
            setEmployees(res.data?.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Could not load employee list", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const delay = setTimeout(() => { fetchEmployees(); }, 500);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const openUpdateModal = (emp: any) => {
        setSelectedEmp(emp);
        setNewSalary(emp.base_salary > 0 ? emp.base_salary.toString() : '');
        setReasonCode(emp.base_salary === 0 ? 'NEW_HIRE' : 'ANNUAL_REVIEW');
        setNote('');
        setIsUpdateModalOpen(true);
    };

    const handleUpdateSalary = async () => {
        if (!newSalary || isNaN(Number(newSalary)) || Number(newSalary) < 0) {
            toast({ title: "Error", description: "Please enter a valid salary", variant: "destructive" });
            return;
        }

        setSubmitLoading(true);
        try {
            await axiosInstance.post('/payroll/update-base-salary', {
                userId: selectedEmp.user_id,
                newSalary: Number(newSalary),
                reasonCode: reasonCode,
                note: note
            });

            toast({ title: "Success", description: "New salary set. Will take effect next month." });
            setIsUpdateModalOpen(false);
            fetchEmployees(); // Refresh data
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.message || "System error", variant: "destructive" });
        } finally {
            setSubmitLoading(false);
        }
    };

    const openAllowanceModal = async (emp: any) => {
        setSelectedEmp(emp);
        setIsAllowanceModalOpen(true);
        fetchConfigs(emp.user_id);
    };

    const fetchConfigs = async (userId: number) => {
        setConfigLoading(true);
        try {
            const res = await axiosInstance.get(`/payroll/salary-configs/${userId}`);
            setConfigs(res.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Could not load allowances list", variant: "destructive" });
        } finally {
            setConfigLoading(false);
        }
    };

    const handleAddConfig = async () => {
        if (!configName || !configAmount || isNaN(Number(configAmount))) {
            toast({ title: "Error", description: "Please enter valid name and amount", variant: "destructive" });
            return;
        }
        try {
            await axiosInstance.post('/payroll/salary-configs', {
                userId: selectedEmp.user_id,
                type_code: configType,
                name: configName,
                amount: Number(configAmount),
                is_recurring: true
            });
            toast({ title: "Success", description: "Salary configuration added." });
            setConfigName('');
            setConfigAmount('');
            fetchConfigs(selectedEmp.user_id); // Tải lại danh sách
        } catch (error) {
            toast({ title: "Error", description: "Could not add configuration", variant: "destructive" });
        }
    };

    const handleStopConfig = async (configId: number) => {
        try {
            await axiosInstance.patch(`/payroll/salary-configs/${configId}/stop`);
            toast({ title: "Success", description: "Item removed." });
            fetchConfigs(selectedEmp!.user_id);
        } catch (error) {
            toast({ title: "Error", description: "Could not stop configuration", variant: "destructive" });
        }
    };

    const openHistoryModal = async (emp: any) => {
        setSelectedEmp(emp);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const res = await axiosInstance.get(`/payroll/salary-history/${emp.user_id}`);
            setSalaryHistory(res.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Could not load salary history", variant: "destructive" });
        } finally {
            setHistoryLoading(false);
        }
    };

    const openPenaltyRulesModal = async () => {
        setIsRuleModalOpen(true);
        try {
            const res = await axiosInstance.get('/payroll/penalty-rules');
            res.data.forEach((r: any) => {
                if (r.code === 'LATE_PENALTY' && r.meta_data?.amount) setRuleLate(r.meta_data.amount.toString());
                if (r.code === 'EARLY_LEAVE_PENALTY' && r.meta_data?.amount) setRuleEarlyLeave(r.meta_data.amount.toString());
                if (r.code === 'CORRECTION_PENALTY' && r.meta_data) {
                    setRuleSpam(r.meta_data.amount?.toString() || '20000');
                    setRuleLimit(r.meta_data.free_limit?.toString() || '3');
                }
            });
        } catch (error) { }
    };

    const handleSaveRules = async () => {
        setSavingRule(true);
        try {
            await Promise.all([
                axiosInstance.post('/payroll/penalty-rules', { code: 'LATE_PENALTY', value: 'Phạt đi trễ', meta_data: { amount: Number(ruleLate) } }),
                axiosInstance.post('/payroll/penalty-rules', { code: 'EARLY_LEAVE_PENALTY', value: 'Phạt về sớm', meta_data: { amount: Number(ruleEarlyLeave) } }),
                axiosInstance.post('/payroll/penalty-rules', { code: 'CORRECTION_PENALTY', value: 'Phạt spam khiếu nại', meta_data: { amount: Number(ruleSpam), free_limit: Number(ruleLimit) } })
            ]);
            toast({ title: "Success", description: "Penalty rules saved." });
            setIsRuleModalOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Could not save penalty rules", variant: "destructive" });
        } finally {
            setSavingRule(false);
        }
    };


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Base Salary Configuration</h1>
                    <p className="text-neutral-500 text-sm mt-1">Manage and update hourly rates for all employees.</p>
                </div>

                <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={openPenaltyRulesModal}>
                    <Gavel className="w-4 h-4 mr-2" /> Penalty Rules Configuration
                </Button>
            </div>

            <Card>
                <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-8 bg-neutral-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-neutral-50">
                                <TableRow>
                                    <TableHead>EMP ID</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Hourly Rate (VND/h)</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.user_id}>
                                        <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{emp.users?.full_name}</div>
                                            <div className="text-xs text-neutral-500">{emp.users?.email}</div>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary">{emp.users?.role_code}</Badge></TableCell>
                                        <TableCell className="text-right font-medium">
                                            {emp.base_salary === 0 ? (
                                                <span className="text-red-500 text-xs italic">Not configured</span>
                                            ) : (
                                                <span className="text-emerald-600">{formatCurrency(emp.base_salary)}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openUpdateModal(emp)}>
                                                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Update Salary
                                                </Button>
                                                {/* Nút này sẽ làm ở bước sau để gán Phụ cấp chuyên cần */}
                                                <Button size="sm" variant="ghost" className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => openAllowanceModal(emp)}>
                                                    <Settings2 className="w-3.5 h-3.5 mr-1" /> Allowances
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => openHistoryModal(emp)}>
                                                    <History className="w-3.5 h-3.5 mr-1" /> History
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal Cập nhật lương */}
            <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Employee Salary</DialogTitle>
                        <DialogDescription>
                            Set the hourly rate for <b>{selectedEmp?.users?.full_name}</b>. The new rate will take effect next month.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Hourly Rate (VND/h) <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                                <Input
                                    type="number"
                                    className="pl-8 font-mono"
                                    placeholder="e.g: 25000"
                                    value={newSalary}
                                    onChange={(e) => setNewSalary(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason for change <span className="text-red-500">*</span></Label>
                            <Select value={reasonCode} onValueChange={setReasonCode}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NEW_HIRE">New hire (First time setup)</SelectItem>
                                    <SelectItem value="ANNUAL_REVIEW">Periodic review (Salary increase)</SelectItem>
                                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                                    <SelectItem value="CORRECTION">Correction</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Additional notes (Optional)</Label>
                            <Input
                                placeholder="e.g: Probations for 2 months..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateSalary} disabled={submitLoading}>
                            {submitLoading ? "Saving..." : "Confirm Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Modal Quản lý Phụ cấp / Khấu trừ */}
            <Dialog open={isAllowanceModalOpen} onOpenChange={setIsAllowanceModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Manage Allowances & Deductions</DialogTitle>
                        <DialogDescription>
                            Set fixed monthly amounts for <b>{selectedEmp?.users?.full_name}</b>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        {/* Danh sách đang áp dụng */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-neutral-500">Currently Applied</Label>
                            {configLoading ? (
                                <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" /></div>
                            ) : configs.length === 0 ? (
                                <div className="text-sm text-neutral-500 italic py-2 border border-dashed rounded-md text-center bg-neutral-50">No allowances currently configured.</div>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {configs.map(cfg => (
                                        <div key={cfg.config_id} className="flex items-center justify-between p-3 border rounded-md bg-white shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-neutral-900">{cfg.name}</span>
                                                    <Badge variant="outline" className={cfg.type_code === 'ALLOWANCE' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}>
                                                        {cfg.type_code === 'ALLOWANCE' ? '+' : '-'} {formatCurrency(cfg.amount)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2" onClick={() => handleStopConfig(cfg.config_id)}>
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Form thêm mới */}
                        <div className="bg-neutral-50 p-4 rounded-lg border space-y-4">
                            <Label className="text-xs font-bold uppercase text-neutral-500">Add New Item</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Type</Label>
                                    <Select value={configType} onValueChange={setConfigType}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALLOWANCE">Allowance (Add)</SelectItem>
                                            <SelectItem value="DEDUCTION">Deduction (Subtract)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Amount (VND)</Label>
                                    <Input type="number" className="bg-white font-mono text-sm" placeholder="e.g: 1000000" value={configAmount} onChange={(e) => setConfigAmount(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Item Name (Will print on slip)</Label>
                                <Input className="bg-white text-sm" placeholder="e.g: Attendance allowance..." value={configName} onChange={(e) => setConfigName(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={handleAddConfig}>Add to List</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Modal Lịch sử thay đổi lương */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Salary Change History</DialogTitle>
                        <DialogDescription>
                            Salary change records for <b>{selectedEmp?.users?.full_name}</b>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        {historyLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
                        ) : salaryHistory.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-lg border border-dashed">
                                No salary change records found for this employee.
                            </div>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {salaryHistory.map((item, index) => (
                                    <div key={item.history_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                            <History className="w-4 h-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border shadow-sm">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {formatCurrency(item.new_salary)}/h
                                                </div>
                                                <time className="text-xs font-medium text-amber-600">
                                                    {new Date(item.effective_date).toLocaleDateString('en-US')}
                                                </time>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-2">
                                                Old salary: {formatCurrency(item.old_salary)}/h
                                            </div>
                                            <div className="text-sm text-slate-700 mb-2">
                                                <Badge variant="secondary" className="font-normal text-[10px] bg-slate-100">{item.reason}</Badge>
                                            </div>
                                            {item.note && (
                                                <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-dashed">
                                                    "{item.note}"
                                                </div>
                                            )}
                                            <div className="text-[10px] text-slate-400 mt-2 text-right">
                                                By: {item.users?.full_name || 'System'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Modal Cấu hình Luật Phạt Hệ Thống */}
            <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-indigo-700">
                            <Gavel className="w-5 h-5" /> General Penalty Rules Configuration
                        </DialogTitle>
                        <DialogDescription>
                            The penalty amounts below will be automatically deducted from the employee's <b>Attendance Allowance</b> when running payroll.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Late Penalty / Time (VND)</Label>
                                <Input type="number" value={ruleLate} onChange={e => setRuleLate(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Early Leave Penalty / Time (VND)</Label>
                                <Input type="number" value={ruleEarlyLeave} onChange={e => setRuleEarlyLeave(e.target.value)} />
                            </div>
                        </div>
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                            <Label className="text-xs font-bold text-orange-800 uppercase">Dispute Spam / False Report Penalties</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-orange-700">Free (Times/month)</Label>
                                    <Input type="number" value={ruleLimit} onChange={e => setRuleLimit(e.target.value)} className="bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-orange-700">Penalty per exceed</Label>
                                    <Input type="number" value={ruleSpam} onChange={e => setRuleSpam(e.target.value)} className="bg-white" />
                                </div>
                            </div>
                            <p className="text-[10px] text-orange-600/80 italic">* Encouraging employees to check their timesheets carefully before disputing.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRuleModalOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveRules} disabled={savingRule}>
                            {savingRule ? "Saving..." : "Save Configuration"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}