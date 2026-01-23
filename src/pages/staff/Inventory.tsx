import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAFF_INVENTORY } from "@/lib/staffMockData";
import { useState } from "react";

export default function Inventory() {
    const [items, setItems] = useState(STAFF_INVENTORY);

    // Mock update stock function
    const updateStock = (id: string, delta: number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, currentStock: Math.max(0, item.currentStock + delta) } : item
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Inventory Management</h1>
                    <p className="text-neutral-500">Track stock levels and location.</p>
                </div>
                <Button>Add Product</Button>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -tranneutral-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="text" placeholder="Search by SKU or Name..." className="w-full pl-9 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filters
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-neutral-900">{item.name}</h3>
                                <p className="text-xs text-neutral-500 font-mono mt-1">{item.sku}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.currentStock === 0 ? 'bg-red-100 text-red-700' :
                                item.currentStock < item.minStock ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {item.currentStock === 0 ? 'Out of Stock' : item.currentStock < item.minStock ? 'Low Stock' : 'In Stock'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <p className="text-neutral-500">Location</p>
                                <p className="font-medium text-neutral-900">{item.location}</p>
                            </div>
                            <div>
                                <p className="text-neutral-500">Category</p>
                                <p className="font-medium text-neutral-900">{item.category}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                            <div className="text-sm">
                                Stock: <span className="font-bold text-neutral-900 text-lg ml-1">{item.currentStock}</span>
                            </div>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateStock(item.id, -1)}>-</Button>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateStock(item.id, 1)}>+</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
