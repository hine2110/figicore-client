import CustomerLayout from '@/layouts/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Wallet,
    Package,
    Gift,
    ArrowRight,
    CreditCard,
    Ticket,
    Gavel
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerHome() {
    const navigate = useNavigate();

    // Mock Data based on Screenshot 0
    const stats = [
        { label: 'Wallet Balance', value: '$1,247.50', icon: Wallet, action: 'Manage', path: '/customer/wallet' },
        { label: 'Active Orders', value: '3', icon: Package, action: 'Track', path: '/customer/orders' },
        { label: 'Collection Points', value: '2,840 pts', icon: Gift, action: 'Redeem', path: '/customer/wallet' }, // Assuming redeem is in wallet or specific page
    ];

    const recentOrders = [
        { id: 'ORD-1042', item: 'Molly Chess Series', date: 'January 20, 2026', total: '$149.99', status: 'Delivered', badgeColor: 'bg-green-100 text-green-700' },
        { id: 'ORD-1038', item: 'Skullpanda Dark Night', date: 'January 18, 2026', total: '$189.00', status: 'In Transit', badgeColor: 'bg-blue-100 text-blue-700' },
        { id: 'ORD-1025', item: 'Labubu Macaron Series', date: 'January 15, 2026', total: '$124.99', status: 'Delivered', badgeColor: 'bg-green-100 text-green-700' },
    ];

    const curatedProducts = [
        {
            id: '1',
            name: 'Molly Chess Series',
            price: '$149.99',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
            category: 'Art Toy',
            badge: 'Limited Edition'
        },
        {
            id: '2',
            name: 'Skullpanda Dark Night',
            price: '$189.00',
            image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop',
            category: 'Art Toy',
            badge: 'New Arrival'
        }
    ];

    return (
        <CustomerLayout activePage="home">
            <div className="bg-gray-50 min-h-screen pb-20">
                <div className="bg-white border-b border-gray-200 pt-10 pb-16">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-light text-gray-900 mb-2">Welcome back, Alice</h1>
                        <p className="text-gray-500">Your collection awaits</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {stats.map((stat, index) => (
                            <Card key={index} className="p-6 shadow-sm border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <stat.icon className="w-5 h-5 text-gray-600" />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-900"
                                    onClick={() => navigate(stat.path)}
                                >
                                    {stat.action}
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Recent Orders - Spans 2 cols */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                                    <p className="text-sm text-gray-500">Track your purchases</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate('/customer/orders')}>View All</Button>
                            </div>

                            <Card className="border-gray-200 shadow-sm overflow-hidden">
                                {recentOrders.map((order, idx) => (
                                    <div key={idx} className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${idx !== recentOrders.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-gray-900">{order.id}</span>
                                                <Badge className={`${order.badgeColor} border-0 font-medium`}>{order.status}</Badge>
                                            </div>
                                            <p className="font-medium text-gray-800">{order.item}</p>
                                            <p className="text-sm text-gray-500">{order.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 mb-2">{order.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                            <Card className="border-gray-200 shadow-sm p-2">
                                <div className="flex flex-col gap-1">
                                    <button
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left transition-colors text-sm font-medium text-gray-700"
                                        onClick={() => navigate('/customer/orders')}
                                    >
                                        <Package className="w-4 h-4 text-gray-500" />
                                        Track Orders
                                    </button>
                                    <button
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left transition-colors text-sm font-medium text-gray-700"
                                        onClick={() => navigate('/customer/wallet')}
                                    >
                                        <Wallet className="w-4 h-4 text-gray-500" />
                                        Manage Wallet
                                    </button>
                                    <button
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left transition-colors text-sm font-medium text-gray-700"
                                        onClick={() => navigate('/customer/wallet')}
                                    >
                                        <Ticket className="w-4 h-4 text-gray-500" />
                                        Redeem Points
                                    </button>
                                    <button
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left transition-colors text-sm font-medium text-gray-700"
                                        onClick={() => navigate('/customer/auctions')}
                                    >
                                        <Gavel className="w-4 h-4 text-gray-500" />
                                        Active Auctions
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Curated for You */}
                    <div className="mt-12 mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-light text-gray-900">Curated for You</h2>
                                <p className="text-sm text-gray-500">Based on your collection preferences</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate('/customer/shop')}>View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {curatedProducts.map((product) => (
                                <Card key={product.id} className="group border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden cursor-pointer" onClick={() => navigate(`/guest/product/${product.id}`)}>
                                    <div className="aspect-square relative bg-gray-50 overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <Badge className="absolute top-3 left-3 bg-gray-900 text-white border-0 text-xs font-light tracking-wide rounded-full px-3">
                                            {product.badge}
                                        </Badge>
                                    </div>
                                    <div className="p-4">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.category}</div>
                                        <h3 className="font-medium text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{product.name}</h3>
                                        <p className="font-semibold text-gray-900">{product.price}</p>
                                    </div>
                                </Card>
                            ))}
                            {/* Fillers to match layout look */}
                            <div className="bg-gray-100 rounded-xl min-h-[300px] flex items-center justify-center text-gray-400 text-sm">More recommendations loading...</div>
                            <div className="bg-gray-100 rounded-xl min-h-[300px] flex items-center justify-center text-gray-400 text-sm">More recommendations loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
