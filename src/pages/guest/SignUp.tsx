import { GuestLayout } from '@/layouts/GuestLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Mail, Lock, User, Gift, Phone, Smartphone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';

export function SignUp() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });

    const [errors, setErrors] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });

    const [generalError, setGeneralError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Countdown Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const validateField = (name: string, value: string) => {
        let errorMessage = '';
        switch (name) {
            case 'email':
                if (!value.trim()) errorMessage = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMessage = 'Invalid email format';
                break;
            case 'phone':
                if (!value.trim()) errorMessage = 'Phone number is required';
                else if (!/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/.test(value)) errorMessage = 'Invalid Vietnam phone number';
                break;
            case 'password':
                if (!value) errorMessage = 'Password is required';
                else if (value.length < 6) errorMessage = 'Password must be at least 6 characters';
                break;
            case 'confirmPassword':
                if (!value) errorMessage = 'Confirm Password is required';
                else if (value !== formData.password) errorMessage = 'Passwords do not match';
                break;
            case 'fullName':
                if (!value.trim()) errorMessage = 'Full Name is required';
                break;
            case 'otp':
                if (otpSent && (!value || value.length !== 6)) errorMessage = 'OTP must be 6 digits';
                break;
        }
        setErrors(prev => ({ ...prev, [name]: errorMessage }));
        return errorMessage === '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });

        // Optional: Clear error when user starts typing
        if (errors[id as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        validateField(e.target.id, e.target.value);
    };

    const handleSendOtp = async (e: React.MouseEvent) => {
        e.preventDefault();
        setGeneralError(null);
        setMessage(null);

        // Validate all fields before sending
        const isNameValid = validateField('fullName', formData.fullName);
        const isPhoneValid = validateField('phone', formData.phone);
        const isEmailValid = validateField('email', formData.email);
        const isPasswordValid = validateField('password', formData.password);
        const isConfirmValid = validateField('confirmPassword', formData.confirmPassword);

        if (!isNameValid || !isPhoneValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
            return;
        }

        setIsLoading(true);
        try {
            await authService.sendOtp({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phone: formData.phone
            });
            setOtpSent(true);
            setTimer(60); // Start 60s countdown
            setMessage('OTP sent to your email!');
        } catch (err: any) {
            setGeneralError(err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        const isOtpValid = validateField('otp', formData.otp);
        if (!isOtpValid) return;

        setIsLoading(true);
        try {
            const response = await authService.register({
                email: formData.email,
                otp: formData.otp
            });

            const responseData = (response as any).data || response;
            const accessToken = responseData.access_token || responseData.token;
            const user = responseData.user;

            // Save token and user info
            localStorage.setItem('accessToken', accessToken);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }

            // Smart Redirect Logic
            const userRole = user?.role_code;
            let target = redirectUrl;

            // Security Rule: Customer cannot go to Admin pages
            if (userRole === 'CUSTOMER' && target.startsWith('/admin')) {
                target = '/';
            }

            // Business Rule: Admin defaults to Dashboard if no specific target
            if (userRole !== 'CUSTOMER' && target === '/') {
                target = '/admin/dashboard';
            }

            setMessage(`Registration successful! Redirecting to ${target === '/' ? 'Home' : 'page'}...`);
            setTimeout(() => {
                navigate(target);
            }, 1000);

        } catch (err: any) {
            setGeneralError(err.response?.data?.message || 'Registration failed. Check OTP.');
            setIsLoading(false);
        }
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
                                    Join FigiCore to start collecting. <br />
                                    <span className="text-xs text-blue-600">Note: We use 2-Step Verification (OTP).</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form className="space-y-5" onSubmit={handleRegister}>

                                    {/* General Error / Message Display */}
                                    {generalError && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{generalError}</div>}
                                    {message && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>}

                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="fullName" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Full Name</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${errors.fullName ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                placeholder="John Doe"
                                                disabled={otpSent}
                                            />
                                        </div>
                                        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${errors.phone ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                placeholder="0901234567"
                                                disabled={otpSent}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Email Address</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${errors.email ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                placeholder="john@example.com"
                                                disabled={otpSent}
                                            />
                                        </div>
                                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label htmlFor="password" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Password</label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${errors.password ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                placeholder="••••••••"
                                                disabled={otpSent}
                                            />
                                        </div>
                                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                placeholder="••••••••"
                                                disabled={otpSent}
                                            />
                                        </div>
                                        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                                    </div>

                                    {/* OTP Section */}
                                    <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
                                        <label htmlFor="otp" className="text-xs font-semibold uppercase text-gray-500 tracking-wider block">Verification Code (OTP)</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    id="otp"
                                                    value={formData.otp}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors font-mono tracking-widest text-center ${errors.otp ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                    placeholder="• • • • • •"
                                                    maxLength={6}
                                                    disabled={!otpSent}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 px-4 min-w-[120px]"
                                                onClick={handleSendOtp}
                                                disabled={otpSent && timer > 0 || isLoading}
                                            >
                                                {timer > 0 ? `${timer}s` : (otpSent ? 'Resend' : 'Get Code')}
                                            </Button>
                                        </div>
                                        {errors.otp && <p className="text-xs text-red-500">{errors.otp}</p>}
                                        <p className="text-xs text-gray-400">
                                            {otpSent
                                                ? "Check your email for the 6-digit code."
                                                : "Click 'Get Code' to verify your email."
                                            }
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-start gap-3 mb-4">
                                            <Checkbox id="terms" className="mt-1 border-gray-300 text-gray-900 focus:ring-gray-900" required />
                                            <label htmlFor="terms" className="text-sm text-gray-600 leading-snug">
                                                I agree to the <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-900 underline font-medium hover:text-blue-600">Terms of Service</a>
                                            </label>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium text-lg mt-6 shadow-lg hover:shadow-xl transition-all"
                                        size="lg"
                                        disabled={isLoading || !otpSent}
                                    >
                                        {isLoading ? (
                                            <span className="animate-pulse">Processing...</span>
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5 mr-2" />
                                                Complete Registration
                                            </>
                                        )}
                                    </Button>

                                    <div className="text-center text-sm text-gray-600 mt-6 pt-6 border-t border-gray-100">
                                        Already have an account? <span onClick={() => navigate(redirectUrl === '/' ? '/guest/login' : `/guest/login?redirect=${encodeURIComponent(redirectUrl)}`)} className="text-gray-900 underline font-semibold hover:text-blue-600 ml-1 cursor-pointer">Sign In</span>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Benefits Section */}
                        <div className="space-y-6 lg:sticky lg:top-24 hidden lg:block">
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
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">1</div>
                                            <div>
                                                <p className="font-semibold text-gray-900">10% Welcome Discount</p>
                                                <p className="text-sm text-gray-500 mt-0.5">Get 10% off your first purchase instantly</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 font-bold text-sm">2</div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Loyalty Points</p>
                                                <p className="text-sm text-gray-500 mt-0.5">Earn points on every purchase</p>
                                            </div>
                                        </div>
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
