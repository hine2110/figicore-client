import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import { GHN_TOKEN } from "./api";

export const shipmentService = {
    getProcessingOrders: async () => {
        const response = await axiosInstance.get('/orders?status=PROCESSING');
        return response.data;
    },

    uploadVideo: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data; // { url, type, public_id }
    },

    createShipment: async (orderId: number, videoUrl?: string) => {
        const response = await axiosInstance.post(`/shipments/create/${orderId}`, { videoUrl });
        return response.data;
    },

    getGHNPrintToken: async (orderCode: string) => {
        // Direct call to GHN API for Token Generation
        const response = await axios.post(
            'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/a5/gen-token',
            { order_codes: [orderCode] },
            { headers: { Token: GHN_TOKEN } }
        );
        return response.data.data.token;
    }
};
