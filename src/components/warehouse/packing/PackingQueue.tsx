import { motion } from "framer-motion";
import { format } from "date-fns";
import { Package, Clock, ChevronRight, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PackingOrder } from "@/types/packing";

interface PackingQueueProps {
    queue: PackingOrder[];
    selectedOrderId: number | null;
    onSelectOrder: (order: PackingOrder) => void;
    isLoading: boolean;
}

export function PackingQueue({ queue, selectedOrderId, onSelectOrder, isLoading }: PackingQueueProps) {
    return (
        <div className="w-[380px] border-r border-neutral-200 bg-white flex flex-col h-full print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 bg-white/50 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-xl text-neutral-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Packing Queue
                    </h2>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        {queue.length} Pending
                    </Badge>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Search Order ID..."
                        className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white transition-all rounded-xl"
                    />
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 bg-neutral-50/30">
                <div className="p-3 space-y-2">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-20 bg-neutral-100 animate-pulse rounded-xl" />
                        ))
                    ) : queue.length === 0 ? (
                        <div className="text-center py-10 text-neutral-400 flex flex-col items-center">
                            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                                <Package className="w-6 h-6 opacity-30" />
                            </div>
                            <p>No orders pending</p>
                        </div>
                    ) : (
                        queue.map((order, idx) => (
                            <motion.div
                                key={order.order_id}
                                layoutId={`order-${order.order_id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => onSelectOrder(order)}
                                className={cn(
                                    "p-4 rounded-xl cursor-pointer border transition-all duration-200 group relative overflow-hidden",
                                    selectedOrderId === order.order_id
                                        ? "bg-white border-blue-500 shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
                                        : "bg-white border-transparent hover:border-neutral-200 hover:shadow-sm"
                                )}
                            >
                                {selectedOrderId === order.order_id && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                                    />
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-neutral-900 text-lg">#{order.order_id}</span>
                                    {/* Time elapsed could go here properly calculated */}
                                    <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(order.created_at), "HH:mm")}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-neutral-500">
                                        {format(new Date(order.created_at), "dd/MM/yyyy")}
                                    </div>
                                    <ChevronRight className={cn(
                                        "w-4 h-4 text-neutral-300 transition-transform duration-300",
                                        selectedOrderId === order.order_id ? "text-blue-500 translate-x-1" : "group-hover:translate-x-1"
                                    )} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
