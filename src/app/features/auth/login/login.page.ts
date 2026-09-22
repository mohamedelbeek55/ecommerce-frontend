import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly showPassword = signal(false);

  /** Reactive form with email + password. */
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /** UI state — using signals so Angular reactively updates the template. */
  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);

  /**
   * Handle form submission.
   * - Show loading state
   * - Call authService.login()
   * - On success: navigate to home
   * - On 403: show a specific "verify your email" message
   * - On other errors: display the normalized messages
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errors.set([]);

    const { email, password } = this.form.getRawValue();

    // Match the backend's @Transform: trim + lowercase email.
    const trimmedEmail = email!.trim().toLowerCase();

    this.authService.login(trimmedEmail!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        // TODO: route to a real home page (currently no home route exists).
        this.router.navigate(['/']);
      },
      error: (err: NormalizedError) => {
        this.loading.set(false);

        // 403 = email not verified. Show a distinct, helpful message.
        if (err.statusCode === 403) {
          this.errors.set([
            'Your email address is not verified yet.',
            'Please check your inbox for the verification link, then try again.',
          ]);
          return;
        }

        // Otherwise, show whatever the backend returned (already normalized).
        this.errors.set(err.messages);
      },
    });
  }
  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }
  /** Convenience getters used in the template for validation feedback. */
  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }
}