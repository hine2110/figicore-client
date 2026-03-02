import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { auctionsService } from "@/services/auctions.service";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RefreshCcw, PlusCircle, Trash2 } from "lucide-react";
import { CreateAuctionModal } from "@/components/admin/CreateAuctionModal";

export default function AuctionManagement() {
    const [auctions, setAuctions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { toast } = useToast();

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const fetchAuctions = async () => {
        setIsLoading(true);
        try {
            const data = await auctionsService.getAuctions();
            setAuctions(data);
        } catch (error: any) {
            toast({
                title: "Failed to fetch auctions",
                description: error.response?.data?.message || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this auction?")) return;
        try {
            await auctionsService.remove(id); // NOTE: Requires adding remove to service
            toast({
                title: "Auction deleted",
                description: "The auction has been successfully removed.",
            });
            fetchAuctions();
        } catch (error: any) {
            toast({
                title: "Failed to delete",
                description: error.response?.data?.message || "Cannot delete active auctions.",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="outline" className="text-gray-500 border-gray-500 bg-gray-50">Draft</Badge>;
            case 'UPCOMING': return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">Upcoming</Badge>;
            case 'ACTIVE': return <Badge variant="destructive" className="animate-pulse">Active (Live)</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-green-600">Completed</Badge>;
            case 'AWAITING_PAYMENT': return <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">Awaiting Default</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">VIP Auctions</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage B2C limited-edition product auctions, set deposits, and monitor real-time bidding rooms.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchAuctions} disabled={isLoading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Room
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="font-semibold text-neutral-900">Room Info</TableHead>
                            <TableHead className="font-semibold text-neutral-900">Product</TableHead>
                            <TableHead className="font-semibold text-neutral-900 text-right">Prices & Deposit</TableHead>
                            <TableHead className="font-semibold text-neutral-900">Timeline</TableHead>
                            <TableHead className="font-semibold text-neutral-900">Status</TableHead>
                            <TableHead className="font-semibold text-neutral-900 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-neutral-500">
                                    Loading auction rooms...
                                </TableCell>
                            </TableRow>
                        ) : auctions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-neutral-500">
                                    No auctions found. Click "Create Room" to start a new event.
                                </TableCell>
                            </TableRow>
                        ) : (
                            auctions.map((auction) => (
                                <TableRow key={auction.auction_id} className="hover:bg-neutral-50/50">
                                    <TableCell>
                                        <div className="font-medium text-neutral-900">Room #{auction.auction_id}</div>
                                        <div className="text-xs text-neutral-500 flex gap-2 mt-1">
                                            <span>{auction._count.auction_participants} Joined</span>
                                            <span>•</span>
                                            <span>{auction._count.auction_bids} Bids</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                                                {/* Assuming product_variants > products > media_urls exists */}
                                                {(auction.product_variants?.products?.media_urls as any)?.[0] ? (
                                                    <img src={(auction.product_variants.products.media_urls as any)[0]} alt="Product" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">No Img</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-900 line-clamp-1 max-w-[200px]" title={auction.product_variants?.products?.name}>
                                                    {auction.product_variants?.products?.name || 'Unknown Product'}
                                                </div>
                                                <div className="text-xs text-neutral-500 font-mono mt-0.5">
                                                    SKU: {auction.product_variants?.sku}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-medium text-neutral-900">{formatPrice(Number(auction.start_price))}</div>
                                        <div className="text-xs text-neutral-500 mt-1">
                                            Step: {formatPrice(Number(auction.step_price))}
                                        </div>
                                        <div className="text-xs text-red-600 font-medium mt-0.5 bg-red-50 inline-flex px-1.5 py-0.5 rounded">
                                            Deposit: {formatPrice(Number(auction.deposit_fee))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div><span className="text-neutral-500">Start:</span> {format(new Date(auction.start_time), 'MMM dd, HH:mm')}</div>
                                            <div className="mt-1"><span className="text-neutral-500">End:</span> {format(new Date(auction.end_time), 'MMM dd, HH:mm')}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(auction.status_code)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                onClick={() => handleDelete(auction.auction_id)}
                                                disabled={auction.status_code !== 'DRAFT' && auction.status_code !== 'UPCOMING'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateAuctionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchAuctions}
            />
        </div>
    );
}
