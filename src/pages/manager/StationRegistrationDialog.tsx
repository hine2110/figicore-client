import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '@/lib/axiosInstance';
import { useToast } from '@/components/ui/use-toast';
import { MonitorSmartphone, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';

interface StationRegistrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStationConnected?: () => void;
}

export default function StationRegistrationDialog({ open, onOpenChange, onStationConnected }: StationRegistrationDialogProps) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stationId, setStationId] = useState<number | null>(null);
    const [polling, setPolling] = useState(false);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setPolling(false);
            setStationId(null);
            setIsSubmitting(false);
        }
    }, [open]);

    // Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (polling && stationId) {
            interval = setInterval(async () => {
                try {
                    const res = await axiosInstance.get(`/check-in/station-status/${stationId}`);
                    // Logic: If API response returns { is_active: true, station_token: "..." }
                    if (res.data.is_active && res.data.station_token) {
                        // Store the station_token
                        localStorage.setItem('FIGICORE_STATION_TOKEN', res.data.station_token);

                        // Clear Pending state
                        setPolling(false);

                        toast({
                            title: "Registration Confirmed!",
                            description: "This station is now active and connected.",
                            className: "bg-green-50 border-green-200 text-green-800"
                        });

                        // Notify parent
                        if (onStationConnected) onStationConnected();

                        // Close dialog
                        onOpenChange(false);

                        // Automatically redirect/reload (Logic handled by onStationConnected usually updating state, 
                        // but user asked for "Automatically redirect... to Dashboard". 
                        // Since this dialog is likely ON the dashboard, maybe just refreshing state is enough?
                        // "Automatically redirect the user to the Check-in Dashboard" -> /pos/schedule or similar?
                        // Assuming onStationConnected/FinalizeSetup updates the view immediately.
                    }
                } catch (error) {
                    console.error("Polling error", error);
                    // Don't stop polling on transient network errors, but maybe if 404?
                }
            }, 5000); // 5 seconds
        }

        return () => clearInterval(interval);
    }, [polling, stationId, onStationConnected, onOpenChange, toast]);

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await axiosInstance.post('/check-in/register-station', { name, managerEmail: email });

            // Assuming API now returns station_id as per backend update
            if (res.data.station_id) {
                setStationId(res.data.station_id);
                setPolling(true);
            }

            toast({
                title: "Request Sent",
                description: "Check your email to confirm this station."
            });
        } catch (error: any) {
            setIsSubmitting(false); // Only reset if failed
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to register station",
                variant: "destructive"
            });
        }
        // Do NOT set isSubmitting(false) on success, keep it disabled/loading state transition to "Waiting"
    };

    const handleClose = () => {
        setPolling(false);
        setName('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                {!polling ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MonitorSmartphone className="w-5 h-5 text-blue-600" />
                                Register This Station
                            </DialogTitle>
                            <DialogDescription>
                                Create a identity for this device to allow secure Check-ins.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Station Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Front Desk iMac..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Manager Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || !name || !email}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Waiting for Approval...
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                                Request sent for <strong>{name}</strong>. Please check your email and approve the request.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                            <ShieldCheck className="w-16 h-16 text-neutral-200" />
                            <p className="text-sm text-neutral-500 max-w-[80%]">
                                This screen will automatically update once you verify the request in your email.
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel / Run in Background
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
