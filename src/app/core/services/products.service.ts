import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
    PaginatedProducts,
    Product,
    ProductQuery,
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/products`;

    getProducts(query: ProductQuery = {}): Observable<PaginatedProducts> {
        let params = new HttpParams();

        // Only add params that have a real value — never send empty strings or NaN.
        if (query.page != null) params = params.set('page', query.page);
        if (query.limit != null) params = params.set('limit', query.limit);
        if (query.search && query.search.trim().length > 0) {
            params = params.set('search', query.search.trim());
        }
        if (query.minPrice != null) params = params.set('minPrice', query.minPrice);
        if (query.maxPrice != null) params = params.set('maxPrice', query.maxPrice);
        if (query.categoryId) params = params.set('categoryId', query.categoryId);
        if (query.sortBy) params = params.set('sortBy', query.sortBy);
        if (query.sortOrder) params = params.set('sortOrder', query.sortOrder);

        return this.http.get<PaginatedProducts>(this.apiUrl, { params });
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }
}