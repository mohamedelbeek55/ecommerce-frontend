import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { sanitizeReturnUrl } from '../../../shared/utils/return-url.util';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';
import { environment } from '../../../../environments/environment';

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

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;

  renderButton(
    element: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'small' | 'medium' | 'large';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number;
      logo_alignment?: 'left' | 'center';
    },
  ): void;

  cancel(): void;
}

interface GoogleGlobal {
  accounts: {
    id: GoogleAccountsId;
  };
}

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('googleButton')
  private readonly googleButton?: ElementRef<HTMLElement>;

  private returnUrl: string | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private googleReadyTimer: ReturnType<typeof setTimeout> | null = null;

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
  readonly googleLoading = signal(false);

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

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    this.stopCountdown();

    if (this.googleReadyTimer) {
      clearTimeout(this.googleReadyTimer);
    }

    window.google?.accounts.id.cancel();
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

  private initializeGoogleSignIn(): void {
    if (window.google?.accounts?.id) {
      this.renderGoogleButton();
      return;
    }

    this.googleReadyTimer = setTimeout(() => {
      this.initializeGoogleSignIn();
    }, 100);
  }

  private renderGoogleButton(): void {
    const element = this.googleButton?.nativeElement;

    if (!element || !window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: GoogleCredentialResponse) => {
        this.handleGoogleCredential(response);
      },
    });

    element.innerHTML = '';

    window.google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 350,
      logo_alignment: 'center',
    });
  }

  private handleGoogleCredential(
    response: GoogleCredentialResponse,
  ): void {
    if (!response.credential) {
      this.errors.set(['Google sign-up failed. Please try again.']);
      return;
    }

    this.googleLoading.set(true);
    this.errors.set([]);
    this.success.set(false);

    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.googleLoading.set(false);
        this.navigateAfterGoogleLogin();
      },
      error: (error: NormalizedError) => {
        this.googleLoading.set(false);

        this.errors.set(
          error.messages?.length
            ? error.messages
            : ['Google sign-up failed. Please try again.'],
        );
      },
    });
  }

  private navigateAfterGoogleLogin(): void {
    const currentUser = this.authService.currentUser();

    if (currentUser?.role === 'ADMIN') {
      void this.router.navigate(['/admin']);
      return;
    }

    void this.router.navigate([this.returnUrl ?? '/']);
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