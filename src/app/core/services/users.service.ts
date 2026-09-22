import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { UserProfile } from '../models/user.model';

/**
 * Service for the /users endpoints.
 * Requires an authenticated user — the authInterceptor attaches the token.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = `${environment.apiUrl}/users`;

    /** GET /users/me — returns the current user's profile. */
    getMe(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/me`);
    }

    /** PATCH /users/me — updates the current user's name. */
    updateMe(name: string): Observable<UserProfile> {
        return this.http.patch<UserProfile>(`${this.apiUrl}/me`, { name });
    }
}