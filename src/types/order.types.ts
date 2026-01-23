export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItemDTO {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl: string;
}

export interface OrderDTO {
    id: string;
    userId: string;
    status: OrderStatus;
    totalAmount: number;
    items: OrderItemDTO[];
    shippingAddress: string;
    paymentMethod: 'cod' | 'wallet' | 'banking';
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderPayload {
    items: {
        productId: string;
        quantity: number;
    }[];
    shippingAddress: string;
    paymentMethod: string;
    note?: string;
}
