import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PENDING_APPROVALS = [
    { id: 'RMA-9015', value: '$250.00', reason: 'High Value Return', requester: 'Staff: Sarah Jones', date: 'Today, 10:00 AM' },
    { id: 'RMA-9011', value: '$120.00', reason: 'Damaged > 3 items', requester: 'Staff: Mike Ross', date: 'Yesterday' },
];

export default function ReturnApprovals() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Return Approvals</h1>
                    <p className="text-neutral-500">Authorize high-value or escalated returns.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {PENDING_APPROVALS.map(item => (
                    <Card key={item.id} className="p-6 border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-neutral-900">{item.id}</span>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Needs Approval</Badge>
                            </div>
                            <div className="text-sm text-neutral-500 mb-2">
                                Requested by <span className="font-medium text-neutral-900">{item.requester}</span> • {item.date}
                            </div>
                            <div className="font-medium text-neutral-900">Reason: {item.reason}</div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="block text-xs text-neutral-500">Refund Amount</span>
                                <span className="block text-xl font-bold text-neutral-900">{item.value}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <X className="w-4 h-4 mr-2" /> Reject
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    <Check className="w-4 h-4 mr-2" /> Approve
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {PENDING_APPROVALS.length === 0 && (
                    <div className="text-center py-12 text-neutral-500">
                        No pending approvals.
                    </div>
                )}
            </div>
        </div>
    );
}
