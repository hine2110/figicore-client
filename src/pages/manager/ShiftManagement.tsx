import { Calendar, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SHIFT_REQUESTS = [
    { id: 1, staff: 'Sarah Jones', type: 'Time Off', dates: 'Feb 10 - Feb 12', reason: 'Personal Appointment', status: 'Pending' },
    { id: 2, staff: 'Mike Ross', type: 'Swap Request', dates: 'Jan 25', reason: 'Swap with Alice Chen', status: 'Pending' },
];

export default function ShiftManagement() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Shift Management</h1>
                    <p className="text-neutral-500">Manage schedules and approve requests.</p>
                </div>
                <Button>
                    <Calendar className="w-4 h-4 mr-2" />
                    Publish Schedule
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-neutral-200">
                    <h3 className="font-bold text-lg text-neutral-900 mb-4">Pending Requests</h3>
                    <div className="space-y-4">
                        {SHIFT_REQUESTS.map(req => (
                            <div key={req.id} className="p-4 border border-neutral-100 rounded-lg bg-neutral-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">{req.type}</Badge>
                                        <span className="font-medium text-neutral-900">{req.staff}</span>
                                    </div>
                                    <span className="text-xs text-neutral-400">2h ago</span>
                                </div>
                                <p className="text-sm text-neutral-600 mb-1">{req.dates}</p>
                                <p className="text-sm text-neutral-500 italic mb-4">"{req.reason}"</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="w-full">Deny</Button>
                                    <Button size="sm" className="w-full">Approve</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 border-neutral-200">
                    <h3 className="font-bold text-lg text-neutral-900 mb-4">Today's Coverage</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border-b border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-full"><UserCheck className="w-4 h-4" /></div>
                                <div>
                                    <div className="font-medium text-neutral-900">Morning Shift</div>
                                    <div className="text-xs text-neutral-500">09:00 - 13:00</div>
                                </div>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-800">S</div>
                                <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-800">J</div>
                                <div className="w-8 h-8 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center text-xs text-neutral-500">+1</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border-b border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-50 text-neutral-600 rounded-full"><Clock className="w-4 h-4" /></div>
                                <div>
                                    <div className="font-medium text-neutral-900">Evening Shift</div>
                                    <div className="text-xs text-neutral-500">13:00 - 21:00</div>
                                </div>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-800">M</div>
                                <div className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-xs font-bold text-pink-800">A</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
