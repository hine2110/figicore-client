import { useEffect, useState, useRef } from "react";
import { Loader2, Camera, Wallet, QrCode, Upload, History } from "lucide-react";
import { useForm } from "react-hook-form";
import { AvatarUploader } from "@/components/AvatarUploader";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';


// Schema for Personal Information
const personalSchema = z.object({
    full_name: z.string().min(2, "Name is required"),
    phone: z.string().regex(/^0\d{9}$/, "Phone must be 10 digits starting with 0"),
    address: z.string().optional(),
    avatar_url: z.string().url("Invalid URL").optional().or(z.literal('')),
});

const passwordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// Schema for Bank Information (No admin approval needed)
const bankSchema = z.object({
    bank_name: z.string().optional(),
    bank_account_no: z.string().optional(),
    bank_account_name: z.string().optional(),
    bank_qr_code_url: z.string().optional(),
});

export default function ProfilePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const qrFileInputRef = useRef<HTMLInputElement>(null);
    const [qrUploading, setQrUploading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // State cho Lịch sử lương
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchSalaryHistory = async () => {
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            // ProfilePage đang dùng đối tượng `api` được import sẵn
            const res = await api.get('/payroll/my-history');
            setSalaryHistory(res.data || []);
        } catch (error) {
            toast({ title: "Lỗi", description: "Error to load", variant: "destructive" });
        } finally {
            setHistoryLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const form = useForm<z.infer<typeof personalSchema>>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            full_name: "",
            phone: "",
            address: "",
            avatar_url: "",
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const bankForm = useForm<z.infer<typeof bankSchema>>({
        resolver: zodResolver(bankSchema),
        defaultValues: { bank_name: "", bank_account_no: "", bank_account_name: "", bank_qr_code_url: "" },
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const data: any = await userService.getProfile();
            setProfile(data);

            // Set form values
            const defaultAddress = data.addresses?.find((a: any) => a.is_default)?.detail_address || "";
            form.reset({
                full_name: data.full_name,
                phone: data.phone || "",
                address: defaultAddress,
                avatar_url: data.avatar_url || "",
            });

            // Set form values for Bank Info
            bankForm.reset({
                bank_name: data.bank_name || "",
                bank_account_no: data.bank_account_no || "",
                bank_account_name: data.bank_account_name || "",
                bank_qr_code_url: data.bank_qr_code_url || "",
            });
        } catch (error) {
            console.error("Failed to load profile", error);
            setError("Failed to load profile. Please try again.");
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load profile",
            });
        } finally {
            setLoading(false);
        }
    };



    const handleAvatarSelect = async (file: File) => {
        setUploading(true);
        try {
            const { url } = await userService.uploadAvatar(file);
            toast({ title: "Success", description: "Avatar uploaded successfully" });

            // Optimistic Update
            setProfile((prev: any) => ({ ...prev, avatar_url: url }));
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to upload avatar"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleQrFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({ variant: "destructive", title: "Error", description: "Chỉ cho phép định dạng ảnh" });
            return;
        }

        setQrUploading(true);
        try {
            // SỬ DỤNG API UPLOAD CHUNG CỦA HỆ THỐNG
            // LƯU Ý: Thay '/upload' bằng API upload ảnh thật của bạn (trả về { url: '...' })
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Lấy url từ response và set thẳng vào Form Ngân hàng
            const uploadedUrl = res.data.url || res.data.secure_url;
            bankForm.setValue('bank_qr_code_url', uploadedUrl);
            toast({ title: "Success", description: "Đã tải ảnh QR lên thành công" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: "Lỗi tải ảnh lên" });
        } finally {
            setQrUploading(false);
            if (qrFileInputRef.current) qrFileInputRef.current.value = "";
        }
    };

    const onSubmit = async (values: z.infer<typeof personalSchema>) => {
        const isPhoneChanged = values.phone && values.phone !== (profile.phone || "");

        // Only send fields that have actually changed
        const changes: any = {};
        if (values.full_name !== profile.full_name) changes.full_name = values.full_name;
        if (isPhoneChanged) changes.phone = values.phone;
        if (values.address !== (profile.addresses?.find((a: any) => a.is_default)?.detail_address || "")) {
            changes.address = values.address;
        }

        if (Object.keys(changes).length === 0) {
            toast({ title: "No changes", description: "Your profile is already up to date." });
            return;
        }

        // Send profile update request (No OTP required for staff)
        setLoading(true);
        try {
            await userService.requestProfileUpdate({
                changes,
                otp: ""
            });

            toast({
                title: "Request Submitted",
                description: "Your profile update request has been sent for Admin approval.",
            });

            fetchProfile();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to submit request",
            });
        } finally {
            setLoading(false);
        }
    };

    const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
        try {
            await api.post("/auth/update-password", {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            toast({
                title: "Success",
                description: "Password updated successfully",
            });
            passwordForm.reset();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to update password",
            });
        }
    };

    const onBankSubmit = async (values: z.infer<typeof bankSchema>) => {
        try {
            const payload = {
                ...values,
                bank_account_name: values.bank_account_name?.toUpperCase()
            };
            await api.patch("/users/profile/bank-info", payload);
            toast({ title: "Success", description: "Cập nhật thông tin nhận lương thành công." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Lỗi cập nhật ngân hàng" });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-full gap-4">
                <p className="text-red-500">{error}</p>
                <Button onClick={fetchProfile}>Retry</Button>
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8 text-center">Loading profile...</div>;
    }

    const employeeInfo = profile.employees;

    // Define roles that cannot change their profile picture
    const restrictedRoles = ['MANAGER', 'STAFF_POS', 'STAFF_INVENTORY'];
    const isUploadDisabled = restrictedRoles.includes(profile.role_code);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Summary */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="text-center">
                        <div className="flex flex-col items-center mb-4 relative group">
                            <AvatarUploader
                                currentAvatarUrl={profile?.avatar_url}
                                defaultFallback={profile?.full_name?.charAt(0)}
                                onFileSelect={handleAvatarSelect}
                                disableUpload={isUploadDisabled}
                            />
                            {uploading && (
                                <p className="text-xs text-muted-foreground mt-2 animate-pulse flex flex-row items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Uploading image to server...
                                </p>
                            )}
                        </div>

                        <CardTitle>{profile.full_name}</CardTitle>
                        <CardDescription>{profile.email}</CardDescription>
                        {/* ... rest of the component */}
                        <div className="mt-2">
                            <Badge variant={profile.role_code === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
                                {profile.role_code}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {employeeInfo && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Employee ID</span>
                                    <span className="font-medium">{employeeInfo.employee_code}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Joined</span>
                                    <span className="font-medium">{new Date(employeeInfo.start_date || profile.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Tabs */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className={`grid w-full ${employeeInfo ? 'grid-cols-4' : 'grid-cols-3'}`}>
                            <TabsTrigger value="personal">Personal Info</TabsTrigger>
                            <TabsTrigger value="work">Work Details</TabsTrigger>
                            {employeeInfo && <TabsTrigger value="bank">Bank & Payroll</TabsTrigger>}
                            <TabsTrigger value="security">Security</TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Personal Info */}
                        <TabsContent value="personal">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your contact details here.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            {profile.has_pending_request && (
                                                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md flex items-center gap-2 text-sm">
                                                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                                    <span>You have a pending profile update request waiting for approval.</span>
                                                </div>
                                            )}
                                            <FormField
                                                control={form.control}
                                                name="full_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} disabled={profile.has_pending_request} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="0901234567" {...field} disabled={profile.has_pending_request} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Default Address</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="123 Street, Dist 1, HCMC" {...field} disabled={profile.has_pending_request} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {/* Avatar URL is now handled by file upload */}
                                            <input type="hidden" {...form.register('avatar_url')} />
                                            <Button type="submit" disabled={form.formState.isSubmitting || profile.has_pending_request}>
                                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {profile.has_pending_request ? "Waiting for Approval" : "Save Changes"}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab 2: Work Details */}
                        <TabsContent value="work">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Work Information</CardTitle>
                                    <CardDescription>View your employment details (Read-Only).</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Employee Code</label>
                                            <Input value={employeeInfo?.employee_code || "N/A"} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Job Title</label>
                                            <Input value={employeeInfo?.job_title_code || "N/A"} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Base Salary</label>
                                            <Input value={employeeInfo?.base_salary ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(employeeInfo.base_salary) : "N/A"} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Contract Start Date</label>
                                            <Input value={employeeInfo?.start_date ? new Date(employeeInfo.start_date).toLocaleDateString() : "N/A"} disabled />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab 3: Bank Details (Tự động duyệt) */}
                        {employeeInfo && (
                            <TabsContent value="bank">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-600" /> Bank Information</CardTitle>
                                        <CardDescription>Update your bank details for payroll. These changes are saved instantly.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Form {...bankForm}>
                                            <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={bankForm.control} name="bank_name" render={({ field }) => (
                                                        <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="VD: Vietcombank, MBBank..." {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={bankForm.control} name="bank_account_no" render={({ field }) => (
                                                        <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="Số tài khoản..." className="font-mono" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                                <FormField control={bankForm.control} name="bank_account_name" render={({ field }) => (
                                                    <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input placeholder="Tên in hoa không dấu (VD: NGUYEN VAN A)" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={bankForm.control} name="bank_qr_code_url" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2"><QrCode className="w-4 h-4" /> Ảnh Mã QR Nhận Lương</FormLabel>
                                                        <FormControl>
                                                            <div className="flex flex-col gap-3">
                                                                <input type="file" ref={qrFileInputRef} className="hidden" accept="image/*" onChange={handleQrFileChange} />

                                                                <div className="flex items-center gap-4">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => qrFileInputRef.current?.click()}
                                                                        disabled={qrUploading}
                                                                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                                    >
                                                                        {qrUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                                                        {field.value ? "Thay đổi ảnh QR" : "Tải ảnh QR lên"}
                                                                    </Button>
                                                                    {field.value && (
                                                                        <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => bankForm.setValue('bank_qr_code_url', '')}>
                                                                            Xóa ảnh
                                                                        </Button>
                                                                    )}
                                                                </div>

                                                                {field.value && (
                                                                    <div className="p-3 border border-dashed border-indigo-200 rounded-lg bg-slate-50 w-fit relative group">
                                                                        <img src={field.value} alt="QR Preview" className="max-h-40 object-contain rounded shadow-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <Button type="submit" disabled={bankForm.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                    {bankForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Bank Details
                                                </Button>
                                                
                                            </form>
                                            
                                        </Form>

                                        {/* THÊM MỚI TẠI ĐÂY: Khu vực nút mở lịch sử lương */}
                                        <div className="mt-8 pt-6 border-t border-slate-100">
                                            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">History update salary</h4>
                                                    <p className="text-sm text-slate-500">Xem lộ trình thăng tiến và thay đổi mức lương cơ bản của bạn.</p>
                                                </div>
                                                <Button type="button" variant="outline" className="mt-3 sm:mt-0 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={fetchSalaryHistory}>
                                                    <History className="w-4 h-4 mr-2" /> View
                                                </Button>
                                            </div>
                                        </div>
                                        
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {/* Tab 4: Security */}
                        <TabsContent value="security">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>Manage your password and security questions.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...passwordForm}>
                                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                            <FormField
                                                control={passwordForm.control}
                                                name="oldPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Old Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="••••••••" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={passwordForm.control}
                                                name="newPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>New Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="Min. 8 chars, 1 Upper, 1 Number, 1 Special" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={passwordForm.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Confirm Password</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" placeholder="Re-enter new password" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                                {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Update Password
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Modal Lịch sử thay đổi lương tái sử dụng từ Manager */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Salary Change History</DialogTitle>
                        
                    </DialogHeader>

                    <div className="py-2">
                        {historyLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
                        ) : salaryHistory.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-lg border border-dashed">
                                Bạn chưa có bản ghi thay đổi lương nào.
                            </div>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {salaryHistory.map((item, index) => {
                                    // Xác định đơn vị lương dựa vào role_code
                                    const isFixedSalary = ['MANAGER', 'SUPER_ADMIN'].includes(profile?.role_code);
                                    
                                    return (
                                        <div key={item.history_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                <History className="w-4 h-4" />
                                            </div>
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border shadow-sm">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className="font-bold text-slate-900 text-sm">
                                                        {formatCurrency(item.new_salary)}
                                                        <span className="text-xs font-normal text-slate-500 ml-1">
                                                            {isFixedSalary ? '/tháng' : '/h'}
                                                        </span>
                                                    </div>
                                                    <time className="text-xs font-medium text-amber-600">
                                                        {new Date(item.effective_date).toLocaleDateString('vi-VN')}
                                                    </time>
                                                </div>
                                                <div className="text-xs text-slate-500 mb-2">
                                                    Old salary: {formatCurrency(item.old_salary)}
                                                    <span className="ml-1">
                                                        {isFixedSalary ? '/tháng' : '/h'}
                                                    </span>
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
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
