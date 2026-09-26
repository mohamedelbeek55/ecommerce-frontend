import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './admin-dashboard.page.html',
})
export class AdminDashboardPage implements OnInit {
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);

    readonly totalProducts = signal(0);
    readonly totalCategories = signal(0);
    readonly lowStockProducts = signal(0);

    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    ngOnInit(): void {
        this.loadDashboard();
    }

    private loadDashboard(): void {
        this.loading.set(true);
        this.error.set(null);

        let productsLoaded = false;
        let categoriesLoaded = false;

        const checkLoadingComplete = (): void => {
            if (productsLoaded && categoriesLoaded) {
                this.loading.set(false);
            }
        };

        this.productsService
            .getProducts({
                page: 1,
                limit: 100,
            })
            .subscribe({
                next: (res) => {
                    this.totalProducts.set(res.meta.total);

                    const lowStock = res.data.filter(
                        (product) => product.stock < 5,
                    ).length;

                    this.lowStockProducts.set(lowStock);

                    productsLoaded = true;
                    checkLoadingComplete();
                },
                error: (err: NormalizedError) => {
                    this.error.set(
                        err.messages[0] ?? 'Failed to load product statistics.',
                    );

                    productsLoaded = true;
                    checkLoadingComplete();
                },
            });

        this.categoriesService.getCategories().subscribe({
            next: (categories) => {
                this.totalCategories.set(categories.length);

                categoriesLoaded = true;
                checkLoadingComplete();
            },
            error: (err: NormalizedError) => {
                this.error.set(
                    err.messages[0] ?? 'Failed to load category statistics.',
                );

                categoriesLoaded = true;
                checkLoadingComplete();
            },
        });
    }
}