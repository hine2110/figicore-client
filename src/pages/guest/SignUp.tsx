import { GuestLayout } from '@/layouts/GuestLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Mail, Lock, User, Gift, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function SignUp() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Mock Registration in progress...");

        // Mock API delay
        setTimeout(() => {
            console.log("Registration successful! Redirecting...");
            setIsLoading(false);
            navigate('/guest/home');
        }, 1500);
    };

    return (
        <GuestLayout activePage="signup">
            <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Sign Up Form */}
                        <Card className="bg-white shadow-xl border-0 overflow-hidden">
                            <CardHeader className="bg-white border-b border-gray-100 pb-6">
                                <CardTitle className="text-2xl font-light text-gray-900">Create Your Account</CardTitle>
                                <CardDescription className="text-gray-500 mt-1">
                                    Join FigiCore and start your collection journey
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">First Name</label>
                                            <div className="relative">
                                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <Input id="firstName" className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors" placeholder="John" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastName" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Last Name</label>
                                            <div className="relative">
                                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <Input id="lastName" className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors" placeholder="Doe" required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Email Address</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input id="email" type="email" className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors" placeholder="john@example.com" required />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="password" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Password</label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input id="password" type="password" className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors" placeholder="••••••••" required />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input id="confirmPassword" type="password" className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors" placeholder="••••••••" required />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-start gap-3 mb-4">
                                            <Checkbox id="terms" className="mt-1 border-gray-300 text-gray-900 focus:ring-gray-900" required />
                                            <label htmlFor="terms" className="text-sm text-gray-600 leading-snug">
                                                I agree to the <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-900 underline font-medium hover:text-blue-600">Terms of Service</a> and <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-900 underline font-medium hover:text-blue-600">Privacy Policy</a>
                                            </label>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Checkbox id="newsletter" defaultChecked className="mt-1 border-gray-300 text-gray-900 focus:ring-gray-900" />
                                            <label htmlFor="newsletter" className="text-sm text-gray-600 leading-snug">
                                                Subscribe to newsletter for exclusive deals, new drops, and community updates
                                            </label>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium text-lg mt-6 shadow-lg hover:shadow-xl transition-all"
                                        size="lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="animate-pulse">Creating Account...</span>
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5 mr-2" />
                                                Create Account
                                            </>
                                        )}
                                    </Button>

                                    <div className="text-center text-sm text-gray-600 mt-6 pt-6 border-t border-gray-100">
                                        Already have an account? <span onClick={() => navigate('/guest/login')} className="text-gray-900 underline font-semibold hover:text-blue-600 ml-1 cursor-pointer">Sign In</span>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Benefits Section */}
                        <div className="space-y-6 lg:sticky lg:top-24">
                            <div className="bg-gradient-to-br from-white to-gray-50 p-1 rounded-2xl shadow-sm border border-gray-200">
                                <div className="bg-white rounded-xl overflow-hidden p-6 space-y-6">
                                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Gift className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Member Benefits</h3>
                                            <p className="text-sm text-gray-500">Unlock excessive value</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">
                                                1
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">10% Welcome Discount</p>
                                                <p className="text-sm text-gray-500 mt-0.5">Get 10% off your first purchase instantly</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 font-bold text-sm">
                                                2
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Loyalty Points</p>
                                                <p className="text-sm text-gray-500 mt-0.5">Earn points on every purchase to redeem rewards</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 text-pink-600 font-bold text-sm">
                                                3
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Early Access</p>
                                                <p className="text-sm text-gray-500 mt-0.5">Be first to shop new releases and limited drops</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 font-bold text-sm">
                                                4
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Exclusive Deals</p>
                                                <p className="text-sm text-gray-500 mt-0.5">Member-only promotions, sales, and events</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 font-bold text-sm">
                                                5
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Digital Wallet</p>
                                                <p className="text-sm text-gray-500 mt-0.5">Convenient payment and fast balance management</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    Trusted by Collectors
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">12K+</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Members</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">50K+</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Orders</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">4.9</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Rating</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
