import {
    Component,
    OnDestroy,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import type {
    Product,
    ProductImage,
} from '../../../core/models/product.model';
import type { Category } from '../../../core/models/category.model';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

/** Custom validator: value must be a non-negative integer. */
function nonNegativeInteger(
    control: import('@angular/forms').AbstractControl,
) {
    const v = control.value;

    if (v === null || v === '') {
        return null;
    }

    const n = Number(v);

    if (!Number.isInteger(n) || n < 0) {
        return { nonNegativeInteger: true };
    }

    return null;
}

@Component({
    selector: 'app-admin-product-form-page',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './admin-product-form.page.html',
})
export class AdminProductFormPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);
    private readonly productsService = inject(ProductsService);
    private readonly categoriesService = inject(CategoriesService);

    private readonly maxImages = 5;
    private readonly maxImageSize = 5 * 1024 * 1024;

    // ---------- Mode ----------

    /** Product ID in edit mode, null in create mode. */
    readonly productId = signal<string | null>(null);
    readonly isEditMode = signal(false);

    // ---------- Data ----------

    readonly categories = signal<Category[]>([]);
    readonly pageLoading = signal(true);
    readonly pageError = signal<string | null>(null);

    readonly existingImages = signal<ProductImage[]>([]);
    readonly selectedImages = signal<File[]>([]);
    readonly imagePreviews = signal<string[]>([]);

    readonly imageError = signal<string | null>(null);

    // ---------- Form ----------

    readonly form = this.fb.group({
        name: [
            '',
            [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(100),
            ],
        ],

        description: [
            '',
            [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(1000),
            ],
        ],

        price: [
            null as number | null,
            [
                Validators.required,
                Validators.min(0.01),
            ],
        ],

        stock: [
            null as number | null,
            [
                Validators.required,
                nonNegativeInteger,
            ],
        ],

        categoryId: [
            '',
            [Validators.required],
        ],
    });

    // ---------- Submit state ----------

    readonly submitting = signal(false);
    readonly errors = signal<string[]>([]);

    // ---------- Convenience getters ----------

    get nameControl() {
        return this.form.controls.name;
    }

    get descriptionControl() {
        return this.form.controls.description;
    }

    get priceControl() {
        return this.form.controls.price;
    }

    get stockControl() {
        return this.form.controls.stock;
    }

    get categoryIdControl() {
        return this.form.controls.categoryId;
    }

    // ---------- Lifecycle ----------

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        this.isEditMode.set(!!id);
        this.productId.set(id);

        this.categoriesService.getCategories().subscribe({
            next: (cats) => {
                this.categories.set(cats);

                if (id) {
                    this.loadProduct(id);
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

    ngOnDestroy(): void {
        this.revokePreviewUrls();
    }

    // ---------- Product loading ----------

    private loadProduct(id: string): void {
        this.productsService.getProduct(id).subscribe({
            next: (product) => {
                this.form.patchValue({
                    name: product.name,
                    description: product.description,
                    price: parseFloat(product.price),
                    stock: product.stock,
                    categoryId: product.categoryId,
                });

                this.existingImages.set(product.images ?? []);
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
    }

    // ---------- Image handling ----------

    onImagesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);

        this.imageError.set(null);

        if (files.length === 0) {
            return;
        }

        const currentCount = this.selectedImages().length;
        const totalCount = currentCount + files.length;

        if (totalCount > this.maxImages) {
            this.imageError.set(
                `You can upload a maximum of ${this.maxImages} images.`,
            );

            input.value = '';
            return;
        }

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                this.imageError.set(
                    `"${file.name}" is not a valid image file.`,
                );

                input.value = '';
                return;
            }

            if (file.size > this.maxImageSize) {
                this.imageError.set(
                    `"${file.name}" is larger than 5MB.`,
                );

                input.value = '';
                return;
            }
        }

        this.selectedImages.update((current) => [
            ...current,
            ...files,
        ]);

        this.imagePreviews.update((current) => [
            ...current,
            ...files.map((file) => URL.createObjectURL(file)),
        ]);

        // Allow selecting the same file again after removing it.
        input.value = '';
    }

    removeSelectedImage(index: number): void {
        const previews = this.imagePreviews();

        if (previews[index]) {
            URL.revokeObjectURL(previews[index]);
        }

        this.selectedImages.update((images) =>
            images.filter((_, i) => i !== index),
        );

        this.imagePreviews.update((images) =>
            images.filter((_, i) => i !== index),
        );

        this.imageError.set(null);
    }

    private revokePreviewUrls(): void {
        for (const url of this.imagePreviews()) {
            URL.revokeObjectURL(url);
        }
    }

    // ---------- Submit ----------

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.imageError.set(null);
        this.errors.set([]);

        const selectedImages = this.selectedImages();

        // Create requires at least one image because the backend
        // contract requires 1–5 images for product creation.
        if (!this.isEditMode() && selectedImages.length === 0) {
            this.imageError.set(
                'Please select at least one product image.',
            );

            return;
        }

        if (selectedImages.length > this.maxImages) {
            this.imageError.set(
                `You can upload a maximum of ${this.maxImages} images.`,
            );

            return;
        }

        this.submitting.set(true);

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
            ? this.productsService.updateProduct(
                id,
                payload,
                selectedImages,
            )
            : this.productsService.createProduct(
                payload,
                selectedImages,
            );

        request$.subscribe({
            next: () => {
                this.submitting.set(false);

                this.router.navigate([
                    '/admin/products',
                ]);
            },

            error: (err: NormalizedError) => {
                this.errors.set(err.messages);

                this.submitting.set(false);
            },
        });
    }
}