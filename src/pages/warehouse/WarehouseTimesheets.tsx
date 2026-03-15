import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { timesheetService, MyHistoryResponse } from "@/services/timesheet.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, CalendarClock, Banknote, Clock } from "lucide-react";
import { format } from "date-fns";
import TimesheetCorrectionModal from "@/components/TimesheetCorrectionModal";
import { AlertTriangle } from "lucide-react";

export default function WarehouseTimesheets() {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MyHistoryResponse | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [selectedTimesheetId, setSelectedTimesheetId] = useState<number | null>(null);
    const [selectedShiftInfo, setSelectedShiftInfo] = useState<string>("");

    const handleOpenCorrection = (timesheetId: number, dateStr: string, shiftName: string) => {
        setSelectedTimesheetId(timesheetId);
        setSelectedShiftInfo(`${formatDate(dateStr)} - ${shiftName}`);
        setCorrectionModalOpen(true);
    };

    useEffect(() => {
        if (location.state?.targetDate) {
            setCurrentDate(new Date(location.state.targetDate));
        }
    }, [location.state]);

    // Auto-scroll effect
    useEffect(() => {
        if (!loading && data && location.state?.targetDate) {
            const dateKey = new Date(location.state.targetDate).toISOString().split('T')[0];
            const targetShift = location.state.targetShift || '';
            const uniqueKey = targetShift ? `${dateKey}-${targetShift}` : dateKey;

            const element = rowRefs.current[uniqueKey];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [loading, data, location.state]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const res = await timesheetService.getMyHistory(month, year);
            setData(res);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return "--:--";
        return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'LATE': return 'bg-red-500 hover:bg-red-600';
            case 'EARLY_LEAVE': return 'bg-orange-500 hover:bg-orange-600';
            case 'MISSING': return 'bg-neutral-500 hover:bg-neutral-600';
            case 'FORGOT_CHECKOUT': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'PRESENT':
            case 'WORKING': return 'bg-green-500 hover:bg-green-600';
            default: return 'bg-blue-500 hover:bg-blue-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-orange-700">Warehouse Timesheets</h1>

                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium min-w-[170px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : data?.summary.total_shifts}</div>
                        <p className="text-xs text-muted-foreground">Shifts scheduled this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Real Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : data?.summary.total_hours}</div>
                        <p className="text-xs text-muted-foreground">Actual working hours</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Salary</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {loading ? "Loading..." : formatCurrency(data?.summary.expected_salary || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Based on hourly rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                        </div>
                    ) : (data?.logs.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">
                            No attendance records found for this month.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Shift</TableHead>
                                        <TableHead>Check In</TableHead>
                                        <TableHead>Check Out</TableHead>
                                        <TableHead className="text-right">Real Hours</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.logs.map((log, index) => {
                                        const isTarget = location.state?.targetDate &&
                                            new Date(log.date).toDateString() === new Date(location.state.targetDate).toDateString() &&
                                            (!location.state?.targetShift || log.shift_name === location.state.targetShift);

                                        const dateKey = new Date(log.date).toISOString().split('T')[0];
                                        const uniqueKey = `${dateKey}-${log.shift_name}`;

                                        return (
                                            <TableRow
                                                key={index}
                                                ref={(el) => { if (el) rowRefs.current[uniqueKey] = el; }}
                                                className={`
                                                    ${log.is_flagged ? "bg-red-50/50" : ""}
                                                    ${isTarget ? "bg-orange-50 border-l-4 border-l-orange-600" : ""}
                                                `}
                                            >
                                                <TableCell className="font-medium">{formatDate(log.date)}</TableCell>
                                                <TableCell>{log.shift_name}</TableCell>
                                                <TableCell>{formatTime(log.check_in_at)}</TableCell>
                                                <TableCell>{formatTime(log.check_out_at)}</TableCell>
                                                <TableCell className="text-right font-mono">{log.real_hours}</TableCell>
                                                <TableCell className="text-right">
                                                    {log.error_tags && log.error_tags.length > 0 ? (
                                                        <div className="flex flex-col gap-1 items-end">
                                                            {log.error_tags.map((tag: string) => (
                                                                <Badge key={tag} className={`${getStatusColor(tag)} text-white border-0 w-fit`}>
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Badge className={`${getStatusColor(log.status)} text-white border-0`}>
                                                            {log.status}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {/* Điều kiện: Có ID & Khác PRESENT & (Đã checkout HOẶC Trạng thái là MISSING) */}
                                                    {log.timesheet_id && log.status !== 'PRESENT' && (log.check_out_at !== null || log.status === 'MISSING') ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 h-8 text-xs"
                                                            onClick={() => handleOpenCorrection(log.timesheet_id as number, log.date, log.shift_name)}
                                                        >
                                                            <AlertTriangle className="w-3 h-3 mr-1" /> Báo lỗi
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400 italic">Không có lỗi</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <TimesheetCorrectionModal
                open={correctionModalOpen}
                onOpenChange={setCorrectionModalOpen}
                timesheetId={selectedTimesheetId}
                shiftInfo={selectedShiftInfo}
            />
        </div>
    );
}
