import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

import { VouchersService } from '@/services/vouchers.service';
import { PromotionsService } from '@/services/promotions.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VoucherListPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const currentTab = searchParams.get('tab') || 'vouchers';

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') {
            navigate('/');
        }
    }, [user, navigate]);

    const canWrite = user?.role_code === 'MANAGER'; 

    const { data: vouchers, isLoading: isLoadingVouchers } = useQuery({
        queryKey: ['vouchers'],
        queryFn: VouchersService.getAll,
    });

    const { data: promotions, isLoading: isLoadingPromotions } = useQuery({
        queryKey: ['promotions'],
        queryFn: PromotionsService.getAll
    });

    // --- FILTERS ---
    const [voucherSearch, setVoucherSearch] = useState('');
    const [voucherType, setVoucherType] = useState('ALL');
    const [voucherStatus, setVoucherStatus] = useState('ALL');
    const [voucherRank, setVoucherRank] = useState('ALL');

    const [promoSearch, setPromoSearch] = useState('');
    const [promoStatus, setPromoStatus] = useState('ALL');

    const getVoucherStatusObj = (v: any) => {
        const now = new Date();
        const startDate = v.start_date ? new Date(v.start_date) : new Date();
        const endDate = v.end_date ? new Date(v.end_date) : null;
        
        if (!v.is_public) return 'HIDDEN';
        if (endDate && now > endDate) return 'EXPIRED';
        if (v.max_quantity && v.collected_quantity !== undefined && v.collected_quantity >= v.max_quantity) return 'OUT_OF_STOCK';
        if (startDate > now) return 'COMING_SOON';
        return 'PUBLIC';
    };

    const getPromoStatusObj = (p: any) => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${h}:${mi}`;

        if (!p.is_active) return 'INACTIVE';
        // Check if we're inside the daily time window
        const inWindow = p.start_time && p.end_time && currentTime >= p.start_time && currentTime <= p.end_time;
        if (inWindow) return 'ACTIVE';
        return 'SCHEDULED';
    };

    const filteredVouchers = vouchers?.filter(v => {
        const srch = voucherSearch.toLowerCase();
        const matchesSearch = v.code.toLowerCase().includes(srch) ||
                              String(v.discount_value).includes(srch);
        const matchesType = voucherType === 'ALL' || v.discount_type === voucherType;
        const matchesRank = voucherRank === 'ALL' || 
                           (voucherRank === 'NO_RANK' && !v.apply_rank_code) ||
                           v.apply_rank_code === voucherRank;

        let matchesStatus = true;
        if (voucherStatus !== 'ALL') {
            matchesStatus = getVoucherStatusObj(v) === voucherStatus;
        }

        return matchesSearch && matchesType && matchesRank && matchesStatus;
    });

    const filteredPromotions = promotions?.filter(p => {
        const srch = promoSearch.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(srch) || 
                              String(p.value).includes(srch);
        
        let matchesStatus = true;
        if (promoStatus !== 'ALL') {
            matchesStatus = getPromoStatusObj(p) === promoStatus;
        }
        
        return matchesSearch && matchesStatus;
    });

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Promotions & Vouchers</h2>
                    <p className="text-muted-foreground">Manage all your product discounts and order vouchers in one place.</p>
                </div>
                {canWrite && (
                    <Button onClick={() => navigate('/manager/vouchers/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Create Campaign
                    </Button>
                )}
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="vouchers" className="text-base">Order Vouchers & Free Ship</TabsTrigger>
                    <TabsTrigger value="promotions" className="text-base">Product Promotions</TabsTrigger>
                </TabsList>

                {/* TAB 1: VOUCHERS */}
                <TabsContent value="vouchers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Vouchers</CardTitle>
                            <CardDescription>Coupons applied at checkout for order discounts or free shipping.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search by Code or % (e.g., WELCOME20, 15)..." 
                                        className="pl-9"
                                        value={voucherSearch}
                                        onChange={(e) => setVoucherSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Select value={voucherType} onValueChange={setVoucherType}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Types</SelectItem>
                                            <SelectItem value="PERCENTAGE">Discount %</SelectItem>
                                            <SelectItem value="FREE_SHIP">Free Shipping</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={voucherRank} onValueChange={setVoucherRank}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="All Ranks" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Ranks</SelectItem>
                                            <SelectItem value="NO_RANK">No Rank Limit</SelectItem>
                                            <SelectItem value="BRONZE">Bronze</SelectItem>
                                            <SelectItem value="SILVER">Silver</SelectItem>
                                            <SelectItem value="GOLD">Gold</SelectItem>
                                            <SelectItem value="DIAMOND">Diamond</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={voucherStatus} onValueChange={setVoucherStatus}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Status</SelectItem>
                                            <SelectItem value="PUBLIC">Public & Active</SelectItem>
                                            <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                                            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                                            <SelectItem value="EXPIRED">Expired</SelectItem>
                                            <SelectItem value="HIDDEN">Hidden</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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
                                        {isLoadingVouchers ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    {Array.from({ length: 8 }).map((_, j) => (
                                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : filteredVouchers?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                                    No vouchers found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredVouchers?.map((v) => (
                                                <TableRow key={v.promotion_id}>
                                                    <TableCell className="font-semibold">{v.code}</TableCell>
                                                    <TableCell>
                                                        {v.discount_type === 'PERCENTAGE' 
                                                            ? `${v.discount_value}%` 
                                                            : v.discount_type === 'FREE_SHIP' 
                                                                ? 'Free Ship'
                                                                : `${new Intl.NumberFormat('vi-VN').format(Number(v.discount_value))}đ`}
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
                                                        {(() => {
                                                            const status = getVoucherStatusObj(v);
                                                            if (status === 'HIDDEN') return <Badge variant="secondary">Hidden</Badge>;
                                                            if (status === 'EXPIRED') return <Badge variant="secondary" className="bg-slate-200 text-slate-600 hover:bg-slate-300">Expired</Badge>;
                                                            if (status === 'OUT_OF_STOCK') return <Badge className="bg-yellow-500 hover:bg-yellow-600">Out of Stock</Badge>;
                                                            if (status === 'COMING_SOON') return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Coming Soon</Badge>;
                                                            return <Badge className="bg-green-500 hover:bg-green-600">Public</Badge>;
                                                        })()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => navigate(`/manager/vouchers/${v.promotion_id}/edit`)}
                                                            disabled={!canWrite}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: PROMOTIONS */}
                <TabsContent value="promotions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Product Promotions</CardTitle>
                            <CardDescription>Discounts applied directly to products, displayed as strikethrough prices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search by Name or % (e.g., Summer Sale, 15)..." 
                                        className="pl-9"
                                        value={promoSearch}
                                        onChange={(e) => setPromoSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={promoStatus} onValueChange={setPromoStatus}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Status</SelectItem>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                                            <SelectItem value="EXPIRED">Expired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Program Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Variants Applied</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingPromotions ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    {Array.from({ length: 7 }).map((_, j) => (
                                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : filteredPromotions?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                                    No product promotions found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPromotions?.map((promo) => (
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
                                                        {promo.start_time && promo.end_time ? (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-semibold text-orange-700">⚡ {promo.start_time} – {promo.end_time}</span>
                                                                {promo.is_recurring
                                                                    ? <Badge className="w-fit text-[10px] bg-orange-100 text-orange-700 border-orange-300">🔁 Daily</Badge>
                                                                    : <Badge className="w-fit text-[10px] bg-slate-100 text-slate-600 border-slate-300">One-time</Badge>
                                                                }
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            const status = getPromoStatusObj(promo);
                                                            if (status === 'INACTIVE') return <Badge variant="secondary">Inactive</Badge>;
                                                            if (status === 'SCHEDULED') return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Scheduled</Badge>;
                                                            return <Badge className="bg-green-500 hover:bg-green-600">Active Now</Badge>;
                                                        })()}
                                                    </TableCell>
                                                    <TableCell>{promo._count?.product_variants || 0}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => navigate(`/manager/vouchers/${promo.promotion_id}/edit?type=promotion`)}
                                                            disabled={!canWrite}
                                                            className={!canWrite ? "opacity-50 cursor-not-allowed" : ""}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
