import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import type { Cart } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly apiUrl = `${environment.apiUrl}/cart`;

    // ---------- State ----------

    /** Full cart state. null means not yet loaded (or user is logged out). */
    readonly cartSignal = signal<Cart | null>(null);

    /**
     * Total number of individual units across all cart items.
     * Drives the navbar badge — 0 means no badge shown.
     */
    readonly itemCount = computed(
        () =>
            this.cartSignal()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    );

    constructor() {
        // Reactively watch authentication state so cart is always in sync:
        //   - login  → load the cart from the API
        //   - logout → immediately clear the local cart signal (no API call needed)
        // Using untracked() for the side-effect calls so they don't create nested
        // reactive dependencies inside the effect.
        effect(() => {
            const authenticated = this.authService.isAuthenticated();

            if (authenticated) {
                untracked(() => {
                    this.loadCart().subscribe({
                        error: () => {
                            // Silently ignore — token may be stale; the auth
                            // interceptor handles refresh/redirect on subsequent requests.
                        },
                    });
                });
            } else {
                untracked(() => this.cartSignal.set(null));
            }
        });
    }

    // ---------- API methods ----------

    /** Fetches the user's cart (creates one if none exists) and syncs cartSignal. */
    loadCart(): Observable<Cart> {
        return this.http
            .get<Cart>(this.apiUrl)
            .pipe(tap((cart) => this.cartSignal.set(cart)));
    }

    /**
     * Adds a product to the cart (or increments quantity if already present).
     * The backend returns the full updated CartResponseDto on 201 — sync directly.
     */
    addItem(productId: string, quantity: number): Observable<Cart> {
        return this.http
            .post<Cart>(`${this.apiUrl}/items`, { productId, quantity })
            .pipe(tap((cart) => this.cartSignal.set(cart)));
    }

    /**
     * Sets a new quantity for a product already in the cart.
     * Backend returns the full updated CartResponseDto on 200 — sync directly.
     */
    updateItem(productId: string, quantity: number): Observable<Cart> {
        return this.http
            .patch<Cart>(`${this.apiUrl}/items/${productId}`, { quantity })
            .pipe(tap((cart) => this.cartSignal.set(cart)));
    }

    /**
     * Removes a single product from the cart.
     * Backend returns the full updated CartResponseDto on 200 — sync directly.
     */
    removeItem(productId: string): Observable<Cart> {
        return this.http
            .delete<Cart>(`${this.apiUrl}/items/${productId}`)
            .pipe(tap((cart) => this.cartSignal.set(cart)));
    }

    /**
     * Clears all items from the cart.
     * Backend returns the empty CartResponseDto on 200 — sync directly so the
     * cartSignal reflects the empty cart (id preserved) rather than going null.
     */
    clearCart(): Observable<Cart> {
        return this.http
            .delete<Cart>(this.apiUrl)
            .pipe(tap((cart) => this.cartSignal.set(cart)));
    }
}
