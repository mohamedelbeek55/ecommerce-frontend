import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/orders`;

    /** POST /orders/checkout — creates an order from the current cart. */
    checkout(): Observable<Order> {
        return this.http.post<Order>(`${this.apiUrl}/checkout`, {});
    }

    /** GET /orders — list the current user's orders, most recent first. */
    getOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(this.apiUrl);
    }

    /** GET /orders/:id — single order (owner-only, 404 otherwise). */
    getOrder(id: string): Observable<Order> {
        return this.http.get<Order>(`${this.apiUrl}/${id}`);
    }
}
