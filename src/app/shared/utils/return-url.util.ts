/**
 * Reject open redirects — only same-origin relative paths.
 * Used when reading or building login `returnUrl` query params.
 */
export function sanitizeReturnUrl(url: string | null): string | null {
    if (!url || !url.startsWith('/') || url.startsWith('//')) {
        return null;
    }
    return url;
}

/** Query params for redirecting to login with a return URL (matches authGuard pattern). */
export function loginQueryParamsWithReturnUrl(returnUrl: string): {
    returnUrl: string;
} {
    return { returnUrl };
}
