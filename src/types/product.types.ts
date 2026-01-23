export interface ProductDTO {
    id: string;
    name: string;
    description: string;
    sku: string;
    price: number;
    originalPrice?: number;
    stockQuantity: number;
    category: string;
    imageUrl: string;
    images: string[];
    isPreOrder: boolean;
    releaseDate?: string;
    status: 'active' | 'draft' | 'archived';
    createdAt: string;
}

export interface ProductListParams {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    isPreOrder?: boolean;
}
