import { Plus, BarChart3, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CAMPAIGNS = [
    { id: 1, name: 'Lunar New Year Special', status: 'Active', reach: '12.5k', conversion: '3.2%', start: 'Jan 15', end: 'Feb 15' },
    { id: 2, name: 'Mega Sale 2026', status: 'Scheduled', reach: '-', conversion: '-', start: 'Mar 01', end: 'Mar 05' },
    { id: 3, name: 'Figures Clearance', status: 'Ended', reach: '8.2k', conversion: '1.8%', start: 'Jan 01', end: 'Jan 10' },
];

export default function MarketingCampaigns() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Marketing Campaigns</h1>
                    <p className="text-neutral-500">Manage promotions and analyze performance.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" /> New Campaign
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CAMPAIGNS.map(campaign => (
                    <Card key={campaign.id} className="p-6 border-neutral-200 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <Badge className={`
                                ${campaign.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                    campaign.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                        'bg-neutral-100 text-neutral-700 hover:bg-neutral-100'} border-0
                            `}>
                                {campaign.status}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                        </div>

                        <h3 className="text-lg font-bold text-neutral-900 mb-2">{campaign.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
                            <Calendar className="w-4 h-4" />
                            {campaign.start} - {campaign.end}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                            <div>
                                <div className="text-xs text-neutral-500 mb-1">Reach</div>
                                <div className="font-semibold text-neutral-900">{campaign.reach}</div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 mb-1">Conversion</div>
                                <div className="font-semibold text-neutral-900">{campaign.conversion}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-8 border-neutral-200 flex flex-col items-center justify-center text-center min-h-[300px]">
                <BarChart3 className="w-16 h-16 text-neutral-200 mb-4" />
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Campaign Analytics</h3>
                <p className="text-neutral-500 max-w-sm mb-6">Select a campaign to view detailed performance metrics, click activity, and ROI breakdowns.</p>
                <Button variant="outline">View All Reports</Button>
            </Card>
        </div>
    );
}
