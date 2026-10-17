export interface ProductImage {
    id: string;
    url: string;
    publicId: string;
    createdAt: string;
}

/**
 * Product shape — matches ProductResponseDto on the backend.
 * Prices are serialized as strings (Prisma Decimal → JSON).
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    stock: number;
    categoryId: string;
    images: ProductImage[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Payload for POST /products and PATCH /products/:id.
 *
 * Product images are uploaded separately as multipart/form-data
 * by the admin product form.
 */
export interface CreateProductPayload {
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
}

/**
 * Query parameters for GET /products.
 */
export interface ProductQuery {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
    sortBy?: 'name' | 'price' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated wrapper returned by GET /products.
 */
export interface PaginatedProducts {
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}