export interface ProductInfo {
    name: string;
    media_urls: string[];
}

export interface OrderItem {
    item_id: number;
    quantity: number;
    product_variants: {
        sku: string;
        option_name: string;
        products: ProductInfo;
        media_assets: any;
        price: number;
    };
    allocated_variant?: {
        variant_id: number;
        sku: string;
        option_name: string;
        products: {
            name: string;
            media_urls: string[];
        };
        media_assets: any;
    } | null;
}

export interface PackingOrder {
    order_id: number;
    order_code: string;
    created_at: string;
    status_code: string;
    order_items: OrderItem[];
    addresses: {
        recipient_name: string;
        detail_address: string;
        ward_code: string;
        district_id: number;
    };
}
