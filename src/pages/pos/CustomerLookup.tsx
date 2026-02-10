import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, UserPlus, Zap, History, Phone, Mail, Loader2, CreditCard, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { searchCustomer } from '@/services/posService';
import RegisterCustomerModal from './RegisterCustomerModal';
import { cn } from '@/lib/utils';

import { PaginationControls } from '@/components/ui/pagination-controls';

export default function CustomerLookup() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 15;

    // Initial fetch for recent customers
    useEffect(() => {
        handleSearch('', 1);
    }, []);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Watch for search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    // Handle search and pagination
    useEffect(() => {
        handleSearch(debouncedSearchTerm, currentPage);
    }, [debouncedSearchTerm, currentPage]);

    const handleSearch = async (term: string, page: number) => {
        try {
            setLoading(true);
            const response = await searchCustomer(term, page, itemsPerPage);
            if (response.success) {
                setCustomers(response.data);
                setTotalItems(response.total || response.count);
                setTotalPages(Math.ceil((response.total || response.count) / itemsPerPage));
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rankCode: string) => {
        switch (rankCode) {
            case 'GOLD': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
            case 'SILVER': return 'text-slate-700 bg-slate-100 border-slate-200';
            case 'DIAMOND': return 'text-cyan-800 bg-cyan-100 border-cyan-200';
            default: return 'text-orange-800 bg-orange-100 border-orange-200';
        }
    };

    return (
        <div className="h-full bg-neutral-50/50 p-6 flex flex-col overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Customer Lookup</h1>
                    <p className="text-neutral-500 mt-1 font-medium">Search profiles, purchase history, and membership tiers</p>
                </div>
                <Button
                    onClick={() => setRegisterModalOpen(true)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/20 rounded-xl px-4 h-11"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Customer
                </Button>
            </div>

            {/* Search Section */}
            <div className="relative mb-8 max-w-2xl mx-auto w-full shrink-0 z-10">
                <div className="relative group perspective-1000">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search by name, phone number, or email..."
                        className="pl-12 h-14 bg-white/80 backdrop-blur-xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-lg rounded-2xl placeholder:text-neutral-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {!searchTerm && customers.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <History className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Recent Customers</h2>
                        </div>
                    )}

                    {customers.length === 0 && !loading ? (
                        <div className="text-center py-20 bg-white/50 rounded-[2rem] border border-neutral-100 border-dashed backdrop-blur-sm">
                            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <User className="w-10 h-10 text-neutral-300" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">No customers found</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto mb-6">We couldn't find any profiles matching your search. Try a different keyword or create a new profile.</p>
                            <Button
                                variant="outline"
                                className="rounded-xl border-neutral-200 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
                                onClick={() => setRegisterModalOpen(true)}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Register New Customer
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
                            {customers.map((customer) => (
                                <Card
                                    key={customer.user_id}
                                    className="group hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer border-neutral-200 overflow-hidden rounded-[1.25rem] bg-white relative"
                                    onClick={() => navigate(`/pos/customer/${customer.user_id}`)}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>

                                    <div className="p-5 flex items-start gap-4 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center text-2xl font-bold text-neutral-700 border border-white shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {customer.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-lg text-neutral-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">
                                                    {customer.full_name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                {customer.customers?.current_rank_code ? (
                                                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0 uppercase tracking-wide border", getRankColor(customer.customers.current_rank_code))}>
                                                        {customer.customers.current_rank_code}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 uppercase tracking-wide border text-neutral-500 bg-neutral-50">
                                                        Member
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-sm text-neutral-500 group-hover:text-neutral-700 transition-colors">
                                                    <Phone className="w-3.5 h-3.5 mr-2 shrink-0 text-neutral-400" />
                                                    <span className="truncate font-mono">{customer.phone}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center text-sm text-neutral-500 group-hover:text-neutral-700 transition-colors">
                                                        <Mail className="w-3.5 h-3.5 mr-2 shrink-0 text-neutral-400" />
                                                        <span className="truncate">{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between group-hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center text-xs text-neutral-500 font-medium" title="Total Orders">
                                                <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                                                {customer.total_orders || 0}
                                            </div>
                                            <div className="flex items-center text-xs text-neutral-500 font-medium" title="Lifetime Value">
                                                <CreditCard className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                                                {Number(customer.total_spent || 0).toLocaleString('vi-VN')}₫
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {customers.length > 0 && (
                        <div className="pb-8">
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            <RegisterCustomerModal
                open={registerModalOpen}
                onClose={() => setRegisterModalOpen(false)}
                onSuccess={(newCustomer) => {
                    handleSearch(newCustomer.phone, 1); // Auto search for new customer
                    setRegisterModalOpen(false);
                }}
            />
        </div>
    );
}
