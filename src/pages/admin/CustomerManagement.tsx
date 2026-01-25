import { useState, useEffect } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
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
import { customersService, Customer } from '@/services/customers.service';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

export default function CustomerManagement() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const res = await customersService.getCustomers({ page, limit: 10, search });
            setCustomers(res.data);
            setTotalPages(res.meta.totalPages);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to fetch customers",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Customer Management</h1>
                    <p className="text-neutral-500">View and manage customer accounts.</p>
                </div>
            </div>

            <Card className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex gap-4 bg-neutral-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input 
                            type="text" 
                            placeholder="Search customers..." 
                            className="w-full pl-9 pr-4 bg-white" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Total Spent</th>
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Loading...</td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No customers found.</td>
                            </tr>
                        ) : (
                            customers.map(cust => (
                                <tr key={cust.user_id} className="hover:bg-neutral-50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{cust.users.full_name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-neutral-900">{cust.users.full_name}</div>
                                            <div className="text-xs text-neutral-500">{cust.users.email}</div>
                                            <div className="text-xs text-neutral-400">{cust.users.phone}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono">${Number(cust.total_spent).toLocaleString()}</td>
                                    <td className="px-6 py-4">{cust.current_rank_code}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`${cust.users.status_code === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {cust.users.status_code}
                                        </Badge>
                                    </td>
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
                            ))
                        )}
                    </tbody>
                </table>
                <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
                    <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
                    <div className="space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
