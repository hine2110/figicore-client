import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Trash2, Plus, Loader2, Save, CheckCircle } from "lucide-react";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";

const userSchema = z.object({
  full_name: z.string().min(1, "Full Name is required"),
  phone: z.string().min(10, "Phone invalid").regex(/^0[0-9]*$/, "Start with 0"),
  role_code: z.enum(["MANAGER", "STAFF_POS", "STAFF_INVENTORY"]),
  base_salary: z.coerce.number().positive("Must be > 0"),
  // Email and Code are not input by user
});

const bulkCreateSchema = z.object({
  users: z.array(userSchema).min(1, "Add at least one user"),
});

type BulkCreateFormValues = z.infer<typeof bulkCreateSchema>;

interface BulkCreateUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function BulkCreateUserSheet({
  open,
  onOpenChange,
  onSuccess,
}: BulkCreateUserSheetProps) {
  const { toast } = useToast();
  const [createdUsers, setCreatedUsers] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BulkCreateFormValues>({
    resolver: zodResolver(bulkCreateSchema) as any,
    defaultValues: {
      users: [
        { full_name: "", phone: "", role_code: undefined, base_salary: 5000000 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "users",
  });

  const onSubmit = async (data: BulkCreateFormValues) => {
    try {
      // Map data to match Backend DTO (Inject dummy email/job_title)
      const payload = {
        users: data.users.map((u) => ({
            ...u,
            email: undefined, 
            employee_code: undefined,
            job_title_code: u.role_code,
            start_date: new Date(),
            base_salary: Number(u.base_salary)
        })),
      };

      console.log("Sending Payload:", JSON.stringify(payload, null, 2)); // Debug Log
      const result = await userService.createBulk(payload);
      
      setCreatedUsers(result);
      setShowResult(true);
      toast({
        title: "Success",
        description: `Successfully created ${data.users.length} employees.`,
      });
      onSuccess();
    } catch (error: any) {
        console.error("Submit Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create employees. Check console for details.",
      });
    }
  };

  const handleClose = () => {
      setShowResult(false);
      setCreatedUsers([]);
      reset();
      onOpenChange(false);
  }

  // Effect to reset state when sheet is closed externally
  useEffect(() => {
    if (!open) {
        setShowResult(false);
        setCreatedUsers([]);
        reset();
    }
  }, [open, reset]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[900px] w-full sm:w-[80vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{showResult ? "Creation Successful" : "Add New Employee(s)"}</SheetTitle>
          <SheetDescription>
            {showResult 
                ? "The following accounts have been successfully created." 
                : "Add one or more employees. Emails and Codes will be auto-generated."}
          </SheetDescription>
        </SheetHeader>

        {showResult ? (
            <div className="mt-6 space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-100 mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                    <h3 className="text-lg font-semibold text-green-700">All Employees Added!</h3>
                    <p className="text-green-600">You can now share the credentials below.</p>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Employee Code</TableHead>
                                <TableHead>Email (Login)</TableHead>
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {createdUsers.map((user: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.employee_details?.employee_code || "N/A"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-blue-600">{user.email}</TableCell>
                                    <TableCell>{user.role_code}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleClose} className="bg-neutral-900">
                        Close & Refresh
                    </Button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Base Salary (VND)</TableHead>
                    <TableHead>Auto-Gen Info</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((field, index) => (
                    <TableRow key={field.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                        <Input
                            {...register(`users.${index}.full_name`)}
                            placeholder="Name"
                            className={errors.users?.[index]?.full_name ? "border-red-500" : ""}
                        />
                        </TableCell>
                        <TableCell>
                        <Input
                            {...register(`users.${index}.phone`)}
                            placeholder="09..."
                            className={errors.users?.[index]?.phone ? "border-red-500" : ""}
                        />
                        </TableCell>
                        <TableCell>
                        <Select 
                                onValueChange={(val) => setValue(`users.${index}.role_code`, val as any)} 
                                defaultValue={field.role_code}
                            >
                                <SelectTrigger className={errors.users?.[index]?.role_code ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="STAFF_POS">POS Staff</SelectItem>
                                    <SelectItem value="STAFF_INVENTORY">Inventory Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Input
                                type="number"
                                {...register(`users.${index}.base_salary`)}
                                className={errors.users?.[index]?.base_salary ? "border-red-500" : ""}
                            />
                        </TableCell>
                        <TableCell>
                            <span className="text-xs text-neutral-500 italic">System will generate Email & Code</span>
                        </TableCell>
                        <TableCell>
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>

            {errors.users?.root && (
                <p className="text-red-500 text-sm">{errors.users.root.message}</p>
            )}

            <div className="flex justify-between items-center">
                <Button
                type="button"
                variant="outline"
                onClick={() => append({ full_name: "", phone: "", role_code: undefined as any, base_salary: 5000000 })}
                >
                <Plus className="w-4 h-4 mr-2" />
                Add Row
                </Button>

                <Button type="submit" disabled={isSubmitting || fields.length === 0} className="bg-neutral-900">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Employee(s)
                </Button>
            </div>
            </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
