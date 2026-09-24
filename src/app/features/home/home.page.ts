import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import type { Product } from '../../core/models/product.model';
import type { Category } from '../../core/models/category.model';

@Component({
    selector: 'app-home-page',
    imports: [RouterLink, ProductCard],
    templateUrl: './home.page.html',
    styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
    readonly authService = inject(AuthService);
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);

    readonly featuredProducts = signal<Product[]>([]);
    readonly categories = signal<Category[]>([]);
    readonly loadingFeatured = signal(true);
    readonly loadingCategories = signal(true);

    ngOnInit(): void {
        this.productsService
            .getProducts({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' })
            .subscribe({
                next: (res) => {
                    this.featuredProducts.set(res.data);
                    this.loadingFeatured.set(false);
                },
                error: () => {
                    this.featuredProducts.set([]);
                    this.loadingFeatured.set(false);
                },
            });

        this.categoriesService.getCategories().subscribe({
            next: (cats) => {
                this.categories.set(cats);
                this.loadingCategories.set(false);
            },
            error: () => {
                this.categories.set([]);
                this.loadingCategories.set(false);
            },
        });
    }

    getCategoryName(categoryId: string): string | null {
        return this.categories().find((c) => c.id === categoryId)?.name ?? null;
    }
}
