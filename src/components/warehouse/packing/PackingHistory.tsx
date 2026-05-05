import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
    Search, Filter, History, Video, ExternalLink, 
    User, Calendar, Package, TrendingUp, CheckCircle2,
    ArrowUpRight, Clock
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PackingHistoryProps {
    history: any[];
    isLoading: boolean;
    stats: {
        pending: number;
        packed: number;
        delivered: number;
        returned: number;
    };
}

export function PackingHistory({ history, isLoading, stats }: PackingHistoryProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredHistory = useMemo(() => {
        return history.filter(item => 
            item.order_id.toString().includes(searchQuery) ||
            item.order_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.packer?.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.shipments?.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.addresses?.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [history, searchQuery]);

    // Use stats from props
    const displayStats = useMemo(() => [
        { label: "Pending Packing", value: stats.pending, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Successfully Packed", value: stats.packed, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Returns", value: stats.returned, icon: ArrowUpRight, color: "text-rose-600", bg: "bg-rose-50" }
    ], [stats]);

    return (
        <div className="flex-1 flex flex-col h-full bg-neutral-50/50 overflow-hidden font-sans">
            {/* Header / Stats */}
            <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600" />
                            Operations Ledger
                        </h1>
                        <p className="text-neutral-500 mt-1">Real-time fulfillment metrics and evidence logs for the selected range</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {displayStats.map((stat, idx) => (
                        <Card key={idx} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden bg-white group hover:shadow-md transition-all duration-300">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-2xl shrink-0", stat.bg)}>
                                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                                        <h3 className="text-2xl font-black text-neutral-900 truncate tabular-nums">
                                            {stat.value.toLocaleString()}
                                        </h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                            placeholder="Search by Order ID, Code, Staff, Customer or Tracking..."
                            className="pl-11 h-11 bg-neutral-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500/10 rounded-xl text-sm font-semibold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <ScrollArea className="flex-1 px-8 pb-8">
                <div className="space-y-4">
                    {isLoading ? (
                         Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-20 bg-white/50 animate-pulse rounded-2xl border border-neutral-200" />
                        ))
                    ) : filteredHistory.length === 0 ? (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-neutral-200 p-24 text-center">
                            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-neutral-200" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900">No matching orders</h3>
                            <p className="text-neutral-500 mt-2">Try adjusting your filters or date range.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-black text-neutral-400 uppercase tracking-widest items-center">
                                <div className="col-span-2">Order & Customer</div>
                                <div className="col-span-2">Fulfillment Staff</div>
                                <div className="col-span-2">Timeline</div>
                                <div className="col-span-2">Value & Mode</div>
                                <div className="col-span-2">Carrier & Status</div>
                                <div className="col-span-2 text-right px-2">Action / Evidence</div>
                            </div>
                            
                            <div className="divide-y divide-neutral-100">
                                <AnimatePresence mode="popLayout">
                                    {filteredHistory.map((order) => (
                                        <motion.div 
                                            key={order.order_id} 
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="grid grid-cols-12 gap-4 px-6 py-6 items-center hover:bg-neutral-50/50 transition-colors group relative border-l-4 border-l-transparent hover:border-l-blue-500"
                                        >
                                            <div className="col-span-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-neutral-900">#{order.order_id}</span>
                                                    <span className="text-[10px] font-bold text-neutral-400 font-mono tracking-tighter truncate">{order.order_code}</span>
                                                    <div className="mt-2 flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-bold shrink-0">
                                                            {order.addresses?.recipient_name?.charAt(0) || "U"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-neutral-700 truncate">{order.addresses?.recipient_name || "Guest"}</p>
                                                            <p className="text-[9px] font-medium text-neutral-400 truncate">{order.addresses?.province_name || "Unknown Location"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-2 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold overflow-hidden border border-neutral-200">
                                                    {order.packer?.users?.avatar_url ? (
                                                        <img src={order.packer.users.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-neutral-800 leading-tight truncate">{order.packer?.users?.full_name || "System"}</p>
                                                    <p className="text-[10px] text-neutral-400 mt-1 font-bold uppercase tracking-wide">Packer</p>
                                                    
                                                    {order.return_requests?.[0]?.processor?.users?.full_name && (
                                                        <div className="mt-2 pt-2 border-t border-neutral-100">
                                                            <p className="font-bold text-[10px] text-rose-600 leading-tight truncate">
                                                                Return: {order.return_requests[0].processor.users.full_name}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Packed On</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-neutral-700 tabular-nums">
                                                        {order.packed_at ? format(new Date(order.packed_at), "dd MMM, yyyy") : "N/A"}
                                                    </span>
                                                    <span className="text-xs text-neutral-400 font-medium tabular-nums">
                                                        {order.packed_at ? format(new Date(order.packed_at), "HH:mm") : "-"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-base font-black text-neutral-900">
                                                        {Number(order.total_amount).toLocaleString()} VND
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[9px] h-4 font-bold border-neutral-200 px-1.5 text-neutral-500 uppercase">
                                                            {order.payment_method_code}
                                                        </Badge>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] h-4 font-bold px-1.5 uppercase",
                                                            order.channel_code === 'LIVESTREAM' ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                        )}>
                                                            {order.channel_code}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <div className="flex flex-col gap-2">
                                                    {order.shipments?.tracking_code ? (
                                                        <div className="flex items-center gap-1.5 group/track">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="font-mono text-xs font-bold text-emerald-700 tracking-tight">
                                                                {order.shipments.tracking_code}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-neutral-300 italic text-[10px] font-bold tracking-widest">AWAITING_GHN</span>
                                                    )}
                                                    
                                                    <Badge className={cn(
                                                        "w-fit px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border-none",
                                                        order.status_code === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" :
                                                        order.status_code === 'PACKED' ? "bg-blue-100 text-blue-700" :
                                                        order.status_code === 'SHIPPING' ? "bg-amber-100 text-amber-700" :
                                                        order.status_code?.includes('RETURN') ? "bg-rose-100 text-rose-700" :
                                                        "bg-neutral-100 text-neutral-500"
                                                    )}>
                                                        {order.status_code}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                                                {order.packing_video_urls && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="h-10 w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-2xl transition-all"
                                                        onClick={() => {
                                                            const urls = typeof order.packing_video_urls === 'string' 
                                                                ? JSON.parse(order.packing_video_urls) 
                                                                : order.packing_video_urls;
                                                            if (urls?.[0]) window.open(urls[0], '_blank');
                                                        }}
                                                    >
                                                        <Video className="w-5 h-5" />
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" className="rounded-2xl h-10 w-10 p-0 text-neutral-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <ExternalLink className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
