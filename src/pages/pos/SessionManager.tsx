import { useState, useEffect } from 'react';
import { DollarSign, Clock, LogOut, CheckCircle, PlayCircle, Banknote, History, AlertCircle, Wallet, Calendar, User, ChevronLeft, ChevronRight, Eye, Receipt, Info, UserCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { openSession, closeSession, getCurrentSession, getSessionAnalytics, getSessions, getSessionDetails } from '@/services/posService';
import type { PosSession } from '@/types/pos.types';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import DenominationTable from './components/DenominationTable';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatVNDInput, parseVNDInput } from '@/lib/formatUtils';

export default function SessionManager() {
    const [currentSession, setCurrentSession] = useState<PosSession | null>(null);
    const [historySessions, setHistorySessions] = useState<PosSession[]>([]);
    const [totalSessions, setTotalSessions] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [currentSales, setCurrentSales] = useState<number>(0);
    const [cashSalesApp, setCashSalesApp] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const [closeDialogVisible, setCloseDialogVisible] = useState(false);
    const [openingCash, setOpeningCash] = useState('');
    const [suggestedOpeningCash, setSuggestedOpeningCash] = useState<number>(0);
    const [openingNote, setOpeningNote] = useState('');

    // New states for Advanced Closing
    const [actualCashTotal, setActualCashTotal] = useState(0);
    const [cashBreakdown, setCashBreakdown] = useState<Record<number, number>>({});
    const [cashExpenses, setCashExpenses] = useState<string>('');
    const [closeNote, setCloseNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Detail View State
    const [detailSession, setDetailSession] = useState<(PosSession & { orders?: any[] }) | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load current session
            const sessionRes = await getCurrentSession();
            setCurrentSession(sessionRes.data);

            if (sessionRes.data) {
                try {
                    const analyticsRes = await getSessionAnalytics();
                    if (analyticsRes.data) {
                        setCurrentSales(analyticsRes.data.statistics?.total_sales || 0);
                        const cashAmount = analyticsRes.data.payment_breakdown?.CASH?.amount || 0;
                        setCashSalesApp(cashAmount);
                    }
                } catch (err) {
                    console.error('Failed to load sales stats', err);
                }
            } else if (sessionRes.suggested_opening_cash !== undefined) {
                // Auto-fill opening cash from system suggestions (first of day = 2M, else last closed shift)
                setSuggestedOpeningCash(sessionRes.suggested_opening_cash);
                setOpeningCash(formatVNDInput(sessionRes.suggested_opening_cash.toString()));
            }

            // Load history sessions
            const historyRes = await getSessions(page, limit);
            setHistorySessions(historyRes.data);
            setTotalSessions(historyRes.total);
        } catch (error) {
            console.error('Failed to load sessions data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSession = async () => {
        const cashAmount = parseVNDInput(openingCash);
        const discrepancy = cashAmount - suggestedOpeningCash;

        if (cashAmount < 0 || (openingCash === '' && isNaN(cashAmount))) {
            toast.error('Invalid Amount', {
                description: 'Please enter a valid cash amount',
            });
            return;
        }

        if (discrepancy !== 0 && !openingNote.trim()) {
            toast.error('Note Required', {
                description: 'Opening cash mismatch. Please enter the reason for the discrepancy.',
            });
            return;
        }

        setActionLoading(true);
        try {
            await openSession(cashAmount, openingNote || undefined);
            toast.success('Session Opened', {
                description: 'Your shift has started successfully',
            });
            setOpeningCash('');
            setOpeningNote('');
            loadData();
        } catch (error: any) {
            toast.error('Error', {
                description: error.response?.data?.message || 'Failed to open session',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCloseSession = async () => {
        if (!currentSession) return;

        setActionLoading(true);
        try {
            const expenses = parseVNDInput(cashExpenses);
            const response = await closeSession(
                currentSession.session_id,
                actualCashTotal,
                closeNote || undefined,
                expenses,
                cashBreakdown,
                cashSalesApp
            );

            const summary = response.data.summary;
            const variance = summary.variance;
            const varianceMessage = variance === 0
                ? 'Perfect balance!'
                : variance > 0
                    ? `Excess: ${Number(variance).toLocaleString('vi-VN')}₫`
                    : `Shortage: ${Number(Math.abs(variance)).toLocaleString('vi-VN')}₫`;

            toast.success('Shift Ended', {
                description: varianceMessage,
            });

            setCloseDialogVisible(false);
            setActualCashTotal(0);
            setCashBreakdown({});
            setCashExpenses('');
            setCloseNote('');
            loadData();
        } catch (error: any) {
            toast.error('Error', {
                description: error.response?.data?.message || 'Failed to close session',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetail = async (sessionId: number) => {
        setDetailVisible(true);
        setDetailLoading(true);
        try {
            const res = await getSessionDetails(sessionId);
            setDetailSession(res.data);
        } catch (err) {
            toast.error('Failed to load session details');
            setDetailVisible(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const expensesValue = parseVNDInput(cashExpenses);
    const openingCashValue = currentSession ? Number(currentSession.opening_cash) : 0;
    const mustHaveInDrawer = cashSalesApp + openingCashValue - expensesValue;
    const variance = actualCashTotal - mustHaveInDrawer;
    const amountToWithdraw = mustHaveInDrawer - openingCashValue;

    const currentOpeningCashInput = parseVNDInput(openingCash);
    const openingDiscrepancy = currentOpeningCashInput - suggestedOpeningCash;
    const isOpeningDiscrepant = openingDiscrepancy !== 0;

    if (loading && page === 1 && !currentSession) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-neutral-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto px-6 py-8 pb-20 animate-in fade-in duration-500">
            {/* Header section with Stats & Active Shift */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Shift Management</h1>
                    <p className="text-neutral-500 font-medium mt-1">Open, close and audit your register shifts</p>
                </div>
            </div>

                {currentSession ? (
                    <Card className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden group transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all duration-500 group-hover:scale-150" />
                        <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                                    <div className="p-2 bg-green-100/80 text-green-600 rounded-xl">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    Active Shift
                                </CardTitle>
                                <CardDescription className="text-neutral-500 ml-1 flex items-center gap-1.5 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    Started: {format(new Date(currentSession.opened_at), 'HH:mm, MMM dd yyyy', { locale: enUS })}
                                </CardDescription>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setCloseDialogVisible(true)}
                                className="h-10 px-4 rounded-xl font-bold shadow-sm"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                End Shift & Report
                            </Button>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:shadow-md transition-all duration-300 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                                    <div className="relative z-10 flex flex-col justify-between h-full">
                                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-1">
                                            <div className="p-2 bg-emerald-100 rounded-xl"><Banknote className="w-4 h-4 text-emerald-600" /></div>
                                            Opening Balance
                                        </div>
                                        <div className="text-3xl font-bold text-neutral-900 tracking-tight mt-2">
                                            {Number(currentSession.opening_cash).toLocaleString('vi-VN')}₫
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 bg-cyan-50/50 rounded-2xl border border-cyan-100 hover:shadow-md transition-all duration-300 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                                    <div className="relative z-10 flex flex-col justify-between h-full">
                                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-1">
                                            <div className="p-2 bg-cyan-100 rounded-xl"><DollarSign className="w-4 h-4 text-cyan-600" /></div>
                                            Total Sales (All)
                                        </div>
                                        <div className="text-3xl font-bold text-cyan-700 tracking-tight mt-2">
                                            {Number(currentSales).toLocaleString('vi-VN')}₫
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 hover:shadow-md transition-all duration-300 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                                    <div className="relative z-10 flex flex-col justify-between h-full">
                                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-1">
                                            <div className="p-2 bg-amber-100 rounded-xl"><Wallet className="w-4 h-4 text-amber-600" /></div>
                                            Cash Sales (App)
                                        </div>
                                        <div className="text-3xl font-bold text-neutral-900 tracking-tight mt-2">
                                            {Number(cashSalesApp).toLocaleString('vi-VN')}₫
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="w-full bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden py-8">
                        <CardHeader className="text-center">
                            <div className="w-20 h-20 bg-indigo-50/50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                                <div className="absolute inset-0 border-[4px] border-white rounded-full shadow-sm"></div>
                                <PlayCircle className="w-10 h-10" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-neutral-900 tracking-tight">No Active Shift</CardTitle>
                            <CardDescription className="text-neutral-500 font-medium mt-1">Start a new shift to begin processing orders.</CardDescription>
                        </CardHeader>
                        <CardContent className="max-w-md mx-auto">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="opening-cash-main" className="text-sm font-semibold text-neutral-700 ml-1">Initial Cash Fund</Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                        <Input
                                            id="opening-cash-main"
                                            type="text"
                                            placeholder="0"
                                            className="pl-12 h-14 text-xl font-bold rounded-2xl border-neutral-200 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white"
                                            value={openingCash}
                                            onChange={(e) => setOpeningCash(formatVNDInput(e.target.value))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleOpenSession(); }}
                                        />
                                    </div>
                                </div>

                                {isOpeningDiscrepant && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className={`p-4 rounded-xl flex items-center justify-between ${openingDiscrepancy > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                            <div className="flex items-center gap-2 text-sm font-bold">
                                                <AlertCircle className="w-4 h-4" />
                                                Cash Discrepancy (vs. Last Shift):
                                            </div>
                                            <div className="font-black">
                                                {openingDiscrepancy > 0 ? '+' : ''}{openingDiscrepancy.toLocaleString('vi-VN')}₫
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="opening-note" className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                Discrepancy Note <span className="text-rose-500">*</span>
                                            </Label>
                                            <Textarea
                                                id="opening-note"
                                                placeholder="e.g., Added small change, previous shift error..."
                                                className="resize-none h-20 rounded-xl border-neutral-200 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                                                value={openingNote}
                                                onChange={(e) => setOpeningNote(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button
                                    className="w-full h-12 text-base rounded-xl font-bold shadow-sm"
                                    onClick={handleOpenSession}
                                    disabled={actionLoading || (isOpeningDiscrepant && !openingNote.trim())}
                                >
                                    {actionLoading ? 'Starting...' : 'Open New Shift'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

            {/* Shift History Section */}
            <div className="flex flex-col flex-1 mt-4 animate-in fade-in duration-500 relative">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-neutral-400" />
                        Shift History
                    </h3>
                    <Badge variant="outline" className="px-3 py-1 font-medium bg-white text-neutral-500 rounded-full border-neutral-200 shadow-sm">
                        Total: {totalSessions} shifts
                    </Badge>
                </div>

                <div className="bg-white rounded-[1.5rem] border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50/50 backdrop-blur-sm border-b border-neutral-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider">Employee</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider text-right">Opening</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider text-right">Revenue (Cash)</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider text-right">Actual</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {historySessions.length > 0 ? (
                                    historySessions.map((session) => {
                                        const cashApp = Number(session.cash_revenue_app || 0);
                                        const opening = Number(session.opening_cash || 0);
                                        const expenses = Number(session.total_expenses || 0);
                                        const actual = Number(session.closing_cash || 0);

                                        return (
                                            <tr key={session.session_id} className="hover:bg-neutral-50/80 transition-all border-b border-neutral-50 group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-neutral-900">
                                                            {format(new Date(session.opened_at), 'dd MMM, yyyy')}
                                                        </span>
                                                        <span className="text-xs text-neutral-500 font-medium">
                                                            {format(new Date(session.opened_at), 'HH:mm')} - {session.closed_at ? format(new Date(session.closed_at), 'HH:mm') : 'Active'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                                                            {(session as any).employees?.users?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <span className="font-bold text-sm text-neutral-900">{(session as any).employees?.users?.full_name || 'Staff'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-neutral-600 text-sm">
                                                    {opening.toLocaleString('vi-VN')}₫
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-sm text-indigo-600">{cashApp.toLocaleString('vi-VN')}₫</span>
                                                        {expenses > 0 && <span className="text-xs text-red-500 font-medium">-{expenses.toLocaleString('vi-VN')}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-sm text-neutral-900">
                                                    {session.status_code === 'OPEN' ? '-' : `${actual.toLocaleString('vi-VN')}₫`}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant="secondary" className={`${session.status_code === 'OPEN'
                                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                        : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                                                        } border px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide shadow-sm`}>
                                                        {session.status_code}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                        onClick={() => handleViewDetail(session.session_id)}
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <History className="w-12 h-12" />
                                                <p className="font-black text-sm uppercase tracking-widest">No shift history found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-100 bg-white">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            Showing {limit} per page
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                {totalSessions > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalSessions)} / {totalSessions} shifts
                            </div>
                            <div className="flex gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 w-8 rounded-lg shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page * limit >= totalSessions}
                                    className="h-8 w-8 rounded-lg shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session Detail View Dialog */}
            <Dialog open={detailVisible} onOpenChange={setDetailVisible}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2rem] border border-neutral-200 shadow-2xl bg-white max-h-[90vh] flex flex-col">
                    <DialogTitle className="sr-only">Session Detail View</DialogTitle>
                    {detailLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading details...</p>
                        </div>
                    ) : detailSession && (
                        <>
                            <div className="bg-neutral-50/50 px-8 py-8 border-b border-neutral-100 relative">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                    <History className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-1">
                                        <Badge variant="secondary" className={`${detailSession.status_code === 'OPEN'
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                                            } border px-2.5 py-1 mb-2 rounded-full font-bold text-[10px] uppercase tracking-wide shadow-sm`}>
                                            {detailSession.status_code}
                                        </Badge>
                                        <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Shift #{detailSession.session_id}</h2>
                                        <div className="flex items-center gap-4 text-neutral-500 text-sm font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-neutral-400" />
                                                {format(new Date(detailSession.opened_at), 'MMMM dd, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-neutral-400" />
                                                {format(new Date(detailSession.opened_at), 'HH:mm')} - {detailSession.closed_at ? format(new Date(detailSession.closed_at), 'HH:mm') : 'Present'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 pr-5 rounded-2xl border border-neutral-100 shadow-sm">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                                            {(detailSession as any).employees?.users?.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">In Charge</span>
                                            <span className="text-sm font-bold text-neutral-900">{(detailSession as any).employees?.users?.full_name || 'Staff'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:shadow-md transition-all duration-300 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-1">
                                                <div className="p-2 bg-emerald-100 rounded-xl"><PlusCircle className="w-4 h-4 text-emerald-600" /></div>
                                                Opening Cash
                                            </div>
                                            <div className="text-3xl font-bold text-neutral-900 tracking-tight mt-2">
                                                {Number(detailSession.opening_cash).toLocaleString('vi-VN')}₫
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 hover:shadow-md transition-all duration-300 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-1">
                                                <div className="p-2 bg-rose-100 rounded-xl"><MinusCircle className="w-4 h-4 text-rose-600" /></div>
                                                Total Expenses
                                            </div>
                                            <div className="text-3xl font-bold text-neutral-900 tracking-tight mt-2">
                                                {Number(detailSession.total_expenses).toLocaleString('vi-VN')}₫
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 hover:shadow-md transition-all duration-300 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-xl" />
                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 mb-1">
                                                <div className="p-2 bg-indigo-100 rounded-xl"><Wallet className="w-4 h-4 text-indigo-600" /></div>
                                                Total Cash Revenue
                                            </div>
                                            <div className="text-3xl font-bold text-indigo-700 tracking-tight mt-2">
                                                {Number(detailSession.cash_revenue_app).toLocaleString('vi-VN')}₫
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: Financial Summary */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                                                <Receipt className="w-4 h-4 text-neutral-400" /> Reconciliation Result
                                            </h3>
                                            <div className="bg-white rounded-[1.5rem] border border-neutral-200 overflow-hidden shadow-sm">
                                                <div className="p-5 flex justify-between items-center border-b border-neutral-100">
                                                    <span className="text-sm font-bold text-neutral-500">Expected in Drawer</span>
                                                    <span className="font-bold text-neutral-900 text-base">
                                                        {(Number(detailSession.opening_cash) + Number(detailSession.cash_revenue_app) - Number(detailSession.total_expenses)).toLocaleString('vi-VN')}₫
                                                    </span>
                                                </div>
                                                <div className="p-5 flex justify-between items-center bg-neutral-50/50">
                                                    <span className="text-sm font-bold text-neutral-500">Actual Closing Cash</span>
                                                    <span className="font-bold text-neutral-900 text-base">
                                                        {detailSession.status_code === 'OPEN' ? '-' : Number(detailSession.closing_cash).toLocaleString('vi-VN') + '₫'}
                                                    </span>
                                                </div>
                                                <div className={`p-5 flex justify-between items-center border-t border-neutral-100 ${detailSession.status_code === 'OPEN' ? 'bg-neutral-50/80' :
                                                    (Number(detailSession.closing_cash) - (Number(detailSession.opening_cash) + Number(detailSession.cash_revenue_app) - Number(detailSession.total_expenses))) >= 0
                                                        ? 'bg-emerald-50/50' : 'bg-rose-50/50'
                                                    }`}>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Variance</span>
                                                    <span className={`text-xl font-bold ${detailSession.status_code === 'OPEN' ? 'text-neutral-400' :
                                                        (Number(detailSession.closing_cash) - (Number(detailSession.opening_cash) + Number(detailSession.cash_revenue_app) - Number(detailSession.total_expenses))) >= 0
                                                            ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                        {detailSession.status_code === 'OPEN' ? '-' :
                                                            (Number(detailSession.closing_cash) - (Number(detailSession.opening_cash) + Number(detailSession.cash_revenue_app) - Number(detailSession.total_expenses))).toLocaleString('vi-VN') + '₫'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {detailSession.note && (
                                            <div>
                                                <h3 className="font-bold text-neutral-500 uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                                                    <Info className="w-3 h-3" /> Staff Note
                                                </h3>
                                                <div className="p-4 bg-amber-50/50 rounded-xl text-sm text-neutral-700 italic border border-amber-100/50">
                                                    "{detailSession.note}"
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Cash Breakdown */}
                                    <div>
                                        <h3 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                                            <Banknote className="w-4 h-4 text-emerald-500" /> Cash Breakdown
                                        </h3>
                                        <div className="bg-neutral-50/50 rounded-[1.5rem] p-4 border border-neutral-200 shadow-inner max-h-[300px] overflow-y-auto">
                                            {detailSession.cash_breakdown ? (
                                                <div className="space-y-2">
                                                    {Object.entries(detailSession.cash_breakdown as Record<string, number>)
                                                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                                                        .map(([denom, qty]) => qty > 0 && (
                                                            <div key={denom} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-neutral-100 group hover:shadow-md transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                                    <span className="font-bold text-neutral-900 text-sm">{Number(denom).toLocaleString('vi-VN')}₫</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-xs font-bold text-neutral-400">x {qty}</span>
                                                                    <span className="text-sm font-bold text-indigo-600">{(Number(denom) * qty).toLocaleString('vi-VN')}₫</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 opacity-50 italic text-sm text-neutral-500">No breakdown recorded</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="mt-10 mb-6">
                                    <h3 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-indigo-400" /> Orders Processed ({detailSession.orders?.length || 0})
                                    </h3>
                                    <div className="bg-white rounded-[1.5rem] border border-neutral-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-neutral-50/50 border-b border-neutral-100">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Order ID</th>
                                                    <th className="px-6 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Customer</th>
                                                    <th className="px-6 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase">Method</th>
                                                    <th className="px-6 py-4 font-bold text-neutral-500 text-xs tracking-wider uppercase text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-50">
                                                {detailSession.orders && detailSession.orders.length > 0 ? (
                                                    detailSession.orders.map((order) => (
                                                        <tr key={order.order_id} className="hover:bg-neutral-50/80 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-neutral-900">{order.order_code}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <UserCircle className="w-4 h-4 text-neutral-400" />
                                                                    <span className="font-bold text-neutral-700">{order.users?.full_name || 'Guest'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase bg-white text-neutral-600">
                                                                    {order.payment_method_code}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-bold text-indigo-600">
                                                                {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-6 text-center text-neutral-400 italic font-medium">No orders found in this shift</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-6 bg-neutral-50/50 border-t border-neutral-100">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl text-neutral-700 font-bold shadow-sm bg-white hover:bg-neutral-50"
                                    onClick={() => setDetailVisible(false)}
                                >
                                    Close Details View
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Advanced Close Session Dialog */}
            <Dialog open={closeDialogVisible} onOpenChange={setCloseDialogVisible}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2rem] border border-neutral-200 shadow-2xl">
                    <DialogTitle className="sr-only">End Shift & Reconcile</DialogTitle>
                    <div className="bg-neutral-50/50 px-8 py-6 border-b border-neutral-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-neutral-900">
                                <History className="w-5 h-5 text-indigo-400" />
                                End Shift & Reconcile
                            </h2>
                            <p className="text-neutral-500 text-sm font-medium mt-1">Verify your physical cash vs system records</p>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-[1rem] text-right border border-neutral-100 shadow-sm">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Must have in Drawer</div>
                            <div className="text-xl font-bold text-indigo-600 mt-1">
                                {mustHaveInDrawer.toLocaleString('vi-VN')}₫
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 bg-neutral-50/30 overflow-hidden">
                        {/* Left Side: Cash Counting */}
                        <div className="p-8 border-r border-neutral-100 bg-white">
                            <h3 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-6 flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-indigo-500" /> 1. Actual Cash Count
                            </h3>
                            <DenominationTable onChange={(total, breakdown) => {
                                setActualCashTotal(total);
                                setCashBreakdown(breakdown);
                            }} />

                            <div className="mt-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex justify-between items-center shadow-inner">
                                <span className="font-bold text-indigo-900">Total Actual Cash:</span>
                                <div className="text-2xl font-bold text-indigo-700 tracking-tight">
                                    {actualCashTotal.toLocaleString('vi-VN')}₫
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Reconciliation & Final Form */}
                        <div className="p-8 space-y-6">
                            <h3 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-6 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" /> 2. Reconciliation & Reporting
                            </h3>

                            {/* Detailed Stats Panel */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-[1rem] border border-neutral-200 shadow-sm transition-all focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10">
                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Daily Expenses</div>
                                    <Input
                                        type="text"
                                        placeholder="0"
                                        className="h-10 text-xl font-bold border-none bg-transparent px-0 rounded-none focus-visible:ring-0"
                                        value={cashExpenses}
                                        onChange={(e) => setCashExpenses(formatVNDInput(e.target.value))}
                                    />
                                </div>
                                <div className="p-4 bg-neutral-50/80 rounded-[1rem] border border-neutral-200 shadow-sm flex flex-col justify-center">
                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">App Cash Revenue</div>
                                    <div className="text-xl font-bold text-neutral-900">{cashSalesApp.toLocaleString('vi-VN')}₫</div>
                                </div>
                            </div>

                            {/* Final Results */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 px-1 border-b border-neutral-100">
                                    <span className="text-sm font-bold text-neutral-500">Expected in Drawer:</span>
                                    <span className="font-bold text-neutral-900">{mustHaveInDrawer.toLocaleString('vi-VN')}₫</span>
                                </div>
                                <div className="flex justify-between items-center py-4 bg-white px-5 rounded-2xl shadow-sm border border-neutral-200">
                                    <span className="text-sm font-bold text-neutral-500">Variance (Actual - App):</span>
                                    <span className={`text-xl font-bold ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {variance > 0 ? '+' : ''}{variance.toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white px-6 rounded-2xl shadow-md border border-indigo-400/30">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Daily Cash Collection</span>
                                        <span className="text-xs font-medium italic opacity-60 mt-0.5">Revenue minus Opening</span>
                                    </div>
                                    <span className="text-2xl font-bold tracking-tight">{amountToWithdraw.toLocaleString('vi-VN')}₫</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="close-note-adv" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Closing Note</Label>
                                <Textarea
                                    id="close-note-adv"
                                    placeholder="Reason for variance (if any)..."
                                    className="resize-none h-24 bg-white border-neutral-200 rounded-[1rem] focus-visible:ring-indigo-500/20 shadow-sm"
                                    value={closeNote}
                                    onChange={(e) => setCloseNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-neutral-50 border-t border-neutral-100 flex sm:justify-between items-center">
                        <Button
                            variant="ghost"
                            className="text-neutral-500 font-bold hover:text-neutral-700 transition-colors"
                            onClick={() => setCloseDialogVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCloseSession}
                            disabled={actionLoading || actualCashTotal === 0}
                            className="h-12 px-8 rounded-xl font-bold shadow-sm"
                        >
                            {actionLoading ? 'Closing...' : 'Confirm & End Shift'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
