/**
 * Production environment (used by `ng build --configuration production`).
 */
export const environment = {
    production: true,
    apiUrl:
        'https://ecommerce-api-nestjs-production-f953.up.railway.app/api/v1',
    // TODO: replace with the actual Stripe test publishable key from the backend's Stripe dashboard
    stripePublishableKey: 'pk_test_placeholder',
};