
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { axiosInstance } from '@/lib/axiosInstance';
import { toast } from '@/components/ui/use-toast';

interface FaceCheckInModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkInType: 'in' | 'out'; // 'in' -> Check In, 'out' -> Check Out
    onSuccess?: () => void;
}

const FaceCheckInModal: React.FC<FaceCheckInModalProps> = ({ open, onOpenChange, checkInType, onSuccess }) => {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; confidence?: number } | null>(null);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
        setResult(null);
    };

    // Helper: Convert Base64 to Blob
    const dataURItoBlob = (dataURI: string) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    const handleConfirm = async () => {
        if (!imgSrc) return;

        setLoading(true);
        try {
            const blob = dataURItoBlob(imgSrc);
            const formData = new FormData();
            formData.append('file', blob, 'face-checkin.jpg');

            // API Endpoint based on Type
            const endpoint = checkInType === 'in' ? '/check-in/verify-check-in' : '/check-in/verify-check-out';

            const response = await axiosInstance.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Success (200/201)
            const confidence = response.data.confidence;
            setResult({
                success: true,
                message: `Check-in successful! (Confidence: ${typeof confidence === 'number' ? confidence.toFixed(1) : confidence}%)`,
                confidence
            });

            toast({
                title: "Success",
                description: response.data.message || "Check-in successful!",
                className: "bg-green-600 text-white border-none",
            });

            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                    onOpenChange(false);
                    setImgSrc(null);
                    setResult(null);
                }, 1500);
            }

        } catch (error: any) {
            console.error("Check-in failed", error);

            const errorMessage = error.response?.data?.message || "Face does not match or system error.";

            setResult({
                success: false,
                message: errorMessage
            });
            toast({
                title: "Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-neutral-200">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                        {checkInType === 'in' ? 'Face Check-In' : 'Face Check-Out'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Move your face into the frame to authenticate.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden ring-4 ring-neutral-100 shadow-xl">
                        {imgSrc ? (
                            <img src={imgSrc} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                        ) : (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover transform scale-x-[-1]"
                                videoConstraints={{ facingMode: "user" }}
                            />
                        )}

                        {/* Overlay Frame */}
                        {!imgSrc && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-64 border-2 border-white/50 rounded-full box-content shadow-[0_0_0_999px_rgba(0,0,0,0.5)]"></div>
                            </div>
                        )}

                        {loading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                <Loader2 className="w-10 h-10 animate-spin mb-2" />
                                <span className="font-medium">Processing...</span>
                            </div>
                        )}
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg w-full justify-center ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {result.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            <span className="font-medium text-sm">{result.message}</span>
                        </div>
                    )}

                    <div className="flex gap-3 w-full">
                        {!imgSrc ? (
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold shadow-lg shadow-blue-200"
                                onClick={capture}
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Capture
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={retake}
                                    disabled={loading || (result?.success)}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Retake
                                </Button>
                                <Button
                                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                    onClick={handleConfirm}
                                    disabled={loading || (result?.success)}
                                >
                                    {loading ? 'Submitting...' : 'Confirm'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FaceCheckInModal;
