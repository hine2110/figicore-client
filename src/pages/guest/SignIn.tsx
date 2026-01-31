import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_LANDING_PATHS, getRoleBaseRoute } from "@/routes";
import { GuestLayout } from '@/layouts/GuestLayout';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';
    // const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
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

            // Save token and user info
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // Sync with Global State
            useAuthStore.getState().setUser(user);

            // Smart Redirect Logic
            const userRole = user?.role_code || 'GUEST';
            console.log('Login Role:', userRole);

            let target = redirectUrl;

            // 1. Get Canonical Landing Path
            const landingPath = ROLE_LANDING_PATHS[userRole] || '/';
            // 2. Get Safe Base (e.g. 'warehouse')
            const roleSafeBase = getRoleBaseRoute(userRole);

            // RULE 1: Default Landing
            // If target is just root, send them to their dashboard
            if (target === '/') {
                target = landingPath;
            }

            // RULE 2: Fix "Wrong Admin Redirect"
            // If a non-Super Admin tries to go to /admin (often leftover from previous sessions or bad defaults),
            // Redirect them to their CORRECT dashboard.
            // Exception: MANAGER might share /admin? No, per map MANAGER -> /manager/dashboard.
            if (target.startsWith('/admin') && userRole !== 'SUPER_ADMIN') {
                console.warn(`Redirecting ${userRole} from restricted /admin to ${landingPath}`);
                target = landingPath;
            }

            // RULE 3: Strict Base Enforcement (Optional but Recommended)
            // If they are strictly a Warehouse staff, they shouldn't be in /pos or /manager
            if (roleSafeBase && !target.startsWith(`/${roleSafeBase}`) && !target.startsWith('/profile')) {
                // Allow /profile or common routes if any, otherwise strict check.
                // For now, let's keep it simple: If they are clearly in the wrong module (e.g. Warehouse -> POS), fix it.
                // But valid public routes? (Products?)
                // Let's safe guard only if target is explicitly another dashboard area.
            }

            // RULE 3: Execute Redirect
            console.log('Redirecting to:', target);
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
            <div className="min-h-screen flex bg-neutral-900 text-white font-sans">
                {/* LEFT PANEL: VISUAL */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
                    {/* Background Image - Matches Register Page */}
                    <div className="absolute inset-0 opacity-60 bg-[url('/images/grok-video-27f76232-6cb0-405b-ab9b-60697fafb4dd-ezgif.com-video-to-gif-converter.gif')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                    <div className="relative z-10 flex flex-col justify-end p-16 h-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="flex items-center gap-3 mb-6 text-amber-500 font-bold tracking-widest uppercase text-sm">
                                <Sparkles className="w-5 h-5" />
                                Welcome Back
                            </div>
                            <h1 className="text-6xl font-serif mb-6 leading-tight">
                                Continue Your <br /> Collection <br /> <span className="text-amber-500 italic">FigiCore</span>
                            </h1>
                            <p className="text-xl text-neutral-400 max-w-md font-light leading-relaxed">
                                Sign in to access your exclusive wishlist, track orders, and discover new limited edition drops.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT PANEL: FORM */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-neutral-900">
                    <div className="max-w-md w-full space-y-8">
                        <div className="text-center lg:text-left">
                            <h2 className="text-3xl font-serif font-bold text-white mb-2">Sign In</h2>
                            <p className="text-neutral-400">Welcome back to FigiCore</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded text-sm"
                            >
                                {error}
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

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-5">
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
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-1">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                                        <Input
                                            id="password"
                                            type="password"
                                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-10 h-12 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <Link to="/guest/forgot-password" className="text-xs text-amber-500 hover:text-amber-400 font-medium">
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-14 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20 uppercase tracking-widest transition-all hover:scale-[1.01]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">Signing In...</span>
                                ) : (
                                    <span className="flex items-center gap-2 justify-center">Sign In <ArrowRight className="w-4 h-4" /></span>
                                )}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-neutral-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-neutral-900 text-neutral-500">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-medium flex items-center justify-center gap-2 border-none transition-all"
                                onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/auth/google`}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Sign in with Google
                            </Button>

                            {/* Footer */}
                            <p className="text-center text-neutral-500 text-sm mt-8">
                                Don't have an account?{' '}
                                <Link to="/guest/register" className="text-white hover:text-amber-500 font-medium transition-colors">
                                    Create Account
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
