import { Injectable, signal } from '@angular/core';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
    /**
     * Reactive mirror of "an access token is stored". Initialized from the
     * current localStorage state at construction, then kept in sync by
     * setTokens()/clearTokens(). Consumers should read `hasAccessToken`
     * instead of calling getAccessToken() inside computed()/effect() —
     * getAccessToken() reads plain localStorage and creates no signal
     * dependency, so anything reactive built on it silently freezes.
     */
    private readonly hasAccessTokenSignal = signal<boolean>(!!this.getAccessToken());

    /** Readonly view of the reactive auth-token-present flag. */
    readonly hasAccessToken = this.hasAccessTokenSignal.asReadonly();

    getAccessToken(): string | null {
        try {
            return localStorage.getItem(ACCESS_TOKEN_KEY);
        } catch {
            return null;
        }
    }

    getRefreshToken(): string | null {
        try {
            return sessionStorage.getItem(REFRESH_TOKEN_KEY);
        } catch {
            return null;
        }
    }

    setTokens(accessToken: string, refreshToken: string): void {
        let accessTokenWritten = false;
        try {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            accessTokenWritten = true;
        } catch {
            // storage unavailable (private browsing, quota exceeded, etc.) — fail silently
        }

        // Only flip the signal when the write actually succeeded, so the
        // signal stays truthful about what is in storage. Edge case: if the
        // write failed (e.g. private browsing), the signal keeps its previous
        // value even though the in-memory intent was to authenticate — the
        // app will simply behave as "not authenticated", which matches the
        // reality that no token is available on later reads.
        if (accessTokenWritten) {
            this.hasAccessTokenSignal.set(true);
        }

        try {
            sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } catch {
            // same here
        }
    }

    clearTokens(): void {
        try {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        } catch {
            // ignore
        }

        // Unconditional: logout must always end up "not authenticated" from
        // the app's perspective, even if the removeItem() above threw — the
        // user's intent is to be signed out and no token should be served
        // from this service's reactive view after that.
        this.hasAccessTokenSignal.set(false);

        try {
            sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        } catch {
            // ignore
        }
    }
}