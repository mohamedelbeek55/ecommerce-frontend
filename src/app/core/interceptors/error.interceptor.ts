import {
    HttpErrorResponse,
    HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Normalized error shape consumed by the UI layer.
 * `messages` is ALWAYS an array — the backend sometimes returns a single
 * string (business errors) and sometimes an array (validation errors).
 * Normalizing here means UI code never needs to branch on which shape it got.
 */
export interface NormalizedError {
    statusCode: number;
    messages: string[];
}

/**
 * Converts the backend's two possible `message` shapes into a single
 * array of strings. Falls back to a generic message when the backend
 * returns neither (e.g. a 500 with no body, a network failure).
 */
function normalizeMessages(rawMessage: unknown): string[] {
    if (Array.isArray(rawMessage)) {
        return rawMessage.filter((m): m is string => typeof m === 'string');
    }

    if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
        return [rawMessage];
    }

    return ['An unexpected error occurred'];
}

/**
 * Functional HTTP interceptor that catches every HttpErrorResponse and
 * re-throws a `NormalizedError` so downstream code (services, components)
 * always receives the same shape.
 *
 * Does NOT display UI — no toasts, no alerts. This layer is purely
 * data-shaping; the UI reacts to the normalized shape wherever it calls
 * the API.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const normalized: NormalizedError = {
                statusCode: error.status,
                messages: normalizeMessages(error.error?.message),
            };

            return throwError(() => normalized);
        }),
    );
};