import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, Phone, Mail, MapPin, Calendar, User,
    Crown, Sparkles, Trophy, Gift, ChevronLeft, CreditCard, Wallet
} from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';
import { format } from 'date-fns';
import CustomerProfileContent from './CustomerProfileContent';
import { cn } from '@/lib/utils';

export default function CustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCustomerHistory();
        }
    }, [id]);

    const fetchCustomerHistory = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/pos/orders/customer/${id}`);
            setProfileData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customer history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-neutral-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-neutral-300" />
                    <p className="text-neutral-400 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-neutral-50/50 gap-6">
                <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center shadow-inner">
                    <User className="w-10 h-10 text-neutral-300" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Customer Not Found</h3>
                    <p className="text-neutral-500 max-w-xs mx-auto">The customer profile you requested could not be located.</p>
                </div>
                <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl border-neutral-300 hover:bg-neutral-100">
                    Go Back
                </Button>
            </div>
        );
    }

    const customer = profileData.customer;

    return (
        <div className="flex h-screen bg-neutral-100/50 overflow-hidden animate-in fade-in duration-500">
            {/* LEFT SIDEBAR - Fixed 340px */}
            <div className="w-[340px] border-r border-neutral-200 bg-white flex flex-col overflow-hidden shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {/* 1. Header / Back Button */}
                <div className="p-4 pt-6">
                    <Button
                        variant="ghost"
                        className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 -ml-2 gap-2 rounded-xl transition-all"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="font-medium">Back to List</span>
                    </Button>
                </div>

                {/* 2. Identity Section */}
                <div className="px-6 flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-3 group">
                        {/* Enhanced Avatar Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                        <div className="w-20 h-20 bg-gradient-to-br from-white to-neutral-100 rounded-full flex items-center justify-center text-3xl font-bold text-neutral-700 shadow-lg border-4 border-white relative z-10">
                            {customer.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute 1bottom-1 right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-white shadow-sm z-20" title="Active Customer"></div>
                    </div>

                    <h1 className="text-xl font-bold text-neutral-900 mb-1 tracking-tight">{customer.full_name}</h1>

                    <div className="mb-4">
                        {(() => {
                            const totalSpentValue = Number(profileData?.statistics?.total_spent || customer.total_spent || 0);
                            let effectiveRankCode = 'BRONZE';
                            if (totalSpentValue >= 50000000) effectiveRankCode = 'DIAMOND';
                            else if (totalSpentValue >= 10000000) effectiveRankCode = 'GOLD';
                            else if (totalSpentValue >= 2000000) effectiveRankCode = 'SILVER';

                            const getRankLabel = (code: string) => {
                                const map: Record<string, string> = { BRONZE: 'Bronze Member', SILVER: 'Silver Member', GOLD: 'Gold Member', DIAMOND: 'Diamond Member' };
                                return map[code] || code;
                            };
                            return (
                                <Badge variant="secondary" className={cn(
                                    "border px-3 py-1 text-xs font-bold tracking-wide shadow-sm uppercase",
                                    effectiveRankCode === 'GOLD' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                        effectiveRankCode === 'DIAMOND' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                                            effectiveRankCode === 'SILVER' ? 'bg-slate-100 text-slate-800 border-slate-200' :
                                                'bg-orange-100 text-orange-800 border-orange-200'
                                )}>
                                    {getRankLabel(effectiveRankCode)}
                                </Badge>
                            );
                        })()}
                    </div>

                    {/* Rank Progress Card */}
                    <div className="w-full text-left mb-6 perspective-1000">
                        {(() => {
                            const totalSpent = Number(profileData?.statistics?.total_spent || customer.total_spent || 0);
                            let nextRankLabel = '';
                            let nextRankThreshold = 0;
                            let currentRankThreshold = 0;
                            let progress = 100;
                            let targetColorClass = 'from-gray-300 to-gray-500';
                            let targetIcon = Trophy;

                            if (totalSpent < 2000000) {
                                nextRankLabel = 'Silver Member';
                                nextRankThreshold = 2000000;
                                currentRankThreshold = 0;
                                targetColorClass = 'from-slate-300 to-slate-500';
                                targetIcon = Sparkles;
                            } else if (totalSpent < 10000000) {
                                nextRankLabel = 'Gold Member';
                                nextRankThreshold = 10000000;
                                currentRankThreshold = 2000000;
                                targetColorClass = 'from-yellow-400 to-yellow-600';
                                targetIcon = Crown;
                            } else if (totalSpent < 50000000) {
                                nextRankLabel = 'Diamond Member';
                                nextRankThreshold = 50000000;
                                currentRankThreshold = 10000000;
                                targetColorClass = 'from-cyan-400 to-cyan-600';
                                targetIcon = Trophy;
                            } else {
                                nextRankLabel = 'MAX LEVEL';
                            }

                            if (nextRankLabel !== 'MAX LEVEL') {
                                const range = nextRankThreshold - currentRankThreshold;
                                const currentInTier = totalSpent - currentRankThreshold;
                                progress = Math.min(Math.max((currentInTier / range) * 100, 0), 100);
                            }

                            const TargetIcon = targetIcon;

                            return (
                                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-4 shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                                    {/* Decorative Elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full -ml-10 -mb-10 blur-xl"></div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Lifetime Value</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-bold text-2xl font-mono tracking-tight">
                                                        {totalSpent.toLocaleString('vi-VN')}
                                                    </span>
                                                    <span className="text-xs text-neutral-400 font-medium">₫</span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                                <TargetIcon className="w-5 h-5 text-yellow-400" />
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                                            <div
                                                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${targetColorClass} shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] font-medium text-neutral-400">
                                            {nextRankLabel !== 'MAX LEVEL' ? (
                                                <>
                                                    <span>Current Tier</span>
                                                    <span className="text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-semibold">
                                                        {nextRankLabel} in {(nextRankThreshold - totalSpent).toLocaleString('vi-VN')}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-cyan-400 font-bold w-full text-center">Legendary Status Achieved</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* 3. Contact Info */}
                <div className="px-6 pb-4 space-y-3">
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1">Contact Details</h3>
                    <div className="space-y-3">
                        <ContactItem icon={Phone} label="Phone" value={customer.phone} />
                        <ContactItem icon={Mail} label="Email" value={customer.email} />
                        <ContactItem icon={MapPin} label="Address" value={customer.address} />
                        <ContactItem icon={Calendar} label="Member Since" value={customer.created_at ? format(new Date(customer.created_at), 'MMM yyyy') : 'N/A'} />
                    </div>
                </div>

                <div className="mt-auto p-3 border-t border-neutral-100 bg-neutral-100/30 space-y-2">
                    {/* Loyalty Points Card - Soft Premium Amber */}
                    <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-4 shadow-lg text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-[9px] font-bold text-amber-100 uppercase tracking-widest mb-0.5">Loyalty Points</p>
                                    <h3 className="text-xl font-bold font-mono tracking-tight">
                                        {Number(customer?.loyalty_points || 0).toLocaleString('vi-VN')}
                                    </h3>
                                </div>
                                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                    <Gift className="w-4 h-4 text-amber-100" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-amber-100 font-medium">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Redeemable rewards</span>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Balance Card - Soft Premium Indigo */}
                    <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-2xl p-4 shadow-lg text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-cyan-400/20 rounded-full -ml-8 -mb-8 blur-xl"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest mb-0.5">Wallet Balance</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-bold text-xl font-mono tracking-tight">
                                            {Number(customer?.wallet_balance || 0).toLocaleString('vi-VN')}
                                        </span>
                                        <span className="text-[10px] text-indigo-200 font-medium">₫</span>
                                    </div>
                                </div>
                                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                    <Wallet className="w-4 h-4 text-indigo-100" />
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[9px] text-indigo-200 font-medium">
                                <CreditCard className="w-2.5 h-2.5" />
                                <span>Available for checkout</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <CustomerProfileContent customer={customer} profileData={profileData} />
        </div>
    );
}

function ContactItem({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-start gap-4 group px-1">
            <div className="p-2 bg-neutral-100 rounded-lg text-neutral-500 group-hover:bg-white group-hover:shadow-sm group-hover:text-indigo-600 transition-all duration-300">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-neutral-400 uppercase mb-0.5">{label}</p>
                <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-indigo-900 transition-colors">
                    {value || <span className="text-neutral-400 italic">Not provided</span>}
                </p>
            </div>
        </div>
    );
}
