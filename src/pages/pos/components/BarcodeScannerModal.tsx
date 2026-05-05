import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera as LucideCamera, RotateCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BarcodeScannerModalProps {
    open: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ open, onClose, onScanSuccess }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const { toast } = useToast();
    const regionId = 'reader-container';
    
    const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (open) {
            const init = async () => {
                try {
                    // Try to get available cameras
                    const devices = await Html5Qrcode.getCameras();
                    if (devices && devices.length > 0) {
                        setCameras(devices);
                        if (!selectedCameraId) {
                            setSelectedCameraId(devices[0].id);
                            return; // Re-run effect with new selectedCameraId
                        }
                    }
                } catch (err) {
                    console.error("Error getting Camera list", err);
                }

                timer = setTimeout(() => {
                    startScanner(selectedCameraId);
                }, 500);
            };

            init();
            
            return () => {
                if (timer) clearTimeout(timer);
                stopScanner();
            };
        } else {
            // Reset when closed
            setCameras([]);
            setSelectedCameraId('');
        }
    }, [open, selectedCameraId]);

    const startScanner = async (cameraId?: string) => {
        try {
            const html5QrCode = new Html5Qrcode(regionId);
            scannerRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            const cameraConfig = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" };

            await html5QrCode.start(
                cameraConfig,
                config,
                (decodedText) => {
                    console.log("Decoded:", decodedText);
                    toast({
                        title: "Code read",
                        description: `Code: ${decodedText}`,
                        duration: 2000,
                    });
                    // Try to vibrate if available
                    if (navigator.vibrate) navigator.vibrate(100);
                    
                    onScanSuccess(decodedText);
                    onClose(); // Auto close on success
                },
                (errorMessage) => {
                    // console.log("Scanning...", errorMessage);
                }
            );
        } catch (err) {
            console.error("Unable to start scanner", err);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none rounded-2xl">
                <DialogHeader className="p-4 bg-neutral-900 border-b border-neutral-800 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <LucideCamera className="w-5 h-5 text-cyan-500" />
                            Scan barcode
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs mt-1">
                            Move Camera to product barcode area
                        </DialogDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                <div className="relative aspect-square w-full bg-black flex items-center justify-center">
                    <div id={regionId} className="w-full h-full"></div>
                    
                    {/* Overlay UI */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-cyan-500/50 rounded-2xl relative">
                            {/* Scanning line animation */}
                            <div className="absolute inset-x-0 h-[2px] bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                            
                            {/* Corners */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-500 rounded-tl-lg"></div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-500 rounded-tr-lg"></div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-500 rounded-bl-lg"></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-500 rounded-br-lg"></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-neutral-900 flex justify-between gap-3 items-center">
                    {cameras.length > 0 ? (
                        <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                            <SelectTrigger className="w-[180px] bg-neutral-800 border-neutral-700 text-white">
                                <SelectValue placeholder="Select Camera" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                {cameras.map((cam, idx) => (
                                    <SelectItem key={cam.id} value={cam.id}>
                                        {cam.label || `Camera ${idx + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="text-sm text-neutral-500 italic">Finding Camera...</div>
                    )}
                    <Button variant="outline" className="bg-transparent border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0%; opacity: 0.5; }
                    50% { top: 100%; opacity: 1; }
                }
                #reader-container video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
            `}</style>
        </Dialog>
    );
};

export default BarcodeScannerModal;
