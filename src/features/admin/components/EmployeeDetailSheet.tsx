import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Briefcase, DollarSign, Calendar, Shield, Hash } from "lucide-react";
import { Employee, employeesService } from "@/services/employees.service";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import ConfirmStatusDialog from "./ConfirmStatusDialog";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/useAuthStore";

interface EmployeeDetailSheetProps {
    employeeId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateSuccess: () => void;
}

export default function EmployeeDetailSheet({ employeeId, open, onOpenChange, onUpdateSuccess }: EmployeeDetailSheetProps) {
    const { toast } = useToast();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState<{ status: string } | null>(null);

    useEffect(() => {
        if (open && employeeId) {
            fetchEmployeeDetails(employeeId);
        } else {
            setEmployee(null);
        }
    }, [open, employeeId]);

    const fetchEmployeeDetails = async (id: number) => {
        setIsLoading(true);
        try {
            const data = await employeesService.getEmployeeById(id);
            setEmployee(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to fetch employee details",
                variant: "destructive"
            });
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Employee Profile</SheetTitle>
                    <SheetDescription>Detailed information about the employee.</SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
                    </div>
                ) : employee ? (
                    <div className="mt-8 space-y-6">
                        {/* Header Profile */}
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-24 w-24 mb-4 border-4 border-neutral-100">
                                <AvatarImage src={employee.users.avatar_url || ""} />
                                <AvatarFallback className="text-2xl bg-neutral-100 text-neutral-600">
                                    {employee.users.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold text-neutral-900 leading-tight">
                                {employee.users.full_name}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="border-neutral-200 bg-neutral-50 text-neutral-600">
                                    {employee.job_title_code}
                                </Badge>
                                <Badge variant={
                                    employee.users.status_code === 'ACTIVE' ? 'default' : 
                                    employee.users.status_code === 'INACTIVE' ? 'destructive' : 'secondary'
                                }>
                                    {employee.users.status_code}
                                </Badge>
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                            <div className="p-4 flex items-center gap-4 hover:bg-neutral-50/50 transition-colors">
                                <Mail className="w-5 h-5 text-neutral-400" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Email Address</p>
                                    <p className="text-sm font-medium text-neutral-900 truncate" title={employee.users.email}>{employee.users.email}</p>
                                </div>
                            </div>
                            
                            <div className="p-4 flex items-center gap-4 hover:bg-neutral-50/50 transition-colors">
                                <Phone className="w-5 h-5 text-neutral-400" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Phone Number</p>
                                    <p className="text-sm font-medium text-neutral-900">{employee.users.phone}</p>
                                </div>
                            </div>

                            {/* Address - Assuming users.addresses is now fetched if update in backend worked */}
                            {(employee.users as any).addresses && (employee.users as any).addresses.length > 0 && (
                                <div className="p-4 flex items-start gap-4 hover:bg-neutral-50/50 transition-colors">
                                    <div className="w-5 h-5 flex items-center justify-center pt-0.5">
                                        <Briefcase className="w-4 h-4 text-neutral-400" />{/* Using Briefcase icon for generic 'Office/Location' or MapPin if available */}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Address</p>
                                        <p className="text-sm font-medium text-neutral-900 line-clamp-2">
                                            {(employee.users as any).addresses[0].detail_address}, {(employee.users as any).addresses[0].ward_code},...
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 flex items-center gap-4 hover:bg-neutral-50/50 transition-colors">
                                <Shield className="w-5 h-5 text-neutral-400" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">System Role</p>
                                    <p className="text-sm font-medium text-neutral-900">{employee.users.role_code}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Hash className="w-4 h-4 text-neutral-400" />
                                    <p className="text-xs font-medium text-neutral-500">Employee Code</p>
                                </div>
                                <p className="text-lg font-bold text-neutral-900 font-mono">
                                    {employee.employee_code}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-neutral-400" />
                                    <p className="text-xs font-medium text-neutral-500">Base Salary</p>
                                </div>
                                <p className="text-lg font-bold text-neutral-900">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(employee.base_salary || 0))}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30 col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                    <p className="text-xs font-medium text-neutral-500">Employment Start Date</p>
                                </div>
                                <p className="text-lg font-bold text-neutral-900">
                                    {employee.start_date ? format(new Date(employee.start_date), 'MMMM dd, yyyy') : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-100 flex justify-end">
                            {/* Only ADMIN/SUPER_ADMIN can ban/unban */}
                            {['SUPER_ADMIN', 'ADMIN'].includes(useAuthStore.getState().user?.role_code || '') && (
                                <Button
                                    variant={employee.users.status_code === 'ACTIVE' ? "destructive" : "default"}
                                    className={employee.users.status_code === 'ACTIVE' ? "" : "bg-green-600 hover:bg-green-700"}
                                    onClick={() => setStatusConfirm({ status: employee.users.status_code })}
                                >
                                    {employee.users.status_code === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-neutral-500">Employee not found.</div>
                )}
            </SheetContent>
            
            {employee && statusConfirm && (
                <ConfirmStatusDialog
                    open={!!statusConfirm}
                    onOpenChange={(open) => !open && setStatusConfirm(null)}
                    currentStatus={statusConfirm.status}
                    onConfirm={async () => {
                        try {
                            if (employeeId) {
                                await userService.updateStatus(employeeId, statusConfirm.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                                toast({ title: "Success", description: "User status updated successfully." });
                                onUpdateSuccess(); 
                                fetchEmployeeDetails(employeeId); // Also refresh local sheet data to show new status!
                            }
                        } catch (error) {
                            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                        } finally {
                            setStatusConfirm(null);
                        }
                    }}
                />
            )}
        </Sheet>
    );
}
