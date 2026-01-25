import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

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


            // Smart Redirect Logic
            const userRole = user?.role_code;
            console.log('Login Role:', userRole);

            let target = redirectUrl;

            // Defined from Server Seed
            const ADMIN_ROLES = ['SUPER_ADMIN', 'MANAGER', 'STAFF_POS', 'STAFF_INVENTORY'];

            // RULE 1: If user is CUSTOMER
            if (userRole === 'CUSTOMER') {
                // Security: Prevent Admin access
                if (target.startsWith('/admin')) {
                    target = '/customer/home';
                }
                // Default: Go to Customer Home instead of landing page
                if (target === '/') {
                    target = '/customer/home';
                }
            }

            // RULE 2: If user is ANY ADMIN ROLE and target is '/' (default) -> Send to Dashboard
            if (ADMIN_ROLES.includes(userRole) && target === '/') {
                target = '/admin/dashboard';
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
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left Decoration */}
            <div className="hidden md:block bg-neutral-900 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 flex flex-col justify-between p-12 text-white z-10">
                    <div className="text-2xl font-bold">FigiCore</div>
                    <div>
                        <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
                        <p className="text-neutral-300 max-w-md">Sign in to access your orders, wishlist, and exclusive member deals.</p>
                    </div>
                    <p className="text-sm text-neutral-400">© 2026 FigiCore Inc.</p>
                </div>
            </div>

            {/* Right Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-neutral-900">Sign in to your account</h1>
                        <p className="text-neutral-500 mt-2">Enter your email below to login</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
                        {message && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-900">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="m@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-neutral-900">Password</label>
                                <Link to="/guest/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
                            </div>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-neutral-200"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-neutral-500">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-11 border-neutral-300 flex items-center justify-center gap-2 hover:bg-gray-50"
                        onClick={() => window.location.href = "http://localhost:3000/auth/google"}
                    >
                        {/* Chrome Icon SVG or Lucide */}
                        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
                        Continue with Google
                    </Button>

                    <p className="text-center text-sm text-neutral-600">
                        Don't have an account?{" "}
                        <span
                            onClick={() => navigate(redirectUrl === '/' ? '/guest/signup' : `/guest/signup?redirect=${encodeURIComponent(redirectUrl)}`)}
                            className="font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                            Sign up
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
