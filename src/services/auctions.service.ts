import { axiosInstance } from '../lib/axiosInstance';

class AuctionsService {
    async getAuctions() {
        const response = await axiosInstance.get(`/auctions`);
        return response.data;
    }

    async createAuction(data: {
        variant_id: number;
        start_price: number;
        step_price: number;
        deposit_fee: number;
        max_participants: number;
        start_time: string;
        end_time: string;
    }) {
        const response = await axiosInstance.post(`/auctions`, data);
        return response.data;
    }

    async getAuctionById(id: number) {
        const response = await axiosInstance.get(`/auctions/${id}`);
        return response.data;
    }

    async remove(id: number) {
        const response = await axiosInstance.delete(`/auctions/${id}`);
        return response.data;
    }

    async joinAuction(id: number) {
        const response = await axiosInstance.post(`/auctions/${id}/join`);
        return response.data;
    }
}

export const auctionsService = new AuctionsService();
