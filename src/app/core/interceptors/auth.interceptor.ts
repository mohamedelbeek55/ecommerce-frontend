import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Endpoints that must go out WITHOUT an Authorization header.
 * These are public auth endpoints where a stale token would
 * either be ignored or actively break the request.
 */
const AUTH_ENDPOINTS_TO_SKIP = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
];

/**
 * Functional HTTP interceptor that attaches `Authorization: Bearer <token>`
 * to every outgoing request that isn't a public auth endpoint.
 *
 * TODO: silent refresh on 401 — next iteration.
 * The current implementation does NOT retry failed requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenStorage = inject(TokenStorageService);

    const isAuthEndpoint = AUTH_ENDPOINTS_TO_SKIP.some((path) =>
        req.url.includes(path),
    );

    if (isAuthEndpoint) {
        return next(req);
    }

    const accessToken = tokenStorage.getAccessToken();

    if (!accessToken) {
        return next(req);
    }

    const authReq = req.clone({
        setHeaders: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return next(authReq);
};