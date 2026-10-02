import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
    CreateProductPayload,
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

        if (query.minPrice != null) {
            params = params.set('minPrice', query.minPrice);
        }

        if (query.maxPrice != null) {
            params = params.set('maxPrice', query.maxPrice);
        }

        if (query.categoryId) {
            params = params.set('categoryId', query.categoryId);
        }

        if (query.sortBy) {
            params = params.set('sortBy', query.sortBy);
        }

        if (query.sortOrder) {
            params = params.set('sortOrder', query.sortOrder);
        }

        return this.http.get<PaginatedProducts>(this.apiUrl, { params });
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }

    // ---------- Admin write methods ----------

    /**
     * POST /products — requires JWT + ADMIN role.
     *
     * Sends product data and 1–5 images as multipart/form-data.
     */
    createProduct(
        data: CreateProductPayload,
        images: File[],
    ): Observable<Product> {
        const formData = this.buildProductFormData(data, images);

        return this.http.post<Product>(this.apiUrl, formData);
    }

    /**
     * PATCH /products/:id — requires JWT + ADMIN role.
     *
     * If images are provided, the backend replaces all existing
     * product images with the uploaded files.
     */
    updateProduct(
        id: string,
        data: Partial<CreateProductPayload>,
        images: File[] = [],
    ): Observable<Product> {
        const formData = this.buildProductFormData(data, images);

        return this.http.patch<Product>(
            `${this.apiUrl}/${id}`,
            formData,
        );
    }

    /** DELETE /products/:id — requires JWT + ADMIN role. */
    deleteProduct(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Build the multipart/form-data payload expected by the backend.
     *
     * Important:
     * Do not manually set Content-Type.
     * HttpClient/browser will add the correct multipart boundary.
     */
    private buildProductFormData(
        data: Partial<CreateProductPayload>,
        images: File[],
    ): FormData {
        const formData = new FormData();

        if (data.name !== undefined) {
            formData.append('name', data.name);
        }

        if (data.description !== undefined) {
            formData.append('description', data.description);
        }

        if (data.price !== undefined) {
            formData.append('price', String(data.price));
        }

        if (data.stock !== undefined) {
            formData.append('stock', String(data.stock));
        }

        if (data.categoryId !== undefined) {
            formData.append('categoryId', data.categoryId);
        }

        for (const image of images) {
            formData.append('images', image);
        }

        return formData;
    }
}