import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Printer } from "lucide-react";

const MOCK_ORDERS = [
    { id: '#FC-1024', customer: 'John Doe', items: 3, total: 299.00, status: 'Pending', time: '10 mins ago', priority: 'High' },
    { id: '#FC-1023', customer: 'Jane Smith', items: 1, total: 45.50, status: 'Processing', time: '25 mins ago', priority: 'Normal' },
    { id: '#FC-1022', customer: 'Mike Ross', items: 5, total: 1250.00, status: 'Packing', time: '1 hour ago', priority: 'High' },
    { id: '#FC-1021', customer: 'Rachel Zane', items: 2, total: 89.99, status: 'Ready', time: '2 hours ago', priority: 'Normal' },
    { id: '#FC-1020', customer: 'Donna Paulsen', items: 1, total: 199.00, status: 'Pending', time: '2.5 hours ago', priority: 'Low' },
];

export default function OrderProcessing() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Order Queue</h1>
                    <p className="text-neutral-500">Manage and process incoming fulfillment requests.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Batch
                    </Button>
                    <Button size="sm">Refresh Queue</Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="w-[100px]">Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_ORDERS.map((order) => (
                            <TableRow key={order.id} className="hover:bg-neutral-50/50">
                                <TableCell className="font-medium text-blue-600 font-mono">
                                    {order.id}
                                    <div className="text-[10px] text-neutral-400 font-normal">{order.time}</div>
                                </TableCell>
                                <TableCell>{order.customer}</TableCell>
                                <TableCell>{order.items} items</TableCell>
                                <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                                <TableCell>
                                    {order.priority === 'High' && (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">High</Badge>
                                    )}
                                    {order.priority === 'Normal' && (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">Normal</Badge>
                                    )}
                                    {order.priority === 'Low' && (
                                        <Badge variant="outline" className="text-neutral-500">Low</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={`
                                        ${order.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : ''}
                                        ${order.status === 'Processing' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' : ''}
                                        ${order.status === 'Packing' ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' : ''}
                                        ${order.status === 'Ready' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : ''}
                                    `}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <Eye className="w-4 h-4 text-neutral-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        Process
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
