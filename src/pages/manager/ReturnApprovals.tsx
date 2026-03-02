import React, { useState, useEffect } from 'react';
import { Check, X, Eye, AlertCircle, PackageX, User, Clock, Film, Image as ImageIcon, MessageSquare, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { returnService } from '@/services/return.service';
import { useToast } from '@/components/ui/use-toast';
import { axiosInstance } from '@/lib/axiosInstance';

import { io } from 'socket.io-client';

export default function ReturnApprovals() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRequests();

        // Real-time listener to refresh list automatically
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const socket = io(`${baseUrl}/events`);

        socket.on('manager:new_return_request', () => {
            fetchRequests(); // Reload list on new request
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

    const handleAction = async (status: 'SHIPPING_TO_WAREHOUSE' | 'REJECTED') => {
        if (!selectedRequest) return;
        if (status === 'REJECTED' && !adminNote.trim()) {
            toast({ variant: 'destructive', title: 'Required', description: 'Please provide a reason for rejection.' });
            return;
        }

        try {
            setActionLoading(true);
            await returnService.updateStatus(selectedRequest.return_id, status, adminNote);

            toast({
                title: status === 'REJECTED' ? 'Request Rejected' : 'Request Approved',
                description: status === 'REJECTED' ? 'The customer has been notified.' : 'The customer has been instructed to ship the items.',
                className: status === 'REJECTED' ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
            });

            setIsReviewModalOpen(false);
            fetchRequests(); // Refresh list
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to update request.' });
        } finally {
            setActionLoading(false);
        }
    };

    const openReviewModal = (req: any) => {
        setSelectedRequest(req);
        setAdminNote(req.admin_note || '');
        setIsReviewModalOpen(true);
    };

    // Helper to get parsed image URLs
    const getImages = (urlsStr: string | null) => {
        if (!urlsStr) return [];
        try {
            return JSON.parse(urlsStr);
        } catch (e) {
            return [];
        }
    };

    // Filter to show only PENDING items first, then others
    const pendingRequests = requests.filter(r => r.status_code === 'PENDING');
    const processedRequests = requests.filter(r => r.status_code !== 'PENDING').slice(0, 10); // Show max 10 recent

    // Helper to format currency
    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Return Approvals</h1>
                    <p className="text-slate-500 mt-1">Review unboxing videos and defect evidence before authorizing warehouse returns.</p>
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-medium border border-orange-200 shadow-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {pendingRequests.length} Pending
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-8 h-8 rounded-full border-t-2 border-slate-900"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* PENDING LIST */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Action Required</h2>
                        {pendingRequests.length === 0 ? (
                            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500">
                                <PackageX className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                <p>No pending return requests require attention.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {pendingRequests.map(req => (
                                    <ReturnRequestCard
                                        key={req.return_id}
                                        req={req}
                                        onReview={() => openReviewModal(req)}
                                        formatPrice={formatPrice}
                                        getImages={getImages}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RECENTLY PROCESSED */}
                    {processedRequests.length > 0 && (
                        <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Recently Processed</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {processedRequests.map(req => (
                                    <ReturnRequestCard
                                        key={req.return_id}
                                        req={req}
                                        onReview={() => openReviewModal(req)}
                                        formatPrice={formatPrice}
                                        getImages={getImages}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* REVIEW MODAL */}
            <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-xl">
                    {selectedRequest && (
                        <>
                            <div className="bg-slate-900 p-6 text-white rounded-t-xl sticky top-0 z-10 flex justify-between items-center">
                                <div>
                                    <DialogTitle className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                                        Return #{selectedRequest.return_id}
                                        <Badge variant="outline" className="bg-white/10 text-white border-white/20 ml-2">
                                            {selectedRequest.status_code}
                                        </Badge>
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-300 mt-1">
                                        Order: <span className="font-mono bg-black/30 px-1 py-0.5 rounded">{selectedRequest.orders?.order_code}</span>
                                    </DialogDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Customer</p>
                                    <p className="font-medium">{selectedRequest.users?.full_name || selectedRequest.users?.email}</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* EVIDENCE SECTION */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                        <Film className="w-4 h-4" /> Evidence
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Video */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Unboxing Video</p>
                                            <div className="rounded-xl overflow-hidden bg-black aspect-video border border-slate-200">
                                                {selectedRequest.unbox_video_url ? (
                                                    <video
                                                        controls
                                                        className="w-full h-full object-contain"
                                                        src={selectedRequest.unbox_video_url}
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No video provided</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Images */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Defect Images</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {getImages(selectedRequest.defect_image_urls).length > 0 ? (
                                                    getImages(selectedRequest.defect_image_urls).map((url: string, idx: number) => (
                                                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity">
                                                            <img src={url} alt={`Defect ${idx + 1}`} className="w-full h-full object-cover" />
                                                        </a>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-center border border-dashed">
                                                        No images provided
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                        <p className="text-xs font-semibold text-amber-800 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Customer's Reason</p>
                                        <p className="text-sm text-amber-900 italic">"{selectedRequest.reason || 'No reason provided.'}"</p>
                                    </div>
                                </div>

                                {/* ITEMS TO RETURN */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                        <PackageX className="w-4 h-4" /> Items Requesting Return
                                    </h3>
                                    <div className="border border-slate-200 rounded-xl divide-y bg-slate-50/50">
                                        {selectedRequest.return_items.map((ri: any) => {
                                            const oi = ri.order_items;
                                            const product = oi?.product_variants?.products;
                                            const variant = oi?.product_variants;

                                            // Calculate approx refund (rough estimate)
                                            const refundEst = Number(oi?.unit_price) * ri.quantity;

                                            return (
                                                <div key={ri.return_item_id} className="p-4 flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded border flex items-center justify-center overflow-hidden">
                                                        {product?.media_urls?.[0] ? (
                                                            <img src={product.media_urls[0]} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate">{product?.name || 'Unknown Product'}</p>
                                                        <p className="text-xs text-slate-500">{variant?.option_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-slate-900">Qty: {ri.quantity}</p>
                                                        <p className="text-xs text-slate-500">Est. {formatPrice(refundEst)}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* ADMIN REVIEW */}
                                {selectedRequest.status_code === 'PENDING' ? (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                            Admin Note
                                            <span className="text-[10px] text-red-500 font-normal">*Required if rejecting</span>
                                        </label>
                                        <Textarea
                                            placeholder="Leave a note for the customer explaining the approval instructions or rejection reason..."
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            className="bg-white resize-none border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                                            rows={3}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historical Admin Note</label>
                                        <p className="text-sm text-slate-700 italic bg-white p-3 rounded border border-slate-200">
                                            {selectedRequest.admin_note || 'No note left.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedRequest.status_code === 'PENDING' && (
                                <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 rounded-b-xl flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleAction('REJECTED')}
                                        disabled={actionLoading}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                                        onClick={() => handleAction('SHIPPING_TO_WAREHOUSE')}
                                        disabled={actionLoading}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Approve & Request Shipping
                                    </Button>
                                </DialogFooter>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ReturnRequestCard({ req, onReview, formatPrice, getImages }: any) {
    const isPending = req.status_code === 'PENDING';

    // Calculate total items
    const totalItems = req.return_items.reduce((sum: number, ri: any) => sum + ri.quantity, 0);
    const imageUrls = getImages(req.defect_image_urls);

    return (
        <Card className={`p-5 transition-shadow hover:shadow-md border-l-4 ${isPending ? 'border-orange-400 bg-white' : 'border-slate-300 bg-slate-50/50'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 space-y-2 w-full">
                    {/* Header line */}
                    <div className="flex items-center justify-between md:justify-start gap-4">
                        <span className="font-mono font-bold text-slate-900">Return #{req.return_id}</span>
                        <Badge variant={isPending ? 'default' : 'secondary'} className={isPending ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : ''}>
                            {req.status_code}
                        </Badge>
                        <span className="text-xs text-slate-400 hidden md:block">
                            {new Date(req.created_at).toLocaleString()}
                        </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> {req.users?.full_name || 'Customer'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5"><PackageX className="w-4 h-4 text-slate-400" /> {totalItems} items</span>
                        <span className="text-slate-300 hidden md:inline">|</span>
                        <div className="flex items-center gap-3">
                            {req.unbox_video_url && <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-100"><Film className="w-3 h-3 mr-1" /> Video</Badge>}
                            {imageUrls.length > 0 && <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-100"><ImageIcon className="w-3 h-3 mr-1" /> {imageUrls.length} Imgs</Badge>}
                        </div>
                    </div>

                    {/* Reason preview */}
                    <p className="text-sm text-slate-500 italic line-clamp-1 border-l-2 border-slate-200 pl-3">
                        "{req.reason || 'No specific reason provided.'}"
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Button
                        onClick={onReview}
                        className={isPending ? "bg-slate-900 text-white w-full md:w-auto" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 w-full md:w-auto"}
                        variant={isPending ? "default" : "outline"}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        {isPending ? 'Review & Action' : 'View Details'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
