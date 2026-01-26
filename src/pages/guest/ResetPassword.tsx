import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Reset token from email link

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        // Validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            if (!token) {
                throw new Error('Reset token is missing');
            }
            await authService.resetPassword(token, formData.password);
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/guest/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left Decoration */}
            <div className="hidden md:block bg-neutral-900 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555421689-d68471e189f2?w=1200&auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 flex flex-col justify-between p-12 text-white z-10">
                    <div className="text-2xl font-bold">FigiCore</div>
                    <div>
                        <h2 className="text-4xl font-bold mb-4">Create New Password</h2>
                        <p className="text-neutral-300 max-w-md">Your new password must be different from previously used passwords.</p>
                    </div>
                    <p className="text-sm text-neutral-400">© 2026 FigiCore Inc.</p>
                </div>
            </div>

            {/* Right Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-neutral-900">Set New Password</h1>
                        <p className="text-neutral-500 mt-2">Must be at least 6 characters</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-6">
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
                        {message && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-900">New Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="w-full pl-10 pr-10 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-900">Confirm Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    className="w-full pl-10 pr-10 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
