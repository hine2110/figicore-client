import { Clock, PlayCircle, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AUCTIONS = [
    { id: 1, item: 'Mega Space Molly 1000%', currentBid: '$1,200', bidders: 14, timeLeft: '2h 15m', status: 'Live' },
    { id: 2, item: 'Rare Labubu Zimomo', currentBid: '$450', bidders: 8, timeLeft: '0h 45m', status: 'Live' },
    { id: 3, item: 'Dimoo World Special', currentBid: '$890', bidders: 22, timeLeft: 'Ended', status: 'Ended' },
];

export default function AuctionManagement() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Auction Management</h1>
                    <p className="text-neutral-500">Monitor live auctions and bid activity.</p>
                </div>
                <Button className="bg-neutral-900">
                    <PlayCircle className="w-4 h-4 mr-2" /> Start New Auction
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AUCTIONS.map(auction => (
                    <Card key={auction.id} className="p-6 border-neutral-200">
                        <div className="flex justify-between items-start mb-4">
                            <Badge className={`${auction.status === 'Live' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-neutral-100 text-neutral-600'} border-0`}>
                                {auction.status === 'Live' ? '● LIVE' : 'ENDED'}
                            </Badge>
                            <span className="text-sm font-mono text-neutral-500">ID: #{auction.id}</span>
                        </div>

                        <h3 className="text-lg font-bold text-neutral-900 mb-2">{auction.item}</h3>

                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-neutral-100 mb-4">
                            <div>
                                <div className="text-xs text-neutral-500">Current Bid</div>
                                <div className="text-xl font-bold text-blue-600">{auction.currentBid}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-neutral-500 flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> Time Left</div>
                                <div className="text-xl font-bold text-neutral-900">{auction.timeLeft}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                                <span className="bg-neutral-100 rounded-full px-2 py-1 text-xs font-semibold text-neutral-600 z-10">{auction.bidders} Bidders</span>
                            </div>
                            {auction.status === 'Live' && (
                                <Button variant="destructive" size="sm">
                                    <StopCircle className="w-4 h-4 mr-2" /> End Now
                                </Button>
                            )}
                            {auction.status === 'Ended' && (
                                <Button variant="outline" size="sm">View Report</Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
