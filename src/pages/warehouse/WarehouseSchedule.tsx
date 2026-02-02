import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Filter, Briefcase, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { axiosInstance } from '@/lib/axiosInstance';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval } from 'date-fns';

interface WorkSchedule {
    schedule_id: number;
    user_id: number;
    date: string;
    shift_code: string;
    expected_start: string | null;
    expected_end: string | null;
    employees?: {
        users: {
            full_name: string;
        }
    }
}

interface ScheduleSummary {
    user_id: number;
    total_shifts: number;
    total_hours: number;
}

export default function WarehouseSchedule() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [summary, setSummary] = useState<ScheduleSummary | null>(null);
    const [loading, setLoading] = useState(false);

    // Calculate dates based on View Mode
    const startDate = viewMode === 'week'
        ? startOfWeek(currentDate, { weekStartsOn: 1 })
        : startOfMonth(currentDate);

    const endDate = viewMode === 'week'
        ? endOfWeek(currentDate, { weekStartsOn: 1 })
        : endOfMonth(currentDate);

    const formattedDateRange = viewMode === 'week'
        ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
        : format(currentDate, 'MMMM yyyy');

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            // Frontend Fix: formatting params as yyyy-MM-dd
            const params = {
                from: format(startDate, 'yyyy-MM-dd'),
                to: format(endDate, 'yyyy-MM-dd'),
            };

            const [listRes, summaryRes] = await Promise.all([
                axiosInstance.get('/my-schedules', { params }),
                axiosInstance.get('/my-schedules/my-summary', { params })
            ]);

            // Robust data extraction
            const scheduleData = Array.isArray(listRes.data)
                ? listRes.data
                : (listRes.data.data || listRes.data.successful_records || []);

            setSchedules(scheduleData);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error("Failed to fetch warehouse schedules:", error);
            setSchedules([]); // Fallback to empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [currentDate, viewMode]);

    const handlePrev = () => {
        if (viewMode === 'week') {
            setCurrentDate(subWeeks(currentDate, 1));
        } else {
            setCurrentDate(subMonths(currentDate, 1));
        }
    };

    const handleNext = () => {
        if (viewMode === 'week') {
            setCurrentDate(addWeeks(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    // Generate days array based on selection
    const daysToDisplay = eachDayOfInterval({ start: startDate, end: endDate });

    const getSchedulesForDay = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return schedules.filter(s => {
            // Frontend Fix: Reliable string comparison
            const scheduleDate = typeof s.date === 'string' ? s.date.split('T')[0] : '';
            return scheduleDate === dayStr;
        });
    };

    // Convert ISO String -> HH:mm (String Manipulation for strict accuracy)
    const getTimeFromIso = (isoString?: string | null) => {
        if (!isoString) return '--:--';
        // Expected format: YYYY-MM-DDTHH:mm:ss... or just Time
        // Regex to extract HH:mm regardless of T or Z
        const match = isoString.match(/T?(\d{2}:\d{2})/);
        return match ? match[1] : '--:--';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Warehouse Schedule</h1>
                    <p className="text-neutral-500">View your logistics and inventory shifts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={viewMode} onValueChange={(v: 'week' | 'month') => setViewMode(v)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="font-medium min-w-[170px] text-center">{formattedDateRange}</span>
                    <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" className="ml-2 gap-2" onClick={fetchSchedules}>
                        <Filter className="w-4 h-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : summary?.total_shifts || 0}</div>
                        <p className="text-xs text-muted-foreground">in selected {viewMode}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : summary?.total_hours || 0}</div>
                        <p className="text-xs text-muted-foreground">calculated duration</p>
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading schedules...</div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {daysToDisplay.map((day) => {
                        const daySchedules = getSchedulesForDay(day);
                        if (daySchedules.length === 0) return null;

                        return (
                            <Card key={day.toISOString()} className="overflow-hidden border-neutral-200">
                                <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-neutral-500" />
                                        <span className="font-semibold text-neutral-900">{format(day, 'EEEE')}</span>
                                        <span className="text-neutral-500">{format(day, 'MMM d')}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-white">{daySchedules.length} Shifts</Badge>
                                </div>
                                <div className="divide-y divide-neutral-100">
                                    {daySchedules.map((shift) => (
                                        <div key={shift.schedule_id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                                            <div className="flex items-start md:items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                    {(shift.employees?.users?.full_name || 'M').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-neutral-900">{shift.employees?.users?.full_name || 'My Shift'}</div>
                                                    <div className="text-sm text-neutral-500">{shift.shift_code}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="flex items-center gap-2 text-neutral-600">
                                                    <Clock className="w-4 h-4" />
                                                    {getTimeFromIso(shift.expected_start)} - {getTimeFromIso(shift.expected_end)}
                                                </div>
                                                {/* Overnight Indicator */}
                                                {shift.expected_end && shift.expected_start && shift.expected_end < shift.expected_start && (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
                                                        <Moon className="w-3 h-3" /> Overnight
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )
                    })}

                    {schedules.length === 0 && (
                        <div className="text-center py-10 text-neutral-500 border rounded-lg bg-neutral-50">
                            Bạn không có ca làm nào trong {viewMode === 'week' ? 'tuần' : 'tháng'} này.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}