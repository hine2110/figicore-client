// POS Types
export interface PosSession {
    session_id: number;
    user_id: number;
    opened_at: string;
    closed_at?: string;
    opening_cash: number;
    closing_cash?: number;
    status_code: string;
    note?: string;
    order_count?: number;
}

// Variant within a product
export interface PosProductVariant {
    variant_id: number;
    sku: string;
    option_name: string;
    price: number;
    current_stock: number;
    thumbnail: string | null;
    tax_rate?: number; // Added for Tax Integration
}

// Product with multiple variants
export interface PosProduct {
    product_id: number;
    product_name: string;
    thumbnail: string | null;
    category: string;
    brand: string | null;
    product_type: string;
    variants: PosProductVariant[];
}

export interface PosCartItem {
    variant_id: number;
    sku: string;
    product_name: string;
    option_name: string;
    price: number;
    quantity: number;
    thumbnail: string | null;
    tax_rate?: number; // Added for Tax Integration
    tax_amount?: number; // Optional: Store calculated tax amount
}

export interface PosOrderItem {
    variant_id: number;
    quantity: number;
}

export interface CreatePosOrderRequest {
    items: PosOrderItem[];
    payment_method_code: string;
    user_id?: number;
    note?: string;
    discount_amount?: number;
    status_code?: string; // COMPLETED, PARKED

    // VAT Mock Fields
    is_vat_export?: boolean;
    vat_tax_number?: string;
    vat_company_name?: string;
    vat_company_address?: string;
    vat_invoice_email?: string;
}

export interface PosOrder {
    order_id: number;
    order_code: string;
    session_id: number;
    total_amount: number;
    total_tax?: number; // Added: Tax amount
    paid_amount: number;
    discount_amount: number;
    payment_method_code: string;
    status_code: string;
    created_at: string;

    // VAT Invoice Fields (Mock)
    is_vat_export?: boolean;
    vat_tax_number?: string;
    vat_company_name?: string;
    vat_company_address?: string;
    vat_invoice_email?: string;
    users?: {
        user_id: number;
        full_name: string;
        phone?: string;
        email?: string;
        customers?: {
            current_rank_code: string;
            total_spent: number;
            loyalty_points: number;
        };
    };
    employees?: {
        users: {
            full_name: string;
        }
    };
    order_items?: Array<{
        order_item_id: number;
        variant_id: number;
        quantity: number;
        unit_price: number;
        total_price: number;
        product_variants?: {
            sku: string;
            option_name?: string;
            products?: {
                name: string;
            };
        };
    }>;
}
