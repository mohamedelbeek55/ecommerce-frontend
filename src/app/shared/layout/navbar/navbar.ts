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

    readonly isAuthenticated = this.authService.isAuthenticated;
    readonly currentUser = this.authService.currentUser;

    readonly mobileMenuOpen = signal(false);
    readonly userMenuOpen = signal(false);
    readonly searchQuery = signal('');

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

    onSearchSubmit(event: Event): void {
        event.preventDefault();
        const q = this.searchQuery().trim();
        this.closeAllMenus();
        this.searchQuery.set('');

        if (q) {
            void this.router.navigate(['/products'], { queryParams: { search: q } });
        } else {
            void this.router.navigate(['/products']);
        }
    }

    logout(): void {
        this.authService.logout().subscribe({
            next: () => this.handleLogoutComplete(),
            error: () => this.handleLogoutComplete(),
        });
    }

    private handleLogoutComplete(): void {
        this.closeAllMenus();
        this.router.navigate(['/']);
    }

    getUserDisplayName(): string {
        return this.currentUser()?.name ?? 'Account';
    }
}
