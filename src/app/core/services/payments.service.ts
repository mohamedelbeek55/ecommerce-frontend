import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentIntentResponse {
    clientSecret: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/payments`;

    /**
     * POST /payments/orders/:orderId/intent
     * Returns a Stripe PaymentIntent clientSecret.
     * Order must belong to the current user and be in PENDING status.
     */
    createPaymentIntent(orderId: string): Observable<PaymentIntentResponse> {
        return this.http.post<PaymentIntentResponse>(
            `${this.apiUrl}/orders/${orderId}/intent`,
            {},
        );
    }
}
