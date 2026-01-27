import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Copy, ChevronLeft, ChevronRight, User as UserIcon, Calendar as CalendarIcon, CopyPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { axiosInstance } from '@/lib/axiosInstance';
import { format, startOfWeek, addDays, subDays, endOfWeek, isSameDay } from 'date-fns';

// --- Types ---

export interface User {
    user_id: number;
    full_name: string;
    email: string;
    role_code: string;
}

export interface WorkSchedule {
    schedule_id: number;
    user_id: number;
    date: string; // YYYY-MM-DD
    shift_code: string;
    expected_start: string | null;
    expected_end: string | null;
    // Relation from backend (if included)
    employees?: {
        full_name: string;
        employee_code?: string;
    };
}

export interface CreateWorkScheduleDto {
    user_id: number;
    date: string;
    shift_code: string;
    expected_start?: string; // ISO String
    expected_end?: string;   // ISO String
}

// --- Constants ---

const ALLOWED_ROLES = ['STAFF_POS', 'STAFF_INVENTORY'];

const SHIFTS = [
    { code: 'MORNING', label: 'Morning', color: 'bg-blue-50 border-blue-200 text-blue-700', time: '08:00 - 12:00' },
    { code: 'AFTERNOON', label: 'Afternoon', color: 'bg-purple-50 border-purple-200 text-purple-700', time: '13:00 - 17:00' },
    { code: 'EVENING', label: 'Evening', color: 'bg-orange-50 border-orange-200 text-orange-700', time: '17:00 - 22:00' },
];

// --- Component ---

export default function ShiftManagement() {
    const { toast } = useToast();
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false);

    // Date Navigation State (Start of the week - Monday)
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

    // Modal State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Form State (Time inputs allow typing HH:mm, but we convert to ISO on submit)
    const [formData, setFormData] = useState<{
        user_id: number;
        date: string;
        shift_code: string;
        expected_start: string; // HH:mm
        expected_end: string;   // HH:mm
    }>({
        user_id: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        shift_code: 'MORNING',
        expected_start: '',
        expected_end: ''
    });

    // --- Computed ---

    const weekDisplay = useMemo(() => {
        const start = currentWeekStart;
        const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        return `Week of ${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
    }, [currentWeekStart]);

    // FILTER: Only show supported roles in dropdown
    const filteredUsers = useMemo(() => {
        return users.filter(user => ALLOWED_ROLES.includes(user.role_code));
    }, [users]);

    // --- Helpers ---

    // Convert Date + Time String (HH:mm) -> ISO 8601 String
    const getIsoDateTime = (dateStr: string, timeStr?: string) => {
        if (!dateStr || !timeStr) return undefined;
        try {
            const date = new Date(`${dateStr}T${timeStr}:00`);
            return date.toISOString();
        } catch (e) {
            console.error("Invalid date/time conversion", e);
            return undefined;
        }
    };

    // Convert ISO String -> HH:mm for Input
    const getTimeFromIso = (isoString?: string | null) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            return format(date, 'HH:mm');
        } catch {
            return '';
        }
    };

    const getUserName = (schedule: WorkSchedule) => {
        if (schedule.employees?.full_name) return schedule.employees.full_name;
        const user = users.find(u => u.user_id === schedule.user_id);
        return user ? user.full_name : `User #${schedule.user_id}`;
    };

    // --- API Methods ---

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get('/users');
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const from = format(currentWeekStart, 'yyyy-MM-dd');
            const to = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

            const res = await axiosInstance.get('/schedules', {
                params: { from, to }
            });
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setSchedules(data);
        } catch (error) {
            console.error("Failed to fetch schedules", error);
            toast({ title: "Error", description: "Failed to load schedules", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.user_id) {
            toast({ title: "Error", description: "Please select an employee", variant: "destructive" });
            return;
        }

        const payload = {
            user_id: Number(formData.user_id),
            date: formData.date,
            shift_code: formData.shift_code,
            expected_start: getIsoDateTime(formData.date, formData.expected_start),
            expected_end: getIsoDateTime(formData.date, formData.expected_end),
        };

        try {
            await axiosInstance.post('/schedules', payload);
            toast({ title: "Success", description: "Schedule created successfully" });
            setIsDialogOpen(false);
            fetchSchedules();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create schedule",
                variant: "destructive"
            });
        }
    };

    const handleUpdate = async () => {
        if (!currentId) return;

        const payload = {
            date: formData.date,
            shift_code: formData.shift_code,
            expected_start: getIsoDateTime(formData.date, formData.expected_start),
            expected_end: getIsoDateTime(formData.date, formData.expected_end),
        };

        try {
            await axiosInstance.patch(`/schedules/${currentId}`, payload);
            toast({ title: "Success", description: "Schedule updated successfully" });
            setIsDialogOpen(false);
            fetchSchedules();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update schedule",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this schedule?")) return;
        try {
            await axiosInstance.delete(`/schedules/${id}`);
            toast({ title: "Success", description: "Schedule deleted" });
            fetchSchedules();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete schedule",
                variant: "destructive"
            });
        }
    };

    // --- Actions ---

    const handleCloneAll = async (todayDate: Date, shiftCode: string) => {
        const prevDay = subDays(todayDate, 1);

        // Find previous day schedules for this shift code
        const prevSchedules = schedules.filter(s => {
            if (!s.date) return false;
            const sDate = new Date(s.date);
            return isSameDay(sDate, prevDay) && s.shift_code === shiftCode;
        });

        if (prevSchedules.length === 0) {
            toast({ title: "Info", description: "No shifts found on the previous day to clone.", variant: "default" });
            return;
        }

        if (!confirm(`Found ${prevSchedules.length} shifts from yesterday. Copy them to today?`)) return;

        const targetDateStr = format(todayDate, 'yyyy-MM-dd');

        // Prepare bulk payload
        const dtos: CreateWorkScheduleDto[] = prevSchedules.map(s => ({
            user_id: s.user_id,
            date: targetDateStr,
            shift_code: shiftCode,
            // Create timestamps for the NEW date but keeping the SAME time
            expected_start: s.expected_start ? getIsoDateTime(targetDateStr, getTimeFromIso(s.expected_start)) : undefined,
            expected_end: s.expected_end ? getIsoDateTime(targetDateStr, getTimeFromIso(s.expected_end)) : undefined,
        }));

        try {
            await axiosInstance.post('/schedules/bulk', dtos);
            toast({ title: "Success", description: `Copied ${dtos.length} shifts successfully` });
            fetchSchedules();
        } catch (error: any) {
            console.error("Clone error", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to clone shifts",
                variant: "destructive"
            });
        }
    };

    const openCreateModal = (prefillData: Partial<typeof formData> = {}) => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({
            user_id: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
            shift_code: 'MORNING',
            expected_start: '08:00',
            expected_end: '12:00',
            ...prefillData
        });
        setIsDialogOpen(true);
    };

    const openCloneModal = (schedule: WorkSchedule) => {
        setIsEditing(false); // treat as create
        setCurrentId(null);
        setFormData({
            user_id: schedule.user_id,
            date: schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : '',
            shift_code: schedule.shift_code,
            expected_start: getTimeFromIso(schedule.expected_start),
            expected_end: getTimeFromIso(schedule.expected_end)
        });
        setIsDialogOpen(true);
    };

    const openEditModal = (schedule: WorkSchedule) => {
        setIsEditing(true);
        setCurrentId(schedule.schedule_id);
        const dateStr = schedule.date ? new Date(schedule.date).toISOString().split('T')[0] : '';
        setFormData({
            user_id: schedule.user_id,
            date: dateStr,
            shift_code: schedule.shift_code,
            expected_start: getTimeFromIso(schedule.expected_start),
            expected_end: getTimeFromIso(schedule.expected_end)
        });
        setIsDialogOpen(true);
    };

    // --- Navigation ---

    const nextWeek = () => setCurrentWeekStart(d => addDays(d, 7));
    const prevWeek = () => setCurrentWeekStart(d => subDays(d, 7));
    const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

    // --- Effects ---

    useEffect(() => {
        fetchSchedules();
    }, [currentWeekStart]);

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- Render Helpers ---

    const renderShiftCell = (dayDate: Date, shiftCode: string) => {
        const daySchedules = schedules.filter(s => {
            if (!s.date) return false;
            const scheduleDate = new Date(s.date);
            return isSameDay(scheduleDate, dayDate) && s.shift_code === shiftCode;
        });

        return (
            <div className="flex flex-col gap-2 min-h-[100px]">
                {daySchedules.map(schedule => (
                    <div key={schedule.schedule_id} className="relative group bg-white border border-neutral-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                                <UserIcon className="w-3 h-3" />
                            </div>
                            <span className="text-sm font-medium truncate max-w-[120px]" title={getUserName(schedule)}>
                                {getUserName(schedule)}
                            </span>
                        </div>
                        <div className="text-xs text-neutral-400 mb-1">
                            {getTimeFromIso(schedule.expected_start)} - {getTimeFromIso(schedule.expected_end)}
                        </div>

                        {/* Action Buttons Overlay */}
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 absolute top-1 right-1 p-1 rounded border shadow-sm">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-neutral-50"
                                onClick={() => openEditModal(schedule)}
                                title="Edit"
                            >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-neutral-50"
                                onClick={() => openCloneModal(schedule)}
                                title="Clone"
                            >
                                <Copy className="w-3 h-3 text-green-600" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-neutral-50"
                                onClick={() => handleDelete(schedule.schedule_id)}
                                title="Delete"
                            >
                                <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                        </div>
                    </div>
                ))}

                <div className="mt-auto flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-neutral-500 hover:text-neutral-900 border border-dashed border-neutral-300 hover:bg-white bg-transparent h-7"
                        onClick={() => openCreateModal({
                            date: format(dayDate, 'yyyy-MM-dd'),
                            shift_code: shiftCode
                        })}
                    >
                        <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] text-neutral-400 hover:text-neutral-700 h-6"
                        onClick={() => handleCloneAll(dayDate, shiftCode)}
                        title="Copy shifts from yesterday"
                    >
                        <CopyPlus className="w-3 h-3 mr-1" /> Clone Prev Day
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Shift Management</h1>
                    <p className="text-neutral-500">Weekly employee shift assignments.</p>
                </div>
                <Button onClick={() => openCreateModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Assignment
                </Button>
            </div>

            {/* Navigation Bar */}
            <Card className="p-4 border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button variant="outline" size="sm" onClick={prevWeek}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous Week
                </Button>

                <div className="text-center">
                    <h3 className="text-lg font-bold text-neutral-900 flex items-center justify-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-neutral-500" />
                        {weekDisplay}
                    </h3>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={goToToday}>Today</Button>
                    <Button variant="outline" size="sm" onClick={nextWeek}>
                        Next Week <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </Card>

            {/* Weekly View Table/Grid */}
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
                {/* Header for Shifts */}
                <div className="hidden md:grid grid-cols-[150px_1fr_1fr_1fr] bg-neutral-50 border-b border-neutral-200">
                    <div className="p-4 font-medium text-neutral-500">Day / Date</div>
                    {SHIFTS.map(shift => (
                        <div key={shift.code} className={`p-4 font-medium border-l border-neutral-200 ${shift.color.split(' ')[0]}`}>
                            {shift.label}
                            <div className="text-xs font-normal opacity-70">{shift.time}</div>
                        </div>
                    ))}
                </div>

                {/* Days Rows */}
                <div className="divide-y divide-neutral-200">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const date = addDays(currentWeekStart, i);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <div key={i} className="flex flex-col md:grid md:grid-cols-[150px_1fr_1fr_1fr] group">
                                {/* Date Column */}
                                <div className={`p-4 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-1 ${isToday ? 'bg-blue-50/50' : ''}`}>
                                    <span className="font-bold text-neutral-900">{format(date, 'EEEE')}</span>
                                    <span className={`text-sm ${isToday ? 'text-blue-600 font-bold' : 'text-neutral-500'}`}>
                                        {format(date, 'MMM dd')}
                                    </span>
                                </div>

                                {/* Shift Columns */}
                                {SHIFTS.map(shift => (
                                    <div key={shift.code} className="p-3 border-t md:border-t-0 md:border-l border-neutral-200 min-h-[140px]">
                                        {/* Mobile Label */}
                                        <div className="md:hidden text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">
                                            {shift.label}
                                        </div>
                                        {renderShiftCell(date, shift.code)}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
                        <DialogDescription>
                            Assign a shift to an employee.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="user_select" className="text-right">Employee</Label>
                            <div className="col-span-3">
                                {isEditing ? (
                                    <div className="flex items-center gap-2 p-2 border rounded-md bg-neutral-50">
                                        <UserIcon className="w-4 h-4 text-neutral-500" />
                                        <span className="text-sm font-medium">
                                            {users.find(u => u.user_id === formData.user_id)?.full_name || `User #${formData.user_id}`}
                                        </span>
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.user_id ? formData.user_id.toString() : ''}
                                        onValueChange={(val) => setFormData({ ...formData, user_id: Number(val) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Staff..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredUsers.length === 0 ? (
                                                <div className="p-2 text-sm text-neutral-500 text-center">No eligible staff found</div>
                                            ) : (
                                                filteredUsers.map(user => (
                                                    <SelectItem key={user.user_id} value={user.user_id.toString()}>
                                                        {user.full_name} <span className="text-xs text-neutral-400">({user.role_code})</span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="shift" className="text-right">Shift</Label>
                            <Select
                                value={formData.shift_code}
                                onValueChange={(val) => setFormData({ ...formData, shift_code: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SHIFTS.map(s => (
                                        <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Time</Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    type="time"
                                    value={formData.expected_start || ''}
                                    onChange={(e) => setFormData({ ...formData, expected_start: e.target.value })}
                                />
                                <span className="flex items-center">-</span>
                                <Input
                                    type="time"
                                    value={formData.expected_end || ''}
                                    onChange={(e) => setFormData({ ...formData, expected_end: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={isEditing ? handleUpdate : handleCreate}>
                            {isEditing ? 'Save Changes' : 'Confirm Assignment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
