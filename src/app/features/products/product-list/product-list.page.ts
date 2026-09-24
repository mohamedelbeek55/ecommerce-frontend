import { Component, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import type { Product } from '../../../core/models/product.model';
import type { Category } from '../../../core/models/category.model';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-product-list-page',
    imports: [FormsModule, ProductCard],
    templateUrl: './product-list.page.html',
    styleUrl: './product-list.page.scss',
})
export class ProductListPage implements OnInit {
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);
    private readonly route = inject(ActivatedRoute);

    // ---------- Filter state (signals) ----------
    readonly searchTerm = signal('');
    readonly selectedCategoryId = signal<string | null>(null);
    readonly minPrice = signal<number | null>(null);
    readonly maxPrice = signal<number | null>(null);
    readonly sortBy = signal<'name' | 'price' | 'createdAt'>('createdAt');
    readonly sortOrder = signal<'asc' | 'desc'>('desc');
    readonly page = signal(1);
    readonly limit = 12;

    // ---------- UI state (signals) ----------
    readonly products = signal<Product[]>([]);
    readonly totalPages = signal(0);
    readonly total = signal(0);
    readonly categories = signal<Category[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    // ---------- Search debounce ----------
    // Bridges the raw input value → debounced → triggers a re-fetch.
    private readonly searchInput$ = new Subject<string>();

    constructor() {
        // Re-fetch whenever any filter changes.
        effect(() => {
            // Read all signals so the effect re-runs when any of them change.
            this.searchTerm();
            this.selectedCategoryId();
            this.minPrice();
            this.maxPrice();
            this.sortBy();
            this.sortOrder();
            this.page();

            // Trigger the actual fetch (untracked so it doesn't re-trigger on state inside).
            untracked(() => this.fetchProducts());
        });
    }

    ngOnInit(): void {
        const categoryId = this.route.snapshot.queryParamMap.get('categoryId');
        if (categoryId) {
            this.selectedCategoryId.set(categoryId);
        }

        const search = this.route.snapshot.queryParamMap.get('search');
        if (search?.trim()) {
            this.searchTerm.set(search.trim());
        }

        this.categoriesService.getCategories().subscribe({
            next: (cats) => this.categories.set(cats),
            error: () => this.categories.set([]),
        });

        // Debounce search input → 400ms after the user stops typing.
        this.searchInput$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((value) => {
                this.searchTerm.set(value);
                this.page.set(1); // Reset to page 1 on a new search
            });
    }

    onSearchInput(value: string): void {
        this.searchInput$.next(value);
    }

    onCategoryChange(value: string): void {
        this.selectedCategoryId.set(value || null);
        this.page.set(1);
    }

    onMinPriceChange(value: string): void {
        const num = value === '' ? null : Number(value);
        this.minPrice.set(num != null && !Number.isNaN(num) ? num : null);
        this.page.set(1);
    }

    onMaxPriceChange(value: string): void {
        const num = value === '' ? null : Number(value);
        this.maxPrice.set(num != null && !Number.isNaN(num) ? num : null);
        this.page.set(1);
    }

    onSortChange(value: string): void {
        // Format: "field-order", e.g. "price-asc"
        const [field, order] = value.split('-');
        this.sortBy.set(field as 'name' | 'price' | 'createdAt');
        this.sortOrder.set(order as 'asc' | 'desc');
        this.page.set(1);
    }

    onPageChange(newPage: number): void {
        if (newPage < 1 || newPage > this.totalPages()) return;
        this.page.set(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    clearFilters(): void {
        this.searchTerm.set('');
        this.selectedCategoryId.set(null);
        this.minPrice.set(null);
        this.maxPrice.set(null);
        this.sortBy.set('createdAt');
        this.sortOrder.set('desc');
        this.page.set(1);
    }

    /** Helper for the template: is any filter currently applied? */
    hasActiveFilters(): boolean {
        return (
            this.searchTerm().trim().length > 0 ||
            this.selectedCategoryId() !== null ||
            this.minPrice() !== null ||
            this.maxPrice() !== null
        );
    }

    /** Pagination helper: returns an array of page numbers to render. */
    getPageNumbers(): number[] {
        const total = this.totalPages();
        if (total <= 1) return [];

        const current = this.page();
        const pages: number[] = [];
        const start = Math.max(1, current - 2);
        const end = Math.min(total, current + 2);

        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }

    /** Resolves a categoryId to its display name; returns null if not found (template @if hides it). */
    getCategoryName(categoryId: string): string | null {
        return this.categories().find((c) => c.id === categoryId)?.name ?? null;
    }

    private fetchProducts(): void {
        this.loading.set(true);
        this.error.set(null);

        this.productsService
            .getProducts({
                page: this.page(),
                limit: this.limit,
                search: this.searchTerm() || undefined,
                categoryId: this.selectedCategoryId() || undefined,
                minPrice: this.minPrice() ?? undefined,
                maxPrice: this.maxPrice() ?? undefined,
                sortBy: this.sortBy(),
                sortOrder: this.sortOrder(),
            })
            .subscribe({
                next: (res) => {
                    this.products.set(res.data);
                    this.totalPages.set(res.meta.totalPages);
                    this.total.set(res.meta.total);
                    this.loading.set(false);
                },
                error: (err: NormalizedError) => {
                    this.error.set(err.messages[0] ?? 'Failed to load products.');
                    this.products.set([]);
                    this.loading.set(false);
                },
            });
    }
}