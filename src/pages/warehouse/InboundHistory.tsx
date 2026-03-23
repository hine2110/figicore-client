import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Download,
    FileText,
    Filter,
    Loader2,
    Search,
    User,
    X,
    Package,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { inventoryService } from "@/services/inventory.service";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// --- Types ---
interface ReceiptItem {
    item_id: number;
    quantity_total: number;
    quantity_good: number;
    quantity_defect: number;
    product_variants: {
        sku: string;
        option_name: string;
        products: {
            name: string;
            media_urls: string[];
        };
    };
}

interface Receipt {
    receipt_id: number;
    created_at: string;
    note: string;
    status_code: string;
    warehouse_staff_id: number;
    employees?: {
        users: {
            full_name: string;
            avatar_url?: string;
        };
    };
    inventory_receipt_items: ReceiptItem[];
}

export function InboundHistory() {
    // --- State ---
    const [data, setData] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    // Approval Modal State
    const [isApprovalOpen, setIsApprovalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [approvalItems, setApprovalItems] = useState<any[]>([]);
    const [isApproving, setIsApproving] = useState(false);
    const { toast } = useToast();

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [date, setDate] = useState<DateRange | undefined>();

    // --- Effects ---
    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch Data
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 10 };
            if (debouncedSearch) params.search = debouncedSearch;
            if (date?.from) params.startDate = date.from.toISOString();
            if (date?.to) params.endDate = date.to.toISOString();

            const res: any = await inventoryService.getHistory(params);

            // Handle API response structure safely
            const receipts = res.data || [];
            setData(receipts);
            setTotalPages(res.meta?.total_pages || 1);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [page, debouncedSearch, date]);

    // --- Handlers ---
    const toggleRow = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleClearDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDate(undefined);
    };

    const handleOpenApproval = (e: React.MouseEvent, receipt: Receipt) => {
        e.stopPropagation();
        setSelectedReceipt(receipt);
        setApprovalItems(receipt.inventory_receipt_items.map(item => ({
            item_id: item.item_id,
            quantity_total: item.quantity_total,
            quantity_good: item.quantity_total, // Default to suggested amount
            quantity_defect: 0,
            option_name: item.product_variants.option_name,
            sku: item.product_variants.sku,
            name: item.product_variants.products.name
        })));
        setIsApprovalOpen(true);
    };

    const handleUpdateApprovalItem = (itemId: number, field: 'quantity_good' | 'quantity_defect', val: string) => {
        if (val === '') {
            setApprovalItems(prev => prev.map(i => i.item_id === itemId ? { ...i, [field]: 0 } : i));
            return;
        }
        const qty = Math.max(0, parseInt(val) || 0);
        setApprovalItems(prev => prev.map(i => i.item_id === itemId ? { ...i, [field]: qty } : i));
    };

    const handleSubmitApproval = async () => {
        if (!selectedReceipt) return;
        setIsApproving(true);
        try {
            await inventoryService.completeReceipt(selectedReceipt.receipt_id, {
                items: approvalItems.map(i => ({
                    item_id: i.item_id,
                    quantity_good: i.quantity_good,
                    quantity_defect: i.quantity_defect
                }))
            });
            toast({ title: "Approved", description: "Receipt approved and stock updated successfully.", className: "bg-green-600 text-white" });
            setIsApprovalOpen(false);
            fetchHistory();
        } catch (error: any) {
            console.error(error);
            toast({ title: "Approval Failed", description: error.response?.data?.message || error.message || "Failed to approve receipt", variant: "destructive" });
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            {/* Header Section with Gradient Accent */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-800 p-8 shadow-2xl shadow-neutral-900/10 text-white">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <Package className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-blue-200 uppercase tracking-wider">Warehouse Operations</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Inbound History</h2>
                        <p className="text-neutral-400 mt-2 max-w-xl">
                            Review and manage your complete history of stock receipts. Track performance and inventory flow in real-time.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                            <Filter className="w-4 h-4 mr-2" />
                            Advanced Filters
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border-none transition-all hover:scale-105 active:scale-95">
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar - Floating & Glassy */}
            <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-2 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="flex flex-col md:flex-row gap-2 items-center justify-between">

                    {/* Search Input */}
                    <div className="relative w-full md:max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <Input
                            placeholder="Search receipt ID, staff name, product name, or notes..."
                            className="pl-10 h-11 bg-neutral-100/50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full md:w-[260px] h-11 justify-start text-left font-medium rounded-xl border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group",
                                        !date && "text-neutral-500"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-blue-100 flex items-center justify-center mr-2 transition-colors">
                                        <CalendarIcon className="w-4 h-4 text-neutral-500 group-hover:text-blue-600" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Date Range</span>
                                        <span className="text-sm truncate">
                                            {date?.from ? (
                                                date.to ? (
                                                    <>{format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}</>
                                                ) : (
                                                    format(date.from, "MMM dd, yyyy")
                                                )
                                            ) : "All Time"}
                                        </span>
                                    </div>
                                    {date && (
                                        <div
                                            role="button"
                                            onClick={handleClearDate}
                                            className="ml-auto hover:bg-red-100 p-1.5 rounded-full transition-colors group/clear"
                                        >
                                            <X className="w-3 h-3 text-neutral-400 group-hover/clear:text-red-500" />
                                        </div>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0 z-[50] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-neutral-100 rounded-2xl overflow-hidden ring-1 ring-black/5"
                                align="end"
                                style={{ backgroundColor: "white" }}
                            >
                                <div className="p-3 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Select Period</span>
                                    <Badge variant="secondary" className="bg-white text-xs font-normal">History View</Badge>
                                </div>
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    className="p-4 bg-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-900/5 bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50/80 backdrop-blur-md sticky top-0 z-10">
                        <TableRow className="border-neutral-100 hover:bg-transparent">
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead className="py-5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Receipt Details</TableHead>
                            <TableHead className="py-5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Received By</TableHead>
                            <TableHead className="py-5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Note</TableHead>
                            <TableHead className="py-5 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-400 pr-8">Performance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4 text-neutral-400 animate-pulse">
                                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        </div>
                                        <span className="text-sm font-medium">Syncing warehouse data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4 text-neutral-300">
                                        <div className="w-20 h-20 rounded-3xl bg-neutral-50 flex items-center justify-center transform rotate-12">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-semibold text-neutral-900">No records found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((receipt) => {
                                const isExpanded = expandedRows.includes(receipt.receipt_id);
                                const totalItems = receipt.inventory_receipt_items.length;
                                const totalQuantity = receipt.inventory_receipt_items.reduce((acc, item) => acc + item.quantity_total, 0);
                                const totalDefects = receipt.inventory_receipt_items.reduce((acc, item) => acc + item.quantity_defect, 0);
                                const hasDefects = totalDefects > 0;

                                return (
                                    <>
                                        <TableRow
                                            key={receipt.receipt_id}
                                            className={cn(
                                                "group cursor-pointer border-neutral-50 transition-all hover:bg-neutral-50/80 relative",
                                                isExpanded && "bg-neutral-50/80 shadow-[inset_3px_0_0_0_#3b82f6]"
                                            )}
                                            onClick={() => toggleRow(receipt.receipt_id)}
                                        >
                                            <TableCell className="pl-6">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "w-8 h-8 rounded-full transition-all duration-300",
                                                        isExpanded
                                                            ? "bg-blue-100 text-blue-600 rotate-180"
                                                            : "bg-neutral-100 text-neutral-400 group-hover:bg-white group-hover:shadow-md group-hover:text-blue-500"
                                                    )}
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </Button>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="w-fit font-mono text-[10px] bg-white text-neutral-500 border-neutral-200">
                                                            #{receipt.receipt_id}
                                                        </Badge>
                                                        <Badge className={cn("text-[8px] px-1.5 py-0 border-none shadow-none uppercase tracking-wider font-bold h-4 flex items-center justify-center", receipt.status_code === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>
                                                            {receipt.status_code}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-neutral-800">
                                                            {format(new Date(receipt.created_at), "MMM dd, yyyy")}
                                                        </span>
                                                        <span className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                                                            {format(new Date(receipt.created_at), "HH:mm")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-3 group/user">
                                                    <div className="relative">
                                                        <Avatar className="w-9 h-9 border-2 border-white shadow-sm transition-transform group-hover/user:scale-110">
                                                            <AvatarImage src={receipt.employees?.users?.avatar_url} />
                                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold">
                                                                {receipt.employees?.users?.full_name?.substring(0, 2).toUpperCase() || "ST"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-neutral-900 group-hover/user:text-blue-600 transition-colors">
                                                            {receipt.employees?.users?.full_name || "Unknown Staff"}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-400">Verified User</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {receipt.note ? (
                                                    <div className="flex items-start gap-2 max-w-[200px]">
                                                        <div className="w-1 h-8 rounded-full bg-yellow-400/50 shrink-0"></div>
                                                        <span className="text-sm text-neutral-600 line-clamp-2 italic leading-snug">
                                                            "{receipt.note}"
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-neutral-300 italic">No notes attached</span>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right pr-8">
                                                <div className="flex flex-col items-end gap-2">
                                                    {receipt.status_code === 'PENDING' ? (
                                                        <Button 
                                                            size="sm" 
                                                            className="h-8 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                                                            onClick={(e) => handleOpenApproval(e, receipt)}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Draft
                                                        </Button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            {hasDefects && (
                                                                <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-100">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {totalDefects} Issues
                                                                </div>
                                                            )}
                                                            <Badge className="bg-neutral-900 hover:bg-neutral-800 text-white border-none px-3 py-1 text-xs shadow-lg shadow-neutral-900/10">
                                                                {totalQuantity} Units
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] font-medium text-neutral-400">
                                                        Across <span className="text-neutral-900 font-bold">{totalItems}</span> Product SKUs
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Row Detail with "Folder Open" Effect */}
                                        {isExpanded && (
                                            <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50 border-b border-neutral-100 shadow-[inset_0_-1px_0_0_#f5f5f5]">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="pl-16 pr-6 py-6 animate-in slide-in-from-top-4 fade-in duration-300">
                                                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl shadow-neutral-200/40 overflow-hidden ring-1 ring-black/[0.02]">
                                                            {/* Nested Header */}
                                                            <div className="px-6 py-4 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-blue-100/50 rounded-lg">
                                                                        <Package className="w-4 h-4 text-blue-600" />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Received Items Breakdown</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-semibold text-neutral-400 uppercase">Quality Check:</span>
                                                                    <div className="flex h-1.5 w-24 bg-neutral-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="bg-green-500 h-full"
                                                                            style={{ width: `${((totalQuantity - totalDefects) / totalQuantity) * 100}%` }}
                                                                        />
                                                                        <div
                                                                            className="bg-red-500 h-full"
                                                                            style={{ width: `${(totalDefects / totalQuantity) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="border-neutral-50 hover:bg-transparent bg-neutral-50/30">
                                                                        <TableHead className="pl-6 h-10 text-[10px] font-bold uppercase text-neutral-400">Product Info</TableHead>
                                                                        <TableHead className="h-10 text-[10px] font-bold uppercase text-neutral-400">Specs</TableHead>
                                                                        <TableHead className="text-right h-10 text-[10px] font-bold uppercase text-green-600">Passed</TableHead>
                                                                        <TableHead className="text-right h-10 text-[10px] font-bold uppercase text-red-600">Failed</TableHead>
                                                                        <TableHead className="text-right h-10 pr-6 text-[10px] font-bold uppercase text-neutral-400">Total Qty</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {receipt.inventory_receipt_items.map((item) => (
                                                                        <TableRow key={item.item_id} className="border-neutral-50 hover:bg-blue-50/20 transition-colors">
                                                                            <TableCell className="pl-6 py-3">
                                                                                <div>
                                                                                    <div className="font-semibold text-sm text-neutral-800">{item.product_variants.products.name}</div>
                                                                                    {item.quantity_defect > 0 && (
                                                                                        <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-0.5 animate-pulse">
                                                                                            <AlertCircle className="w-3 h-3" /> Attention Needed
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <Badge variant="outline" className="w-fit text-[10px] bg-neutral-50 text-neutral-600 border-neutral-200">
                                                                                        {item.product_variants.option_name}
                                                                                    </Badge>
                                                                                    <span className="text-[10px] font-mono text-neutral-400 tracking-tight">{item.product_variants.sku}</span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-right">
                                                                                <span className="font-bold text-green-600 bg-green-50/50 px-2.5 py-1 rounded-md text-xs border border-green-100">
                                                                                    {item.quantity_good}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-right">
                                                                                {item.quantity_defect > 0 ? (
                                                                                    <span className="font-bold text-red-600 bg-red-50/50 px-2.5 py-1 rounded-md text-xs border border-red-100 shadow-sm">
                                                                                        {item.quantity_defect}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-neutral-200 text-xs">—</span>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-right pr-6">
                                                                                <span className="font-bold text-neutral-900">
                                                                                    {item.quantity_total}
                                                                                </span>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Footer with Gradient */}
                <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-neutral-500 font-medium bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-sm">
                        Showing page <span className="text-neutral-900 font-bold">{page}</span> of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="h-8 rounded-lg bg-white shadow-sm hover:shadow border-neutral-200 text-xs transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <ChevronLeft className="w-3 h-3 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="h-8 rounded-lg bg-white shadow-sm hover:shadow border-neutral-200 text-xs transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Next <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Approval Dialog */}
            <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
                <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="px-6 py-6 bg-gradient-to-b from-amber-50 to-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-amber-500" />
                                Approve Inventory Draft #{selectedReceipt?.receipt_id}
                            </DialogTitle>
                            <DialogDescription className="text-neutral-500 mt-2">
                                Review the AI-generated restock quantities and confirm the actual received amounts.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Product Details</TableHead>
                                    <TableHead className="text-xs text-center w-[120px]">Suggested Qty</TableHead>
                                    <TableHead className="text-xs text-center text-green-600 w-[140px]">Good Qty</TableHead>
                                    <TableHead className="text-xs text-center text-red-600 w-[140px]">Defect Qty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvalItems.map(item => (
                                    <TableRow key={item.item_id}>
                                        <TableCell>
                                            <div className="font-semibold text-sm text-neutral-800">{item.name}</div>
                                            <div className="text-[10px] text-neutral-500 flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="font-normal text-[10px]">{item.option_name}</Badge>
                                                <span className="font-mono bg-neutral-100 px-1 rounded">{item.sku}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-neutral-600">
                                            {item.quantity_total}
                                        </TableCell>
                                        <TableCell align="center">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-20 rounded-xl h-10 border border-neutral-200 bg-neutral-50 px-3 text-center text-sm font-semibold text-green-700 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 outline-none transition-all mx-auto block"
                                                value={item.quantity_good === 0 && item.quantity_good.toString() !== '0' ? '' : item.quantity_good}
                                                onChange={e => handleUpdateApprovalItem(item.item_id, 'quantity_good', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-20 rounded-xl h-10 border border-neutral-200 bg-neutral-50 px-3 text-center text-sm font-semibold text-red-700 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 outline-none transition-all mx-auto block"
                                                value={item.quantity_defect === 0 && item.quantity_defect.toString() !== '0' ? '' : item.quantity_defect}
                                                onChange={e => handleUpdateApprovalItem(item.item_id, 'quantity_defect', e.target.value)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex gap-2 justify-end">
                        <Button variant="ghost" className="rounded-xl text-neutral-600" onClick={() => setIsApprovalOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20" onClick={handleSubmitApproval} disabled={isApproving}>
                            {isApproving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Approving...</span> : "Confirm & Update Stock"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
