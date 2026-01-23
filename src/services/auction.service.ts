import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse, PaginatedResponse } from '@/types/common.types';
import { AuctionDTO, PlaceBidPayload } from '@/types/auction.types';

const BASE = '/auctions';

export const auctionService = {
    getActiveAuctions: async (): Promise<PaginatedResponse<AuctionDTO>> => {
        const response = await axiosInstance.get(`${BASE}/active`);
        return response.data;
    },

    getAuctionById: async (id: string): Promise<ApiResponse<AuctionDTO>> => {
        const response = await axiosInstance.get(`${BASE}/${id}`);
        return response.data;
    },

    placeBid: async (payload: PlaceBidPayload): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post(`${BASE}/${payload.auctionId}/bid`, payload);
        return response.data;
    }
};
