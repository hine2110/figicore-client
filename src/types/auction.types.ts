export interface AuctionDTO {
    id: string;
    productId: string;
    productName: string;
    startTime: string;
    endTime: string;
    startingPrice: number;
    currentBid: number;
    bidCount: number;
    status: 'scheduled' | 'active' | 'ended' | 'cancelled';
    winnerId?: string;
    imageUrl: string;
}

export interface PlaceBidPayload {
    auctionId: string;
    amount: number;
}
