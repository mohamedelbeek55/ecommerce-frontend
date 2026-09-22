import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

/**
 * Strong password: at least 8 chars, max 72, at least one lowercase letter,
 * one uppercase letter, one digit, and one special character.
 * Mirrors the backend's @IsStrongPassword rules (FRONTEND_CONTEXT.md §9).
 */
const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

/**
 * Cross-field validator: runs on the FormGroup and asserts that `password`
 * and `confirmPassword` contain the same value.
 */
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
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

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

  /** Separate toggle for each password field so users can reveal them independently. */
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errors.set([]);
    this.success.set(false);

    const { name, email, password } = this.form.getRawValue();

    // Match the backend's @Transform: trim + lowercase email, trim name.
    const trimmedEmail = email!.trim().toLowerCase();
    const trimmedName = name!.trim();

    this.authService.register(trimmedEmail, password!, trimmedName).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err: NormalizedError) => {
        this.loading.set(false);
        this.errors.set(err.messages);
      },
    });
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

  /** True when the two passwords differ and the confirm field has been touched. */
  get passwordsMismatch(): boolean {
    return (
      this.form.hasError('passwordsMismatch') &&
      !!this.confirmPasswordControl.touched
    );
  }
}