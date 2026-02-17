import { useState, useEffect } from 'react';
import { DollarSign, Clock, LogOut, CheckCircle, PlayCircle, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { openSession, closeSession, getCurrentSession, getSessionAnalytics } from '@/services/posService';
import type { PosSession } from '@/types/pos.types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

export default function SessionManager() {
    const [currentSession, setCurrentSession] = useState<PosSession | null>(null);
    const [currentSales, setCurrentSales] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const [closeDialogVisible, setCloseDialogVisible] = useState(false);
    const [openingCash, setOpeningCash] = useState('');
    const [closingCash, setClosingCash] = useState('');
    const [closeNote, setCloseNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const sessionRes = await getCurrentSession();
            setCurrentSession(sessionRes.data);

            if (sessionRes.data) {
                try {
                    const analyticsRes = await getSessionAnalytics();
                    if (analyticsRes.data && analyticsRes.data.statistics) {
                        setCurrentSales(analyticsRes.data.statistics.total_sales || 0);
                    }
                } catch (err) {
                    console.error('Failed to load sales stats', err);
                }
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSession = async () => {
        const cashAmount = parseFloat(openingCash);
        if (isNaN(cashAmount) || cashAmount < 0) {
            toast.error('Invalid Amount', {
                description: 'Please enter a valid cash amount',
            });
            return;
        }

        setActionLoading(true);
        try {
            await openSession(cashAmount);
            toast.success('Session Opened', {
                description: 'Your shift has started successfully',
            });
            setOpeningCash('');
            loadData();
        } catch (error: any) {
            console.error('Failed to open session:', error);
            toast.error('Error', {
                description: error.response?.data?.message || 'Failed to open session',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCloseSession = async () => {
        if (!currentSession) return;

        const cashAmount = parseFloat(closingCash);
        if (isNaN(cashAmount) || cashAmount < 0) {
            toast.error('Invalid Amount', {
                description: 'Please enter a valid cash amount',
            });
            return;
        }

        setActionLoading(true);
        try {
            const response = await closeSession(currentSession.session_id, cashAmount, closeNote || undefined);

            const summary = response.data.summary;
            const variance = summary.variance;
            const varianceMessage = variance === 0
                ? 'Perfect balance!'
                : variance > 0
                    ? `Excess: ${Number(variance).toLocaleString('vi-VN')}₫`
                    : `Shortage: ${Number(Math.abs(variance)).toLocaleString('vi-VN')}₫`;

            toast.success('Session Closed', {
                description: varianceMessage,
            });

            setCloseDialogVisible(false);
            setClosingCash('');
            setCloseNote('');
            loadData();
        } catch (error: any) {
            console.error('Failed to close session:', error);
            toast.error('Error', {
                description: error.response?.data?.message || 'Failed to close session',
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-neutral-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            {/* Current Session Status */}
            {currentSession ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Status Card */}
                    <Card className="col-span-2 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl text-neutral-900 flex items-center gap-2">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    Active Session
                                </CardTitle>
                                <CardDescription className="text-neutral-500 ml-1">
                                    Session started at {format(new Date(currentSession.opened_at), 'HH:mm, MMM dd yyyy', { locale: enUS })}
                                </CardDescription>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setCloseDialogVisible(true)}
                                className="shadow-lg shadow-red-200"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                End Shift
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                                        <Banknote className="w-4 h-4" /> Opening Cash
                                    </div>
                                    <div className="text-2xl font-bold text-neutral-900">
                                        {Number(currentSession.opening_cash).toLocaleString('vi-VN')}₫
                                    </div>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                                        <DollarSign className="w-4 h-4" /> Current Sales
                                    </div>
                                    <div className="text-2xl font-bold text-indigo-600">
                                        {Number(currentSales).toLocaleString('vi-VN')}₫
                                    </div>
                                    <p className="text-xs text-neutral-400 mt-1">Session to date</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-neutral-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                                        <Clock className="w-4 h-4" /> Duration
                                    </div>
                                    <div className="text-2xl font-bold text-neutral-900">
                                        {/* Calculate duration here if needed */}
                                        Running
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="w-full max-w-lg border-neutral-200 shadow-xl">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PlayCircle className="w-8 h-8" />
                            </div>
                            <CardTitle className="text-2xl">Start New Session</CardTitle>
                            <CardDescription>
                                You need to open a session to start selling. Please count your cash drawer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="opening-cash-main">Opening Cash Amount</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <Input
                                        id="opening-cash-main"
                                        type="number"
                                        placeholder="0"
                                        className="pl-9 h-12 text-lg"
                                        value={openingCash}
                                        onChange={(e) => setOpeningCash(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleOpenSession();
                                        }}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                                        VND
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 font-medium"
                                onClick={handleOpenSession}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Starting Session...' : 'Open Session & Start Selling'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Close Session Dialog */}
            <Dialog open={closeDialogVisible} onOpenChange={setCloseDialogVisible}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>End Shift & Close Session</DialogTitle>
                        <DialogDescription>
                            Please count the cash in your drawer and enter the total amount below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="closing-cash">Total Cash in Drawer</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                    id="closing-cash"
                                    type="number"
                                    placeholder="0"
                                    className="pl-9"
                                    value={closingCash}
                                    onChange={(e) => setClosingCash(e.target.value)}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                                    VND
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="close-note">Notes (Optional)</Label>
                            <Textarea
                                id="close-note"
                                placeholder="Any discrepancies or issues during the shift..."
                                value={closeNote}
                                onChange={(e) => setCloseNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCloseDialogVisible(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleCloseSession} disabled={actionLoading}>
                            {actionLoading ? 'Closing...' : 'Close Session'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
