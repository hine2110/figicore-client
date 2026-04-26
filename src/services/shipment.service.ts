import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import api from "./api";
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

    uploadVideo: async (file: File, onProgress?: (pct: number) => void) => {
        // 1. Get Signature from Backend
        const { data: signData } = await axiosInstance.get('/upload/signature?folder=figicore_shipments');
        const { signature, timestamp, cloudName, apiKey, folder } = signData;

        // 2. Detect resource type (image or video)
        const resourceType = file.type.startsWith('video') ? 'video' : 'image';

        // 3. Create FormData for DIRECT upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        // 4. Direct POST to Cloudinary with correct endpoint
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            formData,
            {
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        onProgress(pct);
                    }
                },
                timeout: 600000 // 10 minutes
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
