/**
 * Order shapes — mirror OrderItemResponseDto / OrderResponseDto exactly.
 * Monetary fields are strings (Prisma Decimal → JSON, per FRONTEND_CONTEXT.md §9).
 * Timestamps come back as ISO strings from JSON serialization of Date.
 */

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface OrderItem {
    productId: string;
    productName: string;
    unitPrice: string;
    quantity: number;
    subtotal: string;
}

export interface Order {
    id: string;
    status: OrderStatus;
    total: string;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}
