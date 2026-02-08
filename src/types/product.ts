export interface Brand {
    brand_id: number;
    name: string;
    logo_url?: string;
}

export interface Category {
    category_id: number;
    name: string;
    slug: string;
    parent_id?: number;
}

export interface Series {
    series_id: number;
    name: string;
    description?: string;
}

export interface MediaItem {
    type: 'IMAGE' | 'VIDEO';
    url: string;
    source?: 'CLOUDINARY' | 'YOUTUBE';
    thumbnail?: string;
}

export interface ProductPreorderConfig {
    config_id: number;
    variant_id: number;
    deposit_amount: string | number;
    full_price: string | number;
    total_slots: number;
    sold_slots: number;
    max_qty_per_user: number;
    release_date?: string;
    // stock_held?
}

export interface ProductVariant {
    variant_id: number;
    product_id: number;
    sku: string;
    option_name: string;
    price: string | number;
    stock_available: number;
    stock_defect: number;
    barcode?: string;
    media_assets?: any; // JSON, often [string] or MediaItem[]
    description?: string;
    deposit_amount?: string | number;
    product_preorder_configs?: ProductPreorderConfig;
}

export interface ProductBlindbox {
    product_id: number;
    price: string | number;
    min_value: string | number;
    max_value: string | number;
    tier_config?: any;
}

export interface Product {
    product_id: number;
    name: string;
    type_code: 'RETAIL' | 'BLINDBOX' | 'PREORDER';
    status_code: string;
    description?: string;
    brand_id?: number;
    category_id?: number;
    series_id?: number;
    media_urls?: any; // JSON, often string[]
    specifications?: any; // JSON
    created_at: string;

    // Relations
    brands?: Brand;
    categories?: Category;
    series?: Series;
    product_variants: ProductVariant[];
    product_blindboxes?: ProductBlindbox; // One-to-one
}
