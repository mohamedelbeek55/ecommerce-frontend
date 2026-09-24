import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import type { Product } from '../../../core/models/product.model';
import type { Category } from '../../../core/models/category.model';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-admin-products-page',
    imports: [RouterLink, CurrencyPipe],
    templateUrl: './admin-products.page.html',
})
export class AdminProductsPage implements OnInit {
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);

    readonly products = signal<Product[]>([]);
    readonly categories = signal<Category[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    /** Per-row delete loading: productId → true while delete is in flight. */
    readonly deleting = signal<Record<string, boolean>>({});

    // Pagination
    readonly page = signal(1);
    readonly totalPages = signal(1);
    readonly total = signal(0);
    readonly limit = 20;

    ngOnInit(): void {
        this.categoriesService.getCategories().subscribe({
            next: (cats) => this.categories.set(cats),
            error: () => this.categories.set([]),
        });
        this.fetchProducts();
    }

    onPageChange(p: number): void {
        if (p < 1 || p > this.totalPages()) return;
        this.page.set(p);
        this.fetchProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onDelete(product: Product): void {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

        this.deleting.update((m) => ({ ...m, [product.id]: true }));
        this.error.set(null);

        this.productsService.deleteProduct(product.id).subscribe({
            next: () => {
                // Remove from local list without a full re-fetch.
                this.products.update((list) => list.filter((p) => p.id !== product.id));
                this.total.update((t) => t - 1);
                this.deleting.update((m) => ({ ...m, [product.id]: false }));
            },
            error: (err: NormalizedError) => {
                this.error.set(err.messages[0] ?? 'Failed to delete product.');
                this.deleting.update((m) => ({ ...m, [product.id]: false }));
            },
        });
    }

    getCategoryName(categoryId: string): string {
        return this.categories().find((c) => c.id === categoryId)?.name ?? '—';
    }

    isDeleting(id: string): boolean {
        return this.deleting()[id] === true;
    }

    private fetchProducts(): void {
        this.loading.set(true);
        this.error.set(null);

        this.productsService
            .getProducts({ page: this.page(), limit: this.limit, sortBy: 'createdAt', sortOrder: 'desc' })
            .subscribe({
                next: (res) => {
                    this.products.set(res.data);
                    this.totalPages.set(res.meta.totalPages);
                    this.total.set(res.meta.total);
                    this.loading.set(false);
                },
                error: (err: NormalizedError) => {
                    this.error.set(err.messages[0] ?? 'Failed to load products.');
                    this.loading.set(false);
                },
            });
    }
}
