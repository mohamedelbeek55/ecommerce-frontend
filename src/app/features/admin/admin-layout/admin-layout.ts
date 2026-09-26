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
                    class="fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 -translate-x-full flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:z-auto lg:h-auto lg:translate-x-0"
                    [class.translate-x-0]="isSidebarOpen"
                >
                    <div class="flex h-full min-h-0 flex-col">
                        <!-- Sidebar Header -->
                        <div
                            class="flex items-center justify-between border-b border-border px-6 py-5"
                        >
                            <div>
                                <p
                                    class="text-xs font-semibold uppercase tracking-wider text-text-muted"
                                >
                                    Administration
                                </p>

                                <h2 class="mt-1 text-lg font-semibold text-text">
                                    Admin Panel
                                </h2>
                            </div>

                            <!-- Mobile close -->
                            <button
                                type="button"
                                class="rounded-md p-2 text-text-muted hover:bg-background hover:text-text lg:hidden"
                                aria-label="Close admin menu"
                                (click)="closeSidebar()"
                            >
                                ×
                            </button>
                        </div>

                        <!-- Navigation -->
                        <nav
                            class="flex-1 space-y-1 overflow-y-auto px-3 py-4"
                            aria-label="Admin navigation"
                        >
                            <a
                                routerLink="/admin"
                                routerLinkActive="bg-hero text-primary"
                                [routerLinkActiveOptions]="{ exact: true }"
                                class="block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text"
                                (click)="closeSidebarOnMobile()"
                            >
                                Dashboard
                            </a>

                            <a
                                routerLink="/admin/products"
                                routerLinkActive="bg-hero text-primary"
                                class="block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text"
                                (click)="closeSidebarOnMobile()"
                            >
                                Products
                            </a>

                            <a
                                routerLink="/admin/categories"
                                routerLinkActive="bg-hero text-primary"
                                class="block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text"
                                (click)="closeSidebarOnMobile()"
                            >
                                Categories
                            </a>
                        </nav>

                        <!-- Back to Store -->
                        <div class="mt-auto border-t border-border p-3">
                            <a
                                routerLink="/"
                                class="block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text"
                                (click)="closeSidebarOnMobile()"
                            >
                                ← Back to store
                            </a>
                        </div>
                    </div>
                </aside>

                <!-- Admin Content -->
                <div class="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
                    <!-- Mobile Admin Header -->
                    <div
                        class="flex items-center border-b border-border bg-surface px-4 py-3 lg:hidden"
                    >
                        <button
                            type="button"
                            class="rounded-md p-2 text-text-muted hover:bg-background hover:text-text"
                            aria-label="Open admin menu"
                            (click)="openSidebar()"
                        >
                            ☰
                        </button>

                        <span class="ml-3 text-sm font-semibold text-text">
                            Admin Panel
                        </span>
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