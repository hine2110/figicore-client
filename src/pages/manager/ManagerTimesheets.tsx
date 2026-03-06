import { useState, useEffect, useMemo } from 'react';
import {
    Clock,
    AlertTriangle,
    UserX,
    Ghost,
    Siren,
    AlertOctagon,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { axiosInstance } from '@/lib/axiosInstance';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import EmployeeDetailSheet from '@/features/admin/components/EmployeeDetailSheet';

// --- Types ---
interface StaffSummary {
    user_id: number;
    full_name: string;
    avatar_url: string | null;
    email: string;
    total_shifts: number;
    late_count: number;
    early_leave_count: number;
    missing_count: number;
    absent_count: number;
}

type FilterType = 'LATE' | 'EARLY_LEAVE' | 'MISSING' | 'ABSENT';

// --- Config ---
const FILTER_CONFIG: Record<
    FilterType,
    {
        label: string;
        field: keyof StaffSummary;
        color: string;
        badgeClass: string;
        icon: React.FC<{ className?: string }>;
        gradient: string;
    }
> = {
    LATE: {
        label: 'Late',
        field: 'late_count',
        color: 'text-red-600',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        icon: Clock,
        gradient: 'from-red-500 to-rose-600',
    },
    EARLY_LEAVE: {
        label: 'Early Leave',
        field: 'early_leave_count',
        color: 'text-orange-600',
        badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: AlertTriangle,
        gradient: 'from-orange-500 to-amber-600',
    },
    MISSING: {
        label: 'Missing',
        field: 'missing_count',
        color: 'text-purple-600',
        badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: Ghost,
        gradient: 'from-purple-500 to-violet-600',
    },
    ABSENT: {
        label: 'Absent',
        field: 'absent_count',
        color: 'text-neutral-600',
        badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
        icon: UserX,
        gradient: 'from-neutral-500 to-slate-600',
    },
};

const RANK_ICONS = [Siren, AlertOctagon, AlertTriangle];

// --- Helpers ---
function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
        .toUpperCase();
}

// --- Component ---
export default function ManagerTimesheets() {
    const today = new Date();
    const [fromDate, setFromDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
    const [filterType, setFilterType] = useState<FilterType>('LATE');
    const [data, setData] = useState<StaffSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const fetchReport = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get('/schedules/attendance-report', {
                params: { from: fromDate, to: toDate },
            });
            const arr = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            setData(arr);
        } catch (err) {
            console.error('Failed to fetch attendance report', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Data Fetching ---
    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromDate, toDate]);

    // --- Client-side Sort & Top 3 ---
    const config = FILTER_CONFIG[filterType];

    const sortedData = useMemo(
        () =>
            [...data].sort((a, b) => {
                const countA = Number(a[config.field]) || 0;
                const countB = Number(b[config.field]) || 0;
                const rateA = a.total_shifts > 0 ? countA / a.total_shifts : 0;
                const rateB = b.total_shifts > 0 ? countB / b.total_shifts : 0;

                return rateB - rateA || countB - countA;
            }),
        [data, filterType] // eslint-disable-line react-hooks/exhaustive-deps
    );

    const top3 = useMemo(
        () => sortedData.filter((u) => (Number(u[config.field]) || 0) > 0).slice(0, 3),
        [sortedData, config.field]
    );

    // --- Violation Badge ---
    const ViolationBadge = ({ count, cls }: { count: number; cls: string }) =>
        count > 0 ? (
            <Badge className={`${cls} border font-semibold`}>{count}</Badge>
        ) : (
            <span className="text-neutral-300 text-sm">—</span>
        );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Attendance Timesheets</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">
                        Violation summary per employee for the selected date range.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 border-neutral-200 bg-neutral-50">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-neutral-600 whitespace-nowrap">From</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="border border-neutral-200 rounded-md px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-neutral-600 whitespace-nowrap">To</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="border border-neutral-200 rounded-md px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="h-6 w-px bg-neutral-300 hidden sm:block" />

                    {/* Filter Type Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {(Object.keys(FILTER_CONFIG) as FilterType[]).map((type) => {
                            const cfg = FILTER_CONFIG[type];
                            const FilterIcon = cfg.icon;
                            return (
                                <Button
                                    key={type}
                                    size="sm"
                                    variant={filterType === type ? 'default' : 'outline'}
                                    className={
                                        filterType === type
                                            ? `bg-gradient-to-r ${cfg.gradient} text-white border-0 shadow-sm`
                                            : 'text-neutral-500 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-700'
                                    }
                                    onClick={() => setFilterType(type)}
                                >
                                    <FilterIcon className="w-3.5 h-3.5 mr-1.5" />
                                    {cfg.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Leaderboard (Top 3) */}
            {!loading && top3.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {top3.map((person, idx) => {
                        const RankIcon = RANK_ICONS[idx];
                        const FilterIcon = config.icon;
                        const count = person[config.field] as number;
                        const percentage = person.total_shifts > 0
                            ? Math.round((count / person.total_shifts) * 100)
                            : 0;

                        const cardBorderClass = idx === 0
                            ? 'border-red-500 shadow-lg shadow-red-100'
                            : idx === 1
                                ? 'border-orange-400 shadow-md shadow-orange-100'
                                : 'border-neutral-300 shadow-md';

                        const badgeBgClass = idx === 0
                            ? 'bg-red-500'
                            : idx === 1
                                ? 'bg-orange-400'
                                : 'bg-neutral-400';

                        return (
                            <Card
                                key={person.user_id}
                                onClick={() => setSelectedId(person.user_id)}
                                className={`relative overflow-hidden border-2 cursor-pointer transition-transform hover:scale-[1.02] ${cardBorderClass}`}
                            >
                                {/* Rank Badge */}
                                <div
                                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow ${badgeBgClass}`}
                                >
                                    <RankIcon className="w-4 h-4" />
                                </div>

                                {/* Colored top bar */}
                                <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />

                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                            <AvatarImage src={person.avatar_url || ''} />
                                            <AvatarFallback className={`bg-gradient-to-br ${config.gradient} text-white font-semibold text-sm`}>
                                                {getInitials(person.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-neutral-900 truncate">{person.full_name}</p>
                                            <p className="text-xs text-neutral-500 truncate">{person.email}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <FilterIcon className={`w-4 h-4 ${config.color}`} />
                                            <span className="text-xs text-neutral-500">{config.label}</span>
                                        </div>
                                        <span className={`text-2xl font-bold ${config.color}`}>{count} ({percentage}%)</span>
                                    </div>

                                    <div className="mt-1 text-xs text-neutral-400">
                                        out of {person.total_shifts} total shifts
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!loading && top3.length === 0 && !loading && (
                <Card className="py-8 text-center border-dashed">
                    <p className="text-neutral-400 text-sm">
                        No violations recorded for the selected filter and date range. 🎉
                    </p>
                </Card>
            )}

            {/* Data Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        Staff Summary
                        {data.length > 0 && (
                            <Badge variant="secondary">{data.length} employees</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-12 text-neutral-400 text-sm">
                            No data found for this date range.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-neutral-50">
                                        <TableHead className="w-12 text-center">#</TableHead>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-center">Total Shifts</TableHead>
                                        <TableHead className="text-center">
                                            <span className="flex items-center justify-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-red-500" />
                                                Late
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <span className="flex items-center justify-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                                Early
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <span className="flex items-center justify-center gap-1">
                                                <Ghost className="w-3.5 h-3.5 text-purple-500" />
                                                Missing
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <span className="flex items-center justify-center gap-1">
                                                <UserX className="w-3.5 h-3.5 text-neutral-500" />
                                                Absent
                                            </span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.map((person, idx) => (
                                        <TableRow
                                            key={person.user_id}
                                            onClick={() => setSelectedId(person.user_id)}
                                            className={`cursor-pointer hover:bg-indigo-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}
                                        >
                                            <TableCell className="text-center text-sm text-neutral-400 font-mono">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={person.avatar_url || ''} />
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                                            {getInitials(person.full_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-neutral-900 leading-tight">
                                                            {person.full_name}
                                                        </p>
                                                        <p className="text-xs text-neutral-400">{person.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-semibold text-neutral-700">
                                                    {person.total_shifts}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <ViolationBadge
                                                    count={person.late_count}
                                                    cls={FILTER_CONFIG.LATE.badgeClass}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <ViolationBadge
                                                    count={person.early_leave_count}
                                                    cls={FILTER_CONFIG.EARLY_LEAVE.badgeClass}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <ViolationBadge
                                                    count={person.missing_count}
                                                    cls={FILTER_CONFIG.MISSING.badgeClass}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <ViolationBadge
                                                    count={person.absent_count}
                                                    cls={FILTER_CONFIG.ABSENT.badgeClass}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <EmployeeDetailSheet
                employeeId={selectedId}
                open={!!selectedId}
                onOpenChange={(open) => !open && setSelectedId(null)}
                onUpdateSuccess={fetchReport}
            />
        </div>
    );
}
