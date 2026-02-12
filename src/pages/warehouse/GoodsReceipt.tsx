import { useState, useEffect } from 'react';
import { Package, Search, Plus, ChevronRight, AlertTriangle, Box, Check, X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';
import { optionsService } from '@/services/options.service';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface ReceiptItem {
    variant_id: number;
    option_name: string;
    sku: string;
    quantity_good: number;
    quantity_defect: number;
}

export default function GoodsReceipt() {
    const { toast } = useToast();
    // State
    const [search, setSearch] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState<string>("all"); // NEW: Brand Filter
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    // Quick Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newBrandId, setNewBrandId] = useState<string>("");
    const [newVariants, setNewVariants] = useState<string[]>(["Standard"]);
    const [brands, setBrands] = useState<any[]>([]);

    // Load Brands for Filter & Quick Create
    useEffect(() => {
        optionsService.getBrands().then(setBrands).catch(console.error);
    }, []);

    // Search Effect (Text + Brand)
    useEffect(() => {
        const fetch = async () => {
            // If searching by text, wait for 2 chars. If filtering by brand only (empty search), allow it.
            if (search.length < 1 && selectedBrandId === 'all') {
                setSearchResults([]);
                return;
            }

            try {
                const payload: any = { search };
                if (selectedBrandId && selectedBrandId !== 'all') {
                    payload.brand_id = Number(selectedBrandId);
                }

                const res = await productsService.getProducts(payload);
                setSearchResults(Array.isArray(res) ? res : (res as any).data || []);
            } catch (err) {
                console.error(err);
            }
        };
        const timeout = setTimeout(fetch, 300);
        return () => clearTimeout(timeout);
    }, [search, selectedBrandId]);


    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setSearch("");
        setSelectedBrandId("all"); // Reset filter on select
        setSearchResults([]);

        // Initialize Matrix
        // Initialize Matrix
        if (product.product_variants) {
            let variantsToDisplay = product.product_variants;

            // PREORDER Logic: Removed Shared Stock restriction to allow individual variant allocation
            // if (product.type_code === 'PREORDER') { ... }

            setReceiptItems(variantsToDisplay.map((v: any) => ({
                variant_id: v.variant_id,
                option_name: v.option_name,
                sku: v.sku,
                quantity_good: 0,
                quantity_defect: 0
            })));
        }
    };

    const updateItem = (variantId: number, field: 'quantity_good' | 'quantity_defect', val: string) => {
        // Allow empty string for better UX while typing
        if (val === '') {
            setReceiptItems(prev => prev.map(i => i.variant_id === variantId ? { ...i, [field]: 0 } : i));
            return;
        }
        const qty = Math.max(0, parseInt(val) || 0);
        setReceiptItems(prev => prev.map(i => i.variant_id === variantId ? { ...i, [field]: qty } : i));
    };

    const handleQuickCreate = async () => {
        if (!newName || !newBrandId) {
            toast({ title: "Incomplete Data", description: "Name and Brand are required.", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const res = await productsService.quickCreate({
                name: newName,
                brand_id: Number(newBrandId),
                variant_names: newVariants.filter(v => v.trim() !== "")
            });
            // Auto Select
            handleSelectProduct((res as any).data || res); // Adapt based on api response structure
            setIsCreateOpen(false);
            setNewName("");
            setNewVariants(["Standard"]);
            setNewBrandId("");
            toast({ title: "Draft Created", description: "Product draft created and selected.", className: "bg-blue-600 text-white" });
        } catch (error) {
            console.error(error);
            toast({ title: "Create Failed", description: "Could not create draft product.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async () => {
        const validItems = receiptItems.filter(i => i.quantity_good > 0 || i.quantity_defect > 0);
        if (validItems.length === 0) {
            toast({ title: "No Quantities", description: "Please enter at least one quantity.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await inventoryService.createReceipt({
                note,
                items: validItems.map(i => ({
                    variant_id: i.variant_id,
                    quantity_good: i.quantity_good,
                    quantity_defect: i.quantity_defect
                }))
            });
            toast({ title: "Import Successful", description: "Inventory has been updated successfully.", className: "bg-green-600 text-white" });
            setSelectedProduct(null);
            setReceiptItems([]);
            setNote("");
        } catch (error: any) {
            console.error(error);
            toast({ title: "Import Failed", description: error.message || "Something went wrong.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Helper for Preorder
    const isPreorder = selectedProduct?.type_code === 'PREORDER';

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6 lg:p-10 font-sans text-neutral-900 transition-all">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Inbound Receipt</h1>
                        <p className="text-neutral-500 mt-1 font-medium">Process incoming stock efficiently.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Search & Context (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Search Card - Split Design */}
                        <div className="relative z-30">
                            <div className="flex items-center bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-none pl-1 h-16 w-full relative z-20 group focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                                {/* Brand Selector */}
                                <div className="shrink-0">
                                    <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                                        <SelectTrigger className="w-[110px] sm:w-[130px] border-none shadow-none focus:ring-0 h-full font-semibold text-neutral-700 bg-transparent text-xs sm:text-sm pl-4">
                                            <SelectValue placeholder="All Brands" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Brands</SelectItem>
                                            {brands.map(b => (
                                                <SelectItem key={b.brand_id} value={b.brand_id.toString()}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Divider */}
                                <div className="h-8 w-[1px] bg-neutral-100 mx-1 shrink-0" />

                                {/* Text Input */}
                                <div className="relative flex-1 h-full">
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full h-full pl-9 pr-4 bg-transparent border-none text-base outline-none ring-0 placeholder:text-neutral-400 text-neutral-900"
                                        placeholder="Search product..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Dropdown Results */}
                            {(search.length > 0 || (selectedBrandId !== 'all' && searchResults.length > 0)) && (
                                <div className="absolute top-20 left-0 right-0 bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_40px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {searchResults.length > 0 ? (
                                        <div className="py-2 max-h-[300px] overflow-y-auto">
                                            {searchResults.map((p, idx) => (
                                                <div
                                                    key={p.product_id}
                                                    className={cn(
                                                        "px-5 py-3 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center transition-colors group",
                                                        idx !== searchResults.length - 1 && "border-b border-neutral-100"
                                                    )}
                                                    onClick={() => handleSelectProduct(p)}
                                                >
                                                    <div>
                                                        <div className="font-semibold text-neutral-800 group-hover:text-blue-700 transition-colors">{p.name}</div>
                                                        <div className="text-xs text-neutral-400 mt-0.5">{p.brand_name}</div>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 font-normal group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{p.type_code}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                            <p className="text-sm text-neutral-500">No products found matching filters.</p>
                                            <Button
                                                variant="ghost"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 h-auto py-2 px-4 rounded-xl font-medium"
                                                onClick={() => setIsCreateOpen(true)}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Quick Draft
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Product Context */}
                        {selectedProduct ? (
                            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                                <div className="pl-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <Badge variant="outline" className="rounded-full px-3 py-1 border-neutral-200 text-neutral-500 bg-neutral-50/50 uppercase tracking-wider text-[10px] font-semibold">
                                            {selectedProduct.brands?.name || 'No Brand'}
                                        </Badge>
                                        {isPreorder && (
                                            <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Pre-order
                                            </Badge>
                                        )}
                                    </div>

                                    <h2 className="text-2xl font-bold text-neutral-900 leading-tight mb-2">
                                        {selectedProduct.name}
                                    </h2>

                                    <div className="flex items-center gap-4 text-sm text-neutral-500 mt-6 pt-6 border-t border-dashed border-neutral-100">
                                        <div className="flex-1">
                                            <span className="block text-xs uppercase text-neutral-400 font-semibold tracking-wider mb-1">Total Variants</span>
                                            <span className="text-xl font-medium text-neutral-900">{receiptItems.length}</span>
                                        </div>
                                        <div className="flex-1 border-l border-neutral-100 pl-4">
                                            <span className="block text-xs uppercase text-neutral-400 font-semibold tracking-wider mb-1">Series</span>
                                            <span className="text-base font-medium text-neutral-900 truncate block">{selectedProduct.series?.name || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/50 border border-dashed border-neutral-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-neutral-400 gap-3">
                                <Box className="w-12 h-12 opacity-20" />
                                <p className="text-sm font-medium">No product selected</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Matrix (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <Card className="rounded-3xl border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden bg-white flex-1 flex flex-col h-[600px]">
                            {/* Card Header */}
                            <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="text-lg font-semibold text-neutral-900">Receiving Matrix</h3>
                                <div className="bg-neutral-100 rounded-full px-4 py-1.5 flex items-center gap-2">
                                    <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Total Units</span>
                                    <span className="text-sm font-bold text-neutral-900 tabular-nums">
                                        {receiptItems.reduce((a, b) => a + (b.quantity_good || 0) + (b.quantity_defect || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="flex-1 overflow-auto">
                                {receiptItems.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-neutral-50/50 sticky top-0 z-10 backdrop-blur-sm">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="pl-6 h-12 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Variant Details</TableHead>
                                                <TableHead className="text-center h-12 text-[11px] font-bold uppercase tracking-wider text-green-600/70 w-[140px]">Good Qty</TableHead>
                                                <TableHead className="text-center h-12 text-[11px] font-bold uppercase tracking-wider text-red-600/70 w-[140px]">Defect Qty</TableHead>
                                                <TableHead className="pr-6 text-right h-12 text-[11px] font-bold uppercase tracking-wider text-neutral-400 w-[100px]">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {receiptItems.map((item) => (
                                                <TableRow key={item.variant_id} className="group border-b border-neutral-50 hover:bg-neutral-50/60 transition-colors">
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-semibold text-neutral-900 text-sm group-hover:text-blue-700 transition-colors">{item.option_name}</span>
                                                            <span className="font-mono text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded w-fit">{item.sku}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={item.quantity_good || ''}
                                                            onChange={e => updateItem(item.variant_id, 'quantity_good', e.target.value)}
                                                            className="h-10 text-center font-semibold text-green-700 bg-neutral-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all shadow-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={item.quantity_defect || ''}
                                                            onChange={e => updateItem(item.variant_id, 'quantity_defect', e.target.value)}
                                                            className="h-10 text-center font-semibold text-red-700 bg-neutral-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all shadow-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right font-medium text-neutral-600 tabular-nums">
                                                        {(item.quantity_good || 0) + (item.quantity_defect || 0)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-4 min-h-[300px]">
                                        <div className="w-16 h-16 rounded-3xl bg-neutral-50 flex items-center justify-center">
                                            <Package className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm">Search and select a product to populate the matrix.</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Sticky Action Footer - Floating Style */}
                        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-white/50 flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                                </div>
                                <Input
                                    placeholder="Add an optional reference note or PO number..."
                                    className="pl-9 border-transparent bg-neutral-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>
                            <Button
                                size="lg"
                                className="w-full md:w-auto h-12 rounded-full px-8 bg-black hover:bg-neutral-800 text-white font-medium shadow-lg shadow-neutral-900/10 hover:shadow-xl hover:shadow-neutral-900/20 hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-sm"
                                onClick={handleCommit}
                                disabled={loading || receiptItems.length === 0}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">Processing...</span>
                                ) : (
                                    <span className="flex items-center gap-2">Commit<Check className="w-4 h-4 ml-1" /></span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Create Dialog - Premium Style */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                        <div className="px-6 py-6 bg-gradient-to-b from-neutral-50 to-white">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-center">New Product Draft</DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="px-6 pb-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Product Name</label>
                                <Input
                                    placeholder="Enter product name"
                                    className="rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 h-11"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Brand</label>
                                <Select onValueChange={setNewBrandId} value={newBrandId}>
                                    <SelectTrigger className="rounded-xl bg-neutral-50 border-transparent h-11 focus:ring-2 focus:ring-blue-500/20">
                                        <SelectValue placeholder="Select Brand" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                                        {brands.map(b => <SelectItem key={b.brand_id} value={b.brand_id.toString()} className="rounded-lg cursor-pointer">{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Variant Options</label>
                                </div>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                    {newVariants.map((v, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={v}
                                                onChange={e => {
                                                    const copy = [...newVariants];
                                                    copy[idx] = e.target.value;
                                                    setNewVariants(copy);
                                                }}
                                                className="rounded-xl bg-neutral-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 h-10"
                                                placeholder="e.g. Standard"
                                            />
                                            {newVariants.length > 1 && (
                                                <Button variant="ghost" size="icon" className="shrink-0 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-10 h-10" onClick={() => setNewVariants(prev => prev.filter((_, i) => i !== idx))}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed border-neutral-300 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900" onClick={() => setNewVariants(prev => [...prev, ""])}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Another Variant
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                            <Button variant="ghost" className="rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button className="rounded-xl bg-black hover:bg-neutral-800 text-white shadow-lg shadow-black/10" onClick={handleQuickCreate} disabled={loading}>Create Draft</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
