import { useState } from 'react';
import CustomerLayout from '@/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Shield, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function CustomerProfile() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

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
                                        <div className="flex items-center gap-6 mb-8">
                                            <Avatar className="w-20 h-20 border-2 border-white shadow-sm">
                                                <AvatarImage src={user?.avatarUrl || "https://github.com/shadcn.png"} />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h2 className="text-xl font-medium text-neutral-900">{user?.name || "Alice Chen"}</h2>
                                                <p className="text-neutral-500">{user?.role || "Customer"}</p>
                                                <Badge className="mt-2 bg-blue-100 text-blue-700 border-0">Level 2 Collector</Badge>
                                            </div>
                                            <Button variant="outline" className="ml-auto">Change Avatar</Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <Input defaultValue="Alice Chen" className="pl-10" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <Input defaultValue="alice.chen@example.com" className="pl-10" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Phone Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <Input defaultValue="+1 (555) 123-4567" className="pl-10" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-neutral-700">Location</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <Input defaultValue="New York, USA" className="pl-10" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-neutral-100">
                                            <h3 className="font-medium text-neutral-900 mb-4">Saved Addresses</h3>
                                            <div className="p-4 border border-neutral-200 rounded-lg flex justify-between items-center mb-4">
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 text-neutral-400 mt-1" />
                                                    <div>
                                                        <p className="font-medium text-neutral-900">Home</p>
                                                        <p className="text-sm text-neutral-500">123 Main St, Apt 4B, New York, NY 10001</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </div>
                                            <Button variant="outline" className="w-full border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400">
                                                + Add New Address
                                            </Button>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button className="bg-neutral-900 text-white hover:bg-neutral-800">Save Changes</Button>
                                        </div>
                                    </div>
                                )}

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
                                            {/* Mock Toggles */}
                                            {['Order Updates', 'New Arrivals', 'Promotions & Discounts', 'Account Security'].map((item) => (
                                                <div key={item} className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-neutral-900">{item}</p>
                                                        <p className="text-sm text-neutral-500">Receive notifications via email</p>
                                                    </div>
                                                    <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
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
