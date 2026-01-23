import { useState } from "react";
import { MoreHorizontal, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEAM_MEMBERS } from "@/lib/managerMockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function TeamManagement() {
    const [members, setMembers] = useState(TEAM_MEMBERS);

    const toggleStatus = (id: string) => {
        setMembers(members.map(m => m.id === id ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Team Management</h1>
                    <p className="text-neutral-500">Oversee staff members and shifts.</p>
                </div>
                <Button>+ Add New Staff</Button>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Performance</th>
                            <th className="px-6 py-4">Current Shift</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {members.map(member => (
                            <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                            {member.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-neutral-900">{member.name}</span>
                                </td>
                                <td className="px-6 py-4 text-neutral-600">{member.role}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                                        }`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-semibold ${member.performance === 'High' ? 'text-green-600' :
                                        member.performance === 'Medium' ? 'text-blue-600' : 'text-orange-600'
                                        }`}>
                                        {member.performance}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-neutral-600">{member.shift}</td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleStatus(member.id)}>
                                                {member.status === 'Active' ?
                                                    <div className="flex items-center text-red-600"><UserX className="w-4 h-4 mr-2" /> Deactivate</div> :
                                                    <div className="flex items-center text-green-600"><UserCheck className="w-4 h-4 mr-2" /> Activate</div>
                                                }
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
