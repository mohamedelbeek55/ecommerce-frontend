import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, RouterOutlet],
    styles: [
        `
            :host {
                display: flex;
                flex: 1 1 auto;
                min-height: 0;
            }
        `,
    ],
    template: `
        <div class="flex min-h-0 flex-1 flex-col bg-background">
            <!-- Mobile overlay -->
            @if (isSidebarOpen) {
                <button
                    type="button"
                    class="fixed inset-0 z-40 bg-text/20 lg:hidden"
                    aria-label="Close admin menu"
                    (click)="closeSidebar()"
                ></button>
            }

            <div class="flex min-h-0 flex-1">
                <!-- Admin Sidebar -->
                <aside
                    class="fixed inset-y-0 left-0 z-50 flex h-full w-60 shrink-0 -translate-x-full flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:z-auto lg:h-auto lg:translate-x-0"
                    [class.translate-x-0]="isSidebarOpen"
                    aria-label="Admin navigation"
                >
                    <div class="flex h-full min-h-0 flex-col">
                        <!-- Sidebar Header -->
                        <div class="flex items-center justify-between border-b border-border px-5 py-4">
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    Administration
                                </p>
                                <h2 class="mt-0.5 text-base font-bold text-text">Admin Panel</h2>
                            </div>
                            <button
                                type="button"
                                class="rounded-md p-1.5 text-text-muted hover:bg-background hover:text-text transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Close admin menu"
                                (click)="closeSidebar()"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Navigation -->
                        <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                            <a
                                routerLink="/admin"
                                routerLinkActive="bg-hero text-primary font-semibold"
                                [routerLinkActiveOptions]="{ exact: true }"
                                class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                (click)="closeSidebarOnMobile()"
                            >
                                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Dashboard
                            </a>

                            <a
                                routerLink="/admin/products"
                                routerLinkActive="bg-hero text-primary font-semibold"
                                class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                (click)="closeSidebarOnMobile()"
                            >
                                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Products
                            </a>

                            <a
                                routerLink="/admin/categories"
                                routerLinkActive="bg-hero text-primary font-semibold"
                                class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                (click)="closeSidebarOnMobile()"
                            >
                                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Categories
                            </a>
                        </nav>

                        <!-- Back to Store -->
                        <div class="mt-auto border-t border-border p-3">
                            <a
                                routerLink="/"
                                class="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                (click)="closeSidebarOnMobile()"
                            >
                                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to store
                            </a>
                        </div>
                    </div>
                </aside>

                <!-- Admin Content -->
                <div class="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
                    <!-- Mobile Admin Header -->
                    <div class="flex items-center border-b border-border bg-surface px-4 py-3 lg:hidden">
                        <button
                            type="button"
                            class="rounded-md p-2 text-text-muted hover:bg-background hover:text-text transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Open admin menu"
                            (click)="openSidebar()"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <span class="ml-3 text-sm font-semibold text-text">Admin Panel</span>
                    </div>

                    <!-- Routed Admin Page -->
                    <main class="min-h-0 flex-1 overflow-y-auto">
                        <router-outlet />
                    </main>
                </div>
            </div>
        </div>
    `,
})
export class AdminLayout {
    isSidebarOpen = false;

    openSidebar(): void {
        this.isSidebarOpen = true;
    }

    closeSidebar(): void {
        this.isSidebarOpen = false;
    }

    closeSidebarOnMobile(): void {
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    }
}