import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";

export default function SignIn() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulation
        setTimeout(() => {
            login('customer');
            navigate('/customer/home');
        }, 1500);
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-900">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="m@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-neutral-900">Password</label>
                                <Link to="#" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
                            </div>
                            <input
                                type="password"
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

                    <Button variant="outline" className="w-full h-11 border-neutral-300">
                        GitHub
                    </Button>

                    <p className="text-center text-sm text-neutral-600">
                        Don't have an account?{" "}
                        <Link to="/guest/signup" className="font-semibold text-blue-600 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
