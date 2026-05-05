import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Briefcase, DollarSign, Calendar, Shield, Hash, ChevronLeft, ChevronRight, Wallet, QrCode } from "lucide-react";
import { Employee, employeesService } from "@/services/employees.service";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface EmployeeDetailSheetProps {
    employeeId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateSuccess?: () => void;
}

export default function EmployeeDetailSheet({ employeeId, open, onOpenChange }: EmployeeDetailSheetProps) {
    const { toast } = useToast();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [viewPage, setViewPage] = useState<0 | 1>(0); // 0: Personal, 1: Bank

    useEffect(() => {
        if (open && employeeId) {
            setViewPage(0); // Reset page to General Info
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

                        {/* PAGINATION NAVIGATION (LEFT / RIGHT) */}
                        <div className="flex items-center justify-between bg-slate-100/70 border border-slate-200 p-1.5 rounded-xl mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewPage(0)}
                                disabled={viewPage === 0}
                                className={`h-8 ${viewPage === 0 ? "opacity-30" : "hover:bg-white hover:shadow-sm"}`}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                            </Button>

                            <span className="font-semibold text-sm text-slate-700 flex items-center gap-2 transition-all">
                                {viewPage === 0 ? "General Info" : <><Wallet className="w-4 h-4 text-indigo-600" /> Salary Account</>}
                            </span>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewPage(1)}
                                disabled={viewPage === 1}
                                className={`h-8 ${viewPage === 1 ? "opacity-30" : "hover:bg-white hover:shadow-sm"}`}
                            >
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        {/* NỘI DUNG TRANG CHÍNH */}
                        <div className="relative min-h-[300px]">

                            {/* TRANG 0: THÔNG TIN CHUNG */}
                            {viewPage === 0 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
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

                                        {(employee.users as any).addresses && (employee.users as any).addresses.length > 0 && (
                                            <div className="p-4 flex items-start gap-4 hover:bg-neutral-50/50 transition-colors">
                                                <div className="w-5 h-5 flex items-center justify-center pt-0.5">
                                                    <Briefcase className="w-4 h-4 text-neutral-400" />
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
                                </div>
                            )}

                            {/* TRANG 1: THÔNG TIN NGÂN HÀNG */}
                            {viewPage === 1 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
                                        {(employee as any).bank_qr_code_url ? (
                                            <div className="mb-6 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                <img src={(employee as any).bank_qr_code_url} alt="QR Code" className="w-44 h-44 object-contain" />
                                            </div>
                                        ) : (
                                            <div className="mb-6 w-44 h-44 bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-lg">
                                                <QrCode className="w-10 h-10 mb-2 opacity-50" />
                                                <span className="text-sm">No QR Code</span>
                                            </div>
                                        )}

                                        <div className="w-full space-y-3 text-sm">
                                            <div className="flex justify-between border-b border-slate-200 pb-3">
                                                <span className="text-slate-500">Bank:</span>
                                                <span className="font-semibold text-slate-900">{(employee as any).bank_name || <span className="text-red-500 italic font-normal">Not updated</span>}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-200 pb-3">
                                                <span className="text-slate-500">Account Holder:</span>
                                                <span className="font-semibold text-slate-900 uppercase">{(employee as any).bank_account_name || <span className="text-red-500 italic font-normal">Not updated</span>}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Account Number:</span>
                                                <span className="font-semibold font-mono text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md text-base">{(employee as any).bank_account_no || <span className="text-red-500 italic font-normal text-sm">Not updated</span>}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-neutral-500">Employee not found.</div>
                )}
            </SheetContent>
        </Sheet>
    );
}