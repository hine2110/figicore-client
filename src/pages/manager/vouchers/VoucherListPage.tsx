import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

import { VouchersService, Voucher } from '@/services/vouchers.service';
import { PromotionsService, Promotion } from '@/services/promotions.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Search, Eye, Trash2, Ticket, Tag, Package, Zap, AlertCircle, Settings, Gift } from 'lucide-react';
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

import { toast } from 'sonner';
import { WeeklyVoucherSettingsModal } from './components/WeeklyVoucherSettingsModal';
import { ApologyVoucherModal } from './components/ApologyVoucherModal';
import { PaginationControls } from '@/components/ui/pagination-controls';

// ── Components ───────────────────────────────────────────
function VoucherStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'PUBLIC': return <Badge className="bg-green-500 hover:bg-green-600">Public</Badge>;
        case 'COMING_SOON': return <Badge className="bg-blue-500 text-white hover:bg-blue-600 font-medium">Coming Soon</Badge>;
        case 'OUT_OF_STOCK': return <Badge className="bg-amber-500 hover:bg-amber-600 font-bold">Sold Out</Badge>;
        case 'EXPIRED': return <Badge variant="outline" className="text-slate-400 border-slate-200">Expired</Badge>;
        case 'HIDDEN': return <Badge variant="secondary" className="text-slate-500 bg-slate-100">Hidden</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

function PromoStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'ACTIVE': return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold">Active Now</Badge>;
        case 'SCHEDULED': return <Badge className="bg-sky-500 text-white hover:bg-sky-600 font-medium">Scheduled</Badge>;
        case 'EXPIRED': return <Badge variant="outline" className="text-slate-400 border-slate-200">Expired</Badge>;
        case 'INACTIVE': return <Badge variant="secondary" className="text-slate-500 bg-slate-100 font-medium">Inactive</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

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

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isApologyModalOpen, setIsApologyModalOpen] = useState(false);

    const currentTab = searchParams.get('tab') || 'vouchers';
    const handleTabChange = (value: string) => setSearchParams({ tab: value });

    useEffect(() => {
        if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') navigate('/');
    }, [user, navigate]);

    const canWrite = user?.role_code === 'MANAGER';

    // ── Pagination & Filters state ──────────────────────
    const [voucherSearch, setVoucherSearch] = useState('');
    const [voucherType, setVoucherType] = useState('ALL');
    const [voucherStatus, setVoucherStatus] = useState('ALL');
    const [voucherRank, setVoucherRank] = useState('ALL');
    const [voucherPage, setVoucherPage] = useState(1);
    const pageSize = 10;

    const [promoSearch, setPromoSearch] = useState('');
    const [promoStatus, setPromoStatus] = useState('ALL');
    const [promoPage, setPromoPage] = useState(1);

    // ── Data ──────────────────────────────────────────────
    const { data: voucherResponse, isLoading: isLoadingVouchers } = useQuery({
        queryKey: ['vouchers', voucherPage, voucherSearch, voucherType, voucherStatus, voucherRank],
        queryFn: () => VouchersService.getAll({
            page: voucherPage,
            limit: pageSize,
            search: voucherSearch,
            type: voucherType,
            status: voucherStatus,
            rank: voucherRank
        }),
    });
    const vouchers = voucherResponse?.data || [];
    const voucherTotal = voucherResponse?.total || 0;

    const { data: promoResponse, isLoading: isLoadingPromotions } = useQuery({
        queryKey: ['promotions', promoPage, promoSearch, promoStatus],
        queryFn: () => PromotionsService.getAll({
            page: promoPage,
            limit: pageSize,
            search: promoSearch,
            status: promoStatus
        }),
    });
    const promotions = promoResponse?.data || [];
    const promoTotal = promoResponse?.total || 0;


    // Reset page to 1 on filter changes
    useEffect(() => { setVoucherPage(1); }, [voucherSearch, voucherType, voucherStatus, voucherRank]);
    useEffect(() => { setPromoPage(1); }, [promoSearch, promoStatus]);

    // ── View Detail state ─────────────────────────────────
    const [viewVoucher, setViewVoucher] = useState<VoucherDetail | null>(null);
    const [viewVoucherLoading, setViewVoucherLoading] = useState(false);
    const [viewPromo, setViewPromo] = useState<PromotionDetail | null>(null);
    const [viewPromoLoading, setViewPromoLoading] = useState(false);

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


    // ── Status helpers ─────────────────────────────────────
    const getVoucherStatusObj = (v: any) => {
        if (!v.is_active) return 'EXPIRED';
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
        if (!p.is_active) return 'EXPIRED';
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
        
        if (now > promoEnd) return 'EXPIRED';
        if (now >= promoStart && now <= promoEnd) return 'ACTIVE';
        return 'SCHEDULED';
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(val);

    if (user?.role_code !== 'MANAGER' && user?.role_code !== 'SUPER_ADMIN') return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Promotions & Vouchers</h2>
                    <p className="text-muted-foreground">Manage all your product discounts and order vouchers in one place.</p>
                </div>
                {canWrite && (
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200" onClick={() => setIsApologyModalOpen(true)}>
                            <Gift className="mr-2 h-4 w-4" /> Apology Gift
                        </Button>
                        <Button variant="outline" onClick={() => setIsSettingsModalOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" /> Auto Config
                        </Button>
                        <Button onClick={() => navigate('/manager/vouchers/new?type=percentage')}>
                            <Plus className="mr-2 h-4 w-4" /> Create Campaign
                        </Button>
                    </div>
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
                                                <TableRow key={i}>
                                                    <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : vouchers.length > 0 ? (
                                            vouchers.map((v) => (
                                                <TableRow key={v.promotion_id} className="hover:bg-slate-50 transition-colors group">
                                                    <TableCell className="font-mono font-bold text-indigo-600">{v.code}</TableCell>
                                                    <TableCell>
                                                        {v.discount_type === 'PERCENTAGE' ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{v.discount_value}%</span>
                                                                {v.max_discount_amount && (
                                                                    <span className="text-[10px] text-muted-foreground">Max {formatCurrency(Number(v.max_discount_amount))}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Free Ship</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {v.apply_rank_code ? (
                                                            <Badge variant="secondary" className="font-bold text-[10px]">{v.apply_rank_code}</Badge>
                                                        ) : (
                                                            <span className="text-slate-400">All</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-xs">
                                                        {v.min_order_value ? formatCurrency(Number(v.min_order_value)) : '0 VND'}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className={v.collected_quantity && v.max_quantity && v.collected_quantity >= v.max_quantity ? 'text-rose-600 font-bold' : ''}>
                                                            {v.collected_quantity || 0}
                                                        </span>
                                                        <span className="text-slate-400"> / {v.max_quantity}</span>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] leading-tight text-slate-500">
                                                        {v.start_date ? format(new Date(v.start_date), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                                        <br /> to {v.end_date ? format(new Date(v.end_date), 'dd/MM/yyyy HH:mm') : 'Permanent'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <VoucherStatusBadge status={getVoucherStatusObj(v)} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => handleViewVoucher(v)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {canWrite && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => navigate(`/manager/vouchers/edit/${v.promotion_id}`)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No vouchers found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                
                                {!isLoadingVouchers && voucherTotal > 0 && (
                                    <PaginationControls
                                        currentPage={voucherPage}
                                        totalPages={Math.ceil(voucherTotal / pageSize)}
                                        totalItems={voucherTotal}
                                        itemsPerPage={pageSize}
                                        onPageChange={setVoucherPage}
                                    />
                                )}
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
                                            <SelectItem value="ACTIVE">Active Now</SelectItem>
                                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
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
                                                    <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : promotions.length > 0 ? (
                                            promotions.map((p) => (
                                                <TableRow key={p.promotion_id} className="hover:bg-slate-50 transition-colors group">
                                                    <TableCell>
                                                        <p className="font-semibold text-sm">{p.name}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{p.type_code?.replace('_', ' ')}</Badge>
                                                            {p.is_flash_sale && <Badge className="bg-orange-500 text-white border-0 py-0 text-[10px]"><Zap className="w-3 h-3 mr-1" /> Flash</Badge>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-indigo-600 text-sm">
                                                        {p.is_flash_sale
                                                            ? (() => {
                                                                if (!p.promotion_items || p.promotion_items.length === 0) return <span className="text-muted-foreground text-xs italic">By product</span>;
                                                                
                                                                let maxSave = 0;
                                                                let maxPct = 0;
                                                                p.promotion_items.forEach((item: any) => {
                                                                    const original = Number(item.product_variants?.price || 0);
                                                                    const flash = Number(item.flash_sale_price || 0);
                                                                    const save = original - flash;
                                                                    const pct = original > 0 ? Math.round((save / original) * 100) : 0;
                                                                    if (save > maxSave) maxSave = save;
                                                                    if (pct > maxPct) maxPct = pct;
                                                                });

                                                                if (maxSave <= 0) return <span className="text-muted-foreground text-xs italic">By product</span>;

                                                                return (
                                                                    <span className="font-bold text-green-700">
                                                                        {maxPct}%
                                                                    </span>
                                                                );
                                                            })()
                                                            : p.type_code === 'PERCENTAGE' 
                                                                ? `${Number(p.value)}%` 
                                                                : formatCurrency(Number(p.value))}
                                                    </TableCell>
                                                    <TableCell className="text-[11px] leading-tight text-slate-500">
                                                        {p.start_time && p.end_time ? (
                                                            <div className="flex flex-col">
                                                                {p.is_recurring ? (
                                                                    <>
                                                                        <span className="font-semibold text-orange-700">⚡ {p.start_time} – {p.end_time}</span>
                                                                        <Badge className="w-fit mt-1 text-[10px] bg-orange-100 text-orange-700 border-orange-300 pointer-events-none">🔁 Daily</Badge>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="font-medium text-slate-700 text-[13px]">
                                                                            {p.start_date ? `${format(new Date(p.start_date), 'dd/MM/yyyy')} ` : ''}
                                                                            {p.start_time}
                                                                        </div>
                                                                        <div className="text-slate-500 text-[13px]">
                                                                            to {p.end_date ? `${format(new Date(p.end_date), 'dd/MM/yyyy')} ` : (p.start_date ? `${format(new Date(p.start_date), 'dd/MM/yyyy')} ` : '')}
                                                                            {p.end_time}
                                                                        </div>
                                                                        <Badge className="w-fit mt-1.5 text-[10px] bg-slate-100 text-slate-600 border-slate-300 pointer-events-none">One-time</Badge>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <PromoStatusBadge status={getPromoStatusObj(p)} />
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-sm">
                                                        {p._count?.product_variants || 0}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" title="View applied products" onClick={() => handleViewPromo(p)} disabled={viewPromoLoading}>
                                                                <Eye className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                            {canWrite && (
                                                                <Button
                                                                    variant="ghost" size="icon" title="Edit promotion"
                                                                    onClick={() => {
                                                                        if (p.is_flash_sale) navigate(`/manager/promotions/flash-sale/${p.promotion_id}/edit`);
                                                                        else navigate(`/manager/promotions/${p.promotion_id}/edit`);
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-medium">No product promotions found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {!isLoadingPromotions && promoTotal > 0 && (
                                    <PaginationControls
                                        currentPage={promoPage}
                                        totalPages={Math.ceil(promoTotal / pageSize)}
                                        totalItems={promoTotal}
                                        itemsPerPage={pageSize}
                                        onPageChange={setPromoPage}
                                    />
                                )}
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
                                     `${new Intl.NumberFormat('en-US').format(Number(viewVoucher?.discount_value))} VND OFF`}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Minimum Order</p>
                                <p className="font-semibold">{viewVoucher?.min_order_value ? `${new Intl.NumberFormat('en-US').format(Number(viewVoucher.min_order_value))} VND` : 'No limit'}</p>
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
                            {viewPromo?.type_code === 'PERCENTAGE' ? `${Number(viewPromo?.value)}% off` : (viewPromo?.is_flash_sale ? 'Dynamic Flash Sale' : formatCurrency(Number(viewPromo?.value)))}
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
                                                    <span className="font-bold text-green-700">
                                                        {savingsPct}%
                                                    </span>
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
                                                        <span className="font-bold text-green-700">
                                                            {savingsPct}%
                                                        </span>
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

            <WeeklyVoucherSettingsModal
                open={isSettingsModalOpen}
                onOpenChange={setIsSettingsModalOpen}
            />

            <ApologyVoucherModal
                open={isApologyModalOpen}
                onOpenChange={setIsApologyModalOpen}
            />

        </div>
    );
}
