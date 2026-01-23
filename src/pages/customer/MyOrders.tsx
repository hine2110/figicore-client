import CustomerLayout from '@/layouts/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Package,
    Truck,
    Clock,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyOrders() {
    const navigate = useNavigate();

    const orders = [
        {
            id: 'ORD-1042',
            date: 'January 22, 2026',
            items: 'Molly Chess Series',
            total: '$149.99',
            status: 'Delivered',
            tracking: 'TRK-123456',
            statusColor: 'bg-green-100 text-green-700'
        },
        {
            id: 'ORD-1038',
            date: 'January 18, 2026',
            items: 'Skullpanda Dark Night',
            total: '$189.99',
            status: 'Shipped',
            tracking: 'TRK-223455',
            statusColor: 'bg-blue-100 text-blue-700'
        },
        {
            id: 'ORD-1025',
            date: 'January 15, 2026',
            items: 'Labubu Macaron Series',
            total: '$124.99',
            status: 'Delivered',
            tracking: 'TRK-111456',
            statusColor: 'bg-green-100 text-green-700'
        },
        {
            id: 'ORD-1020',
            date: 'January 12, 2026',
            items: 'CRYBABY Collection Set',
            total: '$299.99',
            status: 'Processing',
            tracking: '-',
            statusColor: 'bg-yellow-100 text-yellow-700'
        }
    ];

    return (
        <CustomerLayout activePage="home">
            <div className="bg-gray-50 min-h-screen pb-20">
                <div className="bg-white border-b border-gray-200 pt-10 pb-16">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-light text-gray-900 mb-2">Order History</h1>
                        <p className="text-gray-500">Track and manage your purchases</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-8">

                    {/* Order Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-6 border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Package className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Orders</p>
                                <p className="text-2xl font-semibold text-gray-900">24</p>
                            </div>
                        </Card>
                        <Card className="p-6 border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Clock className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">In Transit</p>
                                <p className="text-2xl font-semibold text-gray-900">1</p>
                            </div>
                        </Card>
                        <Card className="p-6 border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Truck className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Delivered</p>
                                <p className="text-2xl font-semibold text-gray-900">22</p>
                            </div>
                        </Card>
                    </div>

                    {/* Orders Table */}
                    <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
                            <p className="text-sm text-gray-500">Your complete purchase history</p>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Order ID</th>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium">Items</th>
                                        <th className="px-6 py-4 font-medium">Total</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium">Tracking</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                                            <td className="px-6 py-4 text-gray-500">{order.date}</td>
                                            <td className="px-6 py-4 text-gray-900 font-medium">{order.items}</td>
                                            <td className="px-6 py-4 text-gray-900 font-bold">{order.total}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${order.statusColor} border-0 font-medium`}>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{order.tracking}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="outline" size="sm" className="gap-2 h-8">
                                                    <Eye className="w-3 h-3" /> View
                                                </Button>
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
