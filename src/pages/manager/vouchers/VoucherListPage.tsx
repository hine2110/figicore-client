import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

import { VouchersService, Voucher } from '@/services/vouchers.service';
import { PromotionsService, Promotion } from '@/services/promotions.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Search, Eye, Trash2, Ticket, Tag, Package, Zap, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
interface VoucherDetail extends Voucher {
    description?: string;
}

interface PromotionDetail extends Promotion {
    product_variants?: {
        variant_id: number;
        sku: string;
        option_name: string;
        price: number;
        products?: { name: string };
    }[];
    promotion_items?: {
        item_id: number;
        variant_id: number;
        flash_sale_price: number;
        quota: number;
        sold: number;
        product_variants?: {
            sku: string;
            option_name: string;
            price: number;
            stock_available: number;
            products?: { name: string };
        };
    }[];
}

export default function VoucherListPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const currentTab = searchParams.get('tab') || 'vouchers';
    const handleTabChange = (value: string) => setSearchParams({ tab: value });

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') navigate('/');
    }, [user, navigate]);

    const canWrite = user?.role_code === 'MANAGER';

    // ── Data ──────────────────────────────────────────────
    const { data: vouchers, isLoading: isLoadingVouchers } = useQuery({
        queryKey: ['vouchers'],
        queryFn: VouchersService.getAll,
    });

    const { data: promotions, isLoading: isLoadingPromotions } = useQuery({
        queryKey: ['promotions'],
        queryFn: PromotionsService.getAll,
    });

    // ── Filters ───────────────────────────────────────────
    const [voucherSearch, setVoucherSearch] = useState('');
    const [voucherType, setVoucherType] = useState('ALL');
    const [voucherStatus, setVoucherStatus] = useState('ALL');
    const [voucherRank, setVoucherRank] = useState('ALL');
    const [promoSearch, setPromoSearch] = useState('');
    const [promoStatus, setPromoStatus] = useState('ALL');

    // ── View Detail state ─────────────────────────────────
    const [viewVoucher, setViewVoucher] = useState<VoucherDetail | null>(null);
    const [viewVoucherLoading, setViewVoucherLoading] = useState(false);
    const [viewPromo, setViewPromo] = useState<PromotionDetail | null>(null);
    const [viewPromoLoading, setViewPromoLoading] = useState(false);

    // ── Delete state ──────────────────────────────────────
    const [deleteVoucherTarget, setDeleteVoucherTarget] = useState<Voucher | null>(null);
    const [deletePromoTarget, setDeletePromoTarget] = useState<Promotion | null>(null);

    // ── Handlers ──────────────────────────────────────────
    const handleViewVoucher = async (v: Voucher) => {
        setViewVoucherLoading(true);
        try {
            const detail = await VouchersService.getById(v.promotion_id);
            setViewVoucher(detail as VoucherDetail);
        } catch {
            toast.error('Could not load voucher details.');
        } finally {
            setViewVoucherLoading(false);
        }
    };

    const handleViewPromo = async (p: Promotion) => {
        setViewPromoLoading(true);
        try {
            const detail = await PromotionsService.getById(p.promotion_id);
            setViewPromo(detail as PromotionDetail);
        } catch {
            toast.error('Could not load promotion details.');
        } finally {
            setViewPromoLoading(false);
        }
    };

    // ── Delete mutations ───────────────────────────────────
    const deleteVoucherMutation = useMutation({
        mutationFn: (id: number) => VouchersService.delete(id),
        onSuccess: () => {
            toast.success('Voucher deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
            setDeleteVoucherTarget(null);
        },
        onError: () => toast.error('Failed to delete voucher.'),
    });

    const deletePromoMutation = useMutation({
        mutationFn: (id: number) => PromotionsService.delete(id),
        onSuccess: () => {
            toast.success('Promotion deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            setDeletePromoTarget(null);
        },
        onError: () => toast.error('Failed to delete promotion.'),
    });

    // ── Status helpers ─────────────────────────────────────
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
        if (!p.is_active) return 'INACTIVE';
        const now = new Date();
        const buildDateTime = (dateStr: string | null, timeStr: string, fallbackDate: Date): Date => {
            const base = dateStr ? new Date(dateStr) : new Date(fallbackDate);
            const [hh, mm] = timeStr.split(':').map(Number);
            const d = new Date(base);
            d.setHours(hh, mm, 0, 0);
            return d;
        };
        if (!p.start_time || !p.end_time) return 'SCHEDULED';
        if (p.is_recurring) {
            const startStr = p.start_time; // HH:mm
            const endStr = p.end_time;     // HH:mm
            if (!startStr || !endStr) return 'SCHEDULED';
            
            // Check date range if present
            if (p.start_date || p.end_date) {
                const sDate = p.start_date ? new Date(p.start_date) : null;
                const eDate = p.end_date ? new Date(p.end_date) : null;
                if (sDate && now < sDate) return 'SCHEDULED';
                if (eDate && now > eDate) return 'INACTIVE';
            }

            // check HH:mm window
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            if (startStr === endStr) return 'ACTIVE'; // 24h

            if (startStr < endStr) {
                return (timeStr >= startStr && timeStr < endStr) ? 'ACTIVE' : 'SCHEDULED';
            } else {
                // Overnight: active if (now >= start) OR (now < end)
                return (timeStr >= startStr || timeStr < endStr) ? 'ACTIVE' : 'SCHEDULED';
            }
        }

        const promoStart = buildDateTime(p.start_date, p.start_time, now);
        const promoEnd = buildDateTime(p.end_date || p.start_date, p.end_time, now);
        // Remove 59s grace period to match backend's gt: timeStr
        if (now > promoEnd) return 'INACTIVE';
        if (now >= promoStart && now <= promoEnd) return 'ACTIVE';
        return 'SCHEDULED';
    };

    // ── Filters ───────────────────────────────────────────
    const filteredVouchers = vouchers?.filter(v => {
        const srch = voucherSearch.toLowerCase();
        const matchesSearch = v.code.toLowerCase().includes(srch) || String(v.discount_value).includes(srch);
        const matchesType = voucherType === 'ALL' || v.discount_type === voucherType;
        const matchesRank = voucherRank === 'ALL' || (voucherRank === 'NO_RANK' && !v.apply_rank_code) || v.apply_rank_code === voucherRank;
        let matchesStatus = true;
        if (voucherStatus !== 'ALL') matchesStatus = getVoucherStatusObj(v) === voucherStatus;
        return matchesSearch && matchesType && matchesRank && matchesStatus;
    });

    const filteredPromotions = promotions?.filter(p => {
        const srch = promoSearch.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(srch) || String(p.value).includes(srch);
        let matchesStatus = true;
        if (promoStatus !== 'ALL') matchesStatus = getPromoStatusObj(p) === promoStatus;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Promotions & Vouchers</h2>
                    <p className="text-muted-foreground">Manage all your product discounts and order vouchers in one place.</p>
                </div>
                {canWrite && (
                    <Button onClick={() => navigate('/manager/vouchers/new?type=percentage')}>
                        <Plus className="mr-2 h-4 w-4" /> Create Campaign
                    </Button>
                )}
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="vouchers" className="text-base">Order Vouchers & Free Ship</TabsTrigger>
                    <TabsTrigger value="promotions" className="text-base">Product Promotions</TabsTrigger>
                </TabsList>

                {/* ════════════════ TAB 1: VOUCHERS ════════════════ */}
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
                                    <Input placeholder="Search by Code or % (e.g., WELCOME20, 15)..." className="pl-9" value={voucherSearch} onChange={(e) => setVoucherSearch(e.target.value)} />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Select value={voucherType} onValueChange={setVoucherType}>
                                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Types</SelectItem>
                                            <SelectItem value="PERCENTAGE">Discount %</SelectItem>
                                            <SelectItem value="FREE_SHIP">Free Shipping</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={voucherRank} onValueChange={setVoucherRank}>
                                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Ranks" /></SelectTrigger>
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
                                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
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
                                                <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                                            ))
                                        ) : filteredVouchers?.length === 0 ? (
                                            <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">No vouchers found.</TableCell></TableRow>
                                        ) : (
                                            filteredVouchers?.map((v) => (
                                                <TableRow key={v.promotion_id}>
                                                    <TableCell className="font-semibold">{v.code}</TableCell>
                                                    <TableCell>
                                                        {v.discount_type === 'PERCENTAGE' ? `${v.discount_value}%` : v.discount_type === 'FREE_SHIP' ? 'Free Ship' : `${new Intl.NumberFormat('vi-VN').format(Number(v.discount_value))}đ`}
                                                    </TableCell>
                                                    <TableCell>
                                                        {v.apply_rank_code ? <Badge variant="outline" className="bg-yellow-50">{v.apply_rank_code}</Badge> : <span className="text-gray-400">All</span>}
                                                    </TableCell>
                                                    <TableCell>{v.min_order_value ? `${new Intl.NumberFormat('vi-VN').format(Number(v.min_order_value))}đ` : '-'}</TableCell>
                                                    <TableCell>{v.collected_quantity || 0} / {v.max_quantity || '∞'}</TableCell>
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
                                                            if (status === 'EXPIRED') return <Badge variant="secondary" className="bg-slate-200 text-slate-600">Expired</Badge>;
                                                            if (status === 'OUT_OF_STOCK') return <Badge className="bg-yellow-500 hover:bg-yellow-600">Out of Stock</Badge>;
                                                            if (status === 'COMING_SOON') return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Coming Soon</Badge>;
                                                            return <Badge className="bg-green-500 hover:bg-green-600">Public</Badge>;
                                                        })()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {/* View Detail */}
                                                            <Button variant="ghost" size="icon" title="View voucher details" onClick={() => handleViewVoucher(v)} disabled={viewVoucherLoading}>
                                                                <Eye className="w-4 h-4 text-blue-600" />
                                                            </Button>
                                                            {/* Edit */}
                                                            <Button variant="ghost" size="icon" title="Edit voucher" onClick={() => navigate(`/manager/vouchers/${v.promotion_id}/edit`)} disabled={!canWrite}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            {/* Delete */}
                                                            {canWrite && (
                                                                <Button variant="ghost" size="icon" title="Delete voucher" onClick={() => setDeleteVoucherTarget(v)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
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

                {/* ════════════════ TAB 2: PROMOTIONS ════════════════ */}
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
                                    <Input placeholder="Search by Name or % (e.g., Summer Sale, 15)..." className="pl-9" value={promoSearch} onChange={(e) => setPromoSearch(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={promoStatus} onValueChange={setPromoStatus}>
                                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
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
                                                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                                            ))
                                        ) : filteredPromotions?.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No product promotions found.</TableCell></TableRow>
                                        ) : (
                                            filteredPromotions?.map((promo) => (
                                                <TableRow key={promo.promotion_id}>
                                                    <TableCell className="font-medium">{promo.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{promo.type_code}</Badge>
                                                        {promo.is_flash_sale && <Badge className="ml-1 bg-red-500 text-white text-xs">⚡ Flash</Badge>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {promo.is_flash_sale
                                                            ? (() => {
                                                                if (!promo.promotion_items || promo.promotion_items.length === 0) return <span className="text-muted-foreground text-xs italic">By product</span>;
                                                                
                                                                let maxSave = 0;
                                                                let maxPct = 0;
                                                                promo.promotion_items.forEach((item: any) => {
                                                                    const original = Number(item.product_variants?.price || 0);
                                                                    const flash = Number(item.flash_sale_price || 0);
                                                                    const save = original - flash;
                                                                    const pct = original > 0 ? Math.round((save / original) * 100) : 0;
                                                                    if (save > maxSave) maxSave = save;
                                                                    if (pct > maxPct) maxPct = pct;
                                                                });

                                                                if (maxSave <= 0) return <span className="text-muted-foreground text-xs italic">By product</span>;

                                                                return (
                                                                    <Badge className="bg-green-100 text-green-800 border-green-300 flex flex-col items-center justify-center p-1.5 h-auto w-fit gap-0.5">
                                                                        <span>-{formatCurrency(maxSave)}</span>
                                                                        <span className="text-xs font-normal">({maxPct}%)</span>
                                                                    </Badge>
                                                                );
                                                            })()
                                                            : promo.type_code === 'PERCENTAGE' 
                                                                ? `${Number(promo.value)}%` 
                                                                : formatCurrency(Number(promo.value))}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {promo.start_time && promo.end_time ? (
                                                            <div className="flex flex-col">
                                                                {promo.is_recurring ? (
                                                                    <>
                                                                        <span className="font-semibold text-orange-700">⚡ {promo.start_time} – {promo.end_time}</span>
                                                                        <Badge className="w-fit mt-1 text-[10px] bg-orange-100 text-orange-700 border-orange-300">🔁 Daily</Badge>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="font-medium text-slate-700 text-[13px]">
                                                                            {promo.start_date ? `${format(new Date(promo.start_date), 'dd/MM/yyyy')} ` : ''}
                                                                            {promo.start_time}
                                                                        </div>
                                                                        <div className="text-slate-500 text-[13px]">
                                                                            to {promo.end_date ? `${format(new Date(promo.end_date), 'dd/MM/yyyy')} ` : (promo.start_date ? `${format(new Date(promo.start_date), 'dd/MM/yyyy')} ` : '')}
                                                                            {promo.end_time}
                                                                        </div>
                                                                        <Badge className="w-fit mt-1.5 text-[10px] bg-slate-100 text-slate-600 border-slate-300">One-time</Badge>
                                                                    </>
                                                                )}
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
                                                        <div className="flex justify-end gap-1">
                                                            {/* View Detail */}
                                                            <Button variant="ghost" size="icon" title="View applied products" onClick={() => handleViewPromo(promo)} disabled={viewPromoLoading}>
                                                                <Eye className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                            {/* Edit */}
                                                            <Button
                                                                variant="ghost" size="icon" title="Edit promotion"
                                                                onClick={() => {
                                                                    if (promo.is_flash_sale) navigate(`/manager/promotions/flash-sale/${promo.promotion_id}/edit`);
                                                                    else navigate(`/manager/promotions/${promo.promotion_id}/edit`);
                                                                }}
                                                                disabled={!canWrite}
                                                                className={!canWrite ? 'opacity-50 cursor-not-allowed' : ''}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            {/* Delete */}
                                                            {canWrite && (
                                                                <Button variant="ghost" size="icon" title="Delete promotion" onClick={() => setDeletePromoTarget(promo)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
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

            {/* ════ VIEW DETAIL: VOUCHER ════ */}
            <Dialog open={!!viewVoucher} onOpenChange={(open) => !open && setViewVoucher(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-blue-600" />
                            Voucher: <span className="font-mono text-blue-700">{viewVoucher?.code}</span>
                        </DialogTitle>
                        <DialogDescription>Voucher details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Discount Type</p>
                                <p className="font-semibold">
                                    {viewVoucher?.discount_type === 'PERCENTAGE' ? `${viewVoucher.discount_value}% OFF` :
                                     viewVoucher?.discount_type === 'FREE_SHIP' ? '🚚 Free Shipping' :
                                     `${new Intl.NumberFormat('vi-VN').format(Number(viewVoucher?.discount_value))}đ OFF`}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Minimum Order</p>
                                <p className="font-semibold">{viewVoucher?.min_order_value ? `${new Intl.NumberFormat('vi-VN').format(Number(viewVoucher.min_order_value))}đ` : 'No limit'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Applied Rank</p>
                                <p className="font-semibold">{viewVoucher?.apply_rank_code || 'All'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Collected / Limit</p>
                                <p className="font-semibold">{viewVoucher?.collected_quantity || 0} / {viewVoucher?.max_quantity || '∞'}</p>
                            </div>
                        </div>
                        {viewVoucher?.start_date && viewVoucher?.end_date && (
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Valid Period</p>
                                <p className="font-semibold">
                                    {format(new Date(viewVoucher.start_date), 'dd/MM/yyyy HH:mm')} → {format(new Date(viewVoucher.end_date), 'dd/MM/yyyy HH:mm')}
                                </p>
                            </div>
                        )}
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 text-xs">
                            ℹ️ This voucher is for customers to collect and use at checkout. It cannot be applied directly to a specific product.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewVoucher(null)}>Close</Button>
                        {canWrite && (
                            <Button onClick={() => { setViewVoucher(null); navigate(`/manager/vouchers/${viewVoucher?.promotion_id}/edit`); }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════ VIEW DETAIL: PRODUCT PROMOTION ════ */}
            <Dialog open={!!viewPromo} onOpenChange={(open) => !open && setViewPromo(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-blue-600" />
                            {viewPromo?.name}
                            {viewPromo?.is_flash_sale && <Badge className="bg-red-500 text-white">⚡ Flash Sale</Badge>}
                        </DialogTitle>
                        <DialogDescription>
                            {viewPromo?.type_code === 'PERCENTAGE' ? `${Number(viewPromo?.value)}% off` : formatCurrency(Number(viewPromo?.value))}
                            {' · '}{viewPromo?.start_time} – {viewPromo?.end_time}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Flash Sale items */}
                    {viewPromo?.is_flash_sale && viewPromo.promotion_items && viewPromo.promotion_items.length > 0 ? (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-1">
                                <Zap className="h-4 w-4 text-red-500" /> Flash Sale Items
                            </h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Original Price</TableHead>
                                        <TableHead>Flash Sale Price</TableHead>
                                        <TableHead>Savings</TableHead>
                                        <TableHead>Quota</TableHead>
                                        <TableHead>Sold</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {viewPromo.promotion_items.map((item) => {
                                        const originalPrice = Number(item.product_variants?.price ?? 0);
                                        const flashPrice = Number(item.flash_sale_price);
                                        const savings = originalPrice - flashPrice;
                                        const savingsPct = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
                                        return (
                                            <TableRow key={item.item_id}>
                                                <TableCell>
                                                    <span className="font-medium">{item.product_variants?.products?.name}</span>
                                                    <span className="text-muted-foreground text-xs ml-1">– {item.product_variants?.option_name}</span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{item.product_variants?.sku}</TableCell>
                                                <TableCell className="text-muted-foreground line-through text-sm">
                                                    {formatCurrency(originalPrice)}
                                                </TableCell>
                                                <TableCell className="text-red-600 font-bold">
                                                    {formatCurrency(flashPrice)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-green-100 text-green-800 border-green-300">
                                                        -{formatCurrency(savings)} ({savingsPct}%)
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{item.quota}</TableCell>
                                                <TableCell>
                                                    <span className={item.sold >= item.quota ? 'text-red-500 font-semibold' : ''}>
                                                        {item.sold}/{item.quota}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-1">
                                <Package className="h-4 w-4 text-blue-500" />
                                Applied Product Variants ({viewPromo?.product_variants?.length ?? 0})
                            </h4>
                            {viewPromo?.product_variants && viewPromo.product_variants.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Option</TableHead>
                                            <TableHead>Original Price</TableHead>
                                            <TableHead>Promo Price</TableHead>
                                            <TableHead>Savings</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewPromo.product_variants.map((v) => {
                                            const original = Number(v.price ?? 0);
                                            const promValue = Number(viewPromo.value ?? 0);
                                            const afterDiscount = viewPromo.type_code === 'PERCENTAGE'
                                                ? original * (1 - promValue / 100)
                                                : original - promValue;
                                            const savings = original - afterDiscount;
                                            const savingsPct = original > 0 ? Math.round((savings / original) * 100) : 0;
                                            return (
                                                <TableRow key={v.variant_id}>
                                                    <TableCell className="font-medium">{v.products?.name ?? '—'}</TableCell>
                                                    <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                                                    <TableCell>{v.option_name}</TableCell>
                                                    <TableCell className="text-muted-foreground line-through text-sm">
                                                        {formatCurrency(original)}
                                                    </TableCell>
                                                    <TableCell className="text-red-600 font-bold">
                                                        {formatCurrency(Math.max(afterDiscount, 0))}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-green-100 text-green-800 border-green-300">
                                                            -{formatCurrency(savings)} ({savingsPct}%)
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm py-6 justify-center">
                                    <AlertCircle className="h-4 w-4" /> No product variants applied yet.
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewPromo(null)}>Close</Button>
                        {canWrite && (
                            <Button onClick={() => {
                                setViewPromo(null);
                                if (viewPromo?.is_flash_sale) {
                                    navigate(`/manager/promotions/flash-sale/${viewPromo.promotion_id}/edit`);
                                } else {
                                    navigate(`/manager/promotions/${viewPromo?.promotion_id}/edit`);
                                }
                            }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ════ DELETE CONFIRM: VOUCHER ════ */}
            <AlertDialog open={!!deleteVoucherTarget} onOpenChange={(open) => !open && setDeleteVoucherTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" /> Delete voucher?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Are you sure you want to delete voucher{' '}
                                <span className="font-semibold font-mono text-foreground">"{deleteVoucherTarget?.code}"</span>?
                            </p>
                            <p className="text-sm text-muted-foreground">
                                This voucher will be <strong>permanently deleted</strong>. Customers who have already collected it will still be able to use it.
                            </p>
                            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-blue-800 text-xs mt-2">
                                ℹ️ The system now <strong>marks vouchers as EXPIRED automatically</strong> but preserves them for your records. Use this button only if you want to permanently remove it.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteVoucherTarget && deleteVoucherMutation.mutate(deleteVoucherTarget.promotion_id)}
                            disabled={deleteVoucherMutation.isPending}
                        >
                            {deleteVoucherMutation.isPending ? 'Deleting...' : 'Delete permanently'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ════ DELETE CONFIRM: PRODUCT PROMOTION ════ */}
            <AlertDialog open={!!deletePromoTarget} onOpenChange={(open) => !open && setDeletePromoTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" /> Delete product promotion?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Are you sure you want to delete the promotion{' '}
                                <span className="font-semibold text-foreground">"{deletePromoTarget?.name}"</span>?
                            </p>
                            <p className="text-sm text-muted-foreground">
                                The promotion will be disabled and all applied products will automatically revert to their previous promotions.
                            </p>
                            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-blue-800 text-xs mt-2">
                                ℹ️ Expired promotions are <strong>automatically deactivated and preserved</strong> in the system. Use this button to permanently delete this record.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletePromoTarget && deletePromoMutation.mutate(deletePromoTarget.promotion_id)}
                            disabled={deletePromoMutation.isPending}
                        >
                            {deletePromoMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
