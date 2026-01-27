import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';

export const inventoryService = {
    // Draft / Inbound
    createReceipt: async (data: any): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post('/inventory/receipts', data);
        return response.data;
    },

    // Future: Get receipts, details, etc.
};
