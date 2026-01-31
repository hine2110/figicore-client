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
