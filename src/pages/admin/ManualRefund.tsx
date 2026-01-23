import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ManualRefund() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Manual Refund</h1>
                <p className="text-neutral-500">Process refunds for cancelled or disputed orders.</p>
            </div>

            <Card className="p-8 border-neutral-200 shadow-sm">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Order ID</Label>
                        <div className="flex gap-2">
                            <Input placeholder="FC-xxxx" />
                            <Button variant="outline">
                                <Search className="w-4 h-4" /> Find
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center text-neutral-500 text-sm">
                        Enter Order ID to load details...
                    </div>

                    <div className="space-y-2">
                        <Label>Refund Amount ($)</Label>
                        <Input type="number" placeholder="0.00" />
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input placeholder="e.g. Defective item, Customer cancellation" />
                    </div>

                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Process Refund
                    </Button>
                </div>
            </Card>
        </div>
    );
}
