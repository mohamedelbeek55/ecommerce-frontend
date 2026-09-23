/**
 * Default environment configuration.
 *
 * This file is the fallback for `ng serve` and `ng build` when no
 * `--configuration` flag is passed. It is replaced at build time by
 * `fileReplacements` in angular.json:
 *   - `--configuration development` → environment.development.ts
 *   - `--configuration production`  → environment.prod.ts
 */
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api/v1',
    // TODO: replace with the actual Stripe test publishable key from the backend's Stripe dashboard
    stripePublishableKey: 'pk_test_placeholder',
};