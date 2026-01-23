export interface WalletDTO {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    updatedAt: string;
}

export interface TransactionDTO {
    id: string;
    walletId: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
    description: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
}
