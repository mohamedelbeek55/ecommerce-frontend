import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-admin-category-form-page',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './admin-category-form.page.html',
})
export class AdminCategoryFormPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly categoriesService = inject(CategoriesService);

    readonly categoryId = signal<string | null>(null);
    readonly isEditMode = signal(false);

    readonly pageLoading = signal(true);
    readonly pageError = signal<string | null>(null);

    readonly form = this.fb.group({
        // name: 2–50 chars — verified against CreateCategoryDto
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    });

    readonly submitting = signal(false);
    readonly errors = signal<string[]>([]);

    get nameControl() { return this.form.controls.name; }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        this.isEditMode.set(!!id);
        this.categoryId.set(id ?? null);

        if (id) {
            this.categoriesService.getCategory(id).subscribe({
                next: (cat) => {
                    this.form.patchValue({ name: cat.name });
                    this.pageLoading.set(false);
                },
                error: (err: NormalizedError) => {
                    this.pageError.set(
                        err.statusCode === 404
                            ? 'Category not found.'
                            : (err.messages[0] ?? 'Failed to load category.'),
                    );
                    this.pageLoading.set(false);
                },
            });
        } else {
            this.pageLoading.set(false);
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        this.errors.set([]);

        const name = this.nameControl.value!.trim();
        const id = this.categoryId();

        const request$ = id
            ? this.categoriesService.updateCategory(id, { name })
            : this.categoriesService.createCategory({ name });

        request$.subscribe({
            next: () => {
                this.submitting.set(false);
                this.router.navigate(['/admin/categories']);
            },
            error: (err: NormalizedError) => {
                this.errors.set(err.messages);
                this.submitting.set(false);
            },
        });
    }
}
