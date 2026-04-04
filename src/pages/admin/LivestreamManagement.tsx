import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { livestreamsService } from "@/services/livestreams.service";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RefreshCcw, PlusCircle, Trash2, Video, BarChart3, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateLivestreamModal } from "@/components/admin/CreateLivestreamModal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import api from '@/services/api';

export default function LivestreamManagement() {
    const [livestreams, setLivestreams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Report Modal State
    const [reportData, setReportData] = useState<any>(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isFetchingReport, setIsFetchingReport] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchLivestreams = async () => {
        setIsLoading(true);
        try {
            const data = await livestreamsService.getLivestreams();
            setLivestreams(data);
        } catch (error: any) {
            toast({
                title: "Failed to fetch livestreams",
                description: error.response?.data?.message || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLivestreams();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this session?")) return;
        try {
            await livestreamsService.remove(id);
            toast({ title: "Session deleted" });
            fetchLivestreams();
        } catch (error: any) {
            toast({
                title: "Failed to delete",
                description: error.response?.data?.message || "Cannot delete active sessions.",
                variant: "destructive",
            });
        }
    };

    const handleViewReport = async (id: number) => {
        setIsFetchingReport(true);
        try {
            const res = await api.get(`/livestreams/${id}/report`);
            setReportData(res.data);
            setIsReportOpen(true);
        } catch (error: any) {
            toast({
                title: "Failed to fetch report",
                description: "Could not retrieve the post-live report.",
                variant: "destructive"
            });
        } finally {
            setIsFetchingReport(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Livestream Sessions</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Schedule and manage your Shopee-style selling sessions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLivestreams} disabled={isLoading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-200">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Session
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="font-semibold text-neutral-900">Session Info</TableHead>
                            <TableHead className="font-semibold text-neutral-900">Scheduled Time</TableHead>
                            <TableHead className="font-semibold text-neutral-900">Status</TableHead>
                            <TableHead className="font-semibold text-neutral-900 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-neutral-500">
                                    Loading sessions...
                                </TableCell>
                            </TableRow>
                        ) : livestreams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-neutral-500">
                                    No livestream sessions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            livestreams.map((ls) => (
                                <TableRow key={ls.id} className="hover:bg-neutral-50/50">
                                    <TableCell>
                                        <div className="font-medium text-neutral-900">{ls.title}</div>
                                        <div className="text-xs text-neutral-500 line-clamp-1">{ls.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {ls.start_time ? format(new Date(ls.start_time), 'MMM dd, HH:mm') : 'Not Scheduled'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={ls.status === 'LIVE' ? 'destructive' : 'secondary'}>
                                            {ls.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {ls.status === 'ENDED' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                                    onClick={() => handleViewReport(ls.id)}
                                                    disabled={isFetchingReport}
                                                >
                                                    <BarChart3 className="w-4 h-4 mr-2" />
                                                    View Report
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                                        onClick={() => navigate(`/admin/livestreams/${ls.id}/live`)}
                                                    >
                                                        <Video className="w-4 h-4 mr-2" />
                                                        Go Live
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(ls.id)}
                                                        disabled={ls.status === 'LIVE'}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateLivestreamModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchLivestreams}
            />

            {/* Post-Live Report Dialog */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="max-w-md bg-white border-0 p-0 rounded-2xl overflow-hidden shadow-2xl">
                    <DialogTitle className="sr-only">Session Report</DialogTitle>
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150"></div>
                        </div>
                        <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md mx-auto mb-4 flex items-center justify-center shadow-2xl border border-white/30 rotate-3">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Transmission Report</h2>
                        <div className="flex flex-col items-center gap-1 mt-3">
                            {reportData?.startTime && (
                                <p className="text-emerald-100/80 text-[10px] font-mono tracking-widest uppercase flex gap-2">
                                    <span>Start</span> <span>{format(new Date(reportData.startTime), 'dd/MM/yy HH:mm')}</span>
                                </p>
                            )}
                            {reportData?.endTime && (
                                <p className="text-emerald-100/80 text-[10px] font-mono tracking-widest uppercase flex gap-2">
                                    <span>End</span> <span className="ml-[10px]">{format(new Date(reportData.endTime), 'dd/MM/yy HH:mm')}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="p-8 space-y-6 bg-slate-50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-3xl bg-white border border-neutral-200 text-center shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2 block">Total Revenue</span>
                                <span className="text-lg font-black text-emerald-600 font-mono tracking-tighter">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(reportData?.revenue || 0)}
                                </span>
                            </div>
                            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-center shadow-sm hover:shadow-md transition-shadow">
                                <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest mb-2 block">Net Profit</span>
                                <span className="text-lg font-black text-emerald-700 font-mono tracking-tighter">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(reportData?.profit || 0)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block text-center mb-1">Orders</span>
                                <div className="text-2xl font-black text-neutral-800 font-mono">{reportData?.orderCount || 0}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block text-center mb-1">Top Item</span>
                                <div className="text-[11px] font-bold text-neutral-700 uppercasetext-center line-clamp-2 leading-tight">
                                    {reportData?.topProduct || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold tracking-wide shadow-lg"
                            onClick={() => setIsReportOpen(false)}
                        >
                            Close Report
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
