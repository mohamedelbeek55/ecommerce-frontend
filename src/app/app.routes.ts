import { Routes } from '@angular/router';
import { AppLayout } from './shared/layout/app-layout/app-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // ----- Auth pages (fullscreen, no navbar/footer) -----
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login.page').then((m) => m.LoginPage),
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./features/auth/register/register.page').then((m) => m.RegisterPage),
    },
    {
        path: 'verify-email',
        loadComponent: () =>
            import('./features/auth/verify-email/verify-email.page').then(
                (m) => m.VerifyEmailPage,
            ),
    },

    // ----- App pages (with navbar/footer via AppLayout) -----
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./features/home/home.page').then((m) => m.HomePage),
            },
            {
                path: 'products',
                loadComponent: () =>
                    import('./features/products/product-list/product-list.page').then(
                        (m) => m.ProductListPage,
                    ),
            },
            {
                path: 'products/:id',
                loadComponent: () =>
                    import('./features/products/product-detail/product-detail.page').then(
                        (m) => m.ProductDetailPage,
                    ),
            },
            {
                path: 'cart',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/cart/cart.page').then((m) => m.CartPage),
            },
            {
                path: 'checkout/:orderId',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/checkout/checkout.page').then(
                        (m) => m.CheckoutPage,
                    ),
            },
            {
                path: 'orders',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/orders/order-history.page').then(
                        (m) => m.OrderHistoryPage,
                    ),
            },
            {
                path: 'orders/:id',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/orders/order-detail.page').then(
                        (m) => m.OrderDetailPage,
                    ),
            },
            {
                path: 'account',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/account/account.page').then(
                        (m) => m.AccountPage,
                    ),
            },
        ],
    },
];
