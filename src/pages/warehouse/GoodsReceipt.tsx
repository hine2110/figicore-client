import { useState } from 'react';
import { Package, Trash2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
//import { InboundSearch } from './components/InboundSearch';
import { inventoryService } from '@/services/inventory.service';
// import { useToast } from "@/components/ui/use-toast";

interface DraftItem {
    id: number;
    name: string;
    sku: string;
    quantity: number;
}

export default function GoodsReceipt() {
    // const { toast } = useToast();
    const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddProduct = (product: any) => {
        const existing = draftItems.find(i => i.id === product.product_id);
        if (existing) {
            // Already added, maybe focus or increment?
            // toast({ title: "Already in list", variant: "warning" });
            return;
        }

        // Default SKU finding
        const sku = product.product_variants?.[0]?.sku || 'UNKNOWN-SKU';

        setDraftItems(prev => [
            {
                id: product.product_id,
                name: product.name,
                sku: sku,
                quantity: 1
            },
            ...prev
        ]);
    };

    const updateQuantity = (id: number, val: string) => {
        const qty = parseInt(val) || 0;
        setDraftItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: qty } : item
        ));
    };

    const removeItem = (id: number) => {
        setDraftItems(prev => prev.filter(item => item.id !== id));
    };

    const handleCommit = async () => {
        if (draftItems.length === 0) return;
        setIsSubmitting(true);
        try {
            await inventoryService.createReceipt({
                type: 'INBOUND_PO',
                items: draftItems.map(i => ({
                    product_id: i.id,
                    sku: i.sku,
                    quantity: i.quantity
                }))
            });
            // Success
            setDraftItems([]);
            // toast({ title: "Receipt committed successfully!", className: "bg-green-600 text-white" });
            alert("Receipt committed successfully!");
        } catch (error) {
            console.error(error);
            alert("Error committing receipt");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Inbound Workbench</h1>
                    <p className="text-neutral-500">Create inbound receipts and manage incoming stock.</p>
                </div>
                <Button className="gap-2" onClick={handleCommit} disabled={isSubmitting || draftItems.length === 0}>
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Processing..." : "Commit Receipt"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Search & List */}
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex justify-between items-center">
                                <span>Add Product</span>
                                {/*<InboundSearch onSelectProduct={handleAddProduct} /> */}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-neutral-50">
                                        <TableHead>Product / SKU</TableHead>
                                        <TableHead className="w-[150px]">Input Quantity</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draftItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-neutral-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Package className="w-8 h-8 opacity-20" />
                                                    <p>Receipt is empty.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        draftItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-neutral-500 font-mono">{item.sku}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                                                        className="h-9 w-24 text-center"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Instructions / Stats */}
                <div className="space-y-6">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="pt-6">
                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Inbound Guidelines
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                                <li>Scan barcode or search by product name.</li>
                                <li>If not found, use <strong>"Quick Create"</strong> in search.</li>
                                <li>Double check physical quantity.</li>
                                <li>Click <strong>"Commit Receipt"</strong> to finalize (GRN).</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Receipt Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Total Products:</span>
                                <span className="font-medium">{draftItems.length} items</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Total Quantity:</span>
                                <span className="font-bold text-lg">
                                    {draftItems.reduce((acc, i) => acc + i.quantity, 0)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
