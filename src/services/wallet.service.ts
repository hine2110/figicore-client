import { axiosInstance } from '@/lib/axiosInstance';
import { ApiResponse } from '@/types/common.types';
import { TransactionDTO, WalletDTO } from '@/types/wallet.types';

const BASE = '/wallet';

export const walletService = {
    getMyWallet: async (): Promise<ApiResponse<WalletDTO>> => {
        const response = await axiosInstance.get(BASE);
        return response.data;
    },

    getTransactions: async (page = 1, limit = 10): Promise<ApiResponse<TransactionDTO[]>> => {
        const response = await axiosInstance.get(`${BASE}/transactions`, {
            params: { page, limit }
        });
        return response.data;
    },

    topUp: async (amount: number, method: string): Promise<ApiResponse<any>> => {
        const response = await axiosInstance.post(`${BASE}/top-up`, { amount, method });
        return response.data;
    }
};
