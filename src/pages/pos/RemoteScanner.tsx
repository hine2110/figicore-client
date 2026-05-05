import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Html5Qrcode } from 'html5-qrcode';
import { Smartphone, CheckCircle, AlertCircle, Zap, ZapOff } from 'lucide-react';

// Function to create beep sound without mp3 file
const playBeep = (type: 'success' | 'error') => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {
        // Browser does not support AudioContext
    }
};

export default function RemoteScanner() {
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const lastScannedRef = useRef<string | null>(null);
    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorchConfig, setHasTorchConfig] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const regionId = 'remote-reader';

    useEffect(() => {
        if (!roomId) return;

        const serverUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || "http://localhost:3000";
        const newSocket = io(`${serverUrl}/scanner`);
        
        newSocket.on("connect", () => {
            setIsConnected(true);
            newSocket.emit("join-room", roomId);
        });

        newSocket.on("disconnect", () => {
            setIsConnected(false);
        });

        // Listen for feedback from PC
        newSocket.on("scan-feedback", (data) => {
            setScanStatus(data.success ? 'success' : 'error');
            playBeep(data.success ? 'success' : 'error');
            setTimeout(() => setScanStatus('idle'), 2000);
            if (navigator.vibrate) {
                if (data.success) navigator.vibrate([100, 50, 100]); 
                else navigator.vibrate([200, 100, 200]);
            }
        });

        setSocket(newSocket);
        socketRef.current = newSocket;

        return () => {
            newSocket.disconnect();
        };
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return; // Prevent scanner if no room

        let timer: NodeJS.Timeout;
        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode(regionId);
                scannerRef.current = html5QrCode;
                
                // Expand scan area and increase FPS for super sensitive scanning
                const config = { 
                    fps: 20, 
                    // Remove qrbox for camera to scan entire frame, or use large value
                    qrbox: { width: window.innerWidth > 400 ? 300 : 250, height: 150 },
                    aspectRatio: window.innerHeight / window.innerWidth
                };
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        const cleanedBarcode = decodedText.trim();
                        
                        // Prevent continuous duplicate scanning within 2 seconds
                        if (lastScannedRef.current === cleanedBarcode) {
                            return;
                        }
                        
                        lastScannedRef.current = cleanedBarcode;
                        setLastScanned(cleanedBarcode);
                        console.log("Scanned:", cleanedBarcode);
                        if (navigator.vibrate) navigator.vibrate(50); // Vibrate
                        playBeep('success');
                        
                        // Emit to server directly from ref to avoid closure issues
                        if (socketRef.current) {
                            socketRef.current.emit("send-barcode", { roomId, barcode: cleanedBarcode });
                        }
                        
                        // Flash UI green
                        setScanStatus('success');
                        setTimeout(() => setScanStatus('idle'), 1000);

                        // Clear throttle after 2 seconds to scan ONE PRODUCT MULTIPLE TIMES
                        if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
                        throttleTimeoutRef.current = setTimeout(() => {
                            lastScannedRef.current = null;
                        }, 2000);
                    },
                    (error) => { /* ignore normal errors */ }
                );

                // Check if camera supports Flash
                setTimeout(async () => {
                    try {
                        const capabilities = html5QrCode.getRunningTrackCapabilities();
                        if (capabilities && (capabilities as any).torch) {
                            setHasTorchConfig(true);
                        }
                    } catch (e) {}
                }, 1500);

            } catch (err) {
                console.error("Camera start error", err);
            }
        };

        timer = setTimeout(startScanner, 500);

        return () => {
            if (timer) clearTimeout(timer);
            if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [roomId]);

    const toggleTorch = async () => {
        if (!scannerRef.current || !hasTorchConfig) return;
        try {
            const newTorchState = !isTorchOn;
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: newTorchState } as any]
            });
            setIsTorchOn(newTorchState);
        } catch (err) {
            console.error("Error turning on flash:", err);
        }
    };

    if (!roomId) {
        return (
            <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-center text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Connection error</h1>
                <p className="text-neutral-400">Room ID not found. Please scan QR code on computer screen.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
            {/* Header */}
            <div className={`p-4 flex items-center justify-between z-10 transition-colors duration-300 ${scanStatus === 'success' ? 'bg-green-600' : scanStatus === 'error' ? 'bg-red-600' : 'bg-neutral-900'}`}>
                <div className="flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-white" />
                    <div>
                        <h1 className="text-white font-bold leading-tight">Figicore Scanner</h1>
                        <p className="text-xs text-neutral-300 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'}`}></span>
                            {isConnected ? 'Connected to computer' : 'Connecting...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center w-full">
                <div id={regionId} className="w-full h-full max-h-[80vh] flex items-center justify-center overflow-hidden"></div>
                
                {/* Overlay UI */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`w-72 h-48 border-2 rounded-2xl relative transition-colors duration-300 ${scanStatus === 'success' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'border-cyan-500/50'}`}>
                        {/* Scanning line animation */}
                        <div className="absolute inset-x-0 h-[2px] bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                        
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-500 rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-500 rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-500 rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-500 rounded-br-lg"></div>
                    </div>
                </div>

                {/* Torch Button Overlay */}
                {hasTorchConfig && (
                    <button 
                        onClick={toggleTorch}
                        className={`absolute top-6 right-6 p-4 rounded-full backdrop-blur-md transition-all ${isTorchOn ? 'bg-amber-400/90 text-neutral-900 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : 'bg-neutral-900/50 text-white border border-neutral-600'}`}
                    >
                        {isTorchOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
                    </button>
                )}

                {/* Scan Result Feedback */}
                {lastScanned && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-md px-6 py-3 rounded-full text-white font-mono flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        {lastScanned}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0%; opacity: 0.5; }
                    50% { top: 100%; opacity: 1; }
                }
                #remote-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
            `}</style>
        </div>
    );
}
