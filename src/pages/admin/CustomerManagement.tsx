import { Search, MoreHorizontal, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CUSTOMERS = [
    { id: 1, name: 'Alice Chen', email: 'alice@example.com', role: 'Customer', cltv: '$2,450', status: 'Active', joined: 'Oct 2025' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Customer (VIP)', cltv: '$8,120', status: 'Active', joined: 'Jan 2025' },
    { id: 3, name: 'Charlie Kim', email: 'charlie@example.com', role: 'Customer', cltv: '$120', status: 'Suspended', joined: 'Dec 2025' },
];

export default function CustomerManagement() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Customer Management</h1>
                    <p className="text-neutral-500">View and manage customer accounts.</p>
                </div>
            </div>

            <Card className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input type="text" placeholder="Search customers..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <Button variant="outline">Filter</Button>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">CLTV</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {CUSTOMERS.map(cust => (
                            <tr key={cust.id} className="hover:bg-neutral-50">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{cust.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-neutral-900">{cust.name}</div>
                                        <div className="text-xs text-neutral-500">{cust.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{cust.role}</td>
                                <td className="px-6 py-4 font-mono">{cust.cltv}</td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={`${cust.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {cust.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-neutral-500">{cust.joined}</td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem>Order History</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Suspend Account</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
