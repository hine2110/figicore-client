import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Spec 3.5: StatusBadge Component

export type StatusType =
    | 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'
    | 'processing' | 'shipped' | 'delivered' | 'approved' | 'rejected'
    | 'ready' | 'packing' | 'in-progress' | 'inspected' | 'off';

interface StatusBadgeProps {
    status: StatusType | string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    // Success - Emerald
    'active': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' },
    'completed': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
    'delivered': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Delivered' },
    'approved': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Approved' },

    // Warning - Amber
    'pending': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
    'packing': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'Packing' },

    // Error - Red
    'cancelled': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Cancelled' },
    'rejected': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' },

    // Info - Blue
    'processing': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Processing' },
    'shipped': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Shipped' },
    'ready': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Ready' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'In Progress' },
    'inspected': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Inspected' },

    // Neutral
    'inactive': { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200', label: 'Inactive' },
    'off': { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', label: 'Off' },
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG['inactive'];

    return (
        <Badge
            variant="outline"
            size={size}
            className={cn(
                config.bg,
                config.text,
                config.border,
                "whitespace-nowrap",
                className
            )}
        >
            {config.label}
        </Badge>
    );
}
