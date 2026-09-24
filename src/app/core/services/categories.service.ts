import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/categories`;

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.apiUrl);
    }

    getCategory(id: string): Observable<Category> {
        return this.http.get<Category>(`${this.apiUrl}/${id}`);
    }

    // ---------- Admin write methods ----------

    /** POST /categories — requires JWT + ADMIN. */
    createCategory(data: { name: string }): Observable<Category> {
        return this.http.post<Category>(this.apiUrl, data);
    }

    /**
     * PATCH /categories/:id — requires JWT + ADMIN.
     * Backend returns 400 if the new name is already taken (unique constraint).
     */
    updateCategory(id: string, data: { name: string }): Observable<Category> {
        return this.http.patch<Category>(`${this.apiUrl}/${id}`, data);
    }

    /**
     * DELETE /categories/:id — requires JWT + ADMIN.
     * Backend returns 400 if the category still has products assigned to it.
     * The caller MUST surface this as a clear message, not a generic failure.
     */
    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
