import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { motion } from 'framer-motion';

export function SignUp() {
    const navigate = useNavigate();
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
        const isEmailValid = validateField('email', formData.email);
        const isPhoneValid = validateField('phone', formData.phone);
        const isPasswordValid = validateField('password', formData.password);
        const isConfirmValid = validateField('confirmPassword', formData.confirmPassword);

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !isConfirmValid) {
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
            setTimer(300); // 5 minutes
            setMessage(`OTP sent to ${formData.email}. Please check your inbox.`);
        } catch (error: any) {
            setGeneralError(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpSent) return;

        setGeneralError(null);
        const isOtpValid = validateField('otp', formData.otp);

        if (!isOtpValid) return;

        setIsLoading(true);
        try {
            await authService.register({
                email: formData.email,
                otp: formData.otp
            });

            navigate('/guest/login?registered=true');
        } catch (error: any) {
            setGeneralError(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GuestLayout activePage="register">
            <div className="min-h-screen bg-[#F2F2F7] relative overflow-hidden flex items-center justify-center p-4 py-12">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] ambient-glow-blue rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] ambient-glow-purple rounded-full animate-breathe gpu-accelerated blob-optimized" style={{ animationDuration: '10s' }} />
                </div>

                {/* Glass Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 w-full max-w-lg bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Create Account</h1>
                        <p className="text-slate-500 text-sm">Join FigiCore community today</p>
                    </div>

                    {generalError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {generalError}
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    id="fullName"
                                    className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium"
                                    placeholder="Enter your name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-xs pl-1 font-medium">{errors.fullName}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    id="phone"
                                    className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium"
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-xs pl-1 font-medium">{errors.phone}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium"
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs pl-1 font-medium">{errors.email}</p>}
                        </div>

                        {/* Password Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                </div>
                                {errors.password && <p className="text-red-500 text-xs pl-1 font-medium">{errors.password}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium"
                                        placeholder="Confirm"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs pl-1 font-medium">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* OTP Section */}
                        <div className="pt-2">
                            {!otpSent ? (
                                <Button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={isLoading}
                                    className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold uppercase tracking-wider text-xs rounded-xl transition-all border border-slate-200"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Code'}
                                </Button>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div className="text-center">
                                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Enter OTP</label>
                                    </div>
                                    <Input
                                        id="otp"
                                        className="bg-white border-blue-200 text-blue-900 text-center tracking-[0.5em] text-lg font-bold h-12 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                                        placeholder="• • • • • •"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        maxLength={6}
                                    />
                                    <div className="flex justify-between items-center text-xs px-1">
                                        <span className="text-slate-500 font-medium">Expires in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all"
                                            disabled={timer > 0}
                                        >
                                            Resend Code
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                            disabled={!otpSent || isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processing...</span>
                            ) : (
                                <span className="flex items-center gap-2 justify-center">Complete Registration <ArrowRight className="w-4 h-4" /></span>
                            )}
                        </Button>

                        {/* Footer */}
                        <p className="text-center text-slate-500 text-sm mt-8">
                            Already have an account?{' '}
                            <Link to="/guest/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </form>
                </motion.div>
            </div>
        </GuestLayout>
    );
}
