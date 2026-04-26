import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Html5Qrcode } from 'html5-qrcode';
import { Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

export default function RemoteScanner() {
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const scannerRef = useRef<Html5Qrcode | null>(null);
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
            setTimeout(() => setScanStatus('idle'), 2000);
            if (navigator.vibrate) {
                if (data.success) navigator.vibrate([100, 50, 100]); 
                else navigator.vibrate([200, 100, 200]);
            }
        });

        setSocket(newSocket);

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
                const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 };
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Prevent rapid firing of same barcode
                        setLastScanned(prev => {
                            if (prev !== decodedText) {
                                console.log("Scanned:", decodedText);
                                if (navigator.vibrate) navigator.vibrate(50); // Beep vibration
                                
                                // Emit to server
                                setSocket(s => {
                                    s?.emit("send-barcode", { roomId, barcode: decodedText });
                                    return s;
                                });
                                
                                // Flash UI green immediately
                                setScanStatus('success');
                                setTimeout(() => setScanStatus('idle'), 1500);

                                // Clear last scanned after 3 seconds so they can scan the same item again if needed
                                setTimeout(() => setLastScanned(null), 3000);
                                return decodedText;
                            }
                            return prev;
                        });
                    },
                    (error) => { /* ignore normal errors */ }
                );
            } catch (err) {
                console.error("Camera start error", err);
            }
        };

        timer = setTimeout(startScanner, 500);

        return () => {
            if (timer) clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [roomId]);

    if (!roomId) {
        return (
            <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-center text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Lỗi kết nối</h1>
                <p className="text-neutral-400">Không tìm thấy mã Room ID. Vui lòng quét mã QR trên màn hình máy tính.</p>
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
                            {isConnected ? 'Đã kết nối máy tính' : 'Đang kết nối...'}
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
