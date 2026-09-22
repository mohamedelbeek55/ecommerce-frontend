import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
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
        try {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        } catch {
            // storage unavailable (private browsing, quota exceeded, etc.) — fail silently
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

        try {
            sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        } catch {
            // ignore
        }
    }
}