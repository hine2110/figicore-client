import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import { AvatarUploader } from "@/components/AvatarUploader";

export default function ActivationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const token = searchParams.get("token");

    const [tempPassword, setTempPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showTemp, setShowTemp] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [avatarKey, setAvatarKey] = useState(0);
    
    // Resend UI states
    const [isExpired, setIsExpired] = useState(false);
    const [emailForResend, setEmailForResend] = useState("");
    const [resending, setResending] = useState(false);
    const [linkSent, setLinkSent] = useState(false);
    
    // Real-time validation states
    const [passwordError, setPasswordError] = useState("");
    const [confirmError, setConfirmError] = useState("");

    useEffect(() => {
        if (!token) {
            toast({
                title: "Invalid Link",
                description: "Activation token is missing.",
                variant: "destructive"
            });
            navigate("/guest/login");
        }
    }, [token, navigate, toast]);

    const handleResendLink = async () => {
        if (!emailForResend) {
            toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
            return;
        }
        setResending(true);
        try {
            await api.post("/auth/resend-activation", { email: emailForResend });
            toast({
                title: "Link Sent!",
                description: "A new activation link has been sent to your email."
            });
            setLinkSent(true);
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Failed to resend link.";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setResending(false);
        }
    };

    const handleAvatarSelect = async (file: File) => {
        // Fast-fail validation is already handled by AvatarUploader.
        // We simply store the valid file locally until form submission.
        setAvatarFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setPasswordError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
            return;
        } else {
            setPasswordError("");
        }

        if (newPassword !== confirmPassword) {
            setConfirmError("Passwords do not match.");
            return;
        } else {
            setConfirmError("");
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("token", token as string);
            formData.append("tempPassword", tempPassword);
            formData.append("newPassword", newPassword);
            
            if (avatarFile) {
                formData.append("file", avatarFile);
            }

            await api.post("/auth/activate", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 60000 // 60 seconds specifically for AI face validation and Cloudinary Upload
            });

            toast({
                title: "Activation Successful",
                description: "Your account is now active. Please login."
            });

            navigate("/guest/login");

        } catch (error: any) {
            console.error(error);
            const rawMsg = error.response?.data?.message || "Activation failed.";
            const msg = Array.isArray(rawMsg) ? rawMsg[0] : String(rawMsg);
            
            if (msg.toLowerCase().includes("expired") || error.response?.status === 401) {
                setIsExpired(true);
                toast({ title: "Link Expired", description: "Your activation link has expired.", variant: "destructive" });
            } else {
                toast({ title: "Error", description: Array.isArray(rawMsg) ? rawMsg.join(", ") : msg, variant: "destructive" });
                const errorStr = String(msg).toLowerCase();
                if (errorStr.includes("cartoons") || errorStr.includes("drawings")) {
                    setAvatarFile(null);
                    setAvatarKey(prev => prev + 1);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Setup Your Profile</CardTitle>
                    <CardDescription className="text-center">
                        Enter your temporary password, set a new password, and upload an avatar.
                    </CardDescription>
                </CardHeader>
                
                {linkSent ? (
                    <div className="p-6 space-y-4 pt-0 text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm border border-green-200">
                            A new activation link and temporary password have been sent to your email. Please check your inbox to continue.
                        </div>
                        <Button 
                            type="button" 
                            className="w-full mt-4 bg-black hover:bg-neutral-800"
                            onClick={() => navigate("/guest/login")}
                        >
                            Back to Login
                        </Button>
                    </div>
                ) : isExpired ? (
                    <div className="p-6 space-y-4 pt-0">
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-200">
                            Your activation link has expired for security purposes. (Đường dẫn kích hoạt của bạn đã hết hạn để đảm bảo an toàn).
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resend-email">Confirm your email address</Label>
                            <Input 
                                id="resend-email"
                                type="email"
                                value={emailForResend}
                                onChange={(e) => setEmailForResend(e.target.value)}
                                placeholder="name@figicore.com"
                                required
                            />
                        </div>
                        <Button 
                            className="w-full bg-black hover:bg-neutral-800" 
                            onClick={handleResendLink}
                            disabled={resending}
                        >
                            {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send new link to my email
                        </Button>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className="w-full mt-2"
                            onClick={() => setIsExpired(false)}
                        >
                            Back to Activation
                        </Button>
                    </div>
                ) : (
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="temp-pass">Temporary Password</Label>
                            <div className="relative">
                                <Input
                                    id="temp-pass"
                                    type={showTemp ? "text" : "password"}
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                    placeholder="Enter code from email"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowTemp(!showTemp)}
                                >
                                    {showTemp ? <EyeOff className="h-4 w-4 text-neutral-500" /> : <Eye className="h-4 w-4 text-neutral-500" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-pass">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-pass"
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
                                        if (e.target.value && !regex.test(e.target.value)) {
                                            setPasswordError("Needs 8+ chars, uppercase, lowercase, number, & special char.");
                                        } else {
                                            setPasswordError("");
                                        }
                                        if (confirmPassword && e.target.value !== confirmPassword) {
                                            setConfirmError("Passwords do not match.");
                                        } else if (confirmPassword) {
                                            setConfirmError("");
                                        }
                                    }}
                                    placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 special char"
                                    required
                                    className={passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowNew(!showNew)}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4 text-neutral-500" /> : <Eye className="h-4 w-4 text-neutral-500" />}
                                </Button>
                            </div>
                            {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-pass">Confirm New Password</Label>
                            <Input
                                id="confirm-pass"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (e.target.value && e.target.value !== newPassword) {
                                        setConfirmError("Passwords do not match.");
                                    } else {
                                        setConfirmError("");
                                    }
                                }}
                                placeholder="Re-enter new password"
                                required
                                className={confirmError ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {confirmError && <p className="text-xs text-red-500 mt-1">{confirmError}</p>}
                        </div>

                        <div className="space-y-4 flex flex-col items-center pt-2">
                            <Label className="self-start">Avatar Photo (Optional)</Label>
                            <AvatarUploader
                                key={avatarKey}
                                onFileSelect={handleAvatarSelect}
                                defaultFallback="New"
                            />
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-black hover:bg-neutral-800" type="submit" disabled={loading || uploading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Activate Account
                        </Button>
                    </CardFooter>
                </form>
                )}
            </Card>
        </div>
    );
}
