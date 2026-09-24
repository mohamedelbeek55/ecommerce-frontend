import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import type { Category } from '../../../core/models/category.model';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

/** Custom validator: value must be a non-negative integer. */
function nonNegativeInteger(control: import('@angular/forms').AbstractControl) {
    const v = control.value;
    if (v === null || v === '') return null; // let required handle empty
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) return { nonNegativeInteger: true };
    return null;
}

@Component({
    selector: 'app-admin-product-form-page',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './admin-product-form.page.html',
})
export class AdminProductFormPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);

    // ---------- Mode ----------
    /** null while loading, a product id string in edit mode, empty string in create mode. */
    readonly productId = signal<string | null>(null);
    readonly isEditMode = signal(false);

    // ---------- Data ----------
    readonly categories = signal<Category[]>([]);
    readonly pageLoading = signal(true);   // initial data fetch (edit: also loads product)
    readonly pageError = signal<string | null>(null);

    // ---------- Form ----------
    readonly form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
        price: [null as number | null, [Validators.required, Validators.min(0.01)]],
        stock: [null as number | null, [Validators.required, nonNegativeInteger]],
        categoryId: ['', [Validators.required]],
    });

    // ---------- Submit state ----------
    readonly submitting = signal(false);
    readonly errors = signal<string[]>([]);

    // Convenience getters
    get nameControl()        { return this.form.controls.name; }
    get descriptionControl() { return this.form.controls.description; }
    get priceControl()       { return this.form.controls.price; }
    get stockControl()       { return this.form.controls.stock; }
    get categoryIdControl()  { return this.form.controls.categoryId; }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        this.isEditMode.set(!!id);
        this.productId.set(id ?? '');

        // Load categories for the dropdown (needed in both create and edit).
        this.categoriesService.getCategories().subscribe({
            next: (cats) => {
                this.categories.set(cats);

                if (id) {
                    // Edit mode: also fetch the existing product to pre-fill the form.
                    this.productsService.getProduct(id).subscribe({
                        next: (p) => {
                            this.form.patchValue({
                                name: p.name,
                                description: p.description,
                                // price comes back as string (Decimal); parse to number for the form
                                price: parseFloat(p.price),
                                stock: p.stock,
                                categoryId: p.categoryId,
                            });
                            this.pageLoading.set(false);
                        },
                        error: (err: NormalizedError) => {
                            this.pageError.set(
                                err.statusCode === 404
                                    ? 'Product not found.'
                                    : (err.messages[0] ?? 'Failed to load product.'),
                            );
                            this.pageLoading.set(false);
                        },
                    });
                } else {
                    this.pageLoading.set(false);
                }
            },
            error: () => {
                this.pageError.set('Failed to load categories.');
                this.pageLoading.set(false);
            },
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        this.errors.set([]);

        const raw = this.form.getRawValue();
        const payload = {
            name: raw.name!.trim(),
            description: raw.description!.trim(),
            price: Number(raw.price),
            stock: Number(raw.stock),
            categoryId: raw.categoryId!,
        };

        const id = this.productId();
        const request$ = id
            ? this.productsService.updateProduct(id, payload)
            : this.productsService.createProduct(payload);

        request$.subscribe({
            next: () => {
                this.submitting.set(false);
                this.router.navigate(['/admin/products']);
            },
            error: (err: NormalizedError) => {
                this.errors.set(err.messages);
                this.submitting.set(false);
            },
        });
    }
}
