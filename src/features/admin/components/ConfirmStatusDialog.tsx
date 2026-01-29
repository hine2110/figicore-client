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

interface ConfirmStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    currentStatus: string; // 'ACTIVE' | 'INACTIVE'
}

export default function ConfirmStatusDialog({ open, onOpenChange, onConfirm, currentStatus }: ConfirmStatusDialogProps) {
    const isActive = currentStatus === 'ACTIVE';

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isActive ? "Deactivate Account?" : "Activate Account?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isActive 
                            ? "This user will lose access to the system immediately. You can reactivate them later."
                            : "This user will regain access to the system immediately."
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm}
                        className={isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                    >
                        {isActive ? "Deactivate" : "Activate"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
