import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeTab from "./tabs/EmployeeTab";
import CustomerTab from "./tabs/CustomerTab";

export default function AccountManagement() {
    return (
        <div className="space-y-6">
            {/* 1. Common Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Account Management</h1>
                <p className="text-neutral-500">Manage all system users, employees, and customers.</p>
            </div>

            {/* 2. Tabs Container */}
            <Tabs defaultValue="employees" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="employees">Employees</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="employees">
                        <EmployeeTab />
                    </TabsContent>
                    <TabsContent value="customers">
                        <CustomerTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
