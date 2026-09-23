import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    readonly cartService = inject(CartService);

    /** Expose signals from AuthService to the template. */
    readonly isAuthenticated = this.authService.isAuthenticated;
    readonly currentUser = this.authService.currentUser;

    /** UI state for the two dropdowns (signals → reactive templates). */
    readonly mobileMenuOpen = signal(false);
    readonly userMenuOpen = signal(false);

    toggleMobileMenu(): void {
        this.mobileMenuOpen.update((v) => !v);
    }

    toggleUserMenu(): void {
        this.userMenuOpen.update((v) => !v);
    }

    closeAllMenus(): void {
        this.mobileMenuOpen.set(false);
        this.userMenuOpen.set(false);
    }

    logout(): void {
        // The service always clears local tokens (finalize), so navigate either way.
        this.authService.logout().subscribe({
            next: () => this.handleLogoutComplete(),
            error: () => this.handleLogoutComplete(),
        });
    }

    private handleLogoutComplete(): void {
        this.closeAllMenus();
        this.router.navigate(['/']);
    }

    /** Display name for the user menu — fallback while profile is loading. */
    getUserDisplayName(): string {
        return this.currentUser()?.name ?? 'Account';
    }
}