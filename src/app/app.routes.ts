import { Routes } from '@angular/router';
import { AppLayout } from './shared/layout/app-layout/app-layout';

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

    // ----- App pages (with navbar/footer) -----
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./features/home/home.page').then((m) => m.HomePage),
            },
        ],
    },
];