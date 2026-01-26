import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { authService } from "@/services/auth.service";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const [email, setEmail] = useState('');

    const handleSendResetLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            setEmailSent(true);
            setMessage('Password reset link has been sent to your email.');
            setIsLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
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
                        <h2 className="text-4xl font-bold mb-4">Reset Your Password</h2>
                        <p className="text-neutral-300 max-w-md">Enter your email and we'll send you a link to get back into your account.</p>
                    </div>
                    <p className="text-sm text-neutral-400">© 2026 FigiCore Inc.</p>
                </div>
            </div>

            {/* Right Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-neutral-900">Forgot Password?</h1>
                        <p className="text-neutral-500 mt-2">
                            {emailSent
                                ? "Check your email for reset instructions"
                                : "No worries, we'll send you reset instructions"
                            }
                        </p>
                    </div>

                    {!emailSent ? (
                        <form onSubmit={handleSendResetLink} className="space-y-6">
                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-900">Email</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="m@example.com"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-green-50 text-green-600 p-4 rounded-md text-sm text-center">
                                <p className="font-medium mb-1">Email Sent!</p>
                                <p className="text-green-700">{message}</p>
                            </div>

                            <div className="text-center text-sm text-neutral-600">
                                <p>Didn't receive the email?</p>
                                <button
                                    onClick={() => {
                                        setEmailSent(false);
                                        setMessage(null);
                                    }}
                                    className="text-blue-600 hover:underline font-semibold mt-1"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link to="/guest/login" className="text-sm text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1">
                            ← Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
