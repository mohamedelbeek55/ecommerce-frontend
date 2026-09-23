import {
    Component,
    OnInit,
    OnDestroy,
    inject,
    signal,
    ElementRef,
    viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { PaymentsService } from '../../core/services/payments.service';
import { StripeService } from '../../core/services/stripe.service';
import { OrderSummary } from '../../shared/components/order-summary/order-summary';
import type { Order } from '../../core/models/order.model';
import type { NormalizedError } from '../../core/interceptors/error.interceptor';
import type {
    Stripe,
    StripeElements,
    StripePaymentElement,
} from '@stripe/stripe-js';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-checkout-page',
    imports: [CurrencyPipe, RouterLink, OrderSummary],
    templateUrl: './checkout.page.html',
})
export class CheckoutPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly ordersService = inject(OrdersService);
    private readonly paymentsService = inject(PaymentsService);
    private readonly stripeService = inject(StripeService);

    // Template ref for the Stripe Elements mount point
    readonly paymentElementRef = viewChild<ElementRef<HTMLDivElement>>('paymentElement');

    // ---------- Order state ----------
    readonly order = signal<Order | null>(null);
    readonly orderLoading = signal(true);
    readonly orderError = signal<string | null>(null);

    // ---------- Payment state ----------
    readonly intentLoading = signal(false);
    readonly intentError = signal<string | null>(null);
    readonly elementsReady = signal(false);

    readonly paymentLoading = signal(false);
    readonly paymentError = signal<string | null>(null);
    readonly paymentSuccess = signal(false);

    // Stripe objects — not signals (Stripe manages its own DOM lifecycle)
    private stripe: Stripe | null = null;
    private elements: StripeElements | null = null;
    private paymentElement: StripePaymentElement | null = null;
    private orderId = '';

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('orderId');
        if (!id) {
            this.orderError.set('No order ID provided.');
            this.orderLoading.set(false);
            return;
        }
        this.orderId = id;

        this.ordersService.getOrder(id).subscribe({
            next: (o) => {
                this.order.set(o);
                this.orderLoading.set(false);
                this.initPayment(id);
            },
            error: (err: NormalizedError) => {
                this.orderError.set(
                    err.statusCode === 404
                        ? 'Order not found.'
                        : (err.messages[0] ?? 'Failed to load order.'),
                );
                this.orderLoading.set(false);
            },
        });
    }

    ngOnDestroy(): void {
        // Unmount the Payment Element to prevent memory leaks when the user
        // navigates away before completing payment.
        this.paymentElement?.unmount();
    }

    private async initPayment(orderId: string): Promise<void> {
        this.intentLoading.set(true);

        // Load Stripe SDK and fetch the payment intent in parallel.
        const [stripe, intentRes] = await Promise.all([
            this.stripeService.getStripe(),
            new Promise<{ clientSecret: string } | NormalizedError>((resolve) => {
                this.paymentsService.createPaymentIntent(orderId).subscribe({
                    next: resolve,
                    error: resolve,
                });
            }),
        ]);

        this.intentLoading.set(false);

        if (!stripe) {
            this.intentError.set(
                'Stripe is not configured. Add your publishable key to environment.ts.',
            );
            return;
        }

        if ('messages' in intentRes) {
            // NormalizedError shape
            this.intentError.set(
                (intentRes as NormalizedError).messages[0] ?? 'Failed to initialise payment.',
            );
            return;
        }

        this.stripe = stripe;

        // Stripe Elements appearance — literal hex values from DESIGN_SYSTEM.md
        // (Stripe does not accept CSS custom properties / Tailwind token names).
        this.elements = stripe.elements({
            clientSecret: intentRes.clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#B85C38',       // primary
                    colorBackground: '#FFFFFF',    // surface
                    colorText: '#1C1917',          // text
                    colorDanger: '#A94442',        // destructive
                    colorTextSecondary: '#736A63', // text-muted
                    borderRadius: '6px',           // rounded-md
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, ' +
                        '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                },
                rules: {
                    '.Input': {
                        border: '1px solid #E7DED4',   // border
                        boxShadow: 'none',
                    },
                    '.Input:focus': {
                        border: '1px solid #B85C38',   // primary on focus
                        boxShadow: '0 0 0 2px rgba(184,92,56,0.2)',
                    },
                    '.Label': {
                        color: '#736A63',              // text-muted
                        fontWeight: '500',
                    },
                },
            },
        });

        // Mount after the DOM has rendered the #payment-element container.
        // We use setTimeout(0) to let Angular finish rendering the @if block
        // that depends on elementsReady().
        this.elementsReady.set(true);

        setTimeout(() => {
            const container = this.paymentElementRef()?.nativeElement;
            if (!container || !this.elements) return;

            this.paymentElement = this.elements.create('payment');
            this.paymentElement.mount(container);
        }, 0);
    }

    async onPayNow(): Promise<void> {
        if (!this.stripe || !this.elements || this.paymentLoading()) return;

        this.paymentLoading.set(true);
        this.paymentError.set(null);

        const returnUrl =
            `${window.location.origin}/orders/${this.orderId}`;

        const result = await this.stripe.confirmPayment({
            elements: this.elements,
            confirmParams: { return_url: returnUrl },
            // 'if_required' means Stripe only redirects when the payment method
            // requires it (e.g. 3D Secure). For cards like 4242... it resolves
            // in-page so we can handle success here without a page reload.
            redirect: 'if_required',
        });

        if (result.error) {
            // Card declined, validation error, or user cancelled 3DS.
            this.paymentError.set(result.error.message ?? 'Payment failed.');
            this.paymentLoading.set(false);
            return;
        }

        // Payment succeeded (no redirect required).
        this.paymentLoading.set(false);
        this.paymentSuccess.set(true);

        // Give the user a moment to see the success state, then navigate to the
        // order detail page. The backend webhook will have updated the status to
        // CONFIRMED by the time the user gets there (or it will update shortly).
        setTimeout(() => {
            this.router.navigate(['/orders', this.orderId]);
        }, 2000);
    }
}
