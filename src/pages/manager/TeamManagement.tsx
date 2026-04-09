import { useState, useEffect } from "react";
import { MoreHorizontal, Shield, Mail, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Employee, employeesService } from "@/services/employees.service";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import EmployeeDetailSheet from "@/features/admin/components/EmployeeDetailSheet";
import ConfirmStatusDialog from "@/features/admin/components/ConfirmStatusDialog";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/useAuthStore";
import { Wallet, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TeamManagement() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [statusConfirm, setStatusConfirm] = useState<{ id: number, status: string } | null>(null);
    const [bankInfoPopup, setBankInfoPopup] = useState<any>(null);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            // Manager typically manages POS and WAREHOUSE staff. We can filter if needed or just show all.
            // For now, let's show all like the admin view but maybe without add/delete buttons if permissions restrict.
            const res = await employeesService.getEmployees({ page: 1, limit: 50, search });
            // Filter to show only staff (exclude MANAGER, ADMIN, SUPER_ADMIN)
            const staffOnly = res.data.filter(e => !['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(e.users.role_code));
            setEmployees(staffOnly);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to fetch team members",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    // Client-side filtering based on dropdowns
    const filteredEmployees = employees.filter(employee => {
        const matchesRole = roleFilter === 'ALL' || employee.users.role_code === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || employee.users.status_code === statusFilter;
        return matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Team Management</h1>
                    <p className="text-neutral-500">Oversee staff members and permissions.</p>
                </div>
                {/* Manager might not have add permissions, keeping it simple as per request to fix columns first */}
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search team members..."
                            className="pl-9 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-white">
                                <SelectValue placeholder="Filter by Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Staff</SelectItem>
                                <SelectItem value="STAFF_POS">POS Staff</SelectItem>
                                <SelectItem value="STAFF_INVENTORY">Warehouse Staff</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-white">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                            <th className="px-6 py-4 w-[50px]">Avatar</th>
                            <th className="px-6 py-4 w-[300px]">Employee Info</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-neutral-500">Loading...</td>
                            </tr>
                        ) : filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-neutral-500">No team members found.</td>
                            </tr>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <tr
                                    key={employee.employee_code}
                                    className="hover:bg-neutral-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedId(employee.user_id)}
                                >
                                    <td className="px-6 py-4">
                                        <Avatar className="h-10 w-10 border border-neutral-200">
                                            <AvatarImage src={employee.users?.avatar_url || ""} />
                                            <AvatarFallback className="bg-neutral-100 text-neutral-600 font-medium">
                                                {employee.users?.full_name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-semibold text-neutral-900 leading-tight">{employee.users.full_name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500">
                                                    <Mail className="w-3 h-3" />
                                                    {employee.users.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-600">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-neutral-400" />
                                            <Badge variant="outline" className={`
                                                ${employee.users.role_code === 'STAFF_POS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    employee.users.role_code === 'STAFF_INVENTORY' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        'bg-neutral-100 text-neutral-700 border-neutral-200'}
                                            `}>
                                                {employee.users.role_code.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-neutral-700">
                                            <Phone className="w-4 h-4 text-neutral-400" />
                                            {employee.users.phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={
                                            employee.users.status_code === 'ACTIVE' ? 'default' :
                                                employee.users.status_code === 'INACTIVE' ? 'destructive' : 'secondary'
                                        }>
                                            {employee.users.status_code}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedId(employee.user_id); }}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setBankInfoPopup(employee); }}>
                                                    View Bank Info
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {['SUPER_ADMIN', 'ADMIN'].includes(useAuthStore.getState().user?.role_code || '') && (
                                                    <DropdownMenuItem
                                                        className={employee.users.status_code === 'ACTIVE' ? "text-red-600" : "text-green-600"}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStatusConfirm({ id: employee.user_id, status: employee.users.status_code });
                                                        }}
                                                    >
                                                        {employee.users.status_code === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>


            </div>

            <EmployeeDetailSheet
                employeeId={selectedId}
                open={!!selectedId}
                onOpenChange={(open) => !open && setSelectedId(null)}
                onUpdateSuccess={fetchEmployees}
            />

            {statusConfirm && (
                <ConfirmStatusDialog
                    open={!!statusConfirm}
                    onOpenChange={(open) => !open && setStatusConfirm(null)}
                    currentStatus={statusConfirm.status}
                    onConfirm={async () => {
                        try {
                            await userService.updateStatus(statusConfirm.id, statusConfirm.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                            toast({ title: "Success", description: "User status updated successfully." });
                            fetchEmployees();
                        } catch (error) {
                            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                        } finally {
                            setStatusConfirm(null);
                        }
                    }}
                />
            )}

            {/* Modal Hiển thị nhanh Thông tin Ngân hàng */}
            <Dialog open={!!bankInfoPopup} onOpenChange={(open) => !open && setBankInfoPopup(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-indigo-700">
                            <Wallet className="w-5 h-5" /> Thông Tin Ngân Hàng
                        </DialogTitle>
                        <DialogDescription>
                            Dữ liệu nhận lương của nhân viên <strong className="text-slate-800">{bankInfoPopup?.users?.full_name}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    {bankInfoPopup && (
                        <div className="py-2">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
                                {bankInfoPopup.bank_qr_code_url ? (
                                    <div className="mb-4 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <img src={bankInfoPopup.bank_qr_code_url} alt="QR Code" className="w-40 h-40 object-contain" />
                                    </div>
                                ) : (
                                    <div className="mb-4 w-40 h-40 bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                                        <QrCode className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs">Chưa có mã QR</span>
                                    </div>
                                )}

                                <div className="w-full space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-500">Ngân hàng:</span>
                                        <span className="font-semibold">{bankInfoPopup.bank_name || <span className="text-red-500 italic">Chưa cập nhật</span>}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="text-slate-500">Chủ tài khoản:</span>
                                        <span className="font-semibold uppercase">{bankInfoPopup.bank_account_name || <span className="text-red-500 italic">Chưa cập nhật</span>}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Số tài khoản:</span>
                                        <span className="font-semibold font-mono text-indigo-700">{bankInfoPopup.bank_account_no || <span className="text-red-500 italic">Chưa cập nhật</span>}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
