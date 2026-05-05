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

        // Trích xuất message từ response của backend (nếu có)
        const backendMessage = error?.response?.data?.message;

        if (error?.response?.status === 403) {
            // Nếu backend có gửi thông báo (chứa IP), dùng nó. Nếu không, dùng câu mặc định.
            const errorMessage = backendMessage || "Access denied. Please go to the office to resolve this issue.";
            setAccessDeniedError(errorMessage);
            return;
        }

        // For non-403 errors, show the standard toast
        const message = backendMessage || error?.message || "An unexpected error occurred";
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