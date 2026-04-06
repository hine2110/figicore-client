import { useEffect, useState, useRef } from "react";
import { Loader2, Camera } from "lucide-react";
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

export default function ProfilePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);

    // OTP States
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [isOtpVerifying, setIsOtpVerifying] = useState(false);
    const [pendingValues, setPendingValues] = useState<z.infer<typeof personalSchema> | null>(null);

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

    const onSubmit = async (values: z.infer<typeof personalSchema>) => {
        const isPhoneChanged = values.phone && values.phone !== (profile.phone || "");
        
        // Only send fields that have actually changed
        const changes: any = {};
        if (values.full_name !== profile.full_name) changes.full_name = values.full_name;
        if (isPhoneChanged) changes.phone = values.phone;
        if (values.address !== (profile.addresses?.find((a: any) => a.is_default)?.detail_address || "")) {
            changes.address = values.address;
        }

        if (isPhoneChanged) {
            // Sensitivity Update: Requires OTP
            setPendingValues(values);
            setLoading(true);
            try {
                await userService.requestUpdateOtp();
                setIsOtpOpen(true);
                toast({
                    title: "Authentication Required",
                    description: "An OTP has been sent to your email to verify this change.",
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.response?.data?.message || "Failed to send OTP",
                });
            } finally {
                setLoading(false);
            }
        } else {
            if (Object.keys(changes).length === 0) {
                toast({ title: "No changes", description: "Your profile is already up to date." });
                return;
            }

            // Basic Info Update: No OTP required
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
        }
    };

    const handleVerifyOtpAndSubmit = async () => {
        if (!pendingValues || !otpValue) return;
        setIsOtpVerifying(true);
        try {
            await userService.requestProfileUpdate({
                changes: {
                    full_name: pendingValues.full_name,
                    phone: pendingValues.phone,
                    address: pendingValues.address,
                },
                otp: otpValue
            });
            
            setIsOtpOpen(false);
            setOtpValue("");
            toast({
                title: "Request Submitted",
                description: "Your profile update request has been sent for Admin approval.",
            });
            
            // Refresh profile to show pending status
            fetchProfile();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: error.response?.data?.message || "Invalid or expired OTP",
            });
        } finally {
            setIsOtpVerifying(false);
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
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="personal">Personal Info</TabsTrigger>
                            <TabsTrigger value="work">Work Details</TabsTrigger>
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

                                    <AlertDialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
                                        <AlertDialogContent className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 max-w-md">
                                            <AlertDialogHeader>
                                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 mx-auto">
                                                    <Shield className="w-8 h-8" />
                                                </div>
                                                <AlertDialogTitle className="text-2xl font-bold text-center text-slate-800">Verify Identity</AlertDialogTitle>
                                                <AlertDialogDescription className="text-center text-slate-500 mt-2">
                                                    We've sent a 6-digit code to your email. Enter it below to confirm your profile update request.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>

                                            <div className="py-8 space-y-4">
                                                <Input
                                                    value={otpValue}
                                                    onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                                                    placeholder="000000"
                                                    className="text-center text-3xl font-mono tracking-[0.5em] h-16 rounded-2xl border-2 border-slate-100 focus:border-blue-400 bg-white/50"
                                                    maxLength={6}
                                                />
                                            </div>

                                            <AlertDialogFooter className="flex gap-3 mt-4 sm:justify-center">
                                                <AlertDialogCancel className="rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 min-w-[120px]">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <Button
                                                    onClick={handleVerifyOtpAndSubmit}
                                                    disabled={otpValue.length !== 6 || isOtpVerifying}
                                                    className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800 min-w-[140px] shadow-lg shadow-slate-200"
                                                >
                                                    {isOtpVerifying ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Verifying
                                                        </>
                                                    ) : (
                                                        "Confirm"
                                                    )}
                                                </Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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

                        {/* Tab 3: Security */}
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
        </div>
    );
}
