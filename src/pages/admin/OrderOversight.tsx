import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Download, 
    Filter, 
    Search, 
    Eye, 
    Edit2, 
    Archive, 
    MoreVertical, 
    ShoppingBag, 
    Store, 
    Globe, 
    Activity, 
    ChevronRight,
    Monitor,
    PlayCircle,
    Gavel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com';

export default function OrderOversight() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [channelFilter, setChannelFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/orders`, {
                params: {
                    status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined,
                    channel: channelFilter !== 'all' ? channelFilter : undefined
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, channelFilter]);

    const filteredOrders = orders.filter(o => 
        o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.users?.full_name || 'Guest').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'DELIVERED':
            case 'COMPLETED':
                return { label: 'Completed', variant: 'default', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold' };
            case 'PROCESSING':
            case 'PACKED':
            case 'SHIPPING':
            case 'SHIPPED':
                return { label: status, variant: 'secondary', color: 'bg-blue-50 text-blue-700 border-blue-100 font-bold' };
            case 'PENDING_PAYMENT':
            case 'WAITING_DEPOSIT':
            case 'DEPOSITED':
                return { label: status.replace('_', ' '), variant: 'outline', color: 'bg-amber-50 text-amber-700 border-amber-100 font-bold' };
            case 'CANCELLED':
            case 'EXPIRED':
                return { label: status, variant: 'destructive', color: 'bg-rose-50 text-rose-700 border-rose-100 font-bold' };
            default:
                return { label: status, variant: 'outline', color: 'bg-neutral-50 text-neutral-500' };
        }
    };

    const getChannelBadge = (channel: string) => {
        switch (channel) {
            case 'POS':
                return { label: 'Store (POS)', icon: Store, color: 'bg-neutral-900 text-white border-transparent' };
            case 'WEB':
                return { label: 'Website', icon: Globe, color: 'bg-blue-600 text-white border-transparent' };
            case 'LIVESTREAM':
                return { label: 'Livestream', icon: PlayCircle, color: 'bg-rose-600 text-white border-transparent' };
            case 'AUCTION':
                return { label: 'Auction', icon: Gavel, color: 'bg-purple-600 text-white border-transparent' };
            default:
                return { label: channel, icon: ShoppingBag, color: 'bg-neutral-100 text-neutral-600' };
        }
    };

    const renderOrderTable = () => (
        <div className="bg-white rounded-[1.5rem] border border-neutral-200 shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
                        <TableHead className="w-[180px] pl-6 font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Order Details</TableHead>
                        <TableHead className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Customer</TableHead>
                        <TableHead className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider text-center">Channel</TableHead>
                        <TableHead className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Items Summary</TableHead>
                        <TableHead className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Total Amount</TableHead>
                        <TableHead className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-right pr-6 font-bold text-neutral-400 text-[11px] uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-20">
                                <Activity className="w-8 h-8 animate-spin mx-auto text-neutral-200 mb-2" />
                                <span className="text-neutral-400 font-medium">Loading orders...</span>
                            </TableCell>
                        </TableRow>
                    ) : filteredOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-20">
                                <ShoppingBag className="w-12 h-12 mx-auto text-neutral-100 mb-4" />
                                <p className="text-neutral-400 font-bold">No orders found</p>
                                <p className="text-xs text-neutral-300">Try adjusting your filters or search query.</p>
                            </TableCell>
                        </TableRow>
                    ) : filteredOrders.map((order) => {
                        const statusBadge = getStatusBadge(order.status_code);
                        const channelInfo = getChannelBadge(order.channel_code);
                        const itemsCount = order.order_items?.length || 0;
                        const firstItemName = order.order_items?.[0]?.product_variants?.products?.name || "Product";
                        const productSummary = itemsCount > 1 ? `${firstItemName} + ${itemsCount - 1} more` : firstItemName;

                        return (
                            <TableRow key={order.order_id} className="group hover:bg-neutral-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.order_id}`}>
                                <TableCell className="pl-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-mono font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">{order.order_code}</span>
                                        <span className="text-[11px] text-neutral-400 font-medium">{new Date(order.created_at).toLocaleString()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-500">
                                            {(order.users?.full_name || 'G').charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-neutral-800 leading-none mb-1">{order.users?.full_name || 'Guest Customer'}</span>
                                            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-tighter">{order.users ? 'Registered' : 'POS Guest'}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn("rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tighter gap-1.5", channelInfo.color)}>
                                        <channelInfo.icon className="w-3 h-3" />
                                        {channelInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-neutral-700 truncate max-w-[200px]">{productSummary}</span>
                                        <span className="text-[10px] text-neutral-400 font-medium">{itemsCount} units total</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-black text-neutral-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 text-[10px] font-bold border", statusBadge.color)}>
                                        {statusBadge.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-neutral-100">
                                                <MoreVertical className="h-4 w-4 text-neutral-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl p-2 border-neutral-200">
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.order_id}`}>
                                                <Eye className="w-4 h-4 text-neutral-500" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                                <Edit2 className="w-4 h-4 text-neutral-500" /> Update Status
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600 font-bold">
                                                <Archive className="w-4 h-4" /> Cancel Order
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                        <Activity className="w-3.5 h-3.5" />
                        Management Suite
                    </div>
                    <h1 className="text-4xl font-black text-neutral-900 tracking-tight">Order Oversight</h1>
                    <p className="text-neutral-500 font-medium">Monitor real-time transactions across all physical and digital channels.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 h-12 px-6 font-bold text-neutral-600 gap-2">
                        <Download className="w-4 h-4" /> Export Ledger
                    </Button>
                    <Button className="rounded-2xl bg-neutral-900 text-white shadow-lg shadow-neutral-900/10 h-12 px-8 font-black gap-2 hover:bg-neutral-800">
                        <Activity className="w-4 h-4" /> Force Sync
                    </Button>
                </div>
            </div>

            {/* Main Tabs Area */}
            <Tabs defaultValue="all" onValueChange={setChannelFilter} className="w-full">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <TabsList className="bg-neutral-100/80 p-1.5 rounded-[1.2rem] w-fit border border-neutral-200/50 backdrop-blur-md">
                        <TabsTrigger value="all" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                            <Activity className="w-3.5 h-3.5" />
                            All Channels
                        </TabsTrigger>
                        <TabsTrigger value="ONLINE" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                            <Globe className="w-3.5 h-3.5" />
                            Online Sales
                        </TabsTrigger>
                        <TabsTrigger value="POS" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                            <Store className="w-3.5 h-3.5" />
                            Retail (POS)
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group min-w-[320px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input 
                                placeholder="Filter by Code, Name, or Phone..." 
                                className="pl-11 h-12 rounded-[1.1rem] border-neutral-200 bg-white focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] h-12 rounded-[1.1rem] bg-white border-neutral-200 font-bold text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-neutral-200">
                                <SelectItem value="all" className="font-bold">All Statuses</SelectItem>
                                <SelectItem value="pending_payment" className="font-medium text-amber-600">Pending</SelectItem>
                                <SelectItem value="processing" className="font-medium text-blue-600">Processing</SelectItem>
                                <SelectItem value="completed" className="font-medium text-emerald-600">Completed</SelectItem>
                                <SelectItem value="cancelled" className="font-medium text-rose-600">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="h-12 w-12 p-0 rounded-[1.1rem] border-neutral-200 bg-white">
                            <Filter className="w-4 h-4 text-neutral-400" />
                        </Button>
                    </div>
                </div>

                <TabsContent value="all" className="mt-0 outline-none">
                    {renderOrderTable()}
                </TabsContent>
                <TabsContent value="ONLINE" className="mt-0 outline-none">
                    {renderOrderTable()}
                </TabsContent>
                <TabsContent value="POS" className="mt-0 outline-none">
                    {renderOrderTable()}
                </TabsContent>
            </Tabs>
        </div>
    );
}

