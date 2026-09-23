import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';
import { UsersService } from './users.service';
import type { NormalizedError } from '../interceptors/error.interceptor';
import type { UserProfile } from '../models/user.model';

/**
 * Response shape from POST /auth/register, /auth/login, /auth/refresh.
 * Backend returns only tokens — no user object (see FRONTEND_CONTEXT.md §9).
 */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    // ============================================================
    // Dependencies
    // ============================================================
    private readonly http = inject(HttpClient);
    private readonly usersService = inject(UsersService);
    private readonly tokenStorage = inject(TokenStorageService);

    // ============================================================
    // Configuration
    // ============================================================
    private readonly apiUrl = `${environment.apiUrl}/auth`;

    // ============================================================
    // State (signals)
    // ============================================================
    private readonly currentUserSignal = signal<UserProfile | null>(null);
    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly isAuthenticated = computed(
        () => !!this.tokenStorage.getAccessToken(),
    );

    // ============================================================
    // Public API
    // ============================================================
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
                tap(() => this.loadCurrentUser()),
            );
    }

    login(email: string, password: string): Observable<AuthTokens> {
        return this.http
            .post<AuthTokens>(`${this.apiUrl}/login`, { email, password })
            .pipe(
                tap((tokens) => {
                    this.tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
                }),
                tap(() => this.loadCurrentUser()),
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
    verifyEmail(token: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/verify-email`, { token });
    }

    /**
     * Allows other services/pages to push an updated UserProfile into the
     * signal — used by AccountPage after a successful PATCH /users/me so the
     * navbar display name updates immediately without a page reload.
     */
    setCurrentUser(user: UserProfile): void {
        this.currentUserSignal.set(user);
    }
    // ============================================================
    // Private helpers
    // ============================================================


    /**
     * 
     * 
     * Fetches the current user's profile and stores it in the signal.
     * Called after login/register (which only return tokens, no user object).
     * Fails silently — the user still has valid tokens even if this fails.
     */
    private loadCurrentUser(): void {
        this.usersService.getMe().subscribe({
            next: (user) => this.currentUserSignal.set(user),
            error: (err) =>
                console.error('Failed to load current user profile:', err),
        });
    }
}