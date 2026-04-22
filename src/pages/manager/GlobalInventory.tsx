import { Search, Filter, Download, Sparkles, AlertCircle, TrendingDown, TrendingUp, RefreshCw, ChevronRight, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useGetRecommendations, useTriggerAI, useApplyRecommendation, useGetGlobalInventory } from '@/hooks/useInventoryAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { OpexSettingsDialog } from '@/components/manager/inventory/OpexSettingsDialog';
import { RecommendationDetailDialog } from '@/components/manager/inventory/RecommendationDetailDialog';
import { RestockDetailDialog } from '@/components/manager/inventory/RestockDetailDialog';

export default function GlobalInventory() {
    const { data: recommendations, isLoading } = useGetRecommendations({ status: 'PENDING' });
    const { data: globalInventory, isLoading: isInventoryLoading } = useGetGlobalInventory();
    const triggerAI = useTriggerAI();
    const applyAction = useApplyRecommendation();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [restockDetailOpen, setRestockDetailOpen] = useState(false);
    const [selectedRestockItem, setSelectedRestockItem] = useState<any>(null);

    // Filter, Search & Pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const handleOpenDetail = (item: any) => {
        setSelectedItem(item);
        setDetailOpen(true);
    };

    const handleOpenRestockDetail = (item: any) => {
        setSelectedRestockItem(item);
        setRestockDetailOpen(true);
    };

    // Phân loại đề xuất để hiển thị thành 2 cột
    const restockList = (Array.isArray(recommendations) ? recommendations : []).filter(r => r.type === 'RESTOCK');
    const clearanceList = (Array.isArray(recommendations) ? recommendations : []).filter(r => r.type === 'CLEARANCE');

    // Lọc, Tìm kiếm và phân trang cho Total Stock Distribution
    const filteredInventory = globalInventory?.filter(item => {
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
    }) || [];

    const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedInventory = filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 pb-12">
            {/* 1. Header & Quick Actions */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex gap-3 items-center">
                        Inventory Intelligence
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1.5 h-6">
                            <Sparkles className="w-3 h-3" /> AI Powered
                        </Badge>
                    </h1>
                    <p className="text-neutral-500 mt-1">Monitor stock levels and execute AI-driven optimization strategies.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 shadow-sm border-neutral-200 h-10 px-4 hover:bg-neutral-50"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="gap-2 shadow-sm border-neutral-200">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                    <Button
                        onClick={() => triggerAI.mutate()}
                        disabled={triggerAI.isPending}
                        className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all active:scale-95"
                    >
                        {triggerAI.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        {triggerAI.isPending ? 'Analyzing...' : 'Trigger AI Deep Scan'}
                    </Button>
                </div>
            </div>

            {/* 2. AI Insights Ribbon */}
            <AnimatePresence>
                {Array.isArray(recommendations) && recommendations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xl flex items-center justify-between text-white"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">AI Insights Detected</h3>
                                <p className="text-sm text-neutral-400">
                                    Found {restockList.length} items to restock and {clearanceList.length} items for clearance.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="bg-blue-500/20 text-blue-300 border-none">Sales Up +12%</Badge>
                            <Badge className="bg-red-500/20 text-red-300 border-none">{recommendations.length} Recommendations</Badge>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. AI Recommendations Grid */}
            {(isLoading || (Array.isArray(recommendations) && recommendations.length > 0)) && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* RESTOCK COLUMN */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <h2 className="font-bold text-neutral-800">Restock Recommendations</h2>
                        </div>

                        <div className="space-y-3">
                            {isLoading ? (
                                [1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
                            ) : (
                                restockList.map((item: any, idx: number) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card className="p-4 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 group">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-neutral-900">{item.product_variants.products.name}</span>
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{item.suggested_action_value}</Badge>
                                                    </div>
                                                    <p className="text-xs text-neutral-500 font-mono italic">{item.product_variants.sku}</p>
                                                    <p className="text-sm text-neutral-700 mt-2 line-clamp-2 leading-relaxed">
                                                        <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                                                        {item.reason}
                                                    </p>

                                                    {item.financial_note && (
                                                        <div className="mt-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-2 items-start">
                                                            <TrendingUp className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                                                            <p className="text-[11px] text-blue-800 leading-tight">
                                                                <span className="font-bold">AI Rationale:</span> {item.financial_note}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-neutral-400 mb-1">Current Stock</div>
                                                    <div className="text-xl font-black text-blue-700">{item.product_variants.stock_available}</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-dotted border-neutral-100 flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs gap-1.5 text-neutral-500 hover:text-neutral-900"
                                                    onClick={() => handleOpenRestockDetail(item)}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View Detail
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs gap-1 group-hover:text-blue-600 transition-colors font-bold"
                                                    onClick={() => applyAction.mutate(item.id)}
                                                    disabled={applyAction.isPending}
                                                >
                                                    {applyAction.isPending ? 'Processing...' : 'Restock Order'} <ChevronRight className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CLEARANCE COLUMN */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <TrendingDown className="w-5 h-5 text-orange-600" />
                            <h2 className="font-bold text-neutral-800">Clearance Strategies</h2>
                        </div>
                        <div className="space-y-3">
                            {isLoading ? (
                                [1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
                            ) : (
                                clearanceList.map((item: any, idx: number) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card className="p-4 hover:shadow-lg transition-shadow border-l-4 border-l-orange-500 group">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-neutral-900">{item.product_variants.products.name}</span>
                                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none text-[10px] font-bold">
                                                            -{item.suggested_action_value} OFF
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-neutral-500 font-mono italic">{item.product_variants.sku}</p>
                                                    <p className="text-sm text-neutral-700 mt-2 line-clamp-2 leading-relaxed">
                                                        <Sparkles className="w-3.5 h-3.5 inline mr-1 text-orange-500" />
                                                        {item.reason}
                                                    </p>

                                                    {item.financial_note && (
                                                        <div className="mt-2 p-2 bg-orange-50/50 rounded-lg border border-orange-100 flex gap-2 items-start">
                                                            <AlertCircle className="w-3 h-3 text-orange-600 mt-0.5 shrink-0" />
                                                            <p className="text-[11px] text-orange-800 leading-tight">
                                                                <span className="font-bold">AI Rationale:</span> {item.financial_note}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-neutral-400 mb-1">Overstock</div>
                                                    <div className="text-xl font-black text-orange-700">{item.product_variants.stock_available}</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-dotted border-neutral-100 flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs gap-1.5 text-neutral-500 hover:text-neutral-900"
                                                    onClick={() => handleOpenDetail(item)}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View Detail
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs gap-1 group-hover:text-orange-600 transition-colors font-bold"
                                                    onClick={() => applyAction.mutate(item.id)}
                                                    disabled={applyAction.isPending}
                                                >
                                                    {applyAction.isPending ? 'Processing...' : 'Apply Discount'} <ChevronRight className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Global Inventory Table */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-neutral-900">Total Stock Distribution</h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search Name or SKU..."
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <select
                            className="border border-neutral-200 rounded-lg text-sm bg-white shadow-sm px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 text-neutral-700 font-medium"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="CRITICAL">Critical (≤10)</option>
                            <option value="LOW_STOCK">Low Stock (&lt;50)</option>
                            <option value="OPTIMIZED">Optimized (≥50)</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-100">
                            <tr>
                                <th className="px-6 py-4">Product Name</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4 text-right">Physical Stock</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {isInventoryLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i}><td colSpan={4} className="px-6 py-4"><Skeleton className="h-6 w-full" /></td></tr>
                                ))
                            ) : paginatedInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-neutral-500 italic">
                                        No items found matching the selected status.
                                    </td>
                                </tr>
                            ) : (
                                paginatedInventory.map(item => (
                                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-neutral-900">{item.name}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-500">{item.sku}</td>
                                        <td className="px-6 py-4 text-right font-bold">{item.stock}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="outline" className={`
                                                ${item.stock <= 10 ? 'bg-red-50 text-red-700 border-red-200' :
                                                    item.stock < 50 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        'bg-green-50 text-green-700 border-green-200'}
                                            `}>
                                                {item.stock <= 10 ? 'Critical' : item.stock < 50 ? 'Low Stock' : 'Optimized'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-neutral-500">
                        Showing {filteredInventory.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredInventory.length)} of {filteredInventory.length} entries
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <OpexSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            <RecommendationDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                item={selectedItem}
            />
            <RestockDetailDialog
                open={restockDetailOpen}
                onOpenChange={setRestockDetailOpen}
                item={selectedRestockItem}
            />
        </div>
    );
}
