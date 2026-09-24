import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CategoriesService } from '../../../core/services/categories.service';
import type { Category } from '../../../core/models/category.model';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-admin-categories-page',
    imports: [RouterLink, DatePipe],
    templateUrl: './admin-categories.page.html',
})
export class AdminCategoriesPage implements OnInit {
    private readonly categoriesService = inject(CategoriesService);

    readonly categories = signal<Category[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    /** Per-row delete loading: categoryId → true while delete is in flight. */
    readonly deleting = signal<Record<string, boolean>>({});

    ngOnInit(): void {
        this.categoriesService.getCategories().subscribe({
            next: (cats) => {
                this.categories.set(cats);
                this.loading.set(false);
            },
            error: (err: NormalizedError) => {
                this.error.set(err.messages[0] ?? 'Failed to load categories.');
                this.loading.set(false);
            },
        });
    }

    onDelete(category: Category): void {
        if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;

        this.deleting.update((m) => ({ ...m, [category.id]: true }));
        this.error.set(null);

        this.categoriesService.deleteCategory(category.id).subscribe({
            next: () => {
                // Remove from local list without a full re-fetch.
                this.categories.update((list) => list.filter((c) => c.id !== category.id));
                this.deleting.update((m) => ({ ...m, [category.id]: false }));
            },
            error: (err: NormalizedError) => {
                // The backend returns 400 with a clear message when the category
                // still has products. Surface it directly so the admin knows why.
                this.error.set(err.messages[0] ?? 'Failed to delete category.');
                this.deleting.update((m) => ({ ...m, [category.id]: false }));
            },
        });
    }

    isDeleting(id: string): boolean {
        return this.deleting()[id] === true;
    }
}
