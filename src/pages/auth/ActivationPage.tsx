import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, UploadCloud, CheckCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

export default function ActivationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const token = searchParams.get("token");

    const [tempPassword, setTempPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showTemp, setShowTemp] = useState(false);
    const [showNew, setShowNew] = useState(false);
    
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

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            // using the public upload endpoint
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setAvatarUrl(res.data.url);
            toast({ title: "Avatar Uploaded", description: "Your profile picture is ready." });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Upload Failed", description: "Failed to upload avatar.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    }, [toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        maxFiles: 1
    });

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
            await api.post("/auth/activate", {
                token,
                tempPassword,
                newPassword,
                avatarUrl: avatarUrl || undefined
            });

            toast({
                title: "Activation Successful",
                description: "Your account is now active. Please login."
            });

            navigate("/guest/login");

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Activation failed.";
            toast({ title: "Error", description: msg, variant: "destructive" });
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

                        <div className="space-y-2">
                            <Label>Avatar Photo (Optional)</Label>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                ${isDragActive ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'}`}
                            >
                                <input {...getInputProps()} />
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-2" />
                                        <p className="text-sm text-neutral-500">Uploading...</p>
                                    </div>
                                ) : avatarUrl ? (
                                    <div className="flex flex-col items-center">
                                        <div className="relative mb-2">
                                            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border" />
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-500">Click to change avatar</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadCloud className="h-8 w-8 text-neutral-400 mb-2" />
                                        <p className="text-sm text-neutral-600">Drag & drop your photo</p>
                                        <p className="text-xs text-neutral-400 mt-1">or click to browse</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-black hover:bg-neutral-800" type="submit" disabled={loading || uploading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Activate Account
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
