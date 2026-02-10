import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange
}: PaginationControlsProps) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-neutral-200 rounded-b-2xl">
            <div className="text-sm text-neutral-600 font-medium">
                Showing <span className="font-bold text-neutral-900">{startItem}-{endItem}</span> of{' '}
                <span className="font-bold text-neutral-900">{totalItems}</span> items
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9 px-3 rounded-xl border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </Button>
                <div className="px-4 py-2 bg-neutral-100 rounded-xl text-sm font-bold text-neutral-900">
                    Page {currentPage} of {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9 px-3 rounded-xl border-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
