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
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { customersService, Customer } from '@/services/customers.service';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import ConfirmStatusDialog from "@/features/admin/components/ConfirmStatusDialog";
import { userService } from "@/services/user.service";
import CustomerDetailSheet from "@/features/admin/components/CustomerDetailSheet";

export default function CustomerTab() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [statusConfirm, setStatusConfirm] = useState<{ id: number, status: string } | null>(null);

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
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Loyalty Points</th>
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
                                            <AvatarFallback>{cust.full_name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-neutral-900">{cust.full_name}</div>
                                            <div className="text-xs text-neutral-500">{cust.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-600">{cust.phone}</td>
                                    <td className="px-6 py-4 font-mono">{cust.loyalty_points ?? 0}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`
                                            ${cust.status_code === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                cust.status_code === 'BANNED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'}
                                        `}>
                                            {cust.status_code}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedId(cust.user_id)}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuSeparator />

                                                {/* Active/Inactive Toggle */}
                                                {cust.status_code !== 'BANNED' && (
                                                    <DropdownMenuItem
                                                        className={cust.status_code === 'ACTIVE' ? "text-orange-600" : "text-green-600"}
                                                        onClick={() => setStatusConfirm({ id: cust.user_id, status: cust.status_code })}
                                                    >
                                                        {cust.status_code === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                                                    </DropdownMenuItem>
                                                )}



                                                {/* Unban Action (Manual Only) */}
                                                {cust.status_code === 'BANNED' && (
                                                    <DropdownMenuItem
                                                        className="text-green-600 font-medium"
                                                        onClick={() => setStatusConfirm({ id: cust.user_id, status: 'BANNED' })}
                                                    >
                                                        Unban Account
                                                    </DropdownMenuItem>
                                                )}
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

            <CustomerDetailSheet
                customerId={selectedId}
                open={!!selectedId}
                onOpenChange={(open) => !open && setSelectedId(null)}
                onUpdateSuccess={fetchCustomers}
            />

            {statusConfirm && (
                <ConfirmStatusDialog
                    open={!!statusConfirm}
                    onOpenChange={(open) => !open && setStatusConfirm(null)}
                    currentStatus={statusConfirm.status}
                    onConfirm={async () => {
                        try {
                            await userService.updateStatus(statusConfirm.id, 'ACTIVE');
                            toast({ title: "Success", description: "User status updated successfully." });
                            fetchCustomers();
                        } catch (error) {
                            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                        } finally {
                            setStatusConfirm(null);
                        }
                    }}
                />
            )}
        </div>
    );
}
