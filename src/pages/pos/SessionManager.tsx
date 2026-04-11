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
        <div className="space-y-8 max-w-6xl mx-auto px-6 py-8 pb-20">
            {/* Header section with Stats & Active Shift */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Shift Management</h1>
                        <p className="text-neutral-500 font-medium">Open, close and audit your register shifts.</p>
                    </div>
                </div>

                {currentSession ? (
                    <Card className="bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl text-neutral-900 flex items-center gap-3">
                                    <div className="p-2.5 bg-green-100/80 text-green-600 rounded-xl">
                                        <CheckCircle className="w-6 h-6" />
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
                                className="h-11 px-6 shadow-lg shadow-red-200 hover:scale-105 transition-transform font-bold uppercase tracking-wider text-xs"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                End Shift & Report
                            </Button>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm group hover:border-indigo-200 transition-all duration-300">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[1.5px] mb-2">
                                        <Banknote className="w-4 h-4 text-emerald-400" /> Opening Balance
                                    </div>
                                    <div className="text-2xl font-black text-neutral-900 tracking-tight">
                                        {Number(currentSession.opening_cash).toLocaleString('vi-VN')}
                                        <span className="text-sm font-bold ml-1 text-neutral-400 uppercase">vnd</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm group hover:border-indigo-200 transition-all duration-300">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[1.5px] mb-2">
                                        <DollarSign className="w-4 h-4 text-indigo-400" /> Total Sales (All)
                                    </div>
                                    <div className="text-2xl font-black text-indigo-600 tracking-tight">
                                        {Number(currentSales).toLocaleString('vi-VN')}
                                        <span className="text-sm font-bold ml-1 text-indigo-300 uppercase">vnd</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm group hover:border-indigo-200 transition-all duration-300">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[1.5px] mb-2">
                                        <Wallet className="w-4 h-4 text-amber-400" /> Cash Sales (App)
                                    </div>
                                    <div className="text-2xl font-black text-neutral-900 tracking-tight">
                                        {Number(cashSalesApp).toLocaleString('vi-VN')}
                                        <span className="text-sm font-bold ml-1 text-neutral-400 uppercase">vnd</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="w-full border-neutral-100 shadow-2xl rounded-3xl overflow-hidden bg-white">
                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        <CardHeader className="text-center pt-8">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-inner">
                                <PlayCircle className="w-8 h-8" />
                            </div>
                            <CardTitle className="text-2xl font-black text-neutral-900 tracking-tight">No Active Shift</CardTitle>
                            <CardDescription className="text-neutral-500 font-medium">Start a new shift to begin processing orders.</CardDescription>
                        </CardHeader>
                        <CardContent className="max-w-md mx-auto pb-10">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="opening-cash-main" className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Initial Cash Fund</Label>
                                    <div className="relative group">
                                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            id="opening-cash-main"
                                            type="text"
                                            placeholder="0"
                                            className="pl-12 h-12 text-xl font-black rounded-xl border-neutral-200 focus:ring-4 focus:ring-indigo-500/10 transition-all"
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
                                    className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                                    onClick={handleOpenSession}
                                    disabled={actionLoading || (isOpeningDiscrepant && !openingNote.trim())}
                                >
                                    {actionLoading ? 'Starting...' : 'Open New Shift'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Shift History Section */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        Shift History
                    </h3>
                    <div className="text-xs font-bold text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        {totalSessions} total shifts
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/80 border-b border-neutral-100">
                                    <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-[10px] tracking-widest">Date & Time</th>
                                    <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-[10px] tracking-widest">Employee</th>
                                    <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-[10px] tracking-widest">Opening</th>
                                    <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-[10px] tracking-widest">Revenue (Cash)</th>
                                    <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-[10px] tracking-widest">Actual</th>
                                    <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-[10px] tracking-widest text-center">Actions</th>
                                    <th className="px-6 py-4 font-bold text-neutral-400 uppercase text-[10px] tracking-widest text-center">Status</th>
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
                                            <tr key={session.session_id} className="hover:bg-neutral-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-neutral-900">
                                                            {format(new Date(session.opened_at), 'MMM dd, yyyy')}
                                                        </span>
                                                        <span className="text-[11px] text-neutral-400 font-medium">
                                                            {format(new Date(session.opened_at), 'HH:mm')} - {session.closed_at ? format(new Date(session.closed_at), 'HH:mm') : 'Active'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center font-bold text-[10px]">
                                                            {(session as any).employees?.users?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <span className="font-semibold text-neutral-700">{(session as any).employees?.users?.full_name || 'Staff'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-medium text-neutral-600 font-mono text-xs">
                                                    {opening.toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-indigo-600 font-mono text-xs">{cashApp.toLocaleString('vi-VN')}</span>
                                                        {expenses > 0 && <span className="text-[10px] text-red-400 font-bold italic">-{expenses.toLocaleString('vi-VN')} Expenses</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-black text-neutral-900 font-mono text-xs">
                                                    {session.status_code === 'OPEN' ? '-' : actual.toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                                        onClick={() => handleViewDetail(session.session_id)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${session.status_code === 'OPEN'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-neutral-100 text-neutral-500'
                                                        }`}>
                                                        {session.status_code}
                                                    </span>
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

                    {/* Pagination */}
                    {totalSessions > limit && (
                        <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
                            <p className="text-xs font-bold text-neutral-400">
                                Showing <span className="text-neutral-900">{(page - 1) * limit + 1}</span> to <span className="text-neutral-900">{Math.min(page * limit, totalSessions)}</span> of <span className="text-neutral-900">{totalSessions}</span> shifts
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page * limit >= totalSessions}
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Detail View Dialog */}
            <Dialog open={detailVisible} onOpenChange={setDetailVisible}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white max-h-[90vh] flex flex-col">
                    {detailLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Loading details...</p>
                        </div>
                    ) : detailSession && (
                        <>
                            <div className="bg-neutral-100 px-8 py-8 border-b border-neutral-200 relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <History className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-1">
                                        <Badge className={`uppercase text-[10px] font-black tracking-widest mb-2 ${detailSession.status_code === 'OPEN' ? 'bg-green-500 hover:bg-green-600' : 'bg-neutral-600'}`}>
                                            {detailSession.status_code}
                                        </Badge>
                                        <h2 className="text-3xl font-black tracking-tighter text-neutral-900">Shift #{detailSession.session_id}</h2>
                                        <div className="flex items-center gap-4 text-neutral-500 text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-indigo-400" />
                                                {format(new Date(detailSession.opened_at), 'MMMM dd, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-indigo-400" />
                                                {format(new Date(detailSession.opened_at), 'HH:mm')} - {detailSession.closed_at ? format(new Date(detailSession.closed_at), 'HH:mm') : 'Present'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                        <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-black text-sm">
                                            {(detailSession as any).employees?.users?.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-[1px]">In Charge</div>
                                            <div className="text-sm font-bold text-neutral-900">{(detailSession as any).employees?.users?.full_name || 'Staff'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                    <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 relative overflow-hidden group hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                                            <PlusCircle className="w-4 h-4 text-emerald-500" /> Opening Cash
                                        </div>
                                        <div className="text-xl font-black text-neutral-900 tracking-tight">
                                            {Number(detailSession.opening_cash).toLocaleString('vi-VN')}₫
                                        </div>
                                    </div>
                                    <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 relative overflow-hidden group hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                                            <MinusCircle className="w-4 h-4 text-rose-500" /> Total Expenses
                                        </div>
                                        <div className="text-xl font-black text-neutral-900 tracking-tight">
                                            {Number(detailSession.total_expenses).toLocaleString('vi-VN')}₫
                                        </div>
                                    </div>
                                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden shadow-sm">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                                            <Wallet className="w-4 h-4 text-indigo-500" /> Total Cash Revenue
                                        </div>
                                        <div className="text-xl font-black text-indigo-600 tracking-tight">
                                            {Number(detailSession.cash_revenue_app).toLocaleString('vi-VN')}₫
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Left: Financial Summary */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-black text-neutral-900 uppercase text-[11px] tracking-[2px] mb-4 flex items-center gap-2">
                                                <Receipt className="w-4 h-4 text-neutral-400" /> Reconciliation Result
                                            </h3>
                                            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                                                <div className="p-4 flex justify-between items-center border-b border-neutral-100">
                                                    <span className="text-sm font-medium text-neutral-500">Expected in Drawer</span>
                                                    <span className="font-bold text-neutral-700">
                                                        {(Number(detailSession.opening_cash) + Number(detailSession.cash_revenue_app) - Number(detailSession.total_expenses)).toLocaleString('vi-VN')}₫
                                                    </span>
                                                </div>
                                                <div className="p-4 flex justify-between items-center bg-neutral-50">
                                                    <span className="text-sm font-medium text-neutral-500">Actual Closing Cash</span>
                                                    <span className="font-black text-neutral-900">
                                                        {detailSession.status_code === 'OPEN' ? '-' : Number(detailSession.closing_cash).toLocaleString('vi-VN') + '₫'}
                                                    </span>
                                                </div>
                                                <div className={`p-5 flex justify-between items-center border-t-2 ${detailSession.status_code === 'OPEN' ? 'bg-neutral-100' :
                                                    (Number(detailSession.closing_cash) - (Number(detailSession.opening_cash) + Number(detailSession.cash_revenue_app) - Number(detailSession.total_expenses))) >= 0
                                                        ? 'bg-emerald-50' : 'bg-rose-50'
                                                    }`}>
                                                    <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Variance</span>
                                                    <span className={`text-xl font-black ${detailSession.status_code === 'OPEN' ? 'text-neutral-400' :
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
                                                <h3 className="font-black text-neutral-400 uppercase text-[10px] tracking-[2px] mb-2 flex items-center gap-2">
                                                    <Info className="w-3 h-3" /> Staff Note
                                                </h3>
                                                <div className="p-4 bg-neutral-50 rounded-xl text-sm text-neutral-600 italic border border-neutral-100">
                                                    "{detailSession.note}"
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Cash Breakdown */}
                                    <div>
                                        <h3 className="font-black text-neutral-900 uppercase text-[11px] tracking-[2px] mb-4 flex items-center gap-2">
                                            <Banknote className="w-4 h-4 text-emerald-500" /> Cash Breakdown
                                        </h3>
                                        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 max-h-[300px] overflow-y-auto">
                                            {detailSession.cash_breakdown ? (
                                                <div className="space-y-2">
                                                    {Object.entries(detailSession.cash_breakdown as Record<string, number>)
                                                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                                                        .map(([denom, qty]) => qty > 0 && (
                                                            <div key={denom} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-neutral-100 group hover:scale-[1.02] transition-transform">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                                    <span className="font-black text-neutral-900 text-sm">{Number(denom).toLocaleString('vi-VN')}₫</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-xs font-bold text-neutral-400">x {qty}</span>
                                                                    <span className="font-mono text-sm font-bold text-indigo-600">{(Number(denom) * qty).toLocaleString('vi-VN')}₫</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 opacity-30 italic text-sm">No breakdown recorded</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="mt-12 mb-8">
                                    <h3 className="font-black text-neutral-900 uppercase text-[11px] tracking-[2px] mb-6 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-amber-500" /> Orders Processed ({detailSession.orders?.length || 0})
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                    <th className="px-6 py-4 font-bold text-neutral-400 text-[10px] uppercase">Order ID</th>
                                                    <th className="px-6 py-4 font-bold text-neutral-400 text-[10px] uppercase">Customer</th>
                                                    <th className="px-6 py-4 font-bold text-neutral-400 text-[10px] uppercase">Method</th>
                                                    <th className="px-6 py-4 font-bold text-neutral-400 text-[10px] uppercase text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-50">
                                                {detailSession.orders && detailSession.orders.length > 0 ? (
                                                    detailSession.orders.map((order) => (
                                                        <tr key={order.order_id} className="hover:bg-neutral-50/50 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-neutral-900">{order.order_code}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <UserCircle className="w-4 h-4 text-neutral-300" />
                                                                    <span className="font-semibold text-neutral-600">{order.users?.full_name || 'Guest'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge variant="outline" className="text-[9px] font-black tracking-wider uppercase bg-white">
                                                                    {order.payment_method_code}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-indigo-600 font-mono">
                                                                {Number(order.total_amount).toLocaleString('vi-VN')}₫
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-6 text-center text-neutral-400 italic">No orders found in this shift</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-8 bg-neutral-50 border-t border-neutral-100">
                                <Button
                                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100"
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
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <div className="bg-neutral-100 px-8 py-6 border-b border-neutral-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-neutral-900">
                                <History className="w-5 h-5 text-indigo-400" />
                                End Shift & Reconcile
                            </h2>
                            <p className="text-neutral-400 text-xs font-medium">Verify your physical cash vs system records</p>
                        </div>
                        <div className="bg-neutral-50 px-4 py-2 rounded-xl text-right border border-neutral-100">
                            <div className="text-[10px] font-black text-neutral-400 uppercase">Must have in Drawer</div>
                            <div className="text-lg font-black text-indigo-600">
                                {mustHaveInDrawer.toLocaleString('vi-VN')}₫
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 bg-neutral-50 overflow-hidden">
                        {/* Left Side: Cash Counting */}
                        <div className="p-8 border-r border-neutral-100 bg-white">
                            <h3 className="font-black text-neutral-900 uppercase text-[10px] tracking-[2px] mb-6 flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-indigo-500" /> 1. Actual Cash Count
                            </h3>
                            <DenominationTable onChange={(total, breakdown) => {
                                setActualCashTotal(total);
                                setCashBreakdown(breakdown);
                            }} />

                            <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                                <span className="font-bold text-indigo-900">Total Actual Cash:</span>
                                <div className="text-2xl font-black text-indigo-600">
                                    {actualCashTotal.toLocaleString('vi-VN')}₫
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Reconciliation & Final Form */}
                        <div className="p-8 space-y-6">
                            <h3 className="font-black text-neutral-900 uppercase text-[10px] tracking-[2px] mb-6 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" /> 2. Reconciliation & Reporting
                            </h3>

                            {/* Detailed Stats Panel */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-xl border border-neutral-100">
                                    <div className="text-[9px] font-black text-neutral-400 uppercase mb-1">Daily Expenses</div>
                                    <Input
                                        type="text"
                                        placeholder="0"
                                        className="h-10 text-lg font-bold border-none bg-neutral-50 px-3"
                                        value={cashExpenses}
                                        onChange={(e) => setCashExpenses(formatVNDInput(e.target.value))}
                                    />
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-neutral-100 flex flex-col justify-center">
                                    <div className="text-[9px] font-black text-neutral-400 uppercase mb-1">App Cash Revenue</div>
                                    <div className="text-lg font-bold text-neutral-900">{cashSalesApp.toLocaleString('vi-VN')}₫</div>
                                </div>
                            </div>

                            {/* Final Results */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-3 border-b border-neutral-200">
                                    <span className="text-sm font-bold text-neutral-500">Expected in Drawer:</span>
                                    <span className="font-black text-neutral-900">{mustHaveInDrawer.toLocaleString('vi-VN')}₫</span>
                                </div>
                                <div className="flex justify-between items-center py-4 bg-white px-4 rounded-xl shadow-sm border border-neutral-100">
                                    <span className="text-sm font-bold text-neutral-500">Variance (Actual - App):</span>
                                    <span className={`text-xl font-black ${variance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {variance > 0 ? '+' : ''}{variance.toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-4 bg-indigo-600 text-white px-6 rounded-2xl shadow-xl shadow-indigo-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase opacity-70">Daily Cash Collection</span>
                                        <span className="text-xs font-medium italic opacity-50 px-0.5">Revenue minus Opening</span>
                                    </div>
                                    <span className="text-2xl font-black">{amountToWithdraw.toLocaleString('vi-VN')}₫</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label htmlFor="close-note-adv" className="text-[9px] font-black text-neutral-400 uppercase">Closing Note</Label>
                                <Textarea
                                    id="close-note-adv"
                                    placeholder="Reason for variance (if any)..."
                                    className="resize-none h-24 bg-white border-neutral-200"
                                    value={closeNote}
                                    onChange={(e) => setCloseNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-neutral-100 border-t border-neutral-200 flex sm:justify-between items-center">
                        <Button
                            variant="link"
                            className="text-neutral-500 font-bold text-xs uppercase tracking-widest"
                            onClick={() => setCloseDialogVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCloseSession}
                            disabled={actionLoading || actualCashTotal === 0}
                            className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-red-100 hover:scale-105 transition-all"
                        >
                            {actionLoading ? 'Closing...' : 'Confirm & End Shift'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
