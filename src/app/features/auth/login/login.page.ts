import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { sanitizeReturnUrl } from '../../../shared/utils/return-url.util';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly showPassword = signal(false);
  private returnUrl: string | null = null;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);
  readonly emailNotVerified = signal(false);
  readonly resendLoading = signal(false);
  readonly resendVerificationMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.returnUrl = sanitizeReturnUrl(
      this.route.snapshot.queryParamMap.get('returnUrl'),
    );
  }

  /** Query params forwarded to register so returnUrl survives the auth loop. */
  get registerQueryParams(): { returnUrl: string } | null {
    return this.returnUrl ? { returnUrl: this.returnUrl } : null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errors.set([]);
    this.emailNotVerified.set(false);
    this.resendVerificationMessage.set(null);

    const { email, password } = this.form.getRawValue();
    const trimmedEmail = email!.trim().toLowerCase();

    this.authService.login(trimmedEmail!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        if (this.returnUrl) {
          void this.router.navigateByUrl(this.returnUrl);
        } else {
          void this.router.navigate(['/']);
        }
      },
      error: (err: NormalizedError) => {
        this.loading.set(false);

        if (err.statusCode === 403) {
          this.emailNotVerified.set(true);
          this.errors.set([
            'Your email address is not verified yet.',
            'Please check your inbox for the verification link, then try again.',
          ]);
          return;
        }

        this.errors.set(err.messages);
      },
    });
  }

  resendVerificationEmail(): void {
    const email = this.form.controls.email.value?.trim().toLowerCase();
    if (!email) {
      this.form.controls.email.markAsTouched();
      return;
    }

    this.resendLoading.set(true);
    this.resendVerificationMessage.set(null);

    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendVerificationMessage.set(
          'Verification email sent, please check your inbox.',
        );
      },
      error: () => {
        this.resendLoading.set(false);
        this.resendVerificationMessage.set(
          'Verification email sent, please check your inbox.',
        );
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

}
