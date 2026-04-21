
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Shield, Bell, Loader2, Trash2, Crown, Package, TicketPercent, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import MembershipTab from '@/components/customer/MembershipTab'; // New Import
import MyOrdersTab from '@/components/customer/MyOrdersTab'; // New Import
import MyVouchersTab from '@/components/customer/MyVouchersTab'; // New Import
import AddressDialog from '@/components/customer/AddressDialog';
import { addressService, Address } from '@/services/address.service';
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
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

const profileSchema = z.object({
    full_name: z.string()
        .min(2, "Full name must be at least 2 characters")
        .regex(/^[\p{L}\s]+$/u, "Name cannot contain special characters or numbers"),
    phone: z.string().regex(/^0\d{9}$/, "Phone must be 10 digits starting with 0"),
    dob: z.date().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Rank Config from Seed Data
const RANK_CONFIG: Record<string, { label: string; className: string }> = {
    'BRONZE': { label: 'Bronze Member', className: 'bg-orange-200 text-orange-900 border-orange-400' },
    'SILVER': { label: 'Silver Member', className: 'bg-gray-100 text-gray-700' },
    'GOLD': { label: 'Gold Member', className: 'bg-yellow-200 text-yellow-900 border-yellow-500' },
    'DIAMOND': { label: 'Diamond Member', className: 'bg-cyan-100 text-cyan-700' },
};

export default function CustomerProfile() {
    const { toast } = useToast();
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'membership' | 'vouchers'>('profile');

    // Add Query Param Support
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['profile', 'orders', 'membership', 'vouchers'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [location.search]);

    // Update URL when tab changes (Optional but good UX)
    const handleTabChange = (tab: string) => {
        setActiveTab(tab as any);
        navigate(`/customer/profile?tab=${tab}`, { replace: true });
    };

    // Address State
    const [isAddressOpen, setIsAddressOpen] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: user?.full_name || '',
            phone: user?.phone || '',
            dob: user?.dob ? new Date(user.dob) : null,
        },
    });

    // DOB Select Helpers
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const currentDob = form.watch('dob');
    const selectedYear = currentDob ? currentDob.getFullYear() : new Date().getFullYear();
    const selectedMonth = currentDob ? currentDob.getMonth() : 0;
    const selectedDay = currentDob ? currentDob.getDate() : 1;

    const days = Array.from(
        { length: getDaysInMonth(selectedYear, selectedMonth) },
        (_, i) => i + 1
    );

    const handleDobChange = (type: 'day' | 'month' | 'year', value: string) => {
        const date = currentDob ? new Date(currentDob) : new Date();
        if (type === 'day') date.setDate(parseInt(value));
        if (type === 'month') {
            const newMonth = parseInt(value);
            const maxDays = getDaysInMonth(date.getFullYear(), newMonth);
            if (date.getDate() > maxDays) date.setDate(maxDays);
            date.setMonth(newMonth);
        }
        if (type === 'year') {
            const newYear = parseInt(value);
            const maxDays = getDaysInMonth(newYear, date.getMonth());
            if (date.getDate() > maxDays) date.setDate(maxDays);
            date.setFullYear(newYear);
        }
        form.setValue('dob', date, { shouldDirty: true });
    };

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // OTP States
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [isOtpVerifying, setIsOtpVerifying] = useState(false);

    const hasChanges = user && (
        form.watch('full_name') !== (user.full_name || '') ||
        form.watch('phone') !== (user.phone || '') ||
        (form.watch('dob') ? new Date(form.watch('dob')!).getTime() : null) !== (user.dob ? new Date(user.dob).getTime() : null)
    );

    // Address Handlers
    const handleEditAddress = (addr: Address) => {
        setAddressToEdit(addr);
        setIsAddressOpen(true);
    };

    const handleCreateAddress = () => {
        setAddressToEdit(null);
        setIsAddressOpen(true);
    };

    const requestDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await addressService.deleteAddress(deleteId);
            toast({
                title: "Action Successful",
                description: "The address has been successfully removed from your list.",
            });
            fetchAddresses();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Something went wrong",
                description: error.response?.data?.message || "This address could not be deleted.",
            });
        } finally {
            setDeleteId(null);
        }
    };

    // Fetch Addresses
    const fetchAddresses = async () => {
        try {
            const res = await addressService.getMyAddresses();
            // Handle both wrapped and unwrapped responses
            // NestJS controller usually returns array directly unless interceptor wraps it
            const data = Array.isArray(res) ? res : (res as any).data;
            if (Array.isArray(data)) {
                setAddresses(data);
            }
        } catch (error) {
            console.error('Failed to load addresses', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'profile') {
            fetchAddresses();
        }
    }, [activeTab]);

    // Sync form with user data when it loads
    useEffect(() => {
        if (user) {
            form.reset({
                full_name: user.full_name || '',
                phone: user.phone || '',
                dob: user.dob ? new Date(user.dob) : null,
            });
        }
    }, [user, form]);

    // Fetch latest profile on mount to ensure fresh data (fixes stale data on refresh)
    useEffect(() => {
        const fetchLatestProfile = async () => {
            try {
                const latestUser = await authService.getCurrentUser();
                setUser(latestUser as any);
            } catch (error) {
                console.error("Failed to load freshly profile", error);
            }
        };
        fetchLatestProfile();
    }, [setUser]);

    const handleSaveProfile = async (values: ProfileFormValues) => {
        if (!hasChanges) return;

        // Check if sensitive field (phone) is changing
        const isPhoneChanging = values.phone !== (user?.phone || '');

        if (isPhoneChanging) {
            setIsLoading(true);
            try {
                await userService.requestUpdateOtp();
                setIsOtpOpen(true);
                toast({
                    title: "OTP Sent",
                    description: "Please check your email for the verification code.",
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Failed to send OTP",
                    description: error.response?.data?.message || "Something went wrong.",
                });
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Only full_name/dob changed or other non-sensitive fields
        setIsLoading(true);
        setMessage(null);
        try {
            await authService.updateProfile({
                full_name: values.full_name,
                dob: values.dob ? values.dob.toISOString().split('T')[0] : undefined
            });

            // Update local store with new data
            const updatedUser = { ...user, ...values };
            setUser(updatedUser as any);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved.",
                duration: 5000,
            });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtpAndSave = async () => {
        if (!otpValue) return;
        setIsOtpVerifying(true);
        const values = form.getValues();
        try {
            await userService.requestProfileUpdate({
                changes: {
                    full_name: values.full_name,
                    phone: values.phone,
                    dob: values.dob ? values.dob.toISOString().split('T')[0] : undefined
                },
                otp: otpValue
            });

            // Success: Update store & UI
            const updatedUser = {
                ...user,
                full_name: values.full_name,
                phone: values.phone,
                dob: values.dob ? values.dob.toISOString().split('T')[0] : user?.dob
            };
            setUser(updatedUser as any);
            setIsOtpOpen(false);
            setOtpValue('');
            setMessage({ type: 'success', text: 'Profile updated successfully with OTP!' });
            toast({
                title: "Changes Saved",
                description: "Your phone number has been updated successfully.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: error.response?.data?.message || "Invalid OTP code.",
            });
        } finally {
            setIsOtpVerifying(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check (e.g., 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Avatar image must be less than 2MB.",
            });
            // Reset input so same file can be selected again
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            const res = await userService.uploadAvatar(file);
            const userResponse = res.data || res; // Handle both wrapped and unwrapped API responses

            if (userResponse?.avatar_url) {
                // Add a timestamp query param to completely bypass the browser's image cache.
                // This guarantees the UI updates instantly without requiring an F5 refresh.
                const newUrl = `${userResponse.avatar_url.split('?')[0]}?t=${Date.now()}`;
                const updatedUser = { ...user, avatar_url: newUrl };
                setUser(updatedUser as any);
                toast({
                    title: "Avatar Updated",
                    description: "Your profile picture has been changed.",
                });
            } else {
                toast({
                    title: "Avatar Uploaded",
                    description: "Please refresh the page to see changes (F5).",
                });
            }
        } catch (error: any) {
            console.error("Avatar upload failed", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.response?.data?.message || "Could not upload avatar.",
            });
        } finally {
            setIsUploading(false);
            // Reset file input value so that the user can upload the same file again if they want
            e.target.value = '';
        }
    };

    return (
        <CustomerLayout activePage="profile">
            <div className="bg-neutral-50 min-h-screen py-8">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-light text-neutral-900">My Profile</h1>
                        <p className="text-neutral-500">Manage your account settings and preferences.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="p-4 border-neutral-200">
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleTabChange('profile')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <User className="w-4 h-4" />
                                        Personal Info
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('membership')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'membership'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Crown className="w-4 h-4" />
                                        Membership
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('orders')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Package className="w-4 h-4" />
                                        My Orders
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('vouchers')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'vouchers'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <TicketPercent className="w-4 h-4" />
                                        My Vouchers
                                    </button>
                                </div>
                            </Card>
                        </div>

                        {/* Content */}
                        <div className="lg:col-span-3">
                            <Card className="p-8 border-neutral-200 min-h-[500px]">
                                {activeTab === 'profile' && (
                                    <div className="space-y-8 animate-in fade-in duration-300">

                                        {/* Avatar Section */}
                                        <div className="flex items-center gap-6 mb-8">
                                            <div className="relative group">
                                                <Avatar className="w-20 h-20 border-2 border-white shadow-sm">
                                                    <AvatarImage src={user?.avatar_url || ""} />
                                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-medium">
                                                        {user?.full_name?.charAt(0) || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-medium text-neutral-900">{user?.full_name || "User"}</h2>
                                                <p className="text-neutral-500 capitalize">{user?.role_code?.replace('_', ' ').toLowerCase() || "Customer"}</p>

                                                {/* Dynamic Rank Badge */}
                                                {(() => {
                                                    const rankCode = (user as any)?.current_rank_code ?? user?.customers?.current_rank_code ?? 'BRONZE';
                                                    const rankInfo = RANK_CONFIG[rankCode] || RANK_CONFIG['BRONZE'];
                                                    return (
                                                        <Badge className={`mt-2 border-0 ${rankInfo.className}`}>
                                                            {rankInfo.label}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                            <div className="ml-auto">
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    disabled={isUploading}
                                                />
                                                <Button
                                                    variant="outline"
                                                    asChild
                                                    disabled={isUploading}
                                                >
                                                    <label htmlFor="avatar-upload" className="cursor-pointer flex items-center gap-2">
                                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                                        Change Avatar
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Membership Progress - MOVED TO TAB */}
                                        {/* <MembershipCard user={user} /> */}

                                        {/* Message Alert */}
                                        {message && (
                                            <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {message.text}
                                            </div>
                                        )}

                                        {/* Form Fields */}
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="full_name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Full Name</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                                        <Input {...field} className="pl-10" />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormItem>
                                                        <FormLabel>Email Address</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                                <Input
                                                                    value={user?.email || ''}
                                                                    readOnly
                                                                    className="pl-10 bg-gray-100 text-gray-500 cursor-not-allowed"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>

                                                    <FormField
                                                        control={form.control}
                                                        name="phone"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Phone Number</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${!field.value ? 'text-amber-500' : 'text-neutral-400'}`} />
                                                                        <Input
                                                                            {...field}
                                                                            onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                                                                            className={`pl-10 ${!field.value ? 'border-amber-300 focus:ring-amber-200' : ''}`}
                                                                            placeholder="Enter your phone number"
                                                                            maxLength={11}
                                                                        />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="dob"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <FormLabel>Date of Birth</FormLabel>
                                                                    {user?.dob && (
                                                                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                                                            <Shield className="w-3 h-3" /> Locked for security
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {/* Day Select */}
                                                                    <Select
                                                                        value={field.value ? field.value.getDate().toString() : undefined}
                                                                        onValueChange={(val) => handleDobChange('day', val)}
                                                                        disabled={!!user?.dob}
                                                                    >
                                                                        <SelectTrigger className={user?.dob ? "bg-neutral-50" : ""}>
                                                                            <SelectValue placeholder="Day" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {days.map((d) => (
                                                                                <SelectItem key={d} value={d.toString()}>
                                                                                    {d}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {/* Month Select */}
                                                                    <Select
                                                                        value={field.value ? field.value.getMonth().toString() : undefined}
                                                                        onValueChange={(val) => handleDobChange('month', val)}
                                                                        disabled={!!user?.dob}
                                                                    >
                                                                        <SelectTrigger className={user?.dob ? "bg-neutral-50" : ""}>
                                                                            <SelectValue placeholder="Month" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {months.map((m, i) => (
                                                                                <SelectItem key={m} value={i.toString()}>
                                                                                    {m}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {/* Year Select */}
                                                                    <Select
                                                                        value={field.value ? field.value.getFullYear().toString() : undefined}
                                                                        onValueChange={(val) => handleDobChange('year', val)}
                                                                        disabled={!!user?.dob}
                                                                    >
                                                                        <SelectTrigger className={user?.dob ? "bg-neutral-50" : ""}>
                                                                            <SelectValue placeholder="Year" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="max-h-[300px]">
                                                                            {years.map((y) => (
                                                                                <SelectItem key={y} value={y.toString()}>
                                                                                    {y}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <FormMessage />
                                                                {user?.dob && (
                                                                    <p className="text-[11px] text-neutral-400 mt-1">
                                                                        Date of birth cannot be changed once set to prevent reward exploitation.
                                                                    </p>
                                                                )}
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Submit Button */}
                                                <div className="flex justify-end pt-4">
                                                    <Button
                                                        type="submit"
                                                        className="bg-neutral-900 text-white hover:bg-neutral-800 min-w-[120px]"
                                                        disabled={isLoading || !hasChanges}
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            "Save Changes"
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>

                                        {/* Saved Addresses */}
                                        <div className="pt-6 border-t border-neutral-100">
                                            <h3 className="font-medium text-neutral-900 mb-4">Saved Addresses</h3>

                                            <div className="space-y-3 mb-4">
                                                {addresses.length === 0 ? (
                                                    <div className="p-8 border border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center text-center bg-neutral-50/50">
                                                        <MapPin className="w-8 h-8 text-neutral-300 mb-2" />
                                                        <p className="text-neutral-500">No addresses saved yet.</p>
                                                        <p className="text-xs text-neutral-400 mt-1">Add an address to speed up checkout.</p>
                                                    </div>
                                                ) : (
                                                    addresses.map((addr) => (
                                                        <div key={addr.address_id} className="p-4 border border-neutral-200 rounded-lg flex justify-between items-center group hover:border-neutral-300 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                                <MapPin className={`w-5 h-5 mt-1 ${addr.is_default ? 'text-blue-600' : 'text-neutral-400'}`} />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-neutral-900">{addr.recipient_name}</span>
                                                                        {addr.is_default && <Badge variant="secondary" className="text-[10px] h-5">Default</Badge>}
                                                                    </div>
                                                                    <p className="text-sm text-neutral-500 mt-0.5">{addr.recipient_phone}</p>
                                                                    <p className="text-sm text-neutral-600 mt-1">{addr.detail_address}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-neutral-500 hover:text-neutral-900"
                                                                    onClick={() => handleEditAddress(addr)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                                                    onClick={() => requestDelete(addr.address_id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="w-full border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400"
                                                onClick={handleCreateAddress}
                                            >
                                                + Add New Address
                                            </Button>
                                        </div>

                                        <AddressDialog
                                            open={isAddressOpen}
                                            onOpenChange={setIsAddressOpen}
                                            onSuccess={fetchAddresses}
                                            initialData={addressToEdit}
                                            user={user}
                                        />

                                        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete this address from your account.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        <AlertDialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
                                            <AlertDialogContent className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 max-w-md">
                                                <AlertDialogHeader>
                                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 mx-auto">
                                                        <Shield className="w-8 h-8" />
                                                    </div>
                                                    <AlertDialogTitle className="text-2xl font-bold text-center text-slate-800">Verify Identity</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-center text-slate-500 mt-2">
                                                        We've sent a 6-digit code to your registered email. Please enter it below to confirm your phone change.
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
                                                    <p className="text-center text-xs text-slate-400">
                                                        Code expires in 5 minutes.
                                                    </p>
                                                </div>

                                                <AlertDialogFooter className="flex gap-3 mt-4 sm:justify-center">
                                                    <AlertDialogCancel className="rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 min-w-[120px]">
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <Button
                                                        onClick={handleVerifyOtpAndSave}
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

                                        {/* Submit Button */}
                                    </div>
                                )}

                                {activeTab === 'membership' && <MembershipTab user={user} />}



                                {activeTab === 'orders' && <MyOrdersTab />}

                                {activeTab === 'vouchers' && <MyVouchersTab />}

                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
