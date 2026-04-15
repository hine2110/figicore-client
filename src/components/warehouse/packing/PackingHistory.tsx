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
}

export function PackingHistory({ history, isLoading }: PackingHistoryProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredHistory = useMemo(() => {
        return history.filter(item => 
            item.order_id.toString().includes(searchQuery) ||
            item.packer?.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.shipments?.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [history, searchQuery]);

    // Management Stats
    const stats = useMemo(() => {
        const today = new Date().toDateString();
        const packedToday = history.filter(item => new Date(item.packed_at).toDateString() === today);
        
        // Find most active staff member
        const staffCounts: Record<string, number> = {};
        history.forEach(item => {
            const name = item.packer?.users?.full_name || "Unknown";
            staffCounts[name] = (staffCounts[name] || 0) + 1;
        });
        
        const topStaff = Object.entries(staffCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

        return [
            { label: "Total Packed", value: history.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Packed Today", value: packedToday.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Top Packer", value: topStaff, icon: User, color: "text-purple-600", bg: "bg-purple-50" }
        ];
    }, [history]);

    return (
        <div className="flex-1 flex flex-col h-full bg-neutral-50/50 overflow-hidden font-sans">
            {/* Header / Stats */}
            <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600" />
                            Packing Management
                        </h1>
                        <p className="text-neutral-500 mt-1">Monitor fulfillment efficiency and evidence logs</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-neutral-200">
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold">
                            <Clock className="w-4 h-4" />
                            Real-time Ledger
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, idx) => (
                        <Card key={idx} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white/80 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-3 rounded-2xl transition-colors", stat.bg)}>
                                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-neutral-900 truncate">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                            placeholder="Find orders, staff, or tracking codes..."
                            className="pl-12 h-12 bg-neutral-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded-xl text-lg font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-neutral-200 font-bold gap-2 text-neutral-600 hover:bg-neutral-50">
                        <Filter className="w-4 h-4" />
                        Advanced Filter
                    </Button>
                </div>
            </div>

            {/* Content Table */}
            <ScrollArea className="flex-1 px-8 pb-8">
                <div className="space-y-4">
                    {isLoading ? (
                         Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-24 bg-white/50 animate-pulse rounded-2xl border border-neutral-200" />
                        ))
                    ) : filteredHistory.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-neutral-200 p-20 text-center">
                            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-neutral-300" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900">No records matched</h3>
                            <p className="text-neutral-500 mt-2">Try adjusting your search or filters to see more results.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-50/50 border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                <div className="col-span-1">Order</div>
                                <div className="col-span-3">Fulfillment Staff</div>
                                <div className="col-span-2">Packed At</div>
                                <div className="col-span-2">Tracking Code</div>
                                <div className="col-span-2">Evidence</div>
                                <div className="col-span-2 text-right">Action</div>
                            </div>
                            
                            <div className="divide-y divide-neutral-100">
                                <AnimatePresence mode="popLayout">
                                    {filteredHistory.map((order, idx) => (
                                        <motion.div 
                                            key={order.order_id} 
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <div className="col-span-1 font-black text-neutral-900">#{order.order_id}</div>
                                            
                                            <div className="col-span-3 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-neutral-500 font-bold overflow-hidden border-2 border-white shadow-sm">
                                                    {order.packer?.users?.avatar_url ? (
                                                        <img src={order.packer.users.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-neutral-800 leading-none">{order.packer?.users?.full_name || "Self-Packed"}</p>
                                                    <p className="text-[10px] text-neutral-400 mt-1 font-semibold uppercase tracking-wider">Warehouse Ops</p>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-neutral-700">{format(new Date(order.packed_at), "dd MMM yyyy")}</span>
                                                    <span className="text-xs text-neutral-400 font-medium">{format(new Date(order.packed_at), "HH:mm:ss")}</span>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                {order.shipments?.tracking_code ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-mono py-1 rounded-lg">
                                                        {order.shipments.tracking_code}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-neutral-300 italic text-xs">Waiting Carrier...</span>
                                                )}
                                            </div>

                                            <div className="col-span-2">
                                                {order.packing_video_urls && (
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-9 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl px-4 group"
                                                        onClick={() => {
                                                            const urls = typeof order.packing_video_urls === 'string' 
                                                                ? JSON.parse(order.packing_video_urls) 
                                                                : order.packing_video_urls;
                                                            if (urls?.[0]) window.open(urls[0], '_blank');
                                                        }}
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        <span className="text-xs font-bold tracking-tight">CCTV Log</span>
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="col-span-2 text-right">
                                                <Button size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 group">
                                                    <ExternalLink className="w-5 h-5 transition-transform group-hover:scale-110" />
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
