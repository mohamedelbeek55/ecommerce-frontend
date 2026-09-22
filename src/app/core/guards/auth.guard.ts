import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that protects routes requiring authentication.
 *
 * If the user is authenticated → allow navigation.
 * If not → redirect to `/login` (route does not exist yet — will be created
 * in the next iteration, before this guard is actually applied to any route).
 *
 * Not applied to any route yet — this file is prepared for future use.
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/login']);
};