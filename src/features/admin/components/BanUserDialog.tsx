import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BanUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: number;
    userName: string;
    onConfirm: (userId: number, reason: string) => Promise<void>;
}

export default function BanUserDialog({ 
    open, 
    onOpenChange, 
    userId, 
    userName, 
    onConfirm 
}: BanUserDialogProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(userId, reason);
            onOpenChange(false);
            setReason(""); // Reset form
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">Ban User Account</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to ban <b>{userName}</b>? 
                        This user will be logged out immediately and cannot access the system anymore.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-2">
                    <Label htmlFor="ban-reason" className="text-sm font-semibold text-neutral-700">
                        Reason for Ban <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="ban-reason"
                        placeholder="Violation of policy, inappropriate behavior, etc..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="resize-none h-24"
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault(); // Prevent auto-closing
                            handleConfirm();
                        }}
                        disabled={!reason.trim() || isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isSubmitting ? "Banning..." : "Confirm Ban"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
