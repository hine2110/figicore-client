import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Wallet, Trophy, Package } from "lucide-react";
import { Customer, customersService } from "@/services/customers.service";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import ConfirmStatusDialog from "./ConfirmStatusDialog";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/useAuthStore";

interface CustomerDetailSheetProps {
    customerId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateSuccess: () => void;
}

export default function CustomerDetailSheet({ customerId, open, onOpenChange, onUpdateSuccess }: CustomerDetailSheetProps) {
    const { toast } = useToast();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState<{ status: string } | null>(null);

    useEffect(() => {
        if (open && customerId) {
            fetchCustomerDetails(customerId);
        } else {
            setCustomer(null);
        }
    }, [open, customerId]);

    const fetchCustomerDetails = async (id: number) => {
        setIsLoading(true);
        try {
            const data = await customersService.getCustomerById(id);
            setCustomer(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to fetch customer details",
                variant: "destructive"
            });
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Customer Profile</SheetTitle>
                    <SheetDescription>Customer details and history.</SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
                    </div>
                ) : customer ? (
                    <div className="mt-8 space-y-6">
                        {/* Header Profile */}
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-24 w-24 mb-4 border-4 border-neutral-100">
                                <AvatarImage src={customer.avatar_url || ""} />
                                <AvatarFallback className="text-2xl bg-neutral-100 text-neutral-600">
                                    {customer.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold text-neutral-900 leading-tight">
                                {customer.full_name}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={`border-neutral-200 
                                    ${customer.current_rank_code === 'GOLD' ? 'bg-amber-50 text-amber-700' : 
                                      customer.current_rank_code === 'PLATINUM' ? 'bg-slate-50 text-slate-700' : 'bg-neutral-50 text-neutral-600'}
                                `}>
                                    {customer.current_rank_code || 'MEMBER'}
                                </Badge>
                                <Badge variant={
                                    customer.status_code === 'ACTIVE' ? 'default' : 'destructive'
                                }>
                                    {customer.status_code}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    <p className="text-xs font-medium text-neutral-500">Loyalty Points</p>
                                </div>
                                <p className="text-lg font-bold text-neutral-900 font-mono">
                                    {customer.loyalty_points?.toLocaleString() ?? 0}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet className="w-4 h-4 text-green-600" />
                                    <p className="text-xs font-medium text-neutral-500">Total Spent</p>
                                </div>
                                <p className="text-lg font-bold text-neutral-900 font-mono">
                                    ${Number(customer.total_spent ?? 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                            <div className="p-4 flex items-center gap-4 hover:bg-neutral-50/50 transition-colors">
                                <Mail className="w-5 h-5 text-neutral-400" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Email Address</p>
                                    <p className="text-sm font-medium text-neutral-900 truncate" title={customer.email}>{customer.email}</p>
                                </div>
                            </div>
                            
                            <div className="p-4 flex items-center gap-4 hover:bg-neutral-50/50 transition-colors">
                                <Phone className="w-5 h-5 text-neutral-400" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Phone</p>
                                    <p className="text-sm font-medium text-neutral-900">{customer.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <MapPin className="w-4 h-4 text-neutral-500" />
                                <h3 className="font-medium text-neutral-900">Saved Addresses</h3>
                            </div>
                            {customer.addresses && customer.addresses.length > 0 ? (
                                <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                                    {customer.addresses.map((addr: any) => (
                                        <div key={addr.address_id} className="p-3 text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">{addr.address_type}</Badge>
                                                {addr.is_default && <Badge className="text-[10px] h-5 px-1.5 bg-neutral-900">Default</Badge>}
                                            </div>
                                            <p className="text-neutral-700">{addr.address_line}</p>
                                            <p className="text-neutral-500 text-xs">{addr.ward}, {addr.district}, {addr.city}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-center text-sm text-neutral-500">
                                    No addresses saved.
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-neutral-100 flex justify-end">
                            {['SUPER_ADMIN', 'ADMIN'].includes(useAuthStore.getState().user?.role_code || '') && (
                                <Button
                                    variant={customer.status_code === 'ACTIVE' ? "destructive" : "default"}
                                    className={customer.status_code === 'ACTIVE' ? "" : "bg-green-600 hover:bg-green-700"}
                                    onClick={() => setStatusConfirm({ status: customer.status_code })}
                                >
                                    {customer.status_code === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-neutral-500">Customer not found.</div>
                )}
            </SheetContent>

            {customer && statusConfirm && (
                <ConfirmStatusDialog
                    open={!!statusConfirm}
                    onOpenChange={(open) => !open && setStatusConfirm(null)}
                    currentStatus={statusConfirm.status}
                    onConfirm={async () => {
                        try {
                            if (customerId) {
                                await userService.updateStatus(customerId, statusConfirm.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                                toast({ title: "Success", description: "User status updated successfully." });
                                onUpdateSuccess();
                                fetchCustomerDetails(customerId); 
                            }
                        } catch (error) {
                            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                        } finally {
                            setStatusConfirm(null);
                        }
                    }}
                />
            )}
        </Sheet>
    );
}
