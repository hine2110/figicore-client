import { axiosInstance } from '../lib/axiosInstance';

class LivestreamsService {
    async getLivestreams(status?: string) {
        const response = await axiosInstance.get(`/livestreams`, { params: { status } });
        return response.data;
    }

    async createLivestream(data: {
        title: string;
        description?: string;
        start_time?: string;
        product_ids: number[];
    }) {
        const response = await axiosInstance.post(`/livestreams`, data);
        return response.data;
    }

    async getLivestreamById(id: number) {
        const response = await axiosInstance.get(`/livestreams/${id}`);
        return response.data;
    }

    async remove(id: number) {
        const response = await axiosInstance.delete(`/livestreams/${id}`);
        return response.data;
    }

    async updateLivestream(id: number, data: any) {
        const response = await axiosInstance.patch(`/livestreams/${id}`, data);
        return response.data;
    }

    async addProducts(id: number, variantIds: number[]) {
        const response = await axiosInstance.post(`/livestreams/${id}/products`, { variantIds });
        return response.data;
    }

    async removeProduct(id: number, variantId: number) {
        const response = await axiosInstance.delete(`/livestreams/${id}/products/${variantId}`);
        return response.data;
    }

    async startSession(id: number) {
        const response = await axiosInstance.post(`/livestreams/${id}/start`);
        return response.data;
    }

    async endSession(id: number) {
        const response = await axiosInstance.post(`/livestreams/${id}/end`);
        return response.data;
    }

    async pinProduct(livestreamId: number, productId: number) {
        const response = await axiosInstance.post(`/livestreams/${livestreamId}/pin`, { productId });
        return response.data;
    }
}

export const livestreamsService = new LivestreamsService();
