import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, AlertCircle, UploadCloud, X, Film, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { returnService } from '@/services/return.service';
import { shipmentService } from '@/services/shipment.service';

interface CreateReturnModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: any;
    onSuccess: () => void;
}

export function CreateReturnModal({ open, onOpenChange, order, onSuccess }: CreateReturnModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // State for tracking selected items and their return quantities
    // Record<order_item_id, quantity>
    const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});

    const [reason, setReason] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    if (!order) return null;

    const handleCheckboxToggle = (itemId: number, maxQty: number, checked: boolean) => {
        const newSelected = { ...selectedItems };
        if (checked) {
            newSelected[itemId] = 1; // Default to returning 1
        } else {
            delete newSelected[itemId];
        }
        setSelectedItems(newSelected);
    };

    const updateQuantity = (itemId: number, maxQty: number, delta: number) => {
        const currentQty = selectedItems[itemId] || 0;
        let newQty = currentQty + delta;
        if (newQty < 1) newQty = 1;
        if (newQty > maxQty) newQty = maxQty;

        setSelectedItems({
            ...selectedItems,
            [itemId]: newQty
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 50 * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a video smaller than 50MB.' });
                return;
            }
            setVideoFile(file);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024); // 5MB limit

            if (validFiles.length < files.length) {
                toast({ variant: 'destructive', title: 'Warning', description: 'Some images were ignored because they exceed 5MB.' });
            }

            if (imageFiles.length + validFiles.length > 5) {
                toast({ variant: 'destructive', title: 'Warning', description: 'Maximum 5 images allowed.' });
                return;
            }

            setImageFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Validation
        const itemsToReturn = Object.keys(selectedItems).map(id => ({
            order_item_id: Number(id),
            quantity: selectedItems[Number(id)]
        }));

        if (itemsToReturn.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one item to return.' });
            return;
        }

        if (!videoFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please upload an unboxing video as evidence.' });
            return;
        }

        if (imageFiles.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please upload at least one image showing the defect/damage.' });
            return;
        }

        try {
            setLoading(true);
            setUploadProgress(10); // Start progress indicating upload

            // 1. Upload Video
            const uploadResult = await shipmentService.uploadVideo(videoFile);
            const uploadedVideoUrl = uploadResult.url;
            setUploadProgress(40); // Base progress

            // 2. Upload Images (Parallel execution!)
            const uploadedImageUrls: string[] = [];
            if (imageFiles.length > 0) {
                const uploadPromises = imageFiles.map((file) => shipmentService.uploadVideo(file));
                const results = await Promise.all(uploadPromises);
                uploadedImageUrls.push(...results.map(res => res.url));
                setUploadProgress(80); // Quick jump as they complete together
            }

            // 3. Submit Return Request
            await returnService.createRequest({
                order_id: order.order_id,
                reason,
                unbox_video_url: uploadedVideoUrl,
                defect_image_urls: JSON.stringify(uploadedImageUrls),
                items: itemsToReturn
            });
            setUploadProgress(100);

            toast({
                title: 'Request Submitted',
                description: 'Your return request has been sent for review.',
                className: "bg-green-50 border-green-200 text-green-800"
            });

            // Clean up states
            setSelectedItems({});
            setReason('');
            setVideoFile(null);
            setImageFiles([]);
            setUploadProgress(0);

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Return Submission Error:", error);
            setUploadProgress(0);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to submit return request.'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] bg-white max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-xl">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white rounded-t-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            Return Order Request
                        </DialogTitle>
                        <DialogDescription className="text-slate-300 mt-2">
                            Select the items from order <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20 select-all">{order.order_code}</span> you wish to return.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    {/* Items Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold leading-none shrink-0">1</span>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest shrink-0">Select Items to Return</h4>
                        </div>

                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[300px] overflow-y-auto bg-slate-50/30">
                            {order.order_items.map((item: any) => {
                                const isChecked = !!selectedItems[item.item_id];
                                const returnQty = selectedItems[item.item_id] || 0;
                                const maxQty = item.quantity;
                                const config = item.product_variants?.product_preorder_configs;
                                const displayPrice = config ? config.full_price : item.unit_price;

                                return (
                                    <div key={item.item_id} className={`p-4 flex items-center gap-4 transition-colors ${isChecked ? 'bg-white' : ''}`}>
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(c) => handleCheckboxToggle(item.item_id, maxQty, c as boolean)}
                                        />

                                        <div className="w-12 h-12 bg-slate-100 rounded border shrink-0 overflow-hidden">
                                            {item.product_variants?.products?.media_urls?.[0] && (
                                                <img src={item.product_variants.products.media_urls[0]} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{item.product_variants?.products?.name}</p>
                                            <p className="text-xs text-slate-500">{item.product_variants?.option_name}</p>
                                            <p className="text-xs font-semibold text-slate-700 mt-1">{formatPrice(Number(displayPrice))}</p>
                                        </div>

                                        {/* Quantity Controls */}
                                        {isChecked && (
                                            <div className="flex items-center gap-3 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="w-7 h-7"
                                                    disabled={returnQty <= 1}
                                                    onClick={() => updateQuantity(item.item_id, maxQty, -1)}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="w-4 text-center text-sm font-medium">{returnQty}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="w-7 h-7"
                                                    disabled={returnQty >= maxQty}
                                                    onClick={() => updateQuantity(item.item_id, maxQty, 1)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reason & Evidence */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold leading-none shrink-0">2</span>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest shrink-0">Reason & Evidence</h4>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detailed Reason</label>
                            <Textarea
                                placeholder="Describe specifically why you are returning these items. For example: 'Missing a part in the box' or 'Box was heavily damaged during transit'..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="resize-none border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-3">
                            {/* --- Video Upload Section --- */}
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between mt-6">
                                <span>Unboxing Video Evidence (* Require continuous shot) <span className="text-red-500">*</span></span>
                                {videoFile && <span className="text-[10px] text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-full border border-green-200">Video Selected</span>}
                            </label>

                            {/* Custom File Upload UI */}
                            {!videoFile ? (
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleFileChange}
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <UploadCloud className="w-6 h-6 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Click or drag an unboxing video</p>
                                            <p className="text-xs text-slate-500 mt-1 pb-1">MP4, WebM, MOV (Max 50MB)</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between group">
                                    <div className="flex items-center gap-3 w-full pr-4 overflow-hidden">
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                                            <Film className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-900 truncate">{videoFile.name}</p>
                                            <p className="text-xs text-slate-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-600 shrink-0"
                                        onClick={() => setVideoFile(null)}
                                        disabled={loading}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {/* --- Image Upload Section --- */}
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between mt-6">
                                <span>Defect/Damage Images <span className="text-red-500">*</span></span>
                                <span className="text-[10px] text-slate-500 font-medium">{imageFiles.length} / 5</span>
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {imageFiles.map((file, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl border border-slate-200 bg-slate-50 relative overflow-hidden group">
                                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="w-8 h-8 rounded-full"
                                                onClick={() => removeImage(idx)}
                                                disabled={loading}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {imageFiles.length < 5 && (
                                    <div className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleImageChange}
                                        />
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                                            <ImageIcon className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <p className="text-xs font-medium text-slate-600">Add Images</p>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-4 p-3 bg-red-50/50 rounded-lg border border-red-100/50">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <span className="text-red-800 leading-relaxed font-medium block">
                                    Return requests must be initiated within 72 hours of receiving your order. A clear, continuous video showing the unboxing process from the sealed package is strictly required. Non-compliant evidence will result in rejection.
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        Refund method: <span className="text-slate-900 font-bold bg-white px-2 py-0.5 border border-slate-200 rounded ml-1">Internal Wallet</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="rounded-full w-full sm:w-auto hover:bg-slate-100 border-slate-300" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-slate-900 hover:bg-black text-white rounded-full min-w-[140px] w-full sm:w-auto shadow-md"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                                    {uploadProgress < 100 ? `Uploading...` : 'Submitting...'}
                                </span>
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
