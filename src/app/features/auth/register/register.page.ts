import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { sanitizeReturnUrl } from '../../../shared/utils/return-url.util';
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

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private returnUrl: string | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  readonly form = this.fb.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      password: [
        '',
        [Validators.required, Validators.pattern(STRONG_PASSWORD_PATTERN)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);
  readonly success = signal(false);

  readonly resendLoading = signal(false);
  readonly resendSuccess = signal(false);
  readonly resendErrors = signal<string[]>([]);
  readonly resendCountdown = signal(0);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  ngOnInit(): void {
    this.returnUrl = sanitizeReturnUrl(
      this.route.snapshot.queryParamMap.get('returnUrl'),
    );
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  get loginQueryParams(): { returnUrl: string } | null {
    return this.returnUrl ? { returnUrl: this.returnUrl } : null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errors.set([]);
    this.success.set(false);

    const { name, email, password } = this.form.getRawValue();

    const trimmedEmail = email!.trim().toLowerCase();
    const trimmedName = name!.trim();

    this.authService.register(trimmedEmail, password!, trimmedName).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.startCountdown();
      },
      error: (err: NormalizedError) => {
        this.loading.set(false);
        this.errors.set(err.messages);
      },
    });
  }

  resendVerification(): void {
    if (
      this.resendCountdown() > 0 ||
      this.resendLoading() ||
      !this.emailControl.value
    ) {
      return;
    }

    const email = this.emailControl.value.trim().toLowerCase();

    this.resendLoading.set(true);
    this.resendSuccess.set(false);
    this.resendErrors.set([]);

    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendSuccess.set(true);
        this.startCountdown();
      },
      error: (err: NormalizedError) => {
        this.resendLoading.set(false);
        this.resendErrors.set(err.messages);
      },
    });
  }

  private startCountdown(): void {
    this.stopCountdown();

    this.resendCountdown.set(60);

    this.countdownTimer = setInterval(() => {
      const remaining = this.resendCountdown();

      if (remaining <= 1) {
        this.resendCountdown.set(0);
        this.stopCountdown();
        return;
      }

      this.resendCountdown.set(remaining - 1);
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  get nameControl() {
    return this.form.controls.name;
  }

  get emailControl() {
    return this.form.controls.email;
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