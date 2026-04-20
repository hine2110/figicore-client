import { useState, useEffect } from 'react';
import { Check, Search, ClipboardCheck, PackageOpen, AlertTriangle, ShieldAlert, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { returnService } from '@/services/return.service';
import { useToast } from '@/components/ui/use-toast';
import { io } from 'socket.io-client';

export default function ReturnInspection() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
    const [inspectionResults, setInspectionResults] = useState<Record<number, string>>({});
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRequests();

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com';
        const socket = io(`${baseUrl}/events`);

        // Usually manager events for now, but good to add generic refresh
        socket.on('manager:new_return_request', () => {
            fetchRequests();
        });

        // If backend emits warehouse:return_arrived or similar, listen here
        socket.on('warehouse:return_arrived', () => {
            fetchRequests();
            toast({ title: 'New Return Arrived', description: 'A return package has arrived at the warehouse.', className: 'bg-blue-50 border-blue-200' });
        });

        return () => { socket.disconnect(); };
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await returnService.getAllRequests();
            const dataList = Array.isArray(res) ? res : res.data;
            setRequests(dataList || []);
        } catch (error) {
            console.error("Failed to fetch return requests:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load return requests.' });
        } finally {
            setLoading(false);
        }
    };

    const handleReceive = async (id: number) => {
        try {
            setActionLoading(true);
            await returnService.receiveAtWarehouse(id);
            toast({ title: 'Package Received', description: 'Return is now ready for inspection.', className: 'bg-green-50 text-green-800' });
            fetchRequests();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to receive package.' });
        } finally {
            setActionLoading(false);
        }
    };

    const openInspectModal = (req: any) => {
        // Initialize results with empty strings or default to RESTOCK if you prefer
        const initialResults: Record<number, string> = {};
        req.return_items.forEach((item: any) => {
            initialResults[item.return_item_id] = ''; // Force them to select explicitly to prevent mistakes
        });
        setInspectionResults(initialResults);
        setSelectedRequest(req);
        setIsInspectModalOpen(true);
    };

    const handleInspectChange = (itemId: number, result: string) => {
        setInspectionResults(prev => ({ ...prev, [itemId]: result }));
    };

    const handleSubmitInspection = async () => {
        // Validation: Ensure all items have a result selected
        if (!selectedRequest) return;
        const missing = selectedRequest.return_items.some((item: any) => !inspectionResults[item.return_item_id]);

        if (missing) {
            toast({ variant: 'destructive', title: 'Incomplete', description: 'Please assign an inspection result for all items.' });
            return;
        }

        try {
            setActionLoading(true);
            const payload = {
                items: selectedRequest.return_items.map((item: any) => ({
                    return_item_id: item.return_item_id,
                    result: inspectionResults[item.return_item_id]
                }))
            };

            await returnService.inspectReturn(selectedRequest.return_id, payload);

            toast({ title: 'Inspection Complete', description: 'Items processed and wallet adjusted successfully.', className: 'bg-green-50 text-green-800' });
            setIsInspectModalOpen(false);
            fetchRequests();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to submit inspection.' });
        } finally {
            setActionLoading(false);
        }
    };

    // Filters
    // Warehouse cares about:
    // 1. SHIPPING_TO_WAREHOUSE (Needs Receiving)
    // 2. INSPECTING (Needs Item Grading)
    // Everything else (PENDING, COMPLETED, REJECTED) is either Not Ready or Done.

    const incomingPackages = requests.filter(r => r.status_code === 'SHIPPING_TO_WAREHOUSE');
    const actionRequired = requests.filter(r => r.status_code === 'INSPECTING');
    const processed = requests.filter(r => ['COMPLETED', 'REJECTED'].includes(r.status_code)).slice(0, 10);

    const getImages = (urlsStr: string | null) => {
        if (!urlsStr) return [];
        try {
            return JSON.parse(urlsStr);
        } catch {
            return [];
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Return Inspection</h1>
                    <p className="text-slate-500 mt-1">Receive packages, perform quality checks, and process customer returns.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-8 h-8 rounded-full border-t-2 border-slate-900"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* INCOMING PACKAGES (Needs Receive) */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <Inbox className="w-5 h-5 text-indigo-500" /> Incoming Packages
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">{incomingPackages.length}</Badge>
                        </h2>
                        {incomingPackages.length === 0 ? (
                            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500">
                                <p>No packages currently en route to the warehouse.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {incomingPackages.map(req => (
                                    <ReturnCard key={req.return_id} req={req} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* READY FOR INSPECTION */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <Search className="w-5 h-5 text-orange-500" /> Ready for Inspection
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">{actionRequired.length}</Badge>
                        </h2>
                        {actionRequired.length === 0 ? (
                            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500">
                                <p>No packages currently awaiting inspection.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {actionRequired.map(req => (
                                    <ReturnCard key={req.return_id} req={req} highlight>
                                        <Button size="sm" onClick={() => openInspectModal(req)} className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto shadow-md">
                                            <Search className="w-4 h-4 mr-2" /> Inspect Items
                                        </Button>
                                    </ReturnCard>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RECENTLY PROCESSED */}
                    {processed.length > 0 && (
                        <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Recently Processed</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {processed.map(req => (
                                    <ReturnCard key={req.return_id} req={req} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* INSPECTION MODAL */}
            <Dialog open={isInspectModalOpen} onOpenChange={setIsInspectModalOpen}>
                <DialogContent className="sm:max-w-[700px] bg-white border-0 shadow-2xl rounded-xl p-0 overflow-y-auto max-h-[90vh]">
                    {selectedRequest && (
                        <>
                            <div className="bg-slate-900 p-6 text-white rounded-t-xl sticky top-0 z-10">
                                <DialogTitle className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                                    Return #{selectedRequest.return_id} Inspection
                                </DialogTitle>
                                <DialogDescription className="text-slate-300 mt-1">
                                    Assess the condition of each item carefully to ensure correct inventory routing and customer refund.
                                </DialogDescription>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-orange-800">
                                        <p className="font-semibold mb-1">Manager Note:</p>
                                        <p className="italic">"{selectedRequest.admin_note || 'No note provided'}"</p>
                                        <p className="font-semibold mt-2 mb-1">Customer Reason:</p>
                                        <p className="italic">"{selectedRequest.reason || 'No specific reason'}"</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 border-b pb-2 border-slate-200 uppercase tracking-widest text-sm">Items to Inspect</h3>
                                    {selectedRequest.return_items.map((item: any) => {
                                        const product = item.order_items?.product_variants?.products;
                                        const variant = item.order_items?.product_variants;
                                        const result = inspectionResults[item.return_item_id];

                                        return (
                                            <Card key={item.return_item_id} className={`p-4 border-l-4 ${result ? 'border-green-500 bg-slate-50' : 'border-orange-400 bg-white shadow-sm'}`}>
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    {/* Item Info */}
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="w-16 h-16 bg-white rounded border flex-shrink-0">
                                                            {product?.media_urls?.[0] && (
                                                                <img src={product.media_urls[0]} alt="" className="w-full h-full object-cover rounded" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{product?.name || 'Unknown Product'}</p>
                                                            <p className="text-sm text-slate-500">{variant?.option_name}</p>
                                                            <div className="mt-1 flex gap-2">
                                                                <Badge variant="outline" className="bg-white">Qty: {item.quantity}</Badge>
                                                                <Badge variant="outline" className="bg-white font-mono">Price: {Number(item.order_items?.unit_price).toLocaleString('vi-VN')}₫</Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Condition Selector */}
                                                    <div className="md:w-[280px] bg-white md:bg-transparent rounded-lg md:rounded-none p-3 md:p-0 border border-slate-200 md:border-0">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Grade Condition</Label>
                                                        <RadioGroup
                                                            value={inspectionResults[item.return_item_id] || ""}
                                                            onValueChange={(val) => handleInspectChange(item.return_item_id, val)}
                                                            className="flex flex-col gap-2"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="RESTOCK" id={`r-restock-${item.return_item_id}`} />
                                                                <Label htmlFor={`r-restock-${item.return_item_id}`} className="flex items-center gap-1.5 cursor-pointer text-sm"><Check className="w-3.5 h-3.5 text-green-600" /> Pristine (Restock)</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="BOX_DAMAGE" id={`r-box-${item.return_item_id}`} />
                                                                <Label htmlFor={`r-box-${item.return_item_id}`} className="flex items-center gap-1.5 cursor-pointer text-sm"><PackageOpen className="w-3.5 h-3.5 text-yellow-600" /> Box Damaged (Refurb)</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="FACTORY_DEFECT" id={`r-defect-${item.return_item_id}`} />
                                                                <Label htmlFor={`r-defect-${item.return_item_id}`} className="flex items-center gap-1.5 cursor-pointer text-sm"><AlertTriangle className="w-3.5 h-3.5 text-orange-600" /> Factory Defect (RMA)</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="FRAUD" id={`r-fraud-${item.return_item_id}`} />
                                                                <Label htmlFor={`r-fraud-${item.return_item_id}`} className="flex items-center gap-1.5 cursor-pointer text-red-600 font-medium text-sm"><ShieldAlert className="w-3.5 h-3.5" /> Fraud / Wrong Item</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                            <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 rounded-b-xl flex gap-3">
                                <Button variant="outline" onClick={() => setIsInspectModalOpen(false)} disabled={actionLoading}>Cancel</Button>
                                <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-md flex-1" onClick={handleSubmitInspection} disabled={actionLoading}>
                                    <ClipboardCheck className="w-4 h-4 mr-2" /> Submit Inspection & Route Inventory
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ReturnCard({ req, children, highlight = false }: any) {
    const totalItems = req.return_items?.reduce((sum: number, ri: any) => sum + ri.quantity, 0) || 0;
    const isCompleted = req.status_code === 'COMPLETED';

    return (
        <Card className={`p-4 transition-all hover:shadow-md border-l-4 ${highlight ? 'border-orange-400 bg-orange-50/10' : isCompleted ? 'border-green-400 bg-slate-50' : 'border-indigo-400 bg-white'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">Return #{req.return_id}</span>
                        <Badge variant="outline" className={isCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-700'}>{req.status_code}</Badge>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span>Order: <span className="font-mono text-slate-700">{req.orders?.order_code || 'N/A'}</span></span>
                        <span>•</span>
                        <span>Items: <span className="font-bold text-slate-700">{totalItems}</span></span>
                        <span>•</span>
                        <span>Customer: <span className="font-medium text-slate-700">{req.users?.full_name || 'N/A'}</span></span>
                    </div>
                </div>
                {children && <div className="w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-dashed sm:border-0 border-slate-200">{children}</div>}
            </div>
        </Card>
    );
}
