import { useState, useEffect, useRef } from "react";
import { shipmentService } from "@/services/shipment.service";
import { toast } from "@/components/ui/use-toast";
import { PackingQueue } from "@/components/warehouse/packing/PackingQueue";
import { PackingStation } from "@/components/warehouse/packing/PackingStation";
import { PackingOrder } from "@/types/packing";
import { PackingHistory } from "@/components/warehouse/packing/PackingHistory";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, History, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PackingFulfillment() {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const [queue, setQueue] = useState<PackingOrder[]>([]);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PackingOrder | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState<string | null>(null);
    const [isPacking, setIsPacking] = useState(false);
    const [activeTab, setActiveTab] = useState("queue");
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // NEW: Date Range & Stats
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [stats, setStats] = useState({ pending: 0, packed: 0, delivered: 0, returned: 0 });

    // AUDIO REF for Notification
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchQueue = async () => {
        setIsLoadingQueue(true);
        try {
            const data = await shipmentService.getProcessingOrders();
            if (data.length > queue.length && queue.length > 0) {
                playNotificationSound();
            }
            setQueue(data);
        } catch (error) {
            console.error("Fetch Queue Failed", error);
        } finally {
            setIsLoadingQueue(false);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const data = await shipmentService.getPackingHistory(startDate, endDate);
            setHistory(data);
        } catch (error) {
            console.error("Fetch History Failed", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await shipmentService.getWarehouseStats(startDate, endDate);
            setStats(data);
        } catch (error) {
            console.error("Fetch Stats Failed", error);
        }
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio autoplay blocked interaction needed", e));
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 15000); // Polling 15s
        audioRef.current = new Audio("/sounds/new-order.mp3");
        return () => clearInterval(interval);
    }, []);

    // Sync History & Stats when dates or tab changes
    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
            fetchStats();
        }
    }, [startDate, endDate, activeTab]);

    const handleSelectOrder = (order: PackingOrder) => {
        if (selectedOrder?.order_id === order.order_id) return;
        setSelectedOrder(order);
        setVideoUrl(null);
    };

    const handleUpload = async (file: File): Promise<string> => {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadSpeed(null);
        const startTime = Date.now();

        try {
            const res = await shipmentService.uploadVideo(file, (pct) => {
                setUploadProgress(pct);
                // Calculate speed
                const elapsedSeconds = (Date.now() - startTime) / 1000;
                if (elapsedSeconds > 0) {
                    const uploadedMB = (file.size * (pct / 100)) / (1024 * 1024);
                    const speed = (uploadedMB / elapsedSeconds).toFixed(2);
                    setUploadSpeed(`${speed} MB/s`);
                }
            });
            console.log("Upload Success, Video URL:", res.url);
            setVideoUrl(res.url);
            toast({ title: "Evidence Recorded", description: "Video uploaded successfully." });
            return res.url;
        } catch (error) {
            console.error("Upload Video Error:", error);
            toast({ variant: "destructive", title: "Upload Failed", description: (error as any).message });
            throw error;
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadSpeed(null);
        }
    };

    const handleConfirmPacking = async (confirmedVideoUrl: string) => {
        if (!selectedOrder) return;
        setIsPacking(true);
        try {
            const data = await shipmentService.createShipment(selectedOrder.order_id, confirmedVideoUrl);
            toast({ title: "Shipment Created", className: "bg-green-600 text-white" });

            try {
                const printToken = await shipmentService.getGHNPrintToken(data.tracking_code);
                if (printToken) {
                    const printUrl = `https://dev-online-gateway.ghn.vn/a5/public-api/printA5?token=${printToken}`;
                    window.open(printUrl, '_blank');
                    toast({ title: "Opening Print Dialog..." });
                }
            } catch (printError) {
                console.error("Print Token Failed", printError);
            }

            // Remove processed order from local queue immediately for better UX
            setQueue(prev => prev.filter(o => o.order_id !== selectedOrder.order_id));
            setSelectedOrder(null);
            setVideoUrl(null);

            // Re-fetch to sync
            fetchQueue();
            fetchHistory(); // Also sync history
        } catch (error: any) {
            toast({ variant: "destructive", title: "Packing Failed", description: error.message });
        } finally {
            setIsPacking(false);
        }
    };

    return (
        <div className="flex bg-neutral-100 flex-col h-[calc(100vh-64px)] w-full overflow-hidden font-sans">
            {/* Global Tab Switcher */}
            <div className="bg-white border-b border-neutral-200 px-6 py-2 flex items-center justify-between shadow-sm z-20">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2 bg-neutral-100/50 p-1 rounded-xl">
                        <TabsTrigger value="queue" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold">
                            <Package className="w-4 h-4" />
                            Live Queue
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold">
                            <History className="w-4 h-4" />
                            Packing History
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-6">
                    {/* Date Selector UI - Only show in history tab if preferred, but global is fine too */}
                    {activeTab === 'history' && (
                        <div className="flex items-center gap-3 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 animate-in fade-in slide-in-from-right-4">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-neutral-600 focus:outline-none cursor-pointer"
                                />
                                <span className="text-neutral-300 font-bold">→</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-neutral-600 focus:outline-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest">Warehouse Monitor</p>
                            <p className="text-sm font-bold text-neutral-600">Active Session</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {activeTab === "queue" ? (
                    <>
                        <PackingQueue
                            queue={queue}
                            selectedOrderId={selectedOrder?.order_id || null}
                            onSelectOrder={handleSelectOrder}
                            isLoading={isLoadingQueue}
                        />

                        <div className="flex-1 flex flex-col h-full overflow-hidden relative border-l border-neutral-200">
                            {selectedOrder ? (
                                <PackingStation
                                    key={selectedOrder.order_id}
                                    order={selectedOrder}
                                    onConfirm={handleConfirmPacking}
                                    onUpload={handleUpload}
                                    isUploading={isUploading}
                                    uploadProgress={uploadProgress}
                                    uploadSpeed={uploadSpeed}
                                    isPacking={isPacking}
                                    videoUrl={videoUrl}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-neutral-400 bg-neutral-50/50">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm mx-auto">
                                            <span className="text-4xl">📦</span>
                                        </div>
                                        <h3 className="text-xl font-medium text-slate-600">No Order Selected</h3>
                                        <p className="text-slate-400 mt-2">Select an order from the queue to start packing.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <PackingHistory 
                        history={history} 
                        isLoading={isLoadingHistory} 
                        stats={stats}
                    />
                )}
            </div>

            <audio ref={audioRef} />
        </div>
    );
}