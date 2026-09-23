import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { OrderSummary } from '../../shared/components/order-summary/order-summary';
import type { Order } from '../../core/models/order.model';
import type { NormalizedError } from '../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-order-detail-page',
    imports: [RouterLink, OrderSummary],
    templateUrl: './order-detail.page.html',
})
export class OrderDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly ordersService = inject(OrdersService);

    readonly order = signal<Order | null>(null);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly notFound = signal(false);
    readonly refreshing = signal(false);

    private orderId = '';

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.error.set('No order ID provided.');
            this.loading.set(false);
            return;
        }
        this.orderId = id;
        this.fetchOrder(/* initial */ true);
    }

    onRefreshStatus(): void {
        if (this.refreshing()) return;
        this.fetchOrder(false);
    }

    private fetchOrder(initial: boolean): void {
        if (initial) {
            this.loading.set(true);
        } else {
            this.refreshing.set(true);
        }

        this.ordersService.getOrder(this.orderId).subscribe({
            next: (o) => {
                this.order.set(o);
                this.loading.set(false);
                this.refreshing.set(false);
            },
            error: (err: NormalizedError) => {
                if (initial) {
                    if (err.statusCode === 404) {
                        this.notFound.set(true);
                    } else {
                        this.error.set(err.messages[0] ?? 'Failed to load order.');
                    }
                    this.loading.set(false);
                } else {
                    // Non-initial refresh: don't wipe the existing order display,
                    // just silently stop the spinner. Stale data is better than
                    // a blank screen for a transient network error.
                    this.refreshing.set(false);
                }
            },
        });
    }
}
