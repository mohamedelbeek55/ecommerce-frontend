/**
 * Development environment (used by `ng serve` and
 * `ng build --configuration development`).
 */
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api/v1',
    // TODO: replace with the actual Stripe test publishable key from the backend's Stripe dashboard
    stripePublishableKey: 'pk_test_placeholder',
};