import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, RefreshCw, Power } from 'lucide-react';

interface Station {
    station_id: number;
    station_name: string;
    is_active: boolean;
    station_token: string;
    created_at: string;
}

interface StationListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStationConnected: () => void;
}

export default function StationListDialog({ open, onOpenChange, onStationConnected }: StationListDialogProps) {
    const { toast } = useToast();
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchStations = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/check-in/stations');
            setStations(res.data);
        } catch (error) {
            console.error("Failed to fetch stations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchStations();
    }, [open]);

    const handleConnect = (token: string) => {
        localStorage.setItem('FIGICORE_STATION_TOKEN', token);
        toast({ title: "Connected", description: "This device is now authorized as a Check-in Station." });
        onStationConnected();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Available Stations</DialogTitle>
                    <DialogDescription>
                        Select a station to finalize setup on this device. Only active stations can be connected.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                    ) : stations.length === 0 ? (
                        <div className="text-center text-neutral-500 py-4">No stations found. Register one first.</div>
                    ) : (
                        stations.map(station => (
                            <div key={station.station_id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {station.station_name}
                                        {station.is_active ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                                                <Check className="w-3 h-3 mr-1" /> Active
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center">
                                                <Loader2 className="w-3 h-3 mr-1" /> Pending
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-neutral-500">Created: {new Date(station.created_at).toLocaleDateString()}</div>
                                </div>
                                <Button
                                    size="sm"
                                    disabled={!station.is_active}
                                    onClick={() => handleConnect(station.station_token)}
                                >
                                    <Power className="w-4 h-4 mr-2" /> Connect
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={fetchStations} disabled={loading}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh List
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
