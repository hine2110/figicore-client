import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PRODUCTS = [
    { id: 1, name: 'Skullpanda The Mare of Animals', sku: 'SKU-001', stock: 1200, price: '$12.00', status: 'Published' },
    { id: 2, name: 'Dimoo Aquarium Series', sku: 'SKU-002', stock: 45, price: '$14.00', status: 'Published' },
    { id: 3, name: 'Secret Item (Hidden)', sku: 'SKU-999', stock: 5, price: '$500.00', status: 'Draft' },
];

export default function ProductManagement() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Product Management</h1>
                    <p className="text-neutral-500">Add, edit, and organize product catalog.</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
            </div>

            <Card className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="Search by name, SKU..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" /> Filters
                    </Button>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {PRODUCTS.map(p => (
                            <tr key={p.id} className="hover:bg-neutral-50">
                                <td className="px-6 py-4 font-medium text-neutral-900">{p.name}</td>
                                <td className="px-6 py-4 font-mono text-neutral-500">{p.sku}</td>
                                <td className="px-6 py-4">{p.stock}</td>
                                <td className="px-6 py-4 font-medium">{p.price}</td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={`${p.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                        {p.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">Edit</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
