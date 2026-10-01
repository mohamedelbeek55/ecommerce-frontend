import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';
import { UsersService } from './users.service';

import type { NormalizedError } from '../interceptors/error.interceptor';
import type { UserProfile } from '../models/user.model';

/**
 * Response shape from POST /auth/register, /auth/login, /auth/google, /auth/refresh.
 * Backend returns only tokens — no user object.
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
    // State
    // ============================================================

    private readonly currentUserSignal = signal<UserProfile | null>(null);

    readonly currentUser = this.currentUserSignal.asReadonly();

    readonly isAuthenticated = this.tokenStorage.hasAccessToken;

    // ============================================================
    // Initialization
    // ============================================================

    constructor() {
        this.restoreSession();
    }

    /**
     * Restores the current user when the application starts and an
     * access token already exists in localStorage.
     *
     * If the token is no longer valid, clear the local authentication
     * state so the application behaves as a guest.
     */
    private restoreSession(): void {
        if (!this.tokenStorage.getAccessToken()) {
            return;
        }

        this.loadCurrentUser().subscribe({
            error: () => {
                this.tokenStorage.clearTokens();
                this.currentUserSignal.set(null);
            },
        });
    }

    // ============================================================
    // Public API
    // ============================================================

    register(
        email: string,
        password: string,
        name: string,
    ): Observable<AuthTokens> {
        return this.http
            .post<AuthTokens>(`${this.apiUrl}/register`, {
                email,
                password,
                name,
            })
            .pipe(
                tap((tokens) => {
                    this.tokenStorage.setTokens(
                        tokens.accessToken,
                        tokens.refreshToken,
                    );
                }),
                switchMap((tokens) =>
                    this.loadCurrentUser().pipe(map(() => tokens)),
                ),
            );
    }

    login(
        email: string,
        password: string,
    ): Observable<AuthTokens> {
        return this.http
            .post<AuthTokens>(`${this.apiUrl}/login`, {
                email,
                password,
            })
            .pipe(
                tap((tokens) => {
                    this.tokenStorage.setTokens(
                        tokens.accessToken,
                        tokens.refreshToken,
                    );
                }),
                switchMap((tokens) =>
                    this.loadCurrentUser().pipe(map(() => tokens)),
                ),
            );
        // NOTE: 403 "email not verified" is not swallowed here.
    }

    /**
     * Authenticates the user using a Google ID token.
     *
     * The Google ID token is verified by the backend before our
     * application tokens are issued.
     */
    googleLogin(idToken: string): Observable<AuthTokens> {
        return this.http
            .post<AuthTokens>(`${this.apiUrl}/google`, {
                idToken,
            })
            .pipe(
                tap((tokens) => {
                    this.tokenStorage.setTokens(
                        tokens.accessToken,
                        tokens.refreshToken,
                    );
                }),
                switchMap((tokens) =>
                    this.loadCurrentUser().pipe(map(() => tokens)),
                ),
            );
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
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
                    this.tokenStorage.setTokens(
                        tokens.accessToken,
                        tokens.refreshToken,
                    );
                }),
            );
    }

    verifyEmail(token: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/verify-email`, { token });
    }

    forgotPassword(email: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/forgot-password`, {
            email,
        });
    }

    resetPassword(
        token: string,
        newPassword: string,
    ): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/reset-password`, {
            token,
            newPassword,
        });
    }

    resendVerification(email: string): Observable<void> {
        return this.http.post<void>(
            `${this.apiUrl}/resend-verification`,
            { email },
        );
    }

    /**
     * Allows other services/pages to push an updated UserProfile into
     * the signal after a successful profile update.
     */
    setCurrentUser(user: UserProfile): void {
        this.currentUserSignal.set(user);
    }

    // ============================================================
    // Private helpers
    // ============================================================

    /**
     * Fetches the current user's profile and stores it in the signal.
     *
     * Unlike the previous implementation, this method returns the
     * Observable so callers can wait until the profile has been loaded.
     */
    private loadCurrentUser(): Observable<UserProfile> {
        return this.usersService.getMe().pipe(
            tap((user) => {
                this.currentUserSignal.set(user);
            }),
        );
    }
}