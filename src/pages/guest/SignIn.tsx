import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_LANDING_PATHS, getRoleBaseRoute } from "@/routes";
import { GuestLayout } from '@/layouts/GuestLayout';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignIn() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Improved Redirect Logic: Check Query Param -> Check History State -> Default to Root
    const fromState = location.state?.from?.pathname ? `${location.state.from.pathname}${location.state.from.search}` : null;
    const redirectUrl = searchParams.get('redirect') || fromState || '/';
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password
            });

            const responseData = (response as any).data || response;
            const accessToken = responseData.access_token || responseData.token;
            const user = responseData.user;

            // Save token and user info based on "Remember Me"
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('accessToken', accessToken);
            storage.setItem('user', JSON.stringify(user));

            // Clean other storage
            const otherStorage = rememberMe ? sessionStorage : localStorage;
            otherStorage.removeItem('accessToken');
            otherStorage.removeItem('user');

            // Sync with Global State
            useAuthStore.getState().setUser(user);

            // Smart Redirect Logic
            const userRole = user?.role_code || 'GUEST';
            let target = redirectUrl;

            // 1. Get Canonical Landing Path
            const landingPath = ROLE_LANDING_PATHS[userRole] || '/';
            // 2. Get Safe Base
            const roleSafeBase = getRoleBaseRoute(userRole);

            if (target === '/') {
                target = landingPath;
            }

            if (target.startsWith('/admin') && userRole !== 'SUPER_ADMIN') {
                target = landingPath;
            }

            if (roleSafeBase && !target.startsWith(`/${roleSafeBase}`) && !target.startsWith('/profile')) {
                // strict check kept for security logic
            }

            setMessage('Login successful! Redirecting...');
            setTimeout(() => {
                navigate(target);
            }, 1000);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid email or password');
            setIsLoading(false);
        }
    };

    return (
        <GuestLayout activePage="login">
            <div className="min-h-screen relative overflow-hidden flex flex-col font-sans">
                {/* Full-Screen Spline 3D Scene Background - Using IFrame for stability */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <Loader2 className="w-10 h-10 animate-spin text-white/20" />
                    </div>
                    <iframe
                        src="https://my.spline.design/interactiveaiwebsite-CkfksXENYmwF1DyVytFvIPP3/?v=final"
                        frameBorder="0"
                        width="100%"
                        height="100%"
                        className="w-full h-full pointer-events-auto"
                        title="Aura Mecha 3D Scene"
                    />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex-1 flex flex-col items-center lg:items-start justify-center px-8 lg:px-24 xl:px-48 py-12">


                    {/* Glass Card - Styled to match Register (SignUp.tsx) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: -50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] p-10 md:p-14 overflow-hidden flex flex-col"
                    >
                        <div className="mb-10 text-center lg:text-left">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
                            <p className="text-slate-500 text-sm">Sign in to continue your collection</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="w-full mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium text-center uppercase tracking-wider"
                            >
                                {error}
                            </motion.div>
                        )}

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="w-full mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-xs font-medium text-center uppercase tracking-wider"
                            >
                                {message}
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="w-full space-y-6">
                            <div className="space-y-5">
                                {/* Email */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium placeholder:text-slate-400"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                        <Link to="/guest/forgot-password" tailwind-title="Recover Access" className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-all">
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="password"
                                            type="password"
                                            className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium placeholder:text-slate-400"
                                            placeholder="Enter password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Remember */}
                                <div className="flex items-center px-1">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 shadow-sm transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                            />
                                            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors select-none">Remember Me</span>
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
                                )}
                            </Button>

                            {/* External */}
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white/0 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-14 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:border-slate-300"
                                onClick={() => {
                                    if (redirectUrl && redirectUrl !== '/') {
                                        localStorage.setItem('auth_return_url', redirectUrl);
                                    }
                                    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/auth/google`;
                                }}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Google account</span>
                            </Button>

                            <p className="text-center text-slate-500 text-sm mt-8">
                                Don't have an account?{' '}
                                <Link to="/guest/register" className="text-blue-600 hover:text-blue-700 font-bold transition-all">
                                    Register Now
                                </Link>
                            </p>
                        </form>
                    </motion.div>
                </div>

            </div>
        </GuestLayout>
    );
}
