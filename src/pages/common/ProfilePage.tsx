import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
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

// Schema for Personal Information
const personalSchema = z.object({
    full_name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Phone is required"),
    address: z.string().optional(),
    avatar_url: z.string().url("Invalid URL").optional().or(z.literal('')),
});

export default function ProfilePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof personalSchema>>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            full_name: "",
            phone: "",
            address: "",
            avatar_url: "",
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



    const onSubmit = async (values: z.infer<typeof personalSchema>) => {
        try {
            await userService.requestProfileUpdate({
                full_name: values.full_name,
                phone: values.phone,
                address: values.address,
                avatar_url: values.avatar_url,
            });
            toast({
                title: "Success",
                description: "Yêu cầu cập nhật đã được gửi đi chờ duyệt",
            });
            // Do not update local state immediately as it needs approval
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to update profile",
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

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Summary */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="text-4xl">{profile?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
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
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">New Password</label>
                                            <Input type="password" placeholder="••••••••" disabled />
                                            <p className="text-xs text-muted-foreground">Change password feature is coming soon.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Confirm Password</label>
                                            <Input type="password" placeholder="••••••••" disabled />
                                        </div>
                                       <Button disabled>Update Password</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
