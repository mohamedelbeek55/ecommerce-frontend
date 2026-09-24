/**
 * Product shape — matches ProductResponseDto on the backend.
 * NOTE: The backend has NO imageUrl field; the UI uses a placeholder image.
 * Prices are serialized as strings (Prisma Decimal → JSON).
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    stock: number;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Payload for POST /products and PATCH /products/:id.
 * Mirrors CreateProductDto / UpdateProductDto on the backend.
 * price is sent as a NUMBER on write (backend @IsNumber) even though it
 * comes back as a string on read (Prisma Decimal → JSON serialization).
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
 * All optional — the backend omits filters when not provided.
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