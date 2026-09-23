import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import type { NormalizedError } from '../../core/interceptors/error.interceptor';

@Component({
    selector: 'app-account-page',
    imports: [ReactiveFormsModule],
    templateUrl: './account.page.html',
})
export class AccountPage implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly usersService = inject(UsersService);

    readonly form = this.fb.group({
        name: [
            '',
            [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
        ],
    });

    // ---------- UI state ----------
    readonly loading = signal(false);
    readonly profileLoading = signal(false);
    readonly errors = signal<string[]>([]);
    readonly success = signal(false);

    private successTimer: ReturnType<typeof setTimeout> | null = null;

    /** Read-only fields derived from the user profile (not editable via this form). */
    readonly email = signal('');
    readonly role = signal('');

    get nameControl() {
        return this.form.controls.name;
    }

    ngOnInit(): void {
        const currentUser = this.authService.currentUser();

        if (currentUser) {
            this.prefillForm(currentUser.name, currentUser.email, currentUser.role);
        } else {
            // Direct navigation after a page refresh — currentUser signal is null
            // because AuthService hasn't fetched the profile yet. Fetch it now.
            this.profileLoading.set(true);
            this.usersService.getMe().subscribe({
                next: (user) => {
                    this.authService.setCurrentUser(user);
                    this.prefillForm(user.name, user.email, user.role);
                    this.profileLoading.set(false);
                },
                error: () => {
                    // Token may be expired — the auth interceptor will handle
                    // the redirect on the next authenticated request.
                    this.profileLoading.set(false);
                },
            });
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errors.set([]);
        this.success.set(false);

        const trimmedName = this.nameControl.value!.trim();

        this.usersService.updateMe(trimmedName).subscribe({
            next: (updatedUser) => {
                // Push the fresh profile into AuthService so the navbar name
                // updates immediately without a page reload.
                this.authService.setCurrentUser(updatedUser);
                this.prefillForm(updatedUser.name, updatedUser.email, updatedUser.role);
                this.loading.set(false);
                this.success.set(true);

                if (this.successTimer) clearTimeout(this.successTimer);
                this.successTimer = setTimeout(() => this.success.set(false), 3000);
            },
            error: (err: NormalizedError) => {
                this.errors.set(err.messages);
                this.loading.set(false);
            },
        });
    }

    private prefillForm(name: string, emailVal: string, roleVal: string): void {
        this.form.patchValue({ name });
        this.email.set(emailVal);
        this.role.set(roleVal);
    }
}
