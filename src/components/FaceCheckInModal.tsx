import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '@/lib/axiosInstance';
import { Loader2, Camera, AlertOctagon, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/useAuthStore';

interface FaceCheckInModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkInType: 'in' | 'out'; // Check-in or Check-out
    onSuccess: () => void;
}

export default function FaceCheckInModal({ open, onOpenChange, checkInType, onSuccess }: FaceCheckInModalProps) {
    const webcamRef = useRef<Webcam>(null);
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        setLoading(true);
        setError(null);

        const stationToken = localStorage.getItem('FIGICORE_STATION_TOKEN');
        if (!stationToken) {
            setError("Station token missing. This device is not authorized.");
            setLoading(false);
            return;
        }

        try {
            const endpoint = checkInType === 'in' ? '/check-in/verify-check-in' : '/check-in/verify-check-out';
            await axiosInstance.post(endpoint, {
                employeeId: user?.user_id, // Fixed: user_id instead of id
                stationToken,
                imageBase64: imageSrc
            });

            toast({
                title: checkInType === 'in' ? "Check-in Successful" : "Check-out Recorded",
                description: `You have successfully checked ${checkInType}.`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Check-in Error:", err);
            const msg = err.response?.data?.message || err.message || "Face verification failed.";
            if (msg.includes("Face not matched") || msg.includes("Face data not found")) {
                setError("Face not recognized. Please try again or ensure you are registered.");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, [webcamRef, checkInType, onSuccess, onOpenChange, toast, user?.user_id]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{checkInType === 'in' ? 'Face Verification Check-In' : 'Face Verification Check-Out'}</DialogTitle>
                    <DialogDescription>
                        Look at the camera to verify your identity.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative rounded-lg overflow-hidden border-2 border-neutral-200 w-full aspect-video bg-black">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user" }}
                            className="w-full h-full object-cover"
                        />
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="ml-2">Verifying...</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md w-full">
                            <AlertOctagon className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={capture} disabled={loading}>
                        <Camera className="w-4 h-4 mr-2" />
                        Capture & Verify
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
