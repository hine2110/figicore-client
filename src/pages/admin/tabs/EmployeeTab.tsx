import { useState, useEffect } from "react";
import { UserPlus, MoreHorizontal, Search, Phone } from "lucide-react";
import { employeesService, Employee } from "@/services/employees.service";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ConfirmStatusDialog from "@/features/admin/components/ConfirmStatusDialog";
import EmployeeDetailSheet from "@/features/admin/components/EmployeeDetailSheet";
import BulkCreateUserSheet from "@/features/admin/components/BulkCreateUserSheet";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/useAuthStore";

export default function EmployeeTab() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [statusConfirm, setStatusConfirm] = useState<{id: number, status: string} | null>(null);
    const [isBulkOpen, setIsBulkOpen] = useState(false);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const res = await employeesService.getEmployees({ page, limit: 10, search, role: roleFilter });
            setEmployees(res.data);
            setTotalPages(res.meta.totalPages);
        } catch (error) {
            console.error(error);
            setEmployees([]);
            toast({
                title: "Error",
                description: "Failed to fetch employees",
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
    }, [page, search, roleFilter]);

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center">
                <Button className="bg-neutral-900" onClick={() => setIsBulkOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Add Employee
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50 gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input 
                            placeholder="Search employees..." 
                            className="pl-9 bg-white" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Filter by Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Roles</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="STAFF_POS">POS Staff</SelectItem>
                            <SelectItem value="STAFF_INVENTORY">Inventory Staff</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                            <TableHead className="w-[300px]">Employee Info</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                                    No employees found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow 
                                    key={employee.employee_code} 
                                    className="cursor-pointer hover:bg-neutral-50/50"
                                    onClick={() => setSelectedId(employee.user_id)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-neutral-200">
                                                <AvatarFallback className="bg-neutral-100 text-neutral-600 font-medium">
                                                    {employee.users.full_name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-neutral-900 leading-tight">{employee.users.full_name}</span>
                                                <span className="text-xs text-neutral-500">{employee.users.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`
                                            ${employee.users.role_code === 'STAFF_POS' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                              employee.users.role_code === 'STAFF_INVENTORY' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                              'bg-neutral-100 text-neutral-700 border-neutral-200'}
                                        `}>
                                            {employee.users.role_code.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                            {employee.users.phone}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            employee.users.status_code === 'ACTIVE' ? 'default' : 
                                            employee.users.status_code === 'INACTIVE' ? 'destructive' : 'secondary'
                                        } className="capitalize">
                                            {employee.users.status_code?.toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedId(employee.user_id); }}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                    Edit Details
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
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                
                <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
                    <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
                    <div className="space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
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
            
            <BulkCreateUserSheet 
                open={isBulkOpen}
                onOpenChange={setIsBulkOpen}
                onSuccess={fetchEmployees}
            />
        </div>
    );
}
