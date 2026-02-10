import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, UserPlus, Zap, History, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { axiosInstance } from '@/lib/axiosInstance';
import RegisterCustomerModal from './RegisterCustomerModal';

export default function CustomerLookup() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);

    // Initial fetch for recent customers
    useEffect(() => {
        handleSearch('');
    }, []);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Watch for search term changes
    useEffect(() => {
        handleSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    const handleSearch = async (term: string) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/pos/orders/search-customer', {
                params: { q: term }
            });
            if (response.data.success) {
                setCustomers(response.data.data);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rankCode: string) => {
        switch (rankCode) {
            case 'GOLD': return 'text-yellow-900 bg-yellow-200 border-yellow-500';
            case 'SILVER': return 'text-slate-600 bg-slate-50 border-slate-200';
            case 'DIAMOND': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
            default: return 'text-orange-900 bg-orange-200 border-orange-400';
        }
    };

    return (
        <div className="h-full bg-neutral-50 p-6 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Customer Lookup</h1>
                    <p className="text-neutral-500 mt-1">Search profiles, purchase history, and membership tiers</p>
                </div>
                <Button
                    onClick={() => setRegisterModalOpen(true)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/10"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Customer
                </Button>
            </div>

            {/* Search Section */}
            <div className="relative mb-8 max-w-2xl mx-auto w-full shrink-0">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search by name, phone number, or email..."
                        className="pl-11 h-12 bg-white border-neutral-200 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {!searchTerm && customers.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <History className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Recent Customers</h2>
                        </div>
                    )}

                    {customers.length === 0 && !loading ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-10 h-10 text-neutral-300" />
                            </div>
                            <h3 className="text-lg font-medium text-neutral-900">No customers found</h3>
                            <p className="text-neutral-500 mt-1">Try searching with a different keyword or add a new customer</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setRegisterModalOpen(true)}
                            >
                                Register New Customer
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                            {customers.map((customer) => (
                                <Card
                                    key={customer.user_id}
                                    className="group hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer border-neutral-200 overflow-hidden"
                                    onClick={() => navigate(`/pos/customer/${customer.user_id}`)}
                                >
                                    <div className="p-5 flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-xl font-bold text-indigo-600 border border-indigo-100 shrink-0 group-hover:scale-105 transition-transform">
                                            {customer.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-neutral-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">
                                                    {customer.full_name}
                                                </h3>
                                                {customer.customers?.current_rank_code && (
                                                    <Badge variant="outline" className={`text-[10px] uppercase ${getRankColor(customer.customers.current_rank_code)}`}>
                                                        {customer.customers.current_rank_code}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center text-sm text-neutral-500">
                                                    <Phone className="w-3.5 h-3.5 mr-2 shrink-0" />
                                                    <span className="truncate">{customer.phone}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center text-sm text-neutral-500">
                                                        <Mail className="w-3.5 h-3.5 mr-2 shrink-0" />
                                                        <span className="truncate">{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-100 flex items-center justify-between group-hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex items-center text-xs text-neutral-500 font-medium">
                                            <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                                            {customer.total_orders || 0} Orders
                                        </div>
                                        <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center">
                                            View Details
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <RegisterCustomerModal
                open={registerModalOpen}
                onClose={() => setRegisterModalOpen(false)}
                onSuccess={(newCustomer) => {
                    handleSearch(newCustomer.phone); // Auto search for new customer
                    setRegisterModalOpen(false);
                }}
            />
        </div>
    );
}
