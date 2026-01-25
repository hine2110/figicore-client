import { useState, useEffect } from "react";
import { UserPlus, MoreHorizontal, Mail, Shield, Loader2, Search } from "lucide-react";
import { employeesService, Employee } from "@/services/employees.service";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const createEmployeeSchema = z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(15, "Phone number must be at most 15 characters"),
    full_name: z.string().min(1, "Full name is required"),
    role_code: z.enum(["MANAGER", "STAFF_POS", "STAFF_INVENTORY"] as const, {
        errorMap: () => ({ message: "Please select a valid role" }),
    }),

    job_title_code: z.string().min(1, "Job title code is required"),
    base_salary: z.coerce.number().positive("Base salary must be positive"),
    start_date: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
});

type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;

export default function EmployeeManagement() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const res = await employeesService.getEmployees({ page, limit: 10, search });
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
    }, [page, search]);
    
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateEmployeeFormValues>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
            role_code: undefined,
        },
    });

    const onSubmit = async (data: CreateEmployeeFormValues) => {
        try {
            await employeesService.createEmployee(data);
            toast({
                title: "Success",
                description: "Employee created successfully.",
            });
            setOpen(false);
            reset();
            fetchEmployees();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to create employee.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Employee Management</h1>
                    <p className="text-neutral-500">Manage staff access and roles.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-neutral-900">
                            <UserPlus className="w-4 h-4 mr-2" /> Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Create a new account for a staff member.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input id="full_name" placeholder="John Doe" {...register("full_name")} />
                                    {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="john@company.com" {...register("email")} />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" placeholder="0123456789" {...register("phone")} />
                                    {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role_code">Role</Label>
                                    <Select onValueChange={(val) => setValue("role_code", val as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                            <SelectItem value="STAFF_POS">POS Staff</SelectItem>
                                            <SelectItem value="STAFF_INVENTORY">Inventory Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role_code && <p className="text-sm text-red-500">{errors.role_code.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="base_salary">Base Salary</Label>
                                    <Input id="base_salary" type="number" placeholder="5000" {...register("base_salary")} />
                                    {errors.base_salary && <p className="text-sm text-red-500">{errors.base_salary.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="job_title_code">Job Title Code</Label>
                                    <Input id="job_title_code" placeholder="Software Engineer" {...register("job_title_code")} />
                                    {errors.job_title_code && <p className="text-sm text-red-500">{errors.job_title_code.message}</p>}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Account
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input 
                            placeholder="Search employees..." 
                            className="pl-9 bg-white" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                            <TableHead>Employee</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Contact</TableHead>
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
                                <TableRow key={employee.employee_code}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-neutral-100 text-neutral-600">
                                                    {employee.users.full_name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-neutral-900">{employee.users.full_name}</p>
                                                <p className="text-xs text-neutral-500">{employee.employee_code}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-neutral-400" />
                                            <span>{employee.users.role_code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-neutral-600 space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-neutral-400" />
                                                {employee.users.email}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`
                                            ${employee.users.status_code === 'ACTIVE' ? 'text-green-700 bg-green-50 border-green-200' :
                                                employee.users.status_code === 'INACTIVE' ? 'text-red-700 bg-red-50 border-red-200' :
                                                    'text-amber-700 bg-amber-50 border-amber-200'}
                                        `}>
                                            {employee.users.status_code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">Deactivate User</DropdownMenuItem>
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
        </div>
    );
}
