
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PromotionsService } from '@/services/promotions.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PromotionListPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    // RBAC: Only MANAGER can write
    const canWrite = user?.role_code === 'MANAGER'; 



    const { data: promotions } = useQuery({
        queryKey: ['promotions'],
        queryFn: PromotionsService.getAll
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Product Promotions</h2>
                    <p className="text-muted-foreground">Manage discounts and flash sales.</p>
                </div>
                {canWrite && (
                    <Button onClick={() => navigate('/manager/promotions/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Create Promotion
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Promotions</CardTitle>
                    <CardDescription>List of all active advertising campaigns and discounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promotions?.map((promo) => (
                                <TableRow key={promo.promotion_id}>
                                    <TableCell className="font-medium">{promo.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{promo.type_code}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {promo.type_code === 'PERCENTAGE' 
                                            ? `${Number(promo.value)}%` 
                                            : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(promo.value))}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(promo.start_date), 'dd/MM/yyyy')} - {format(new Date(promo.end_date), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        {promo.is_active 
                                            ? <Badge className="bg-green-500">Active</Badge> 
                                            : <Badge variant="secondary">Inactive</Badge>}
                                    </TableCell>
                                    <TableCell>{promo._count?.products || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">


                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => navigate(`/manager/promotions/${promo.promotion_id}/edit`)}
                                                disabled={!canWrite} // Disable for Admin
                                                className={!canWrite ? "opacity-50 cursor-not-allowed" : ""}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>



        </div>
    );
}
