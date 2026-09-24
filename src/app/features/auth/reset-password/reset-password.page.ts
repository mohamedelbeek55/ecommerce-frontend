import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

function passwordsMatchValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordsMismatch: true };
}

type PageState = 'form' | 'success' | 'token-error';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
})
export class ResetPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private resetToken: string | null = null;

  readonly state = signal<PageState>('form');
  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.group(
    {
      password: [
        '',
        [Validators.required, Validators.pattern(STRONG_PASSWORD_PATTERN)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParamMap.get('token');

    if (!this.resetToken) {
      this.state.set('token-error');
      this.errors.set([
        'Missing reset token. Please use the link from your email.',
      ]);
    }
  }

  onSubmit(): void {
    if (!this.resetToken || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errors.set([]);

    const { password } = this.form.getRawValue();

    this.authService.resetPassword(this.resetToken, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.state.set('success');
      },
      error: (err: NormalizedError) => {
        this.loading.set(false);
        this.errors.set(
          err.messages.length > 0
            ? err.messages
            : ['This reset link is invalid or has expired.'],
        );
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  get confirmPasswordControl() {
    return this.form.controls.confirmPassword;
  }

  get passwordsMismatch(): boolean {
    return (
      this.form.hasError('passwordsMismatch') &&
      !!this.confirmPasswordControl.touched
    );
  }
}
