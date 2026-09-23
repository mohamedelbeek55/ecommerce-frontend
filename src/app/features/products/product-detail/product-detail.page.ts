import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Product } from '../../../core/models/product.model';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-product-detail-page',
    imports: [CurrencyPipe, FormsModule, RouterLink],
    templateUrl: './product-detail.page.html',
})
export class ProductDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly productsService = inject(ProductsService);
    private readonly cartService = inject(CartService);
    private readonly authService = inject(AuthService);

    // ---------- Product state ----------
    readonly product = signal<Product | null>(null);
    readonly loading = signal(true);
    readonly notFound = signal(false);
    readonly error = signal<string | null>(null);

    /** Quantity the user wants to add to cart (1–stock, clamped in the template). */
    readonly quantity = signal(1);

    // ---------- Cart interaction state ----------
    readonly cartLoading = signal(false);
    /** Shown briefly after a successful add-to-cart, auto-cleared after 3 s. */
    readonly cartSuccess = signal(false);
    readonly cartError = signal<string | null>(null);

    private successTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.notFound.set(true);
            this.loading.set(false);
            return;
        }

        this.productsService.getProduct(id).subscribe({
            next: (p) => {
                this.product.set(p);
                this.loading.set(false);
            },
            error: (err: NormalizedError) => {
                if (err.statusCode === 404) {
                    this.notFound.set(true);
                } else {
                    this.error.set(err.messages[0] ?? 'Failed to load product.');
                }
                this.loading.set(false);
            },
        });
    }

    increaseQty(): void {
        const p = this.product();
        if (!p) return;
        this.quantity.update((q) => Math.min(q + 1, p.stock));
    }

    decreaseQty(): void {
        this.quantity.update((q) => Math.max(q - 1, 1));
    }

    onAddToCart(): void {
        const p = this.product();
        if (!p) return;

        // Cart requires authentication — redirect to login if not signed in.
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        this.cartLoading.set(true);
        this.cartError.set(null);
        this.cartSuccess.set(false);

        this.cartService.addItem(p.id, this.quantity()).subscribe({
            next: () => {
                this.cartLoading.set(false);
                this.cartSuccess.set(true);

                // Auto-dismiss the success banner after 3 s.
                if (this.successTimer) clearTimeout(this.successTimer);
                this.successTimer = setTimeout(() => this.cartSuccess.set(false), 3000);
            },
            error: (err: NormalizedError) => {
                this.cartLoading.set(false);
                this.cartError.set(err.messages[0] ?? 'Could not add item to cart.');
            },
        });
    }
}
