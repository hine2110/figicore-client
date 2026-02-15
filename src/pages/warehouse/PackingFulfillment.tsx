import { useState, useEffect, useRef } from "react";
import { CheckSquare, Package, Camera, FileVideo, Printer, Loader2, Clock, Search, AlertTriangle, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { shipmentService } from "@/services/shipment.service";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackingSlip } from "@/components/warehouse/PackingSlip";

// --- TYPES UPDATE ---
interface ProductInfo {
    name: string;
    media_urls: string[];
}

interface OrderItem {
    item_id: number;
    quantity: number;
    // Retail / Standard Variant
    product_variants: {
        sku: string;
        option_name: string;
        products: ProductInfo;
        media_assets: any;
        price: number;
    };
    // Blindbox: The REAL item allocated (Backend must include this)
    allocated_variant?: {
        variant_id: number;
        sku: string;
        option_name: string;
        products: {
            name: string;
            media_urls: string[];
        };
        media_assets: any;
    } | null;
    is_blindbox_revealed?: boolean; // Helper flag logic
}

interface Order {
    order_id: number;
    order_code: string;
    created_at: string;
    status_code: string;
    order_items: OrderItem[];
    addresses: {
        recipient_name: string;
        detail_address: string;
        ward_code: string;
        district_id: number;
    };
}

const getMediaAssets = (assets: any): any[] => {
    if (!assets) return [];
    if (Array.isArray(assets)) return assets;
    try {
        return typeof assets === 'string' ? JSON.parse(assets) : [];
    } catch (e) {
        return [];
    }
};

export default function PackingFulfillment() {
    const [queue, setQueue] = useState<Order[]>([]);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPacking, setIsPacking] = useState(false);
    const [trackingCode, setTrackingCode] = useState<string | null>(null);

    // AUDIO REF for Notification
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchQueue = async () => {
        setIsLoadingQueue(true);
        try {
            const data = await shipmentService.getProcessingOrders();

            // --- REALTIME SOUND CHECK ---
            // Nếu độ dài hàng chờ mới > hàng chờ cũ -> Có đơn mới -> Ting Ting
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

        // Init Audio
        audioRef.current = new Audio("/sounds/new-order.mp3"); // Đảm bảo file này tồn tại trong folder public

        return () => clearInterval(interval);
    }, []);

    const handleSelectOrder = (order: Order) => {
        if (selectedOrder?.order_id === order.order_id) return;
        setSelectedOrder(order);
        setCheckedItems({});
        setVideoUrl(null);
        setTrackingCode(null);
    };

    const handleToggleItem = (itemId: number) => {
        setCheckedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId] // Chỉ toggle đúng ID này
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const res = await shipmentService.uploadVideo(file);
            setVideoUrl(res.url);
            toast({ title: "Evidence Recorded", description: "Video uploaded successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Upload Failed" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirmPacking = async () => {
        if (!selectedOrder || !videoUrl) return;
        setIsPacking(true);
        try {
            const data = await shipmentService.createShipment(selectedOrder.order_id, videoUrl);
            setTrackingCode(data.tracking_code);
            toast({ title: "Shipment Created", className: "bg-green-600 text-white" });
            fetchQueue();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Packing Failed", description: error.message });
        } finally {
            setIsPacking(false);
        }
    };

    // --- HELPER: RENDER ITEM INFO ---
    const renderItemInfo = (item: OrderItem) => {
        // --- CRITICAL FIX: BLINDBOX VISIBILITY ---
        // Backend now returns `allocated_variant` if this item is a revealed Blindbox
        const isBlindbox = !!item.allocated_variant;
        // If blindbox, show the allocated (won) item info. Otherwise standard.
        const displayVariant = isBlindbox ? item.allocated_variant! : item.product_variants;

        // Data for Warehouse Staff (Must pack the REAL item)
        const displayName = displayVariant.products.name;
        // Helper to format SKU
        const displaySku = displayVariant.sku;
        const displayOption = displayVariant.option_name;

        // Image Handling
        // 1. Try Variant Specific Asset
        const vImg = getMediaAssets(displayVariant.media_assets)[0]?.url;
        // 2. Try Product General Image
        const pImg = displayVariant.products.media_urls;
        // Parse if string (Legacy data issue)
        let parsedPImg = null;
        if (Array.isArray(pImg)) {
            parsedPImg = pImg[0];
        } else if (typeof pImg === 'string') {
            try { parsedPImg = JSON.parse(pImg)[0]; } catch (e) { }
        }

        const imgUrl = vImg || parsedPImg || "https://placehold.co/100";

        const isChecked = !!checkedItems[item.item_id];

        return (
            <div
                className={`p-4 flex items-center gap-4 transition-colors cursor-pointer border-b last:border-0 ${isChecked ? 'bg-blue-50' : 'hover:bg-neutral-50'}`}
                onClick={() => !trackingCode && handleToggleItem(item.item_id)}
            >
                {/* Checkbox */}
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-neutral-300'}`}>
                    {isChecked && <CheckSquare className="w-4 h-4 text-white" />}
                </div>

                {/* Image */}
                <div className="w-14 h-14 bg-white rounded-md overflow-hidden border border-neutral-200 relative">
                    <img src={imgUrl} alt="Prod" className="w-full h-full object-cover" />
                    {isBlindbox && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                            <EyeOff className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-neutral-900 line-clamp-1">{displayName}</p>
                        {isBlindbox && <Badge className="bg-purple-600 hover:bg-purple-700 text-[10px] h-5 px-1.5">[BLINDBOX REVEAL]</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`font-mono text-xs border-neutral-200 ${isBlindbox ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-neutral-100 text-neutral-500'}`}>
                            {displaySku}
                        </Badge>
                        <span className="text-xs text-neutral-500">{displayOption}</span>
                    </div>
                    {isBlindbox && (
                        <p className="text-[10px] text-red-500 mt-1 italic font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Pack this specific item inside the box!
                        </p>
                    )}
                </div>

                {/* Quantity */}
                <div className="text-right">
                    <Badge variant="secondary" className="text-sm font-bold h-7 px-3">x{item.quantity}</Badge>
                </div>
            </div>
        );
    };

    const allChecked = selectedOrder ? selectedOrder.order_items.every(i => checkedItems[i.item_id]) : false;

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-neutral-100">
            {/* ... (Phần Queue Left Side giữ nguyên) ... */}

            {/* LEFT: QUEUE (30%) */}
            <div className="w-[350px] border-r border-neutral-200 bg-white flex flex-col print:hidden">
                {/* ... Giữ nguyên code phần danh sách ... */}
                <div className="p-4 border-b border-neutral-100">
                    <h2 className="font-bold text-lg mb-2">Packing Queue</h2>
                    <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
                        {/* Render Queue List here similar to previous code */}
                        {queue.map(order => (
                            <div key={order.order_id} onClick={() => handleSelectOrder(order)}
                                className={`p-4 border-b cursor-pointer ${selectedOrder?.order_id === order.order_id ? 'bg-blue-50' : ''}`}>
                                <div className="font-bold">#{order.order_id}</div>
                                <div className="text-xs text-neutral-500">{format(new Date(order.created_at), "HH:mm dd/MM/yyyy")}</div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            </div>

            {/* RIGHT: WORKSPACE */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedOrder ? (
                    <div className="m-auto text-neutral-400">Select an order...</div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-white border-b flex justify-between">
                            <h1 className="text-2xl font-bold">Packing Order #{selectedOrder.order_id}</h1>
                            {/* ... Courier info ... */}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* ITEM LIST */}
                            <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                                <div className="p-3 bg-neutral-50 border-b flex justify-between">
                                    <h3 className="font-bold flex gap-2 items-center"><CheckSquare className="w-4 h-4" /> Verification</h3>
                                    <span className="text-xs text-neutral-500">Check items to confirm pick</span>
                                </div>
                                <div>
                                    {selectedOrder.order_items.map(item => (
                                        <div key={item.item_id}>
                                            {renderItemInfo(item)}
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* VIDEO EVIDENCE */}
                            <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                                <div className="p-3 bg-neutral-50 border-b">
                                    <h3 className="font-bold flex gap-2 items-center"><Camera className="w-4 h-4" /> Evidence</h3>
                                </div>
                                <div className="p-6 flex justify-center">
                                    {/* ... Giữ nguyên logic upload ... */}
                                    {!videoUrl ? (
                                        <div className="text-center">
                                            <Input type="file" accept="video/*" onChange={handleFileUpload} disabled={isUploading} />
                                            <p className="text-xs text-neutral-400 mt-2">
                                                {selectedOrder.order_items.some(i => i.allocated_variant)
                                                    ? "⚠️ Đơn này có Blindbox: Vui lòng quay rõ cảnh bỏ mô hình thật vào hộp."
                                                    : "Quay rõ tem vận đơn."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-green-600 font-bold flex items-center gap-2">
                                            <FileVideo /> Video Ready
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* FOOTER */}
                        <div className="p-6 bg-white border-t">
                            <Button className="w-full h-12 text-lg" disabled={!allChecked || !videoUrl || isPacking} onClick={handleConfirmPacking}>
                                {isPacking ? <Loader2 className="animate-spin" /> : "Confirm & Print Label"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}