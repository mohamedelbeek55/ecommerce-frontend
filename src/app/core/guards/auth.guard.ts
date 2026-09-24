import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard for routes that require authentication.
 *
 * Authenticated users proceed; others are redirected to `/login` with the
 * attempted URL preserved as `returnUrl` so login can send them back afterward.
 *
 * Applied to cart, checkout, orders, account, and admin routes.
 */
export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
    });
};
