import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { VouchersService } from '@/services/vouchers.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VoucherListPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') {
            navigate('/');
        }
    }, [user, navigate]);

    const { data: vouchers, isLoading } = useQuery({
        queryKey: ['vouchers'],
        queryFn: VouchersService.getAll,
    });

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Customer Vouchers</h2>
                <Button onClick={() => navigate('/manager/vouchers/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Voucher
                </Button>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Code</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Rank Limit</TableHead>
                            <TableHead>Min Order</TableHead>
                            <TableHead>Collected / Limit</TableHead>
                            <TableHead>Valid Dates</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : vouchers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                    No vouchers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            vouchers?.map((v) => (
                                <TableRow key={v.promotion_id}>
                                    <TableCell className="font-semibold">{v.code}</TableCell>
                                    <TableCell>
                                        {v.discount_type === 'PERCENTAGE' ? `${v.discount_value}%` : `${new Intl.NumberFormat('vi-VN').format(Number(v.discount_value))}đ`}
                                    </TableCell>
                                    <TableCell>
                                        {v.apply_rank_code ? (
                                            <Badge variant="outline" className="bg-yellow-50">{v.apply_rank_code}</Badge>
                                        ) : (
                                            <span className="text-gray-400">All</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {v.min_order_value ? `${new Intl.NumberFormat('vi-VN').format(Number(v.min_order_value))}đ` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {v.collected_quantity || 0} / {v.max_quantity || '∞'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {v.start_date && v.end_date ? (
                                            <>
                                                <div>{format(new Date(v.start_date), 'dd/MM/yyyy HH:mm')}</div>
                                                <div className="text-slate-500">to {format(new Date(v.end_date), 'dd/MM/yyyy HH:mm')}</div>
                                            </>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {v.is_public ? <Badge className="bg-green-500">Public</Badge> : <Badge variant="secondary">Hidden</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/manager/vouchers/${v.promotion_id}/edit`)}>Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
