import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
            // No verifyOtp method separate, register does verification
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
            <div className="min-h-screen flex bg-neutral-900 text-white font-sans">
                {/* LEFT PANEL: VISUAL */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                    {/* Background Image - Art Toy / Mystery Box Theme */}
                    <div className="absolute inset-0 opacity-60 bg-[url('/images/grok-video-c4faf7e1-ec31-44c1-93b3-d4e34445ac7b-ezgif.com-video-to-gif-converter.gif')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                    <div className="relative z-10 flex flex-col justify-end p-16 h-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="flex items-center gap-3 mb-6 text-amber-500 font-bold tracking-widest uppercase text-sm">
                                <Sparkles className="w-5 h-5" />
                                Exclusive Access
                            </div>
                            <h1 className="text-6xl font-serif mb-6 leading-tight">
                                Start Your <br /> Collection <br /> <span className="text-amber-500 italic">FigiCore</span>
                            </h1>
                            <p className="text-xl text-neutral-400 max-w-md font-light leading-relaxed">
                                Join our community of collectors and get early access to limited edition drops, mystery boxes, and exclusive events.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT PANEL: FORM */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-neutral-900">
                    <div className="max-w-md w-full space-y-8">
                        <div className="text-center lg:text-left">
                            <h2 className="text-3xl font-serif font-bold text-white mb-2">Create Account</h2>
                            <p className="text-neutral-400">Enter your details to join FigiCore</p>
                        </div>

                        {generalError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded text-sm"
                            >
                                {generalError}
                            </motion.div>
                        )}

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-green-900/30 border border-green-800 text-green-200 px-4 py-3 rounded text-sm"
                            >
                                {message}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                {/* Name Input */}
                                <div className="space-y-1">
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                                        <Input
                                            id="fullName"
                                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-10 h-12 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                                            placeholder="Full Name"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                    </div>
                                    {errors.fullName && <p className="text-red-500 text-xs pl-1">{errors.fullName}</p>}
                                </div>

                                {/* Phone Input */}
                                <div className="space-y-1">
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                                        <Input
                                            id="phone"
                                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-10 h-12 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                                            placeholder="Phone Number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-500 text-xs pl-1">{errors.phone}</p>}
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-10 h-12 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                                            placeholder="Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs pl-1">{errors.email}</p>}
                                </div>

                                {/* Password Fields Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                                            <Input
                                                id="password"
                                                type="password"
                                                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-10 h-12 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                                                placeholder="Password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                        </div>
                                        {errors.password && <p className="text-red-500 text-xs pl-1">{errors.password}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-10 h-12 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                                                placeholder="Confirm"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                        </div>
                                        {errors.confirmPassword && <p className="text-red-500 text-xs pl-1">{errors.confirmPassword}</p>}
                                    </div>
                                </div>

                                {/* OTP Section */}
                                <div className="space-y-2 pt-2">
                                    {!otpSent ? (
                                        <Button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={isLoading}
                                            variant="outline"
                                            className="w-full h-12 border-amber-600/30 text-amber-500 hover:bg-amber-950 hover:text-amber-400 bg-amber-950/10 font-bold uppercase tracking-wider text-xs"
                                        >
                                            {isLoading ? 'Sending...' : 'Send Verification Code'}
                                        </Button>
                                    ) : (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                            <div className="flex gap-2">
                                                <Input
                                                    id="otp"
                                                    className="bg-neutral-800 border-amber-500/50 text-amber-500 text-center tracking-[0.5em] text-lg font-bold h-12 focus:border-amber-500 focus:ring-amber-500/20"
                                                    placeholder="• • • • • •"
                                                    value={formData.otp}
                                                    onChange={handleChange}
                                                    maxLength={6}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-neutral-500">Expires in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                                                <button
                                                    type="button"
                                                    onClick={handleSendOtp}
                                                    className="text-amber-500 hover:text-amber-400 underline font-medium"
                                                    disabled={timer > 0}
                                                >
                                                    Resend Code
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-14 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20 uppercase tracking-widest transition-all hover:scale-[1.01]"
                                disabled={!otpSent || isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">Creating Account...</span>
                                ) : (
                                    <span className="flex items-center gap-2 justify-center">Complete Registration <ArrowRight className="w-4 h-4" /></span>
                                )}
                            </Button>

                            {/* Footer */}
                            <p className="text-center text-neutral-500 text-sm mt-8">
                                Already have an account?{' '}
                                <span
                                    className="text-white hover:text-amber-500 font-medium cursor-pointer transition-colors"
                                    onClick={() => navigate('/guest/login')}
                                >
                                    Sign In
                                </span>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
