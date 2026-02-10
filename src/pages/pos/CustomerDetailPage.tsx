import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Loader2, Wallet, Phone, Mail, MapPin, Calendar, User,
    Crown, Sparkles, Trophy
} from 'lucide-react';
import { axiosInstance } from '@/lib/axiosInstance';
import { format } from 'date-fns';
import CustomerProfileContent from './CustomerProfileContent';

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
            <div className="flex items-center justify-center h-screen bg-neutral-50">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-neutral-50 gap-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500 font-medium">Customer not found</p>
                <Button onClick={() => navigate(-1)} variant="outline">Back to Lookup</Button>
            </div>
        );
    }

    const customer = profileData.customer;

    return (
        <div className="flex h-full bg-neutral-100 overflow-hidden">
            {/* LEFT SIDEBAR - Fixed 320px */}
            <div className="w-80 border-r border-neutral-200 bg-white flex flex-col overflow-y-auto shrink-0 z-10 shadow-sm">
                {/* 1. Header / Back Button */}
                <div className="p-4">
                    <Button
                        variant="ghost"
                        className="text-neutral-500 hover:text-neutral-900 -ml-2 gap-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </div>

                {/* 2. Identity Section */}
                <div className="px-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center text-3xl font-bold text-neutral-700 shadow-inner border-4 border-white">
                            {customer.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white" title="Active"></div>
                    </div>
                    <h1 className="text-xl font-bold text-neutral-900 mb-1">{customer.full_name}</h1>
                    <div className="flex items-center gap-2 mb-6">
                        <Badge variant="secondary" className={`border px-3 py-0.5 ${customer.rank_code === 'GOLD' ? 'bg-yellow-200 text-yellow-900 border-yellow-500' :
                            customer.rank_code === 'DIAMOND' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                                customer.rank_code === 'SILVER' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                    'bg-orange-200 text-orange-900 border-orange-400'
                            }`}>
                            {customer.rank_code || 'MEMBER'}
                        </Badge>
                    </div>

                    {/* Quick Actions */}
                    {/* Rank Progress */}
                    {/* Rank Progress */}
                    <div className="w-full px-6 mb-8">
                        {(() => {
                            // Use statistics.total_spent if available, fallback to customer.total_spent
                            const totalSpent = Number(profileData?.statistics?.total_spent || customer.total_spent || 0);
                            let nextRankLabel = '';
                            let nextRankThreshold = 0;
                            let currentRankThreshold = 0;
                            let progress = 100;
                            let targetColorClass = 'from-gray-300 to-gray-500';
                            let targetIcon = Trophy;
                            let motivationalText = "Keep collecting to level up!";

                            if (totalSpent < 2000000) {
                                nextRankLabel = 'SILVER';
                                nextRankThreshold = 2000000;
                                currentRankThreshold = 0;
                                targetColorClass = 'from-slate-300 to-slate-500'; // Silver
                                targetIcon = Sparkles;
                                motivationalText = "Unlock 2% discount & gifts!";
                            } else if (totalSpent < 10000000) {
                                nextRankLabel = 'GOLD';
                                nextRankThreshold = 10000000;
                                currentRankThreshold = 2000000;
                                targetColorClass = 'from-yellow-400 to-yellow-600'; // Gold
                                targetIcon = Crown;
                                motivationalText = "Unlock 5% off & free shipping!";
                            } else if (totalSpent < 50000000) {
                                nextRankLabel = 'DIAMOND';
                                nextRankThreshold = 50000000;
                                currentRankThreshold = 10000000;
                                targetColorClass = 'from-cyan-400 to-cyan-600'; // Diamond
                                targetIcon = Trophy;
                                motivationalText = "Unlock VIP perks & 10% off!";
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
                                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 shadow-sm relative overflow-hidden group hover:border-neutral-200 transition-colors">
                                    {/* Decorative Icon Background */}
                                    <div className="absolute -top-2 -right-2 text-neutral-100 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                        <TargetIcon className="w-16 h-16" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Membership Progress</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-bold text-neutral-900 text-lg font-mono">
                                                        {totalSpent.toLocaleString('vi-VN')}
                                                    </span>
                                                    <span className="text-xs text-neutral-500">VND</span>
                                                </div>
                                            </div>
                                            {nextRankLabel !== 'MAX LEVEL' && (
                                                <div className="text-right">
                                                    <p className="text-[10px] text-neutral-400">Target: {nextRankLabel}</p>
                                                    <div className={`p-1.5 rounded-full bg-white shadow-sm border border-neutral-100 inline-flex`}>
                                                        <TargetIcon className={`w-3.5 h-3.5 ${nextRankLabel === 'GOLD' ? 'text-yellow-600' :
                                                            nextRankLabel === 'DIAMOND' ? 'text-cyan-600' :
                                                                'text-slate-600'
                                                            }`} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Custom Gradient Progress Bar */}
                                        <div className="h-2.5 w-full bg-neutral-200 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${targetColorClass} shadow-sm transition-all duration-1000 ease-out`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-end items-center mt-2">
                                            {nextRankLabel !== 'MAX LEVEL' ? (
                                                <p className="text-[10px] font-semibold text-neutral-700 bg-white px-1.5 py-0.5 rounded border border-neutral-200 shadow-sm">
                                                    +{(nextRankThreshold - totalSpent).toLocaleString('vi-VN')}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-cyan-600 font-bold w-full text-center">
                                                    You are a Legend! 🏆
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* 3. Contact Info */}
                <div className="px-6 pb-6 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <Phone className="w-4 h-4 text-neutral-400" />
                        <span>{customer.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <Mail className="w-4 h-4 text-neutral-400" />
                        <span className="truncate">{customer.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span className="truncate">{customer.address || 'No address provided'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span>Joined {customer.created_at ? format(new Date(customer.created_at), 'MMM yyyy') : 'N/A'}</span>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-neutral-100 bg-neutral-50">
                    <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-neutral-500" />
                            <span className="text-xs font-semibold text-neutral-500 uppercase">Wallet Balance</span>
                        </div>
                        <div className="text-xl font-bold text-neutral-900">0₫</div>
                        <p className="text-[10px] text-neutral-400 mt-1">Last updated just now</p>
                    </div>
                </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <CustomerProfileContent customer={customer} profileData={profileData} />
        </div>
    );
}
