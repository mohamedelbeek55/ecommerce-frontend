import { Injectable } from '@angular/core';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StripeService {
    /**
     * Lazily initialised — `loadStripe` is called once and the Promise is
     * cached.  Subsequent calls to `getStripe()` return the same Promise so
     * the SDK script is only injected into the page once.
     *
     * Returns `null` when the publishable key is the placeholder (prevents a
     * noisy Stripe console error in environments where the key hasn't been
     * configured yet).
     */
    private stripePromise: Promise<Stripe | null> | null = null;

    getStripe(): Promise<Stripe | null> {
        if (!this.stripePromise) {
            const key = environment.stripePublishableKey;
            if (!key || key === 'pk_test_placeholder') {
                console.warn(
                    '[StripeService] stripePublishableKey is not configured. ' +
                    'Replace the placeholder in environment.ts with your real ' +
                    'Stripe test key from the Stripe dashboard.',
                );
                this.stripePromise = Promise.resolve(null);
            } else {
                this.stripePromise = loadStripe(key);
            }
        }
        return this.stripePromise;
    }
}
