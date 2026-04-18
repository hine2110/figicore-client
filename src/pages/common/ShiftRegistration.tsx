import { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { axiosInstance } from '@/lib/axiosInstance';
import { format, startOfWeek, addDays, subDays, endOfWeek } from 'date-fns';

export interface WorkSchedule {
    schedule_id: number;
    user_id: number;
    date: string;
    shift_code: string;
    expected_start: string | null;
    expected_end: string | null;
    status_code: string;
}

const SHIFTS = [
    { code: 'MORNING', label: 'Morning', time: '08:00 - 12:00' },
    { code: 'AFTERNOON', label: 'Afternoon', time: '13:00 - 17:00' },
    { code: 'EVENING', label: 'Evening', time: '17:00 - 21:00' },
];

export default function ShiftRegistration() {
    const { toast } = useToast();
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [loading, setLoading] = useState(false);

    // Bắt đầu bằng tuần TỚI (Next Week) vì lịch thường đăng ký cho tuần tới
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
        addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7)
    );

    const weekDisplay = useMemo(() => {
        const start = currentWeekStart;
        const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        return `Week of ${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
    }, [currentWeekStart]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const from = format(currentWeekStart, 'yyyy-MM-dd');
            const to = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            
            const res = await axiosInstance.get('/my-schedules', {
                params: { from, to, include_pending: 'true' }
            });
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setSchedules(data);
        } catch (error: any) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [currentWeekStart]);

    const handleToggleRegistration = async (dayDate: Date, shiftCode: string, existingSchedule?: WorkSchedule) => {
        const dateStr = format(dayDate, 'yyyy-MM-dd');

        if (existingSchedule) {
            // Already registered - try to unregister
            if (existingSchedule.status_code === 'PUBLISHED') {
                toast({
                    title: "Cannot Unregister",
                    description: "This shift is already approved or assigned by your manager.",
                    variant: "destructive"
                });
                return;
            }

            // Unregister (PENDING)
            try {
                await axiosInstance.delete('/my-schedules/unregister', {
                    params: { date: dateStr, shift_code: shiftCode }
                });
                toast({ title: "Registration Cancelled" });
                fetchSchedules();
            } catch (err: any) {
                toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
            }
        } else {
            // Register
            try {
                await axiosInstance.post('/my-schedules/register', {
                    date: dateStr,
                    shift_code: shiftCode
                });
                toast({ title: "Registration Submitted" });
                fetchSchedules();
            } catch (err: any) {
                toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
            }
        }
    };

    const renderShiftCell = (dayDate: Date, shiftCode: string) => {
        const dayStr = format(dayDate, 'yyyy-MM-dd');
        
        // Cố gắng tìm nếu nhân viên đã có schedule ở ô này
        const schedule = schedules.find(s => {
            if (!s.date) return false;
            const sDate = typeof s.date === 'string' ? s.date.substring(0, 10) : '';
            return sDate === dayStr && s.shift_code === shiftCode;
        });

        const isPast = new Date(dayStr) < new Date(format(new Date(), 'yyyy-MM-dd'));

        return (
            <div className="flex flex-col gap-2 min-h-[100px] justify-center items-center p-2 rounded-lg border border-dashed border-neutral-200">
                {schedule ? (
                    schedule.status_code === 'PENDING' ? (
                        <Button 
                            variant="outline" 
                            className="w-full flex-col h-auto py-3 bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 transition-all"
                            onClick={() => handleToggleRegistration(dayDate, shiftCode, schedule)}
                            disabled={isPast}
                        >
                            <Clock className="w-5 h-5 mb-1" />
                            <span className="font-semibold text-sm">Pending</span>
                            <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Tap to cancel</span>
                        </Button>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 rounded-md bg-green-50 border border-green-200 text-green-700">
                            <CheckCircle2 className="w-5 h-5 mb-1 text-green-600" />
                            <span className="font-bold text-sm">Approved</span>
                            <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Official Shift</span>
                        </div>
                    )
                ) : (
                    <Button 
                        variant="ghost" 
                        className="w-full flex-col h-full min-h-[80px] hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all text-neutral-400"
                        onClick={() => handleToggleRegistration(dayDate, shiftCode)}
                        disabled={isPast}
                    >
                        <CalendarDays className="w-6 h-6 mb-1 opacity-50" />
                        <span className="font-medium text-xs">Register</span>
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        Shift Registration
                    </h1>
                    <p className="text-neutral-500">Pick the shifts you want to work for the upcoming weeks.</p>
                </div>
            </div>

            <Card className="shadow-sm border-neutral-200 overflow-hidden">
                {/* Header Controls */}
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-white text-neutral-900">
                    <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(d => subDays(d, 7))}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    
                    <div className="flex items-center gap-2 font-semibold">
                        <CalendarDays className="w-4 h-4 text-neutral-400" />
                        {weekDisplay}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(d => addDays(d, 7))}>
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                {/* Grid Header */}
                <div className="grid grid-cols-4 bg-neutral-50/80 border-b border-neutral-200 divide-x divide-neutral-200 overflow-x-auto min-w-[700px]">
                    <div className="p-4 font-semibold text-neutral-600 text-sm">Day / Date</div>
                    {SHIFTS.map(shift => (
                        <div key={shift.code} className="p-4 flex flex-col">
                            <span className="font-semibold text-neutral-800">{shift.label}</span>
                            <span className="text-xs text-neutral-500">{shift.time}</span>
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                <div className="divide-y divide-neutral-200 overflow-x-auto min-w-[700px] bg-white">
                    {Array.from({ length: 7 }).map((_, idx) => {
                        const dayDate = addDays(currentWeekStart, idx);
                        const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        
                        return (
                            <div key={idx} className={`grid grid-cols-4 divide-x divide-neutral-200 hover:bg-neutral-50/50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                                <div className="p-4 flex flex-col justify-center border-l-4 border-transparent">
                                    <span className="font-medium text-neutral-900">{format(dayDate, 'EEEE')}</span>
                                    <span className="text-sm text-neutral-500">{format(dayDate, 'MMM dd')}</span>
                                </div>
                                {SHIFTS.map(shift => (
                                    <div key={shift.code} className="p-2">
                                        {renderShiftCell(dayDate, shift.code)}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
