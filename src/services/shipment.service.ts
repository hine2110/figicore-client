import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import { GHN_TOKEN } from "./api";

export const shipmentService = {
    getProcessingOrders: async () => {
        const response = await axiosInstance.get('/orders?status=PROCESSING');
        return response.data;
    },
    getPackingHistory: async (startDate?: string, endDate?: string) => {
        let url = '/orders?status=PACKED';
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        const response = await axiosInstance.get(url);
        return response.data;
    },
    getWarehouseStats: async (startDate: string, endDate: string) => {
        const response = await axiosInstance.get(`/orders/warehouse-stats?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    uploadVideo: async (file: File) => {
        // 1. Get Signature from Backend
        const { data: signData } = await axiosInstance.get('/upload/signature?folder=figicore_shipments');
        const { signature, timestamp, cloudName, apiKey, folder } = signData;

        // 2. Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 600000 // 10 minutes for direct video upload
            }
        );

        return {
            url: response.data.secure_url,
            type: response.data.resource_type.toUpperCase(),
            public_id: response.data.public_id
        };
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
