
import { useState, useEffect } from 'react';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Shield, Bell, Loader2, Trash2, Crown, Package } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';
import MembershipTab from '@/components/customer/MembershipTab'; // New Import
import MyOrdersTab from '@/components/customer/MyOrdersTab'; // New Import
import AddressDialog from '@/components/customer/AddressDialog';
import { addressService, Address } from '@/services/address.service';
import { useToast } from "@/components/ui/use-toast";
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

// Rank Config from Seed Data
const RANK_CONFIG: Record<string, { label: string; className: string }> = {
    'BRONZE': { label: 'Newbie Collector', className: 'bg-orange-100 text-orange-700' },
    'SILVER': { label: 'Active Collector', className: 'bg-gray-100 text-gray-700' },
    'GOLD': { label: 'Elite Collector', className: 'bg-yellow-100 text-yellow-700' },
    'DIAMOND': { label: 'Legendary Collector', className: 'bg-cyan-100 text-cyan-700' },
};

export default function CustomerProfile() {
    const { toast } = useToast();
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'membership' | 'security' | 'notifications'>('profile');

    // Address State
    const [isAddressOpen, setIsAddressOpen] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

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

    const handleSaveProfile = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            await authService.updateProfile({
                full_name: formData.full_name,
                phone: formData.phone
            });

            // Update local store with new data
            const updatedUser = { ...user, ...formData };
            setUser(updatedUser as any);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved.",
                duration: 10000,
            });
        } catch (error: any) {
            console.error('Update profile error:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.response?.data?.message || "Failed to update profile",
                duration: 10000,
            });
        } finally {
            setIsLoading(false);
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
                                        onClick={() => setActiveTab('profile')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <User className="w-4 h-4" />
                                        Personal Info
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('membership')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'membership'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Crown className="w-4 h-4" />
                                        Membership
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Package className="w-4 h-4" />
                                        My Orders
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('security')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        Login & Security
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications'
                                            ? 'bg-neutral-100 text-neutral-900'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                            }`}
                                    >
                                        <Bell className="w-4 h-4" />
                                        Notifications
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
                                            <Avatar className="w-20 h-20 border-2 border-white shadow-sm">
                                                <AvatarImage src={user?.avatar_url || ""} />
                                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-medium">
                                                    {user?.full_name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h2 className="text-xl font-medium text-neutral-900">{user?.full_name || "User"}</h2>
                                                <p className="text-neutral-500 capitalize">{user?.role_code?.replace('_', ' ').toLowerCase() || "Customer"}</p>

                                                {/* Dynamic Rank Badge */}
                                                {(() => {
                                                    const rankCode = user?.customers?.current_rank_code || 'BRONZE';
                                                    const rankInfo = RANK_CONFIG[rankCode] || RANK_CONFIG['BRONZE'];
                                                    return (
                                                        <Badge className={`mt-2 border-0 ${rankInfo.className}`}>
                                                            {rankInfo.label}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                            {/* Disabled for now */}
                                            <Button variant="outline" className="ml-auto opacity-50 cursor-not-allowed" disabled>Change Avatar</Button>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <Input
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <Input
                                                        value={user?.email || ''}
                                                        readOnly
                                                        className="pl-10 bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Phone Number</label>
                                                <div className="relative">
                                                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${!formData.phone ? 'text-amber-500' : 'text-neutral-400'}`} />
                                                    <Input
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        className={`pl-10 ${!formData.phone ? 'border-amber-300 focus:ring-amber-200' : ''}`}
                                                        placeholder="Enter your phone number"
                                                    />
                                                </div>
                                            </div>
                                        </div>

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

                                        {/* Submit Button */}
                                        <div className="flex justify-end pt-4">
                                            <Button
                                                className="bg-neutral-900 text-white hover:bg-neutral-800 min-w-[120px]"
                                                onClick={handleSaveProfile}
                                                disabled={isLoading}
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
                                    </div>
                                )}

                                {activeTab === 'membership' && <MembershipTab user={user} />}



                                {activeTab === 'orders' && <MyOrdersTab />}

                                {activeTab === 'security' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h3 className="text-lg font-medium text-neutral-900">Password</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Current Password</label>
                                                <Input type="password" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">New Password</label>
                                                <Input type="password" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Confirm New Password</label>
                                                <Input type="password" />
                                            </div>
                                            <Button className="bg-neutral-900 text-white hover:bg-neutral-800">Update Password</Button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h3 className="text-lg font-medium text-neutral-900">Notification Preferences</h3>
                                        <div className="space-y-4">
                                            {['Order Updates', 'New Arrivals', 'Promotions & Discounts', 'Account Security'].map((item) => (
                                                <div key={item} className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-neutral-900">{item}</p>
                                                        <p className="text-sm text-neutral-500">Receive notifications via email</p>
                                                    </div>
                                                    <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer opacity-50">
                                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
