/**
 * Cart shapes — mirror CartItemResponseDto / CartResponseDto exactly.
 * Prices and subtotals are strings (Prisma Decimal → JSON, per FRONTEND_CONTEXT.md §9).
 */

export interface CartItem {
    productId: string;
    name: string;
    price: string;
    quantity: number;
    subtotal: string;
}

export interface Cart {
    id: string;
    items: CartItem[];
    total: string;
}
