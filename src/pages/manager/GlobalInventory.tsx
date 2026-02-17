import { Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const GLOBAL_INVENTORY = [
    { id: '1', name: 'Skullpanda The Mare of Animals', sku: 'SKU-001', category: 'Blind Box', stock: 1200, value: 14400, trend: 'up' },
    { id: '2', name: 'Dimoo Aquarium Series', sku: 'SKU-002', category: 'Figures', stock: 45, value: 3150, trend: 'down' },
    { id: '3', name: 'Labubu The Monsters', sku: 'SKU-003', category: 'Plush', stock: 0, value: 0, trend: 'stable' },
    { id: '4', name: 'Hirono Little Mischief', sku: 'SKU-004', category: 'Blind Box', stock: 240, value: 2880, trend: 'up' },
];

export default function GlobalInventory() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Inventory Overview</h1>
                    <p className="text-neutral-500">Global stock levels and valuation.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                    <Button>Restock Analysis</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-neutral-200">
                    <div className="text-sm text-neutral-500 mb-1">Total Valuation</div>
                    <div className="text-3xl font-bold text-neutral-900">$124,590.00</div>
                    <div className="text-xs text-green-600 font-medium mt-2">+12% vs last month</div>
                </Card>
                <Card className="p-6 border-neutral-200">
                    <div className="text-sm text-neutral-500 mb-1">Low Stock Items</div>
                    <div className="text-3xl font-bold text-neutral-900">12</div>
                    <div className="text-xs text-red-600 font-medium mt-2">Requires attention</div>
                </Card>
                <Card className="p-6 border-neutral-200">
                    <div className="text-sm text-neutral-500 mb-1">Top Category</div>
                    <div className="text-3xl font-bold text-neutral-900">Blind Box</div>
                    <div className="text-xs text-neutral-500 mt-2">65% of revenue</div>
                </Card>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="Search products..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" /> Filter
                    </Button>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-100">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Stock</th>
                            <th className="px-6 py-4 text-right">Total Value</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {GLOBAL_INVENTORY.map(item => (
                            <tr key={item.id} className="hover:bg-neutral-50">
                                <td className="px-6 py-4 font-medium text-neutral-900">{item.name}</td>
                                <td className="px-6 py-4 font-mono text-xs text-neutral-500">{item.sku}</td>
                                <td className="px-6 py-4">{item.category}</td>
                                <td className="px-6 py-4 text-right font-medium">{item.stock}</td>
                                <td className="px-6 py-4 text-right text-neutral-500">${item.value.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <Badge variant="outline" className={`
                                        ${item.stock === 0 ? 'bg-red-50 text-red-700 border-red-200' :
                                            item.stock < 50 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-green-50 text-green-700 border-green-200'}
                                    `}>
                                        {item.stock === 0 ? 'Out of Stock' : item.stock < 50 ? 'Low Stock' : 'Healthy'}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
