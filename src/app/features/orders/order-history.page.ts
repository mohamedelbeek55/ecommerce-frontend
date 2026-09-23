import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { orderStatusClasses } from '../../shared/utils/order-status.util';
import type { Order } from '../../core/models/order.model';
import type { NormalizedError } from '../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-order-history-page',
    imports: [CurrencyPipe, DatePipe, RouterLink],
    templateUrl: './order-history.page.html',
})
export class OrderHistoryPage implements OnInit {
    private readonly ordersService = inject(OrdersService);

    readonly orders = signal<Order[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    /** Shared util — exposed to the template as a property reference. */
    readonly statusClasses = orderStatusClasses;

    ngOnInit(): void {
        this.ordersService.getOrders().subscribe({
            next: (orders) => {
                this.orders.set(orders);
                this.loading.set(false);
            },
            error: (err: NormalizedError) => {
                this.error.set(err.messages[0] ?? 'Failed to load orders.');
                this.loading.set(false);
            },
        });
    }
}
