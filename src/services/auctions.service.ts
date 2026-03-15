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

    async updateAuction(id: number, data: any) {
        const response = await axiosInstance.patch(`/auctions/${id}`, data);
        return response.data;
    }

    async forceEndAuction(id: number) {
        const response = await axiosInstance.patch(`/auctions/${id}/force-end`);
        return response.data;
    }

    async extendTime(id: number, seconds: number) {
        const response = await axiosInstance.patch(`/auctions/${id}/extend-time`, { seconds });
        return response.data;
    }

    async forfeitWinner(id: number) {
        const response = await axiosInstance.post(`/auctions/${id}/forfeit`);
        return response.data;
    }

    async kickParticipant(auctionId: number, userId: number) {
        const response = await axiosInstance.delete(`/auctions/${auctionId}/participants/${userId}`);
        return response.data;
    }

    async cancelResult(id: number) {
        const response = await axiosInstance.post(`/auctions/${id}/cancel`);
        return response.data;
    }

    async joinAuction(id: number) {
        const response = await axiosInstance.post(`/auctions/${id}/join`);
        return response.data;
    }

    async getMyStatus(id: number) {
        const response = await axiosInstance.get(`/auctions/${id}/my-status`);
        return response.data;
    }

    async checkout(id: number, shippingFee: number = 0) {
        const response = await axiosInstance.post(`/auctions/${id}/checkout`, { shipping_fee: shippingFee });
        return response.data;
    }

    async declineStandby(id: number) {
        const response = await axiosInstance.post(`/auctions/${id}/decline`);
        return response.data;
    }
}

export const auctionsService = new AuctionsService();
