/**
 * Role values from the backend. Backend uses ADMIN / CUSTOMER (not USER).
 */
export type UserRole = 'ADMIN' | 'CUSTOMER';

/**
 * User profile shape — matches UserProfileResponseDto on the backend.
 * Single source of truth for the user shape across the app.
 */
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}