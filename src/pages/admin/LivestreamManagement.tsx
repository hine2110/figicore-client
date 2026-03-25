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
import { RefreshCcw, PlusCircle, Trash2, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateLivestreamModal } from "@/components/admin/CreateLivestreamModal";

export default function LivestreamManagement() {
    const [livestreams, setLivestreams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
        </div>
    );
}
