
import { User } from '@/types/auth.types';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, ArrowUpCircle, Crown } from 'lucide-react';

interface RankConfig {
    code: string;
    label: string;
    threshold: number;
    color: string;
    icon: React.ElementType;
    benefits: string[];
}

const RANKS: RankConfig[] = [
    {
        code: 'BRONZE',
        label: 'Newbie Collector',
        threshold: 0,
        color: 'text-orange-700 bg-orange-100',
        icon: Trophy,
        benefits: ['Standard Access']
    },
    {
        code: 'SILVER',
        label: 'Active Collector',
        threshold: 100,
        color: 'text-gray-700 bg-gray-100',
        icon: ArrowUpCircle,
        benefits: ['2% Discount', 'Birthday Gift']
    },
    {
        code: 'GOLD',
        label: 'Elite Collector',
        threshold: 500,
        color: 'text-yellow-700 bg-yellow-100',
        icon: Crown,
        benefits: ['5% Discount', 'Pre-order Priority', 'Free Shipping > 1M']
    },
    {
        code: 'DIAMOND',
        label: 'Legendary Collector',
        threshold: 2000,
        color: 'text-cyan-700 bg-cyan-100',
        icon: Gift,
        benefits: ['10% Discount', 'Private Assistant', 'Free Shipping All', 'Exclusive Events']
    }
];

interface MembershipCardProps {
    user: User | null;
}

export default function MembershipCard({ user }: MembershipCardProps) {
    const currentPoints = Number(user?.customers?.loyalty_points || 0);
    const currentRankCode = user?.customers?.current_rank_code || 'BRONZE';

    // Find current rank index based on code, fallback to 0
    const currentRankIndex = RANKS.findIndex(r => r.code === currentRankCode);
    const safeRankIndex = currentRankIndex === -1 ? 0 : currentRankIndex;

    const nextRankIndex = safeRankIndex + 1 < RANKS.length ? safeRankIndex + 1 : -1;
    const nextRank = nextRankIndex !== -1 ? RANKS[nextRankIndex] : null;

    // Calculate progress
    let progress = 0;
    let remaining = 0;

    if (nextRank) {
        remaining = nextRank.threshold - currentPoints;
        const prevThreshold = RANKS[safeRankIndex].threshold;
        const range = nextRank.threshold - prevThreshold;
        const currentInTier = currentPoints - prevThreshold;
        progress = Math.min(Math.max((currentInTier / range) * 100, 0), 100);
    } else {
        progress = 100; // Max rank reached
    }

    return (
        <Card className="border-neutral-200 shadow-sm mb-8 overflow-hidden">
            <CardHeader className="bg-neutral-50 pb-4 border-b border-neutral-100">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                            Membership Status
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Track your journey to become a Figicore Legend.
                        </CardDescription>
                    </div>
                    {nextRank ? (
                        <div className="text-right">
                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Next Tier</p>
                            <span className={`font-bold text-sm ${nextRank.color?.split(' ')[0]}`}>
                                {nextRank.label}
                            </span>
                        </div>
                    ) : (
                        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0">MAX LEVEL</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Progress Section */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-neutral-900">My Points: {currentPoints} pts</span>
                        {nextRank && (
                            <span className="text-neutral-500">Goal: {nextRank.threshold} pts</span>
                        )}
                    </div>
                    <Progress value={progress} className="h-3" />
                    {nextRank && (
                        <p className="text-sm text-neutral-500 mt-2 text-center">
                            Earn <span className="font-bold text-neutral-900">{remaining} pts</span> more to unlock <span className="font-medium text-neutral-900">{nextRank.label}</span> perks!
                        </p>
                    )}
                </div>

                {/* Benefits Table */}
                <div className="rounded-lg border border-neutral-200 overflow-hidden text-sm">
                    <div className="grid grid-cols-12 bg-neutral-100 p-3 font-medium text-neutral-700 border-b border-neutral-200">
                        <div className="col-span-4">Rank Tier</div>
                        <div className="col-span-3 text-right">Requirement</div>
                        <div className="col-span-5 pl-4">Benefits</div>
                    </div>
                    {RANKS.map((rank, idx) => (
                        <div key={rank.code} className={`grid grid-cols-12 p-3 border-b last:border-0 border-neutral-100 items-center ${rank.code === currentRankCode ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}`}>
                            <div className="col-span-4 flex items-center gap-2">
                                <rank.icon className={`w-4 h-4 ${rank.color.split(' ')[0]}`} />
                                <span className={rank.code === currentRankCode ? 'font-bold text-blue-900' : 'text-neutral-700'}>
                                    {rank.label}
                                </span>
                                {rank.code === currentRankCode && <Badge className="ml-1 h-5 text-[10px] px-1 bg-blue-600">YOU</Badge>}
                            </div>
                            <div className="col-span-3 text-right text-neutral-600 font-mono text-xs">
                                {rank.threshold} pts
                            </div>
                            <div className="col-span-5 pl-4 text-neutral-600 text-xs">
                                <ul className="list-disc list-inside">
                                    {rank.benefits.map((b, i) => <li key={i}>{b}</li>)}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
