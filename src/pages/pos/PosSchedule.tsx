import { useState } from 'react';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock Schedule Data
const SCHEDULE = [
    {
        id: 1, day: 'Monday', date: 'Jan 22', shifts: [
            { time: '09:00 - 17:00', role: 'Store Manager', staff: 'Alice Chen', type: 'Full Day' },
            { time: '09:00 - 13:00', role: 'Sales Associate', staff: 'Sarah Jones', type: 'Morning' },
            { time: '13:00 - 21:00', role: 'Sales Associate', staff: 'Mike Ross', type: 'Evening' },
        ]
    },
    {
        id: 2, day: 'Tuesday', date: 'Jan 23', shifts: [
            { time: '09:00 - 17:00', role: 'Store Manager', staff: 'Alice Chen', type: 'Full Day' },
            { time: '12:00 - 20:00', role: 'Inventory Specialist', staff: 'Tom Ford', type: 'Mid-Day' },
        ]
    },
    {
        id: 3, day: 'Wednesday', date: 'Jan 24', shifts: [
            { time: '09:00 - 17:00', role: 'Asst. Manager', staff: 'John Doe', type: 'Full Day' },
            { time: '09:00 - 15:00', role: 'Sales Associate', staff: 'Sarah Jones', type: 'Morning' },
            { time: '15:00 - 21:00', role: 'Sales Associate', staff: 'Mike Ross', type: 'Evening' },
        ]
    },
];

export default function StaffSchedule() {
    const [currentWeek, setCurrentWeek] = useState('Jan 22 - Jan 28, 2026');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Work Schedule</h1>
                    <p className="text-neutral-500">View shifts and assignments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="font-medium min-w-[150px] text-center">{currentWeek}</span>
                    <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" className="ml-2 gap-2">
                        <Filter className="w-4 h-4" /> My Shifts
                    </Button>
                    <Button>Request Time Off</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {SCHEDULE.map((day) => (
                    <Card key={day.id} className="overflow-hidden border-neutral-200">
                        <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-neutral-500" />
                                <span className="font-semibold text-neutral-900">{day.day}</span>
                                <span className="text-neutral-500">{day.date}</span>
                            </div>
                            <Badge variant="secondary" className="bg-white">{day.shifts.length} Shifts</Badge>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {day.shifts.map((shift, idx) => (
                                <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                                    <div className="flex items-start md:items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                            {shift.staff.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-neutral-900">{shift.staff}</div>
                                            <div className="text-sm text-neutral-500">{shift.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2 text-neutral-600">
                                            <Clock className="w-4 h-4" />
                                            {shift.time}
                                        </div>
                                        <Badge variant="outline" className={`
                                            ${shift.type === 'Morning' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                shift.type === 'Evening' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                    'bg-green-50 text-green-700 border-green-200'}
                                        `}>
                                            {shift.type}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
