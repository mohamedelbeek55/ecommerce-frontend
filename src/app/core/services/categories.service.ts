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
}