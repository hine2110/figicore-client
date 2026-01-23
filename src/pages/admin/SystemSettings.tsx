import { Save, Lock, Smartphone, Globe, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function SystemSettings() {
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
                                <Lock className="w-5 h-5 text-neutral-500" />
                                Access Control & Limits
                            </CardTitle>
                            <CardDescription>Manage security thresholds and session policies.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Max Order Value ($)</Label>
                                <Input defaultValue="5000.00" type="number" />
                                <p className="text-xs text-neutral-500">Orders above this require manual approval.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Session Timeout (mins)</Label>
                                <Input defaultValue="30" type="number" />
                                <p className="text-xs text-neutral-500">Auto-logout duration for staff accounts.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Password Rotation (days)</Label>
                                <Input defaultValue="90" type="number" />
                                <p className="text-xs text-neutral-500">Required password update frequency.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Failed Login Attempts</Label>
                                <Input defaultValue="5" type="number" />
                                <p className="text-xs text-neutral-500">Lock account after N failed tries.</p>
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
