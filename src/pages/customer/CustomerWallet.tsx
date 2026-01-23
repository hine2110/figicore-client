import CustomerLayout from '@/layouts/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard,
    Plus,
    ArrowRight
} from 'lucide-react';

export default function CustomerWallet() {
    const transactions = [
        { id: 'TXN-1042', date: 'January 22, 2026', type: 'Purchase', description: 'Order #ORD-1042', amount: '-$149.99', status: 'Completed', statusColor: 'bg-green-100 text-green-700' },
        { id: 'TXN-1041', date: 'January 19, 2026', type: 'Refund', description: 'Order #ORD-1015 Return', amount: '+$79.99', status: 'Completed', statusColor: 'bg-green-100 text-green-700' },
        { id: 'TXN-1040', date: 'January 18, 2026', type: 'Top Up', description: 'Wallet Recharge', amount: '+$200.00', status: 'Completed', statusColor: 'bg-green-100 text-green-700' },
        { id: 'TXN-1039', date: 'January 12, 2026', type: 'Purchase', description: 'Order #ORD-1030', amount: '-$89.98', status: 'Completed', statusColor: 'bg-green-100 text-green-700' },
        { id: 'TXN-1038', date: 'January 10, 2026', type: 'Reward', description: 'Points Conversion', amount: '+$25.00', status: 'Completed', statusColor: 'bg-green-100 text-green-700' },
    ];

    return (
        <CustomerLayout activePage="home">
            <div className="bg-gray-50 min-h-screen pb-20">
                <div className="bg-white border-b border-gray-200 pt-10 pb-16">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-light text-gray-900 mb-2">Wallet</h1>
                        <p className="text-gray-500">Manage your balance and transactions</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-8">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Dark Card - Main Balance */}
                        <Card className="p-6 bg-gray-900 text-white shadow-lg border-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <Badge className="bg-gray-800 text-gray-300 border-0">Active</Badge>
                            </div>
                            <div className="mb-8">
                                <CreditCard className="w-8 h-8 mb-4 opacity-80" />
                                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Available Balance</p>
                                <p className="text-4xl font-light">$1,247.50</p>
                            </div>
                            <div className="flex gap-4">
                                <Button className="flex-1 bg-white text-gray-900 hover:bg-gray-100 border-0">
                                    <Plus className="w-4 h-4 mr-2" /> Add Funds
                                </Button>
                                <Button variant="outline" className="flex-1 border-gray-700 text-white hover:bg-gray-800 hover:text-white bg-transparent">
                                    Withdraw
                                </Button>
                            </div>
                        </Card>

                        {/* Points Card */}
                        <Card className="p-6 border-gray-200 bg-white shadow-sm flex flex-col justify-between">
                            <div>
                                <Badge variant="outline" className="w-fit mb-4 border-gray-200">Rewards</Badge>
                                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Collection Points</p>
                                <p className="text-3xl font-light text-gray-900 mb-2">2,450 pts</p>
                                <p className="text-xs text-gray-400">≈ $24.50 credit</p>
                            </div>
                            <Button variant="outline" className="w-full mt-6 border-gray-200">Redeem Points</Button>
                        </Card>

                        {/* Monthly Spending */}
                        <Card className="p-6 border-gray-200 bg-white shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                    <ArrowRight className="w-4 h-4 text-gray-500 -rotate-45" />
                                </div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">This Month</p>
                                <p className="text-3xl font-light text-gray-900 mb-2">$842.30</p>
                                <p className="text-xs text-green-600">+12% from last month</p>
                            </div>
                            <Button variant="outline" className="w-full mt-6 border-gray-200">View Report</Button>
                        </Card>
                    </div>

                    {/* Navigation Tabs (Mock) */}
                    <div className="flex gap-6 border-b border-gray-200 mb-8">
                        <button className="px-4 py-2 border-b-2 border-gray-900 font-medium text-gray-900">Transaction History</button>
                        <button className="px-4 py-2 text-gray-500 hover:text-gray-900">Add Funds</button>
                        <button className="px-4 py-2 text-gray-500 hover:text-gray-900">Rewards</button>
                        <button className="px-4 py-2 text-gray-500 hover:text-gray-900">Payment Methods</button>
                    </div>

                    {/* Transaction History Table */}
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                        <p className="text-sm text-gray-500">Your complete transaction history</p>
                    </div>

                    <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Transaction ID</th>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium">Type</th>
                                        <th className="px-6 py-4 font-medium">Description</th>
                                        <th className="px-6 py-4 font-medium">Amount</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{txn.id}</td>
                                            <td className="px-6 py-4 text-gray-500">{txn.date}</td>
                                            <td className="px-6 py-4 text-gray-900">{txn.type}</td>
                                            <td className="px-6 py-4 text-gray-500">{txn.description}</td>
                                            <td className={`px-6 py-4 font-medium ${txn.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'}`}>{txn.amount}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${txn.statusColor} border-0 font-medium`}>
                                                    {txn.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </CustomerLayout>
    );
}
