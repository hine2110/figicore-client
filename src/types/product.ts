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
}

export interface ProductBlindbox {
    product_id: number;
    price: string | number;
    min_value: string | number;
    max_value: string | number;
    tier_config?: any;
}

export interface ProductPreorder {
    product_id: number;
    deposit_amount?: string | number;
    full_price?: string | number;
    release_date?: string;
    max_slots?: number;
}

export interface Product {
    product_id: number;
    name: string;
    type_code: 'RETAIL' | 'BLINDBOX' | 'PREORDER';
    status_code: string;
    description?: string;
    media_urls?: any; // JSON, often string[]
    specifications?: any; // JSON
    created_at: string;

    // Relations
    brands?: Brand;
    categories?: Category;
    series?: Series;
    product_variants: ProductVariant[];
    product_blindboxes?: ProductBlindbox; // One-to-one
    product_preorders?: ProductPreorder; // One-to-one
}
