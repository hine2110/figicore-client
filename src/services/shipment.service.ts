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

        const chunkSize = 10 * 1024 * 1024; // 10MB Chunks
        const totalSize = file.size;
        const uniqueId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        let lastResponse: any;

        // 2. Upload in chunks
        for (let start = 0; start < totalSize; start += chunkSize) {
            const end = Math.min(start + chunkSize, totalSize);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('file', chunk);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('folder', folder);

            const contentRange = `bytes ${start}-${end - 1}/${totalSize}`;

            try {
                lastResponse = await axios.post(
                    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                    formData,
                    {
                        headers: {
                            'X-Unique-Upload-Id': uniqueId,
                            'Content-Range': contentRange
                        },
                        timeout: 600000 // 10 mins per chunk
                    }
                );
                console.log(`[Upload] Chunk ${start}-${end} uploaded successfully.`);
            } catch (error: any) {
                console.error(`[Upload] Chunk ${start}-${end} failed:`, error.response?.data || error.message);
                throw new Error(error.response?.data?.error?.message || "Chunked upload failed");
            }
        }

        return {
            url: lastResponse.data.secure_url,
            type: lastResponse.data.resource_type.toUpperCase(),
            public_id: lastResponse.data.public_id
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
