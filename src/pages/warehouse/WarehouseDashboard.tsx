import {
    ClipboardList,
    Box,
    AlertCircle,
    CheckCircle2,
    Clock,
    PackageCheck,
    ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { STAFF_TASKS } from "@/lib/staffMockData";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function StaffDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Staff Dashboard</h1>
                    <p className="text-neutral-500">Overview of your current shift performance.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-neutral-500">Current Shift</p>
                    <p className="font-mono font-bold text-lg text-neutral-900">08:00 - 16:00</p>
                </div>
            </div>

            {/* Shift Status Banner - Operational UI */}
            <div className="bg-neutral-900 text-white rounded-xl p-6 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Shift in Progress</h3>
                        <div className="flex items-center gap-2 text-neutral-400 text-sm">
                            <span>Started 2h 15m ago</span>
                            <span className="w-1 h-1 rounded-full bg-neutral-600" />
                            <span>Ends in 5h 45m</span>
                        </div>
                    </div>
                </div>
                <div className="w-1/3 space-y-2 hidden md:block">
                    <div className="flex justify-between text-xs font-medium text-neutral-400">
                        <span>Performance Goal</span>
                        <span className="text-emerald-400">45%</span>
                    </div>
                    <Progress value={45} className="h-2 bg-neutral-800" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                            +12%
                        </Badge>
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">12</h3>
                    <p className="text-sm text-neutral-500">Pending Orders</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-orange-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Box className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
                            Warning
                        </Badge>
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">5</h3>
                    <p className="text-sm text-neutral-500">Restock Alerts</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-red-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100">
                            Urgent
                        </Badge>
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">3</h3>
                    <p className="text-sm text-neutral-500">Priority Issues</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-green-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                            On Track
                        </Badge>
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 mb-1">28</h3>
                    <p className="text-sm text-neutral-500">Tasks Done</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task Board */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg text-neutral-900">Urgent Tasks</h2>
                        <Button variant="link" size="sm" className="text-blue-600">View All Tasks</Button>
                    </div>

                    <div className="space-y-3">
                        {STAFF_TASKS.map(task => (
                            <div key={task.id} className="group bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-12 rounded-full ${task.priority === 'High' ? 'bg-red-500' :
                                            task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`}></div>
                                    <div>
                                        <h4 className="font-semibold text-neutral-900 text-sm mb-1">{task.description}</h4>
                                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Due: {task.dueTime}
                                            </span>
                                            <Badge variant="outline" className={`border-0 font-medium ${task.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                                    task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                                        'bg-neutral-100 text-neutral-700'
                                                }`}>
                                                {task.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    Start Task <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div>
                    <h2 className="font-bold text-lg text-neutral-900 mb-6">Quick Actions</h2>
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 space-y-3">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Operational</p>

                        <Link to="/staff/pos" className="block">
                            <Button variant="outline" className="w-full justify-start h-12 hover:border-blue-300 hover:bg-blue-50">
                                <ClipboardList className="w-4 h-4 mr-3 text-blue-600" />
                                <span className="text-neutral-700">New POS Order</span>
                            </Button>
                        </Link>

                        <Link to="/staff/packing" className="block">
                            <Button variant="outline" className="w-full justify-start h-12 hover:border-blue-300 hover:bg-blue-50">
                                <PackageCheck className="w-4 h-4 mr-3 text-blue-600" />
                                <span className="text-neutral-700">Start Packing</span>
                            </Button>
                        </Link>

                        <div className="h-px bg-neutral-100 my-2" />

                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Inventory</p>

                        <Link to="/staff/inventory" className="block">
                            <Button variant="outline" className="w-full justify-start h-10 text-sm">
                                <Box className="w-4 h-4 mr-3" />
                                Check Inventory
                            </Button>
                        </Link>
                        <Link to="/staff/receipt" className="block">
                            <Button variant="outline" className="w-full justify-start h-10 text-sm">
                                <CheckCircle2 className="w-4 h-4 mr-3" />
                                Receive Goods
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
