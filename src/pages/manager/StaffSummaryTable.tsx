import { useState, useEffect } from 'react';
import { Search, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { axiosInstance } from '@/lib/axiosInstance';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface StaffSummary {
    user_id: number;
    full_name: string;
    email: string;
    total_shifts: number;
    total_hours: number;
}

interface StaffSummaryTableProps {
    fromDate: string;
    toDate: string;
}

export default function StaffSummaryTable({ fromDate, toDate }: StaffSummaryTableProps) {
    const [summary, setSummary] = useState<StaffSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get<StaffSummary[]>('/schedules/summary', {
                params: { from: fromDate, to: toDate },
            });
            setSummary(res.data);
        } catch (error) {
            console.error('Failed to fetch summary:', error);
            toast.error('Failed to load staff summary.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (fromDate && toDate) {
            fetchSummary();
        }
    }, [fromDate, toDate]);

    // Local filter
    const filteredData = summary.filter((item) =>
        item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            toast.warning('No data to export.');
            return;
        }

        // Prepare data for Excel
        const exportData = filteredData.map(item => ({
            'Full Name': item.full_name,
            'Email': item.email,
            'Total Shifts': item.total_shifts,
            'Total Hours': item.total_hours,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Summary');

        // Generate filename: Work_Summary_[Date].xlsx
        // Using current date as requested or range? 
        // Request said: Work_Summary_[Date].xlsx. I will use the range for clarity or today's date?
        // Let's use the range to be consistent with data context: Work_Summary_[From]_[To].xlsx
        const fileName = `Work_Summary_${fromDate}_to_${toDate}.xlsx`;

        XLSX.writeFile(workbook, fileName);
        toast.success('Report exported successfully.');
    };

    return (
        <Card className="mt-6 border-t shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">Total Work Summary</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Staff performance and hours tracking.
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 w-full max-w-lg">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Filter by employee..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleExportExcel}
                            title="Export to Excel"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[200px]">Full Name</TableHead>
                                <TableHead className="w-[200px]">Email</TableHead>
                                <TableHead className="text-center">Total Shifts</TableHead>
                                <TableHead className="text-center">Total Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Loading data...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No data found for the selected period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((employee) => (
                                    <TableRow key={employee.user_id}>
                                        <TableCell className="font-medium">
                                            {employee.full_name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {employee.email}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {employee.total_shifts}
                                        </TableCell>
                                        <TableCell className="text-center text-primary font-semibold">
                                            {employee.total_hours}h
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <div className="p-4 border-t text-sm text-muted-foreground text-center bg-gray-50">
                        Showing data from <b>{fromDate}</b> to <b>{toDate}</b>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
