import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/auth.service";
import { GuestLayout } from '@/layouts/GuestLayout';
import { motion } from 'framer-motion';

export default function ForgotPassword() {

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
        <GuestLayout activePage="login">
            <div className="min-h-screen bg-[#F2F2F7] relative overflow-hidden flex items-center justify-center p-4">
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
                    className="relative z-10 w-full max-w-md bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] p-8 md:p-12 overflow-hidden"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Reset Password</h1>
                        <p className="text-slate-500 text-sm">
                            {emailSent
                                ? "Check your email for instructions"
                                : "Enter your email to receive a reset link"
                            }
                        </p>
                    </div>

                    {!emailSent ? (
                        <form onSubmit={handleSendResetLink} className="space-y-6">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 pl-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>

                            <div className="text-center mt-6">
                                <Link to="/guest/login" className="text-sm text-slate-500 hover:text-slate-800 font-bold inline-flex items-center gap-2 transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col items-center justify-center p-6 bg-green-50/50 border border-green-100 rounded-2xl">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 shadow-sm">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-lg mb-1">Email Sent!</h3>
                                <p className="text-slate-600 text-center text-sm">{message}</p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-center text-sm text-slate-500">
                                    Didn't receive the email? <br />
                                    <button
                                        onClick={() => {
                                            setEmailSent(false);
                                            setMessage(null);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all mt-1"
                                    >
                                        Try again
                                    </button>
                                </p>

                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold"
                                    onClick={() => setEmailSent(false)}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reset
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </GuestLayout>
    );
}
