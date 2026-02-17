import { useState, useEffect, useRef } from "react";
import { shipmentService } from "@/services/shipment.service";
import { toast } from "@/components/ui/use-toast";
import { PackingQueue } from "@/components/warehouse/packing/PackingQueue";
import { PackingStation } from "@/components/warehouse/packing/PackingStation";
import { PackingOrder } from "@/types/packing";

export default function PackingFulfillment() {
    const [queue, setQueue] = useState<PackingOrder[]>([]);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PackingOrder | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPacking, setIsPacking] = useState(false);

    // AUDIO REF for Notification
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchQueue = async () => {
        setIsLoadingQueue(true);
        try {
            const data = await shipmentService.getProcessingOrders();
            // --- REALTIME SOUND CHECK ---
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

    const handleSelectOrder = (order: PackingOrder) => {
        if (selectedOrder?.order_id === order.order_id) return;
        setSelectedOrder(order);
        setVideoUrl(null);
    };

    const handleUpload = async (file: File): Promise<string> => {
        setIsUploading(true);
        try {
            const res = await shipmentService.uploadVideo(file);
            setVideoUrl(res.url);
            toast({ title: "Evidence Recorded", description: "Video uploaded successfully." });
            return res.url;
        } catch (error) {
            console.error("Upload Video Error:", error);
            toast({ variant: "destructive", title: "Upload Failed", description: (error as any).message });
            throw error;
        } finally {
            setIsUploading(false);
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
        } catch (error: any) {
            toast({ variant: "destructive", title: "Packing Failed", description: error.message });
        } finally {
            setIsPacking(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-neutral-100 font-sans">
            <PackingQueue
                queue={queue}
                selectedOrderId={selectedOrder?.order_id || null}
                onSelectOrder={handleSelectOrder}
                isLoading={isLoadingQueue}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {selectedOrder ? (
                    <PackingStation
                        key={selectedOrder.order_id} // Force remount on order change
                        order={selectedOrder}
                        onConfirm={handleConfirmPacking}
                        onUpload={handleUpload}
                        isUploading={isUploading}
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
        </div>
    );
}