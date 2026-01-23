import { useState } from 'react';
import { RotateCcw, Check, X, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const RETURNS = [
    { id: 'RMA-9021', order: 'ORD-1042', customer: 'Alice Chen', item: 'Molly Chess Series (Bishop)', reason: 'Defective/Damaged', status: 'Pending Review' },
    { id: 'RMA-9020', order: 'ORD-1011', customer: 'Bob Smith', item: 'Skullpanda Dark', reason: 'Changed Mind', status: 'Approved' },
    { id: 'RMA-9019', order: 'ORD-0988', customer: 'Charlie Kim', item: 'Labubu Macaron', reason: 'Wrong Item Sent', status: 'Rejected' },
];

export default function ReturnInspection() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Return Inspection</h1>
                    <p className="text-neutral-500">Quality check and process customer returns.</p>
                </div>
            </div>

            <Card className="border-neutral-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4">RMA ID</th>
                                <th className="px-6 py-4">Order / Customer</th>
                                <th className="px-6 py-4">Item & Reason</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {RETURNS.map(rma => (
                                <tr key={rma.id} className="hover:bg-neutral-50 group">
                                    <td className="px-6 py-4 font-medium text-neutral-900">{rma.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{rma.order}</div>
                                        <div className="text-neutral-500 text-xs">{rma.customer}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium truncate max-w-[200px]">{rma.item}</div>
                                        <div className="text-neutral-500 text-xs">{rma.reason}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`
                                            ${rma.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                rma.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'}
                                        `}>
                                            {rma.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="ghost" title="View Details"><Eye className="w-4 h-4" /></Button>
                                            {rma.status === 'Pending Review' && (
                                                <>
                                                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Approve">
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Reject">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
