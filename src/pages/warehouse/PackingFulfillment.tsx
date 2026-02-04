import { useState, useEffect } from "react";
import { CheckSquare, Package, Camera, FileVideo, Printer, Loader2, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { shipmentService } from "@/services/shipment.service";

import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackingSlip } from "@/components/warehouse/PackingSlip";

// Types
interface OrderItem {
    order_item_id: number;
    product_variants: {
        sku: string;
        option_name: string;
        products: { name: string; media_urls: string[] };
        media_assets: any;
    };
    quantity: number;
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
    if (Array.isArray(assets)) return assets; // Already parsed
    try {
        return typeof assets === 'string' ? JSON.parse(assets) : [];
    } catch (e) {
        console.warn("Failed to parse media assets", e);
        return [];
    }
};

export default function PackingFulfillment() {
    // Queue State
    const [queue, setQueue] = useState<Order[]>([]);
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Selected Order State
    // Updated: Track checked state by ID in a map
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPacking, setIsPacking] = useState(false);
    const [trackingCode, setTrackingCode] = useState<string | null>(null);

    // Fetch Queue
    const fetchQueue = async () => {
        setIsLoadingQueue(true);
        try {
            const data = await shipmentService.getProcessingOrders();
            setQueue(data);
            if (data.length > 0 && !selectedOrder) {
                // Optionally select first
            }
        } catch (error) {
            console.error("Fetch Queue Failed", error);
            toast({ variant: "destructive", title: "Wait!", description: "Failed to load packing queue." });
        } finally {
            setIsLoadingQueue(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        // Poll every 30s
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleSelectOrder = (order: Order) => {
        setSelectedOrder(order);
        setCheckedItems({}); // Reset checks
        setVideoUrl(null);   // Reset video
        setTrackingCode(null); // Reset tracking
    };

    const handleToggleItem = (itemId: number) => {
        setCheckedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const res = await shipmentService.uploadVideo(file);
            setVideoUrl(res.url);
            toast({ title: "Video Uploaded", description: "Evidence recorded successfully." });
        } catch (error) {
            console.error("Upload failed", error);
            toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload video." });
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

            toast({
                title: "Packing Completed",
                description: `Shipment created! Tracking: ${data.tracking_code}`,
                className: "bg-green-50 border-green-200 text-green-900",
            });

            // Auto-open print window (Get Token First)
            try {
                const printToken = await shipmentService.getGHNPrintToken(data.tracking_code);
                const printUrl = `https://dev-online-gateway.ghn.vn/a5/public-api/printA5?token=${printToken}`;
                setTimeout(() => {
                    window.open(printUrl, '_blank', 'width=900,height=600');
                }, 500);
            } catch (err) {
                console.error("Auto-print failed", err);
                toast({ variant: "destructive", title: "Print Error", description: "Could not auto-open GHN label." });
            }

            // Refresh queue
            fetchQueue();
        } catch (error: any) {
            console.error("Packing failed", error);
            toast({
                variant: "destructive",
                title: "Packing Failed",
                description: error.response?.data?.message || "Failed to create shipment order.",
            });
        } finally {
            setIsPacking(false);
        }
    };

    const handlePrintGHN = async () => {
        if (!trackingCode) return;
        try {
            const printToken = await shipmentService.getGHNPrintToken(trackingCode);
            const url = `https://dev-online-gateway.ghn.vn/a5/public-api/printA5?token=${printToken}`;
            window.open(url, '_blank', 'width=900,height=600');
        } catch (error) {
            console.error("Print token failed", error);
            toast({ variant: "destructive", title: "Error", description: "Cannot generate GHN print token." });
        }
    };

    const allItemsChecked = selectedOrder ? selectedOrder.order_items.every(i => checkedItems[i.order_item_id]) : false;

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-neutral-50/50">
            {/* LEFT: QUEUE (30%) */}
            <div className="w-[350px] border-r border-neutral-200 bg-white flex flex-col print:hidden">
                <div className="p-4 border-b border-neutral-100">
                    <h2 className="font-bold text-lg mb-2">Packing Queue</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input placeholder="Search Order ID..." className="pl-9 bg-neutral-50" />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {isLoadingQueue && <div className="p-4 text-center text-sm text-neutral-400">Loading queue...</div>}
                    {!isLoadingQueue && queue.length === 0 && <div className="p-4 text-center text-sm text-neutral-400">No processing orders.</div>}

                    <div className="divide-y divide-neutral-100">
                        {queue.map(order => (
                            <div
                                key={order.order_id}
                                onClick={() => handleSelectOrder(order)}
                                className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${selectedOrder?.order_id === order.order_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-neutral-900">#{order.order_id}</span>
                                    <Badge variant="outline" className="text-[10px] h-5 bg-yellow-50 text-yellow-700 border-yellow-200">
                                        Processing
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-neutral-500 mb-2">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(order.created_at), "HH:mm dd/MM")}
                                </div>
                                <div className="text-xs text-neutral-600 truncate">
                                    {order.order_items.length} items • {order.addresses?.recipient_name}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* RIGHT: WORKSPACE (70%) */}
            <div className="flex-1 flex flex-col overflow-hidden print:hidden">
                {!selectedOrder ? (
                    <div className="flex-1 flex items-center justify-center text-neutral-400 flex-col gap-2">
                        <Package className="w-12 h-12 opacity-20" />
                        <p>Select an order to start packing</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Order Header */}
                        <div className="p-6 border-b border-neutral-200 bg-white flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    Order #{selectedOrder.order_id}
                                    {trackingCode && <Badge className="bg-green-600">Shipped</Badge>}
                                </h1>
                                <p className="text-neutral-500 text-sm mt-1">Recipient: <span className="font-medium text-neutral-900">{selectedOrder.addresses?.recipient_name}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Courier</p>
                                <p className="font-bold text-lg text-blue-600">GHN Express</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* 1. Item Checklist */}
                            <Card className="p-0 overflow-hidden border-neutral-200 shadow-sm">
                                <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
                                    <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                                        <CheckSquare className="w-4 h-4" /> Item Verification
                                    </h3>
                                    <span className="text-xs font-medium text-neutral-500">
                                        {Object.values(checkedItems).filter(Boolean).length}/{selectedOrder.order_items.length} Checked
                                    </span>
                                </div>
                                <div className="divide-y divide-neutral-100">
                                    {selectedOrder.order_items.map(item => (
                                        <div
                                            key={item.order_item_id}
                                            onClick={() => !trackingCode && handleToggleItem(item.order_item_id)}
                                            className={`p-4 flex items-center gap-4 transition-colors cursor-pointer ${checkedItems[item.order_item_id] ? 'bg-blue-50/30' : 'hover:bg-neutral-50'}`}
                                        >
                                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${checkedItems[item.order_item_id] ? 'bg-blue-600 border-blue-600' : 'border-neutral-300'}`}>
                                                {checkedItems[item.order_item_id] && <CheckSquare className="w-4 h-4 text-white" />}
                                            </div>

                                            {/* Product Image */}
                                            <div className="w-12 h-12 bg-neutral-100 rounded-md overflow-hidden border border-neutral-200">
                                                <img
                                                    src={(getMediaAssets(item.product_variants.media_assets)[0]?.url) || item.product_variants.products.media_urls?.[0] || "https://placehold.co/100"}
                                                    alt="Prod"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <p className="font-medium text-neutral-900">{item.product_variants.products.name}</p>
                                                <p className="text-sm text-neutral-500">{item.product_variants.option_name} • <span className="font-mono text-xs">{item.product_variants.sku}</span></p>
                                            </div>

                                            <Badge variant="secondary">x{item.quantity}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* 2. Video Evidence - ONLY Show if items are checked? Or generally required */}
                            <Card className="overflow-hidden border-neutral-200 shadow-sm">
                                <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                                    <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                                        <Camera className="w-4 h-4" /> Packing Evidence
                                    </h3>
                                </div>
                                <div className="p-8 flex flex-col items-center justify-center text-center">
                                    {videoUrl ? (
                                        <div className="flex flex-col items-center text-green-600">
                                            <FileVideo className="w-10 h-10 mb-2" />
                                            <p className="font-medium">Video Uploaded Successfully</p>
                                            <a href={videoUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-1">View Evidence</a>
                                            {!trackingCode && (
                                                <Button variant="ghost" size="sm" onClick={() => setVideoUrl(null)} className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50">Remove</Button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading || !!trackingCode}
                                                />
                                                <Button variant="outline" disabled={isUploading || !!trackingCode} className="gap-2">
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                                    {isUploading ? "Uploading..." : "Record / Upload Video"}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-neutral-400 mt-2 max-w-xs">{!isUploading && "Required for insurance. Please show shipping label clearly."}</p>
                                        </>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-neutral-200 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                            {trackingCode ? (
                                <div className="flex gap-4">
                                    <Button
                                        className="flex-1 h-12 text-lg bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-200"
                                        onClick={handlePrintGHN}
                                    >
                                        <Printer className="w-5 h-5 mr-2" /> In Tem Vận Chuyển (GHN)
                                    </Button>
                                    <Button variant="outline" className="h-12 w-32" onClick={() => setSelectedOrder(null)}>Done</Button>
                                </div>
                            ) : (
                                <Button
                                    className="w-full h-12 text-lg font-bold shadow-md shadow-blue-200"
                                    disabled={!allItemsChecked || !videoUrl || isPacking}
                                    onClick={handleConfirmPacking}
                                >
                                    {isPacking ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Shipment...</>
                                    ) : (
                                        <><Package className="w-5 h-5 mr-2" /> Confirm Packing & Ship</>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Print Component */}
            <PackingSlip order={selectedOrder} trackingCode={trackingCode} />
        </div>
    );
}
