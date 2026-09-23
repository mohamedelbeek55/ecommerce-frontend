import type { OrderStatus } from '../../core/models/order.model';

/**
 * Returns Tailwind token classes for an order status badge.
 * Pairs color with text so state is never communicated by color alone.
 *
 * COMPLETED  → primary (warm terracotta — positive outcome)
 * CONFIRMED  → rating  (ochre — in-progress positive)
 * CANCELLED  → destructive (red — negative outcome)
 * PENDING    → muted/border (neutral — awaiting action)
 */
export function orderStatusClasses(status: OrderStatus): string {
    switch (status) {
        case 'COMPLETED':
            return 'bg-surface border border-primary text-primary';
        case 'CONFIRMED':
            return 'bg-surface border border-rating text-rating';
        case 'CANCELLED':
            return 'bg-surface border border-destructive text-destructive';
        case 'PENDING':
        default:
            return 'bg-surface border border-border text-text-muted';
    }
}
