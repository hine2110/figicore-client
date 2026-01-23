import CustomerLayout from '@/layouts/CustomerLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Gavel,
    TrendingUp,
    Trophy,
    Clock
} from 'lucide-react';

export default function CustomerAuctions() {
    const auctions = [
        {
            id: '1',
            name: 'Molly 2020 Series - Rare Edition',
            currentBid: '$850.00',
            yourBid: '$800.00',
            bids: 42,
            timeLeft: '2h 34m',
            image: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&h=400&fit=crop',
            status: 'Outbid',
            statusColor: 'bg-red-100 text-red-700'
        },
        {
            id: '2',
            name: 'Signed Limited Edition Set',
            currentBid: '$1200.00',
            yourBid: '$1200.00',
            bids: 67,
            timeLeft: '1d 3h',
            image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop',
            status: 'Leading Bid',
            statusColor: 'bg-green-100 text-green-700'
        }
    ];

    return (
        <CustomerLayout activePage="auction">
            <div className="bg-gray-50 min-h-screen pb-20">
                <div className="bg-white border-b border-gray-200 pt-10 pb-16">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-light text-gray-900 mb-2">Auction Participation</h1>
                        <p className="text-gray-500">Bid on exclusive collectibles</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-8">

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-6 border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Gavel className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active Bids</p>
                                <p className="text-2xl font-semibold text-gray-900">2</p>
                            </div>
                        </Card>
                        <Card className="p-6 border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Leading</p>
                                <p className="text-2xl font-semibold text-gray-900">1</p>
                            </div>
                        </Card>
                        <Card className="p-6 border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Trophy className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Won Auctions</p>
                                <p className="text-2xl font-semibold text-gray-900">3</p>
                            </div>
                        </Card>
                    </div>

                    {/* Auction Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {auctions.map((item) => (
                            <Card key={item.id} className="overflow-hidden border-gray-200 shadow-sm bg-white">
                                <div className="p-6 pb-0 flex justify-between items-start mb-4">
                                    <div>
                                        <Badge className={`mb-2 border-0 ${item.statusColor}`}>{item.status}</Badge>
                                        <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono">AUC-#{item.id}007</p>
                                    </div>
                                    <Badge variant="outline" className="border-gray-200">{item.status}</Badge>
                                </div>

                                <div className="aspect-video bg-gray-50 mx-6 rounded-lg overflow-hidden relative">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>

                                <div className="p-6 grid grid-cols-2 gap-6 pb-2">
                                    <div>
                                        <p className="text-xs uppercase text-gray-500 mb-1">Current Bid</p>
                                        <p className="text-xl font-bold text-gray-900">{item.currentBid}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-gray-500 mb-1">Your Bid</p>
                                        <p className="text-xl font-medium text-gray-500">{item.yourBid}</p>
                                    </div>
                                </div>

                                <div className="px-6 flex justify-between items-center text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-1">
                                        <Gavel className="w-4 h-4" /> {item.bids} bids
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {item.timeLeft}
                                    </div>
                                </div>

                                <div className="px-6 pb-6 pt-0">
                                    <div className="flex gap-3">
                                        <Input placeholder="Enter bid amount" className="bg-gray-50 border-gray-200" />
                                        <Button className="bg-gray-900 text-white hover:bg-gray-800">Place Bid</Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
