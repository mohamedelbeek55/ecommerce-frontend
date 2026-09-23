import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import type { NormalizedError } from '../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-cart-page',
    imports: [CurrencyPipe, RouterLink],
    templateUrl: './cart.page.html',
})
export class CartPage implements OnInit {
    readonly cartService = inject(CartService);
    private readonly ordersService = inject(OrdersService);
    private readonly router = inject(Router);

    // ---------- UI state ----------
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly checkoutLoading = signal(false);

    /**
     * Per-item loading map: productId → true while an update/remove is in flight.
     * Prevents double-clicks without disabling the whole page.
     */
    readonly itemLoading = signal<Record<string, boolean>>({});

    ngOnInit(): void {
        // cartSignal may already be populated by the service constructor (authenticated
        // user). If it is still null, load now (e.g. user navigated here directly after
        // a hard refresh where the service constructor didn't fire in time, or some
        // edge case where the signal was cleared).
        if (this.cartService.cartSignal() === null) {
            this.loading.set(true);
            this.cartService.loadCart().subscribe({
                next: () => this.loading.set(false),
                error: (err: NormalizedError) => {
                    this.error.set(err.messages[0] ?? 'Failed to load cart.');
                    this.loading.set(false);
                },
            });
        }
    }

    onUpdateQuantity(productId: string, quantity: number): void {
        if (quantity < 1) return;
        this.setItemLoading(productId, true);
        this.error.set(null);

        this.cartService.updateItem(productId, quantity).subscribe({
            next: () => this.setItemLoading(productId, false),
            error: (err: NormalizedError) => {
                this.error.set(err.messages[0] ?? 'Could not update item.');
                this.setItemLoading(productId, false);
            },
        });
    }

    onRemoveItem(productId: string): void {
        this.setItemLoading(productId, true);
        this.error.set(null);

        this.cartService.removeItem(productId).subscribe({
            next: () => this.setItemLoading(productId, false),
            error: (err: NormalizedError) => {
                this.error.set(err.messages[0] ?? 'Could not remove item.');
                this.setItemLoading(productId, false);
            },
        });
    }

    onClearCart(): void {
        if (!window.confirm('Remove all items from your cart?')) return;
        this.loading.set(true);
        this.error.set(null);

        this.cartService.clearCart().subscribe({
            next: () => this.loading.set(false),
            error: (err: NormalizedError) => {
                this.error.set(err.messages[0] ?? 'Could not clear cart.');
                this.loading.set(false);
            },
        });
    }

    onProceedToCheckout(): void {
        const cart = this.cartService.cartSignal();
        if (!cart || cart.items.length === 0) return;

        this.checkoutLoading.set(true);
        this.error.set(null);

        this.ordersService.checkout().subscribe({
            next: (order) => {
                // Checkout empties the cart server-side — clear the local signal so the
                // badge and cart page both reflect the empty state immediately.
                this.cartService.cartSignal.set(null);
                this.checkoutLoading.set(false);
                this.router.navigate(['/checkout', order.id]);
            },
            error: (err: NormalizedError) => {
                // Surface the error on this page — do not navigate away on failure.
                this.error.set(err.messages[0] ?? 'Checkout failed. Please try again.');
                this.checkoutLoading.set(false);
            },
        });
    }

    isItemLoading(productId: string): boolean {
        return this.itemLoading()[productId] === true;
    }

    private setItemLoading(productId: string, state: boolean): void {
        this.itemLoading.update((map) => ({ ...map, [productId]: state }));
    }
}
