import { useState, useEffect } from 'react';
import { Save, Lock, Smartphone, Globe, Bell, Trash2, Plus, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import api from '@/services/api';

interface AccessControl {
    control_id: number;
    role_code: 'STAFF_POS' | 'STAFF_INVENTORY' | 'MANAGER';
    ip_address: string;
    description: string;
    is_active: boolean;
}

export default function SystemSettings() {
    const { toast } = useToast();
    const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
    const [newRole, setNewRole] = useState<string>('');
    const [newIp, setNewIp] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');

    // Fetch Access Controls
    useEffect(() => {
        fetchAccessControls();
    }, []);

    const fetchAccessControls = async () => {
        try {
            const res = await api.get('/admin/access-controls');
            setAccessControls(res.data);
        } catch (error) {
            console.error('Failed to fetch access controls', error);
        }
    };

    const handleAddAccessControl = async () => {
        if (!newRole || !newIp || !newDescription) {
            toast({
                title: "Validation Error",
                description: "All fields are required.",
                variant: "destructive"
            });
            return;
        }

        try {
            await api.post('/admin/access-controls', {
                role_code: newRole,
                ip_address: newIp,
                description: newDescription
            });
            toast({ title: "Success", description: "IP Whitelist entry added." });
            setNewRole('');
            setNewIp('');
            setNewDescription('');
            fetchAccessControls();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add IP entry. Check console.",
                variant: "destructive"
            });
        }
    };

    const handleToggleAccessControl = async (id: number, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/access-controls/${id}/toggle`);
            setAccessControls(prev => prev.map(item =>
                item.control_id === id ? { ...item, is_active: !currentStatus } : item
            ));
            toast({ title: "Updated", description: "Status updated successfully." });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteAccessControl = async (id: number) => {
        if (!confirm("Are you sure you want to delete this IP whitelist entry?")) return;

        try {
            await api.delete(`/admin/access-controls/${id}`);
            setAccessControls(prev => prev.filter(item => item.control_id !== id));
            toast({ title: "Deleted", description: "Entry removed successfully." });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete entry.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">System Settings</h1>
                    <p className="text-neutral-500">Configure global platform parameters and security protocols.</p>
                </div>
                <Button className="bg-neutral-900">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-neutral-500" />
                                Platform Status
                            </CardTitle>
                            <CardDescription>Control system-wide availability and access.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Maintenance Mode</Label>
                                    <p className="text-sm text-neutral-500">Disable customer access for updates. Admins still have access.</p>
                                </div>
                                <Switch />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Guest Checkout</Label>
                                    <p className="text-sm text-neutral-500">Allow purchasing without creating an account.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Beta Features</Label>
                                    <p className="text-sm text-neutral-500">Enable experimental features for manager roles.</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-neutral-500" />
                                Mobile App Settings
                            </CardTitle>
                            <CardDescription>Configuration for the companion mobile application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="min-version">Minimum App Version</Label>
                                <Input id="min-version" placeholder="e.g. 2.4.0" defaultValue="2.3.5" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-neutral-500" />
                                Workforce IP Whitelist
                            </CardTitle>
                            <CardDescription>
                                Restrict access for sensitive roles (Manager, POS, Inventory) to specific IP addresses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add New Entry Form */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-lg bg-neutral-50">
                                <div className="space-y-2">
                                    <Label>User Role</Label>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                            <SelectItem value="STAFF_POS">POS Staff</SelectItem>
                                            <SelectItem value="STAFF_INVENTORY">Inventory Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>IP Address</Label>
                                    <Input
                                        placeholder="e.g. 192.168.1.1"
                                        value={newIp}
                                        onChange={(e) => setNewIp(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="e.g. Office HQ"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleAddAccessControl} className="w-full">
                                    <Plus className="w-4 h-4 mr-2" /> Add Entry
                                </Button>
                            </div>

                            {/* List Table */}
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accessControls.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                                                    No IP restrictions configured.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            accessControls.map((item) => (
                                                <TableRow key={item.control_id}>
                                                    <TableCell className="font-medium">{item.role_code}</TableCell>
                                                    <TableCell>{item.ip_address}</TableCell>
                                                    <TableCell>{item.description}</TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={item.is_active}
                                                            onCheckedChange={() => handleToggleAccessControl(item.control_id, item.is_active)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeleteAccessControl(item.control_id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>


                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-neutral-500" />
                                Alert Configurations
                            </CardTitle>
                            <CardDescription>Manage who gets notified for critical system events.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Critical System Alerts</Label>
                                    <p className="text-sm text-neutral-500">Email admins on server downtime or high load.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Suspicious Activity</Label>
                                    <p className="text-sm text-neutral-500">Notify security team on irregular login patterns.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
