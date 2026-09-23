import { Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Order } from '../../../core/models/order.model';
import { orderStatusClasses } from '../../utils/order-status.util';

/**
 * Presentational component — receives an Order via input() and renders
 * a full order summary card (items, total, status badge, date).
 * Used by CheckoutPage and OrderDetailPage to avoid template duplication.
 */
@Component({
    selector: 'app-order-summary',
    imports: [CurrencyPipe, DatePipe, RouterLink],
    templateUrl: './order-summary.html',
})
export class OrderSummary {
    /** The order to display. Required. */
    readonly order = input.required<Order>();

    /** Whether to show the "View all orders" footer link (default: true). */
    readonly showOrdersLink = input(true);

    statusClasses = orderStatusClasses;
}
