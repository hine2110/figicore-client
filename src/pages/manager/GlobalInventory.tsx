import { Search, Download, Sparkles, AlertCircle, TrendingDown, TrendingUp, RefreshCw, ChevronRight, Settings, Eye, Package, Boxes, ShoppingCart, DollarSign, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useGetRecommendations, useTriggerAI, useApplyRecommendation, useGetGlobalInventory } from '@/hooks/useInventoryAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { OpexSettingsDialog } from '@/components/manager/inventory/OpexSettingsDialog';
import { RecommendationDetailDialog } from '@/components/manager/inventory/RecommendationDetailDialog';
import { RestockDetailDialog } from '@/components/manager/inventory/RestockDetailDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalInventory() {
    const { data: recommendations, isLoading } = useGetRecommendations({ status: 'PENDING', limit: '200' });
    const { data: globalInventory, isLoading: isInventoryLoading } = useGetGlobalInventory();
    const triggerAI = useTriggerAI();
    const applyAction = useApplyRecommendation();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [restockDetailOpen, setRestockDetailOpen] = useState(false);
    const [selectedRestockItem, setSelectedRestockItem] = useState<any>(null);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // AI Recommendation Pagination & Tab state
    const [activeRecTab, setActiveRecTab] = useState<'RESTOCK' | 'CLEARANCE'>('RESTOCK');
    const [recPage, setRecPage] = useState(1);
    const REC_PER_PAGE = 6;

    const formatVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    // 1. Calculate KPI Metrics
    const kpis = useMemo(() => {
        const inventory = Array.isArray(globalInventory) ? globalInventory : [];
        const recs = Array.isArray(recommendations) ? recommendations : [];
        
        const critical = inventory.filter(i => i.stock <= 10).length;
        const restockNeeded = recs.filter(r => r.type === 'RESTOCK').length;
        const clearanceNeeded = recs.filter(r => r.type === 'CLEARANCE').length;
        const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.cost_price), 0);

        return {
            critical,
            restockNeeded,
            clearanceNeeded,
            totalSKUs: inventory.length,
            totalValue
        };
    }, [globalInventory, recommendations]);

    // 2. Filter & Paginate AI Recommendations
    const filteredRecs = useMemo(() => {
        const list = (Array.isArray(recommendations) ? recommendations : [])
            .filter(r => r.type === activeRecTab);
        
        const totalPages = Math.ceil(list.length / REC_PER_PAGE) || 1;
        const startIndex = (recPage - 1) * REC_PER_PAGE;
        const paginated = list.slice(startIndex, startIndex + REC_PER_PAGE);

        return { list: paginated, totalPages, totalCount: list.length };
    }, [recommendations, activeRecTab, recPage]);

    // 3. Filter & Paginate Global Inventory Table
    const filteredInventory = useMemo(() => {
        return (Array.isArray(globalInventory) ? globalInventory : []).filter(item => {
            let statusMatch = true;
            if (statusFilter === 'CRITICAL') statusMatch = item.stock <= 10;
            else if (statusFilter === 'LOW_STOCK') statusMatch = item.stock > 10 && item.stock < 50;
            else if (statusFilter === 'OPTIMIZED') statusMatch = item.stock >= 50;

            let searchMatch = true;
            if (searchTerm.trim()) {
                const lowerTerm = searchTerm.toLowerCase();
                const nameMatch = item.name?.toLowerCase().includes(lowerTerm);
                const skuMatch = item.sku?.toLowerCase().includes(lowerTerm);
                searchMatch = Boolean(nameMatch || skuMatch);
            }
            return statusMatch && searchMatch;
        });
    }, [globalInventory, statusFilter, searchTerm]);

    const totalInventoryPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedInventory = filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleOpenDetail = (item: any) => {
        setSelectedItem(item);
        setDetailOpen(true);
    };

    const handleOpenRestockDetail = (item: any) => {
        setSelectedRestockItem(item);
        setRestockDetailOpen(true);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-neutral-900 flex items-center gap-3">
                        Inventory Intelligence
                        <Badge className="bg-purple-600 text-white border-none gap-1.5 h-6 px-2">
                            <Sparkles className="w-3 h-3 fill-current" /> AI Powered
                        </Badge>
                    </h1>
                    <p className="text-neutral-500 mt-1">Enterprise-grade stock optimization & financial forecasting.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="icon" className="h-10 w-10 border-neutral-200" onClick={() => setSettingsOpen(true)}>
                        <Settings className="w-4 h-4 text-neutral-600" />
                    </Button>
                    <Button variant="outline" className="gap-2 border-neutral-200 h-10 px-4">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button
                        onClick={() => triggerAI.mutate()}
                        disabled={triggerAI.isPending}
                        className="gap-2 bg-neutral-900 hover:bg-black text-white h-10 px-5 shadow-lg shadow-neutral-200"
                    >
                        {triggerAI.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {triggerAI.isPending ? 'Analyzing...' : 'Trigger AI Deep Scan'}
                    </Button>
                </div>
            </div>

            {/* --- ZONE 2: AI RECOMMENDATIONS --- */}
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                <Tabs value={activeRecTab} onValueChange={(v: any) => { setActiveRecTab(v); setRecPage(1); }} className="w-full">
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-neutral-50/50 border-b border-neutral-100 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                            </div>
                            <h2 className="font-bold text-neutral-900 uppercase tracking-wider text-sm">AI Optimization Hub</h2>
                        </div>
                        <TabsList className="bg-neutral-200/50 p-1 rounded-xl">
                            <TabsTrigger value="RESTOCK" className="rounded-lg px-4 font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600">
                                Restock ({kpis.restockNeeded})
                            </TabsTrigger>
                            <TabsTrigger value="CLEARANCE" className="rounded-lg px-4 font-bold data-[state=active]:bg-white data-[state=active]:text-orange-600">
                                Clearance ({kpis.clearanceNeeded})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                            </div>
                        ) : filteredRecs.list.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200">
                                <RefreshCw className="w-10 h-10 mb-3 opacity-20" />
                                <p className="font-medium">No pending {activeRecTab.toLowerCase()} recommendations.</p>
                                <p className="text-xs">Run a Deep Scan to update insights.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AnimatePresence mode="wait">
                                        {filteredRecs.list.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <Card className={`group relative p-5 h-full flex flex-col border-none shadow-md hover:shadow-xl transition-all rounded-2xl ${
                                                    activeRecTab === 'RESTOCK' ? 'bg-blue-50/30' : 'bg-orange-50/30'
                                                }`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-neutral-900 truncate">{item.product_variants.products.name}</h4>
                                                                {activeRecTab === 'CLEARANCE' && (
                                                                    <Badge className="bg-orange-500 text-white border-none text-[10px] h-5">
                                                                        -{item.suggested_action_value}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-mono text-neutral-500 uppercase">{item.product_variants.sku}</p>
                                                        </div>
                                                        <div className="text-right ml-4 shrink-0">
                                                            <p className="text-[10px] text-neutral-400 font-bold uppercase mb-0.5">Stock</p>
                                                            <p className={`text-xl font-black ${activeRecTab === 'RESTOCK' ? 'text-blue-600' : 'text-orange-600'}`}>
                                                                {item.product_variants.stock_available}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-2">
                                                        <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-neutral-100">
                                                            <p className="text-xs text-neutral-700 line-clamp-3 italic leading-relaxed">
                                                                <AlertCircle className={`w-3 h-3 inline mr-1 ${activeRecTab === 'RESTOCK' ? 'text-blue-500' : 'text-orange-500'}`} />
                                                                {item.reason}
                                                            </p>
                                                        </div>
                                                        {item.financial_note && (
                                                            <div className={`p-2 rounded-lg flex gap-2 items-start ${activeRecTab === 'RESTOCK' ? 'bg-blue-100/50' : 'bg-orange-100/50'}`}>
                                                                <TrendingUp className={`w-3 h-3 mt-0.5 shrink-0 ${activeRecTab === 'RESTOCK' ? 'text-blue-700' : 'text-orange-700'}`} />
                                                                <p className={`text-[10px] leading-tight ${activeRecTab === 'RESTOCK' ? 'text-blue-800' : 'text-orange-900'}`}>
                                                                    <span className="font-bold">AI Rationale:</span> {item.financial_note}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 pt-3 flex items-center justify-between">
                                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-0" onClick={() => activeRecTab === 'RESTOCK' ? handleOpenRestockDetail(item) : handleOpenDetail(item)}>
                                                            <Eye className="w-3.5 h-3.5 mr-1" /> View Analysis
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className={`h-8 rounded-lg px-4 text-[10px] font-black uppercase transition-all active:scale-95 ${
                                                                activeRecTab === 'RESTOCK' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'
                                                            }`}
                                                            onClick={() => applyAction.mutate(item.id)}
                                                            disabled={applyAction.isPending}
                                                        >
                                                            {applyAction.isPending ? 'Working...' : activeRecTab === 'RESTOCK' ? 'Restock' : 'Apply Promo'}
                                                        </Button>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* AI Recommendation Pagination */}
                                {filteredRecs.totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 pt-4">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={recPage === 1} onClick={() => setRecPage(p => p - 1)}>
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-xs font-bold text-neutral-500 px-2">Page {recPage} of {filteredRecs.totalPages}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={recPage === filteredRecs.totalPages} onClick={() => setRecPage(p => p + 1)}>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>

            {/* --- ZONE 3: GLOBAL INVENTORY TABLE --- */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-neutral-900" />
                        <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Total Stock Distribution</h2>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by name, SKU..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <select
                            className="bg-white border border-neutral-200 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-purple-500/20 outline-none"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="CRITICAL">Critical (≤10)</option>
                            <option value="LOW_STOCK">Low Stock (&lt;50)</option>
                            <option value="OPTIMIZED">Optimized (≥50)</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50/80 text-neutral-400 font-bold uppercase text-[10px] tracking-widest border-b border-neutral-100">
                                <tr>
                                    <th className="px-6 py-4">Product Info</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                    <th className="px-6 py-4 text-right">Physical Stock</th>
                                    <th className="px-6 py-4 text-right">Sales (30d)</th>
                                    <th className="px-6 py-4 text-center">Health Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {isInventoryLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full" /></td></tr>
                                    ))
                                ) : paginatedInventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 italic">No inventory matching the filters.</td>
                                    </tr>
                                ) : (
                                    paginatedInventory.map(item => {
                                        const hasAI = (recommendations || []).some((r: any) => r.variant_id === item.id && r.status === 'PENDING');
                                        return (
                                            <tr key={item.id} className="hover:bg-neutral-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-neutral-900 group-hover:text-purple-600 transition-colors">{item.name}</span>
                                                            {hasAI && (
                                                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none text-[8px] h-4 px-1">
                                                                    <Sparkles className="w-2 h-2 mr-0.5 fill-current" /> AI FLAG
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-neutral-400 font-mono mt-0.5">{item.sku}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-neutral-600">{formatVND(item.price)}</td>
                                                <td className="px-6 py-4 text-right font-black text-neutral-900">{item.stock}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-neutral-800">{item.sales30d} units</span>
                                                        <span className="text-[9px] text-neutral-400 uppercase font-bold">Velocity</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant="outline" className={`
                                                        rounded-full font-bold text-[10px] border-none px-3
                                                        ${item.stock <= 10 ? 'bg-red-50 text-red-700' :
                                                            item.stock < 50 ? 'bg-orange-50 text-orange-700' :
                                                                'bg-green-50 text-green-700'}
                                                    `}>
                                                        {item.stock <= 10 ? 'CRITICAL' : item.stock < 50 ? 'LOW STOCK' : 'OPTIMIZED'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Table Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-2 py-4 gap-4">
                    <span className="text-xs font-medium text-neutral-500">
                        Showing <span className="text-neutral-900 font-bold">{startIndex + 1}</span> to <span className="text-neutral-900 font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredInventory.length)}</span> of <span className="text-neutral-900 font-bold">{filteredInventory.length}</span> SKUs
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalInventoryPages)].map((_, i) => (
                                <button
                                    key={i}
                                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                        currentPage === i + 1 ? 'bg-neutral-900 text-white shadow-lg' : 'bg-white text-neutral-500 hover:bg-neutral-50'
                                    }`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-bold" onClick={() => setCurrentPage(p => Math.min(totalInventoryPages, p + 1))} disabled={currentPage === totalInventoryPages}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <OpexSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            <RecommendationDetailDialog open={detailOpen} onOpenChange={setDetailOpen} item={selectedItem} />
            <RestockDetailDialog open={restockDetailOpen} onOpenChange={setRestockDetailOpen} item={selectedRestockItem} />
        </div>
    );
}

// Sub-component for KPI Cards
function KPICard({ title, value, icon, color, isLarge = false }: any) {
    const colors = {
        red: 'border-red-100 bg-red-50/30 text-red-700',
        blue: 'border-blue-100 bg-blue-50/30 text-blue-700',
        orange: 'border-orange-100 bg-orange-50/30 text-orange-700',
        green: 'border-green-100 bg-green-50/30 text-green-700',
        neutral: 'border-neutral-100 bg-neutral-50/30 text-neutral-700'
    };

    return (
        <Card className={`p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.02] ${colors[color as keyof typeof colors]}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-xl bg-white shadow-sm border border-neutral-50">
                    {icon}
                </div>
                {isLarge && <Badge className="bg-green-600 text-white border-none text-[8px] animate-pulse">VALUABLE</Badge>}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{title}</p>
                <p className={`font-black tracking-tight ${isLarge ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
            </div>
        </Card>
    );
}

