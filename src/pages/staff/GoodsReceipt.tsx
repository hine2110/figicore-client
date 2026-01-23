import { useState } from 'react';
import { Package, Truck, CheckCircle, AlertTriangle, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const INCOMING_SHIPMENTS = [
    { id: 'GRN-2024-001', supplier: 'PopMart Official', arrived: 'Today, 08:30 AM', items: 250, status: 'Pending' },
    { id: 'GRN-2024-002', supplier: 'Mighty Jaxx', arrived: 'Yesterday', items: 120, status: 'In Progress' },
    { id: 'GRN-2024-003', supplier: 'Tokidoki', arrived: 'Jan 20, 2026', items: 500, status: 'Completed' },
];

export default function GoodsReceipt() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Goods Receipt</h1>
                    <p className="text-neutral-500">Process incoming shipments and inventory.</p>
                </div>
                <Button className="gap-2">
                    <Truck className="w-4 h-4" />
                    New Shipment
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2">
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                            <h2 className="font-semibold text-neutral-900">Incoming Deliveries</h2>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input type="text" placeholder="Search GRN..." className="w-full pl-8 pr-4 py-1.5 text-sm border rounded-md" />
                            </div>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {INCOMING_SHIPMENTS.map(item => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-neutral-50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-neutral-900 flex items-center gap-2">
                                                {item.id}
                                                <Badge variant="outline" className="text-[10px]">{item.supplier}</Badge>
                                            </div>
                                            <div className="text-sm text-neutral-500 flex items-center gap-2">
                                                <span>{item.arrived}</span>
                                                <span>•</span>
                                                <span>{item.items} items</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={`${item.status === 'Completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                item.status === 'In Progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                                    'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                            } border-0`}>
                                            {item.status}
                                        </Badge>
                                        <Button variant="ghost" size="sm">Details</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <h3 className="font-bold text-lg text-neutral-900 mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium">Received Today</span>
                                </div>
                                <span className="font-bold">250</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    <span className="text-sm font-medium">Discrepancies</span>
                                </div>
                                <span className="font-bold">2</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-2">Instructions</h3>
                        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                            <li>Verify carrier seal matches manifest.</li>
                            <li>Check for visible package damage.</li>
                            <li>Scan items individually for blinding box sets.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
