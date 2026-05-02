import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, Filter, Briefcase, Moon, ScanFace, CheckCircle, LogOut, ExternalLink } from 'lucide-react';
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
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, startOfDay } from 'date-fns';
import FaceCheckInModal from '@/components/FaceCheckInModal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import LeaveRequestModal from '@/components/LeaveRequestModal';
import { CalendarDays } from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

interface Timesheet {
    timesheet_id: number;
    check_in_at: string | null;
    check_out_at: string | null;
    status_code: string;
    real_work_hours?: number;
}

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
    };
    timesheets?: Timesheet[];
}

interface ScheduleSummary {
    user_id: number;
    total_shifts: number;
    total_hours: number;
}


export default function WarehouseSchedule() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [summary, setSummary] = useState<ScheduleSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);

    // Check-in State
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [timeOffset, setTimeOffset] = useState<number>(0);
    const [checkInModalOpen, setCheckInModalOpen] = useState(false);
    const [activeCheckInType, setActiveCheckInType] = useState<'in' | 'out'>('in');

    // Timer for finding 5-minute window & Sync Server Time
    useEffect(() => {

        // 1. Fetch Server Time
        axiosInstance.get('/system/time').then(res => {
            const serverTime = new Date(res.data.server_time).getTime();
            const localTime = Date.now();
            const offset = serverTime - localTime;
            setTimeOffset(offset);
            setCurrentTime(new Date(serverTime));
        }).catch(err => {
            console.error("Time sync failed", err);
            setCurrentTime(new Date());
        });

        const timer = setInterval(() => {
            setCurrentTime(prev => {
                if (!prev) return new Date();
                return new Date(Date.now() + timeOffset);
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeOffset]);

    const getAbsoluteTime = (dateStr: string, timeStr: string) => {
        if (!dateStr || !timeStr) return null;

        // Lấy phần ngày (YYYY-MM-DD)
        const datePart = dayjs(dateStr).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');

        // Lấy phần giờ. Xử lý linh hoạt cả trường hợp giờ trả về là "13:00:00" hoặc ISO String
        let timePart = '';
        if (timeStr.includes('T')) {
            timePart = dayjs(timeStr).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss');
        } else {
            timePart = timeStr;
        }

        return dayjs.tz(`${datePart} ${timePart}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Ho_Chi_Minh').toDate();
    };

    const isCheckInWindowOpen = (date: string, expectedStart: string | null, expectedEnd: string | null): boolean => {
        if (!date || !expectedStart || !expectedEnd || !currentTime) return false;

        const start = getAbsoluteTime(date, expectedStart);
        const end = getAbsoluteTime(date, expectedEnd);

        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return false;

        const now = currentTime;

        // Giới hạn mở: Trước giờ bắt đầu ca 15 phút
        const windowStart = new Date(start.getTime() - 60 * 60 * 1000);

        // Giới hạn đóng: Sau giờ kết thúc ca 15 phút
        const windowEnd = new Date(end.getTime() + 60 * 60 * 1000);

        // Nút bấm chỉ được kích hoạt (true) khi thời gian hiện tại nằm giữa 2 mốc này
        return now >= windowStart && now <= windowEnd;
    };
    const handleCheckInClick = (type: 'in' | 'out') => {
        setActiveCheckInType(type);
        setCheckInModalOpen(true);
    };

    const handleCheckInSuccess = () => {
        setCheckInModalOpen(false);
        fetchSchedules();
    };

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
            const params = {
                from: format(startDate, 'yyyy-MM-dd'),
                to: format(endDate, 'yyyy-MM-dd'),
            };

            const [listRes, summaryRes] = await Promise.all([
                axiosInstance.get('/my-schedules', { params }),
                axiosInstance.get('/my-schedules/my-summary', { params })
            ]);

            const scheduleData = Array.isArray(listRes.data)
                ? listRes.data
                : (listRes.data.data || listRes.data.successful_records || []);

            setSchedules(scheduleData);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
            setSchedules([]);
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

    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const today = startOfDay(new Date());

    // Filter days into two groups: Today & Future, and Past
    const futureDays = daysInterval.filter(day => day >= today);
    const pastDays = daysInterval.filter(day => day < today);

    // Combine them: Future first, then Past
    const daysToDisplay = [...futureDays, ...pastDays];

    const getSchedulesForDay = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return schedules.filter(s => {
            const scheduleDate = typeof s.date === 'string' ? s.date.split('T')[0] : '';
            return scheduleDate === dayStr;
        });
    };

    const getTimeFromIso = (isoString?: string | null) => {
        if (!isoString) return '--:--';
        try {
            // Đọc chuỗi ISO và tự động cộng múi giờ địa phương (GMT+7)
            const dateObj = new Date(isoString);

            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');

            return `${hours}:${minutes}`;
        } catch (e) {
            console.error("Invalid ISO format", e);
            return '--:--';
        }
    };
    const renderCountdown = (date: string, shiftStart: string) => {
        if (!currentTime || !date) return null;

        const start = getAbsoluteTime(date, shiftStart);
        if (!start) return null;

        // Giả sử bạn vẫn muốn đếm ngược nếu sớm hơn 15 phút
        const windowStart = new Date(start.getTime() - 15 * 60 * 1000);

        if (currentTime < windowStart) {
            const diff = windowStart.getTime() - currentTime.getTime();
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            return (
                <span className="text-xs text-orange-600 font-mono ml-2">
                    Mở trong {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
            );
        }
        return null;
    };

    // Find Active Shift for "Quick Action" Button
    const activeShift = schedules.find(s => {
        // Đồng chuẩn ngày theo Calendar
        const todayStr = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
        const isToday = typeof s.date === 'string' && s.date.startsWith(todayStr);
        if (!isToday) return false;

        const timesheet = s.timesheets && s.timesheets.length > 0 ? s.timesheets[0] : null;
        if (timesheet?.check_out_at) return false;

        if (!timesheet?.check_in_at) {
            return s.expected_start ? isCheckInWindowOpen(s.date, s.expected_start, s.expected_end) : false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Warehouse Schedule</h1>
                    <p className="text-neutral-500">Manage your shifts and attendance.</p>
                    {currentTime && (
                        <p className="text-xs text-neutral-400 mt-1">
                            Server Time: {format(currentTime, 'HH:mm:ss')}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Global Check-in Button */}
                    {activeShift && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md animate-pulse"
                            onClick={() => {
                                const ts = activeShift.timesheets?.[0];
                                handleCheckInClick(ts?.check_in_at ? 'out' : 'in');
                            }}
                        >
                            <ScanFace className="w-5 h-5 mr-2" />
                            {activeShift.timesheets?.[0]?.check_in_at ? '📸 Chấm công ra ca' : '📸 Chấm công vào ca'}
                        </Button>
                    )}

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
                    <Button
                        variant="outline"
                        className="text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100"
                        onClick={() => setLeaveModalOpen(true)}
                    >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Leave Request
                    </Button>
                </div>
            </div>

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
                                    {daySchedules.map((shift) => {
                                        const timesheet = shift.timesheets && shift.timesheets.length > 0 ? shift.timesheets[0] : null;

                                        let checkInState: 'in' | 'out' | 'completed' = 'in';
                                        if (timesheet?.check_out_at) {
                                            checkInState = 'completed';
                                        } else if (timesheet?.check_in_at) {
                                            checkInState = 'out';
                                        }

                                        const canCheckIn = shift.expected_start ? isCheckInWindowOpen(shift.date, shift.expected_start, shift.expected_end) : false;
                                        const countdown = shift.expected_start ? renderCountdown(shift.date, shift.expected_start) : null;

                                        return (
                                            <div key={shift.schedule_id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                                                <div className="flex items-start md:items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                        {(shift.employees?.users?.full_name || 'Me').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-neutral-900">{shift.employees?.users?.full_name || 'My Shift'}</div>
                                                        <div className="text-sm text-neutral-500">
                                                            {shift.shift_code}
                                                            {timesheet?.status_code && (
                                                                <Badge variant={timesheet.status_code === 'LATE' ? 'destructive' : 'outline'} className="ml-2 text-[10px]">
                                                                    {timesheet.status_code}
                                                                </Badge>
                                                            )}
                                                            {/* Deep Link to History */}
                                                            {(timesheet || (shift.expected_start && new Date(shift.expected_start) < new Date())) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => navigate('/warehouse/timesheets', { state: { targetDate: shift.date, targetShift: shift.shift_code } })}
                                                                >
                                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                                    History
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="flex items-center gap-2 text-neutral-600">
                                                        <Clock className="w-4 h-4" />
                                                        {getTimeFromIso(shift.expected_start)} - {getTimeFromIso(shift.expected_end)}

                                                    </div>
                                                    {shift.expected_end && shift.expected_start && shift.expected_end < shift.expected_start && (
                                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
                                                            <Moon className="w-3 h-3" /> Overnight
                                                        </Badge>
                                                    )}
                                                </div>


                                                <div className="flex items-center">
                                                    {checkInState === 'in' && (
                                                        <Button
                                                            size="sm"
                                                            className={canCheckIn ? "bg-blue-600 hover:bg-blue-700" : "bg-neutral-300 text-neutral-500 cursor-not-allowed"}
                                                            disabled={!canCheckIn}
                                                            onClick={() => handleCheckInClick('in')}
                                                        >
                                                            <ScanFace className="w-4 h-4 mr-2" />
                                                            Check In
                                                        </Button>
                                                    )}

                                                    {checkInState === 'out' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                            onClick={() => handleCheckInClick('out')}
                                                        >
                                                            <LogOut className="w-4 h-4 mr-2" />
                                                            Check Out
                                                        </Button>
                                                    )}

                                                    {checkInState === 'completed' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 border-green-200 bg-green-50"
                                                            disabled
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Completed {timesheet?.real_work_hours ? `(${timesheet.real_work_hours}h)` : ''}
                                                        </Button>
                                                    )}
                                                </div>

                                            </div>
                                        );
                                    })}
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

            <FaceCheckInModal
                open={checkInModalOpen}
                onOpenChange={setCheckInModalOpen}
                checkInType={activeCheckInType}
                onSuccess={handleCheckInSuccess}
            />
            <LeaveRequestModal
                open={leaveModalOpen}
                onOpenChange={setLeaveModalOpen} />
        </div>
    );
}