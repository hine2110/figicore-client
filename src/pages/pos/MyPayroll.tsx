import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';
import { Loader2, Banknote, Calendar, ChevronRight, AlertTriangle, CheckCircle2, FileText, ReceiptText, FileSignature } from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';

export default function MyPayroll() {
    const { toast } = useToast();
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Dispute State
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [disputeContent, setDisputeContent] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [isConfirmedMoney, setIsConfirmedMoney] = useState(false);
    const sigCanvas = useRef<any>(null);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/payroll/my-payrolls');
            setPayrolls(res.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load payroll list.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayrolls(); }, []);

    const openViewModal = (payroll: any) => {
        setSelectedPayroll(payroll);
        setIsViewModalOpen(true);
    };

    const handleConfirmPayroll = async () => {
        if (!selectedPayroll) return;
        setActionLoading(true);
        try {
            await axiosInstance.patch(`/payroll/my-payrolls/${selectedPayroll.payroll_id}/confirm`);
            toast({ title: "Confirmed!", description: "Your payslip has been finalized and sent to Management for payment." });
            setIsViewModalOpen(false);
            fetchPayrolls(); // Refresh list
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Could not confirm", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendDispute = async () => {
        if (!disputeContent.trim()) {
            toast({ title: "Error", description: "Please enter the reason for the dispute.", variant: "destructive" });
            return;
        }
        setActionLoading(true);
        try {
            await axiosInstance.post('/payroll-disputes', {
                payroll_id: selectedPayroll.payroll_id,
                content: disputeContent
            });
            toast({ title: "Dispute Submitted", description: "Your concern has been submitted. Management will review and respond." });
            setIsDisputeModalOpen(false);
            setIsViewModalOpen(false);
            fetchPayrolls();
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.message || "System error", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getStatusUI = (statusCode: string) => {
        switch (statusCode) {
            case 'SENT_FOR_REVIEW': return { label: 'Action Required', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200' };
            case 'PENDING_APPROVAL': return { label: 'Pending Payment', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200' };
            case 'DISPUTED': return { label: 'Under Dispute', color: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200' };
            case 'PAID': return { label: 'Paid', color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200' };
            default: return { label: statusCode, color: 'bg-gray-100 text-gray-800' };
        }
    };

    const handleSignPayroll = async () => {
        if (!isConfirmedMoney) {
            toast({ title: "Attention", description: "Please check the box to confirm you received full amount.", variant: "destructive" });
            return;
        }
        if (sigCanvas.current?.isEmpty()) {
            toast({ title: "Attention", description: "Please sign before confirming.", variant: "destructive" });
            return;
        }

        setActionLoading(true);
        try {
            // Get base64 string of signature
            const signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');

            await axiosInstance.post(`/payroll/my-payrolls/${selectedPayroll.payroll_id}/sign`, {
                signature_data: signatureData
            });

            toast({ title: "Great!", description: "You have successfully signed for salary." });
            setIsSignModalOpen(false);
            setIsViewModalOpen(false);
            fetchPayrolls();
        } catch (error: any) {
            console.error("HAND SIGN ERROR DETAILS:", error);

            toast({ title: "Error", description: error.response?.data?.message || "Cannot sign", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickSign = async () => {
        if (!isConfirmedMoney) {
            toast({ title: "Attention", description: "Please check the box to confirm you received full amount.", variant: "destructive" });
            return;
        }

        setActionLoading(true);
        try {
            // Auto create a hidden Canvas image containing 'Signed' text
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Create transparent or light background
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw signature (Style like handwriting/bold)
                ctx.font = 'italic bold 32px "Times New Roman", serif';
                ctx.fillStyle = '#4f46e5'; // Indigo color
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Signed (Quick Sign)', canvas.width / 2, canvas.height / 2 - 15);

                // Add timestamp to increase transparency
                ctx.font = '14px Arial';
                ctx.fillStyle = '#64748b'; // Gray color
                ctx.fillText(`Timestamp: ${new Date().toLocaleString('en-US')}`, canvas.width / 2, canvas.height / 2 + 25);
            }

            // Get base64 string
            const quickSignatureData = canvas.toDataURL('image/png');

            // Send straight to API like normal drawn signature
            await axiosInstance.post(`/payroll/my-payrolls/${selectedPayroll.payroll_id}/sign`, {
                signature_data: quickSignatureData
            });

            toast({ title: "Great!", description: "You have successfully quick signed." });
            setIsSignModalOpen(false);
            setIsViewModalOpen(false);
            fetchPayrolls();
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Cannot sign", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">My Payroll</h1>
                <p className="text-neutral-500 text-sm mt-1">View monthly payslip details and report any discrepancies.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : payrolls.length === 0 ? (
                <div className="text-center py-16 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <ReceiptText className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                    <p className="text-neutral-500 font-medium">No payslips have been issued yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {payrolls.map((payroll) => {
                        const statusUI = getStatusUI(payroll.status_code);
                        return (
                            <Card
                                key={payroll.payroll_id}
                                className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${payroll.status_code === 'SENT_FOR_REVIEW' ? 'border-l-yellow-400 bg-yellow-50/30' : 'border-l-transparent'}`}
                                onClick={() => openViewModal(payroll)}
                            >
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center font-bold">
                                            <span className="text-[10px] uppercase font-medium">Month</span>
                                            <span className="text-lg leading-none">{payroll.month}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-neutral-900">Salary Month {payroll.month}/{payroll.year}</h3>
                                                <Badge variant="outline" className={statusUI.color}>{statusUI.label}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {payroll.total_work_hours}H work</span>
                                                <span className="flex items-center gap-1 font-medium text-emerald-600"><Banknote className="w-3.5 h-3.5" /> Net Take-home: {formatCurrency(payroll.final_salary)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Payslip Details Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-slate-50">
                    <DialogTitle className="sr-only">Payslip details</DialogTitle>
                    {selectedPayroll && (
                        <>
                            {/* Header (Background color depends on status) */}
                            <div className={`p-6 text-white ${selectedPayroll.status_code === 'SENT_FOR_REVIEW' ? 'bg-amber-600' : 'bg-slate-800'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold uppercase tracking-wider">Payslip</h2>
                                        <p className="opacity-90">Payroll Period: Month {selectedPayroll.month}/{selectedPayroll.year}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none shadow-none">
                                            {getStatusUI(selectedPayroll.status_code).label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Body: Salary details */}
                            <div className="p-6">
                                {selectedPayroll.payment_start_date && (
                                    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-indigo-900">
                                            <Calendar className="w-5 h-5" />
                                            <span className="font-semibold">Expected salary receipt schedule:</span>
                                        </div>
                                        <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-sm text-center">
                                            {new Date(selectedPayroll.payment_start_date).toLocaleDateString('vi-VN')} - {new Date(selectedPayroll.payment_end_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50/50">
                                        <span className="font-semibold text-slate-700">Total recorded work hours</span>
                                        <span className="font-bold font-mono">{selectedPayroll.total_work_hours}H</span>
                                    </div>

                                    {/* List of additions / deductions */}
                                    <div className="p-2">
                                        {selectedPayroll.payroll_items?.map((item: any) => (
                                            <div key={item.item_id} className="flex justify-between items-center py-3 px-3 hover:bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {item.is_addition ? (
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">+</div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">-</div>
                                                    )}
                                                    <span className="text-sm text-slate-700">{item.title}</span>
                                                </div>
                                                <span className={`font-mono font-medium ${item.is_addition ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total net pay */}
                                    <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                                        <span className="font-bold uppercase tracking-wider">Net Take-home</span>
                                        <span className="text-xl font-bold font-mono text-emerald-400">
                                            {formatCurrency(selectedPayroll.final_salary)}
                                        </span>
                                    </div>
                                </div>

                                {/* Signature display area (If signed) */}
                                {selectedPayroll.signature_data && (
                                    <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col items-center justify-center gap-2">
                                        <span className="text-sm font-semibold text-emerald-900">
                                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                            Your confirmation signature
                                        </span>
                                        <div className="bg-white border border-emerald-200 rounded-lg p-2 shadow-sm">
                                            <img
                                                src={selectedPayroll.signature_data}
                                                alt="Your signature"
                                                className="max-h-24 object-contain"
                                            />
                                        </div>
                                        {selectedPayroll.signed_at && (
                                            <span className="text-xs text-emerald-600 font-medium">
                                                Signed time: {new Date(selectedPayroll.signed_at).toLocaleString('en-US')}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Reminder */}
                                {selectedPayroll.status_code === 'SENT_FOR_REVIEW' && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <p>Please review your earnings carefully. If there are any discrepancies, click <b>"Dispute"</b>. If accurate, please <b>"Confirm"</b> for management to process payment.</p>
                                    </div>
                                )}
                                {selectedPayroll.status_code === 'DISPUTED' && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <p>You have submitted a dispute for this payslip. The system has temporarily locked this payslip until Management resolving it.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer: Action Buttons */}
                            <div className="p-4 border-t bg-white flex flex-col gap-3">
                                {selectedPayroll.status_code === 'SENT_FOR_REVIEW' && (() => {
                                    const hasDisputed = selectedPayroll.payroll_disputes && selectedPayroll.payroll_disputes.length > 0;
                                    return (
                                        <div className="w-full flex flex-col gap-3">
                                            {hasDisputed && (
                                                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                                    <p>You have used your dispute right <b>1-time limit</b> for this payslip. Management has reviewed and re-issued the final version. Please verify and Confirm.</p>
                                                </div>
                                            )}
                                            
                                            {selectedPayroll.payment_start_date && (
                                                <p className="text-sm text-center text-slate-500 italic">
                                                    * Payment has been scheduled. You must <b className="text-emerald-600">"Confirm Accuracy"</b> to unlock the signing feature.
                                                </p>
                                            )}

                                            <div className="flex justify-end gap-3">
                                                {!hasDisputed && (
                                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsDisputeModalOpen(true)}>
                                                        <AlertTriangle className="w-4 h-4 mr-2" /> Discrepancy (Dispute)
                                                    </Button>
                                                )}
                                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmPayroll} disabled={actionLoading}>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Accuracy
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* E-Signature Section (For APPROVED status) */}
                                {selectedPayroll.status_code === 'APPROVED' && (
                                    <div className="flex flex-col gap-2">
                                        {selectedPayroll.can_sign ? (
                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg" onClick={() => setIsSignModalOpen(true)}>
                                                <FileSignature className="w-5 h-5 mr-2" /> Sign Payroll Receipt
                                            </Button>
                                        ) : (
                                            <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-lg text-sm border border-slate-200">
                                                {selectedPayroll.payment_start_date ? (
                                                    <span>The signing period has not started or has expired. <br />(Available from {new Date(selectedPayroll.payment_start_date).toLocaleDateString()} to {new Date(selectedPayroll.payment_end_date).toLocaleDateString()})</span>
                                                ) : (
                                                    <span>Waiting for Management to set the payment schedule...</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedPayroll.status_code !== 'SENT_FOR_REVIEW' && selectedPayroll.status_code !== 'APPROVED' && (
                                    <div className="flex justify-end">
                                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Submit Dispute Modal */}
            <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Report Payroll Discrepancy
                        </DialogTitle>
                        <DialogDescription>
                            Specify which amount is incorrect (e.g., Missing work hours on 15/03, incorrect late penalty, etc.).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter details of the issue you encountered..."
                            className="min-h-[120px]"
                            value={disputeContent}
                            onChange={(e) => setDisputeContent(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDisputeModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleSendDispute} disabled={actionLoading}>
                            Submit Dispute
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Electronic Signature Drawing Modal */}
            <Dialog open={isSignModalOpen} onOpenChange={(open) => { setIsSignModalOpen(open); if (!open) setIsConfirmedMoney(false); }}>
                <DialogContent className="sm:max-w-[500px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-center font-bold text-indigo-900 uppercase">ELECTRONIC SIGNATURE</DialogTitle>
                        <DialogDescription className="text-center">
                            Salary Receipt Month {selectedPayroll?.month}/{selectedPayroll?.year}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-center">
                            <p className="text-sm mb-1">Net Pay amount</p>
                            <p className="text-3xl font-bold font-mono">{formatCurrency(selectedPayroll?.final_salary || 0)}</p>
                        </div>

                        {/* Liability Agreement */}
                        <label className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                            <input
                                type="checkbox"
                                className="mt-1 w-5 h-5 accent-red-600 rounded"
                                checked={isConfirmedMoney}
                                onChange={(e) => setIsConfirmedMoney(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-red-900">
                                I confirm I have received the full amount in my bank account. This signature is legally equivalent to a receipt.
                            </span>
                        </label>

                        {/* Signature drawing area */}
                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Your signature:</p>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 relative">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="blue"
                                    canvasProps={{ className: "w-full h-[200px] cursor-crosshair" }}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute bottom-2 right-2 text-xs h-7 text-slate-500 hover:text-red-600"
                                    onClick={() => sigCanvas.current?.clear()}
                                >
                                    Clear and redraw
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center w-full gap-3">
                        {/* Quick Sign Button */}
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                            onClick={handleQuickSign}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "⚡ Quick Sign (Auto)"}
                        </Button>

                        {/* Cancel & Submit drawn signature buttons */}
                        <div className="flex w-full sm:w-auto gap-2">
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsSignModalOpen(false)}>Cancel</Button>
                            <Button className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSignPayroll} disabled={actionLoading}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSignature className="w-4 h-4 mr-2" />}
                                Submit Drawn Signature
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}