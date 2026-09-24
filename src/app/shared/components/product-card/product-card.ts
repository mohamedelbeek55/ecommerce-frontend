import { Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Product } from '../../../core/models/product.model';

@Component({
    selector: 'app-product-card',
    imports: [CurrencyPipe, RouterLink],
    templateUrl: './product-card.html',
})
export class ProductCard {
    readonly product = input.required<Product>();
    readonly categoryName = input<string | null>(null);

    getInitials(name: string): string {
        return name.charAt(0).toUpperCase();
    }
}
