import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseSecurityCheckReturn {
    accessDeniedError: string | null;
    handleApiError: (error: any) => void;
    resetSecurityError: () => void;
}

export const useSecurityCheck = (): UseSecurityCheckReturn => {
    const { toast } = useToast();
    const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);

    const handleApiError = useCallback((error: any) => {
        // Log the full error for debugging
        console.error("API Error handled by useSecurityCheck:", error);

        if (error?.response?.status === 403) {
            setAccessDeniedError("Access denied. Please go to the office to resolve this issue.");
            return;
        }

        // For non-403 errors, show the standard toast
        const message = error?.response?.data?.message || error?.message || "An unexpected error occurred";
        toast({
            title: "Error",
            description: message,
            variant: "destructive"
        });
    }, [toast]);

    const resetSecurityError = useCallback(() => {
        setAccessDeniedError(null);
    }, []);

    return {
        accessDeniedError,
        handleApiError,
        resetSecurityError
    };
};
