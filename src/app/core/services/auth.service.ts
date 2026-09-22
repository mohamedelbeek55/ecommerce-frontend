import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';
import { NormalizedError } from '../interceptors/error.interceptor';

/**
 * Response shape from POST /auth/register, /auth/login, /auth/refresh.
 * Backend returns only tokens — no user object (see FRONTEND_CONTEXT.md §9).
 */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Role values from the backend. Backend uses ADMIN / CUSTOMER (not USER).
 */
export type UserRole = 'ADMIN' | 'CUSTOMER';

/**
 * User profile shape — matches UserProfileResponseDto on the backend.
 * TODO: move to a shared `models/user.model.ts` once users.service.ts exists.
 */
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly tokenStorage = inject(TokenStorageService);

    private readonly apiUrl = `${environment.apiUrl}/auth`;

    /** Current authenticated user (profile). null when not logged in. */
    private readonly currentUserSignal = signal<UserProfile | null>(null);

    /** Read-only signal for consumers. */
    readonly currentUser = this.currentUserSignal.asReadonly();

    /** True if an access token exists in storage. */
    readonly isAuthenticated = computed(
        () => !!this.tokenStorage.getAccessToken(),
    );

    register(
        email: string,
        password: string,
        name: string,
    ): Observable<AuthTokens> {
        return this.http
            .post<AuthTokens>(`${this.apiUrl}/register`, { email, password, name })
            .pipe(
                tap((tokens) => {
                    this.tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
                }),
            );
    }

    login(email: string, password: string): Observable<AuthTokens> {
        return this.http
            .post<AuthTokens>(`${this.apiUrl}/login`, { email, password })
            .pipe(
                tap((tokens) => {
                    this.tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
                }),
            );
        // NOTE: 403 "email not verified" is NOT swallowed here — the error
        // interceptor normalizes it and the UI will surface it (next iteration).
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
            // Always clear local tokens — even if the API call fails (e.g. network
            // down, token already expired). Local state must never outlive the
            // user's intent to log out.
            finalize(() => {
                this.tokenStorage.clearTokens();
                this.currentUserSignal.set(null);
            }),
        );
    }

    refresh(): Observable<AuthTokens> {
        const refreshToken = this.tokenStorage.getRefreshToken();

        if (!refreshToken) {
            return throwError(
                (): NormalizedError => ({
                    statusCode: 401,
                    messages: ['No refresh token available'],
                }),
            );
        }

        return this.http
            .post<AuthTokens>(`${this.apiUrl}/refresh`, { refreshToken })
            .pipe(
                tap((tokens) => {
                    this.tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
                }),
            );
    }
}