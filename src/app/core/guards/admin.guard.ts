import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/users.service';

/**
 * Route guard that restricts access to ADMIN-only routes.
 *
 * Flow:
 *  1. Not authenticated              → redirect to /login?returnUrl=<attempted url>
 *  2. Authenticated + user loaded    → check role immediately
 *  3. Authenticated + user NOT loaded (hard refresh on admin URL)
 *                                    → fetch profile first, then check role
 *  4. Role is ADMIN                  → allow
 *  5. Role is CUSTOMER (or anything else) → redirect to / (home)
 *
 * The returnUrl on Step 1 is consistent with authGuard so that login.page.ts
 * can redirect the user back to the admin URL they were trying to reach after
 * they authenticate (login.page.ts already reads and sanitizes returnUrl).
 *
 * This is UX enforcement only. The backend enforces 403 for non-admins on
 * every write endpoint — this guard just prevents broken UI from rendering.
 */
export const adminGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const usersService = inject(UsersService);
    const router = inject(Router);

    // Step 1: not authenticated → /login, preserving the attempted URL so
    // login.page.ts can redirect back after a successful sign-in.
    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
        });
    }

    const currentUser = authService.currentUser();

    // Step 2: profile already in the signal → check role synchronously.
    if (currentUser) {
        return currentUser.role === 'ADMIN'
            ? true
            : router.createUrlTree(['/']);
    }

    // Step 3: authenticated but profile not yet loaded (hard refresh).
    // Fetch it, update the AuthService signal, then check the role.
    return usersService.getMe().pipe(
        switchMap((user) => {
            authService.setCurrentUser(user);
            return of(
                user.role === 'ADMIN'
                    ? true
                    : router.createUrlTree(['/']),
            );
        }),
        // Network failure during profile fetch → treat as unauthorised.
        // The auth interceptor handles token expiry / redirect separately.
        map((result) => result),
    );
};
