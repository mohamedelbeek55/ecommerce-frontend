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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { sanitizeReturnUrl } from '../../../shared/utils/return-url.util';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';
import { environment } from '../../../../environments/environment';

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
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('googleButton')
  private readonly googleButton?: ElementRef<HTMLElement>;

  readonly showPassword = signal(false);

  readonly loading = signal(false);
  readonly googleLoading = signal(false);

  readonly errors = signal<string[]>([]);
  readonly emailNotVerified = signal(false);

  readonly resendLoading = signal(false);
  readonly resendVerificationMessage = signal<string | null>(null);

  private returnUrl: string | null = null;

  private googleReadyTimer: ReturnType<typeof setTimeout> | null = null;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.returnUrl = sanitizeReturnUrl(
      this.route.snapshot.queryParamMap.get('returnUrl'),
    );
  }

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    if (this.googleReadyTimer) {
      clearTimeout(this.googleReadyTimer);
    }

    window.google?.accounts.id.cancel();
  }

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

    const email = this.form.controls.email.value ?? '';
    const password = this.form.controls.password.value ?? '';

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.navigateAfterLogin();
      },
      error: (error: NormalizedError) => {
        this.loading.set(false);

        if (error.statusCode === 403) {
          this.emailNotVerified.set(true);
          this.errors.set([
            'Your email address has not been verified yet.',
          ]);
          return;
        }

        this.errors.set(error.messages);
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
      this.errors.set(['Google sign-in failed. Please try again.']);
      return;
    }

    this.googleLoading.set(true);
    this.errors.set([]);
    this.emailNotVerified.set(false);
    this.resendVerificationMessage.set(null);

    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.googleLoading.set(false);
        this.navigateAfterLogin();
      },
      error: (error: NormalizedError) => {
        this.googleLoading.set(false);

        this.errors.set(
          error.messages?.length
            ? error.messages
            : ['Google sign-in failed. Please try again.'],
        );
      },
    });
  }

  private navigateAfterLogin(): void {
    const currentUser = this.authService.currentUser();

    if (currentUser?.role === 'ADMIN') {
      void this.router.navigate(['/admin']);
      return;
    }

    void this.router.navigate([this.returnUrl ?? '/']);
  }

  resendVerificationEmail(): void {
    const email = this.form.controls.email.value?.trim();

    if (!email || this.form.controls.email.invalid) {
      return;
    }

    this.resendLoading.set(true);
    this.resendVerificationMessage.set(null);

    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendVerificationMessage.set(
          'If an account exists with this email, a verification email has been sent.',
        );
      },
      error: () => {
        this.resendLoading.set(false);
        this.resendVerificationMessage.set(
          'If an account exists with this email, a verification email has been sent.',
        );
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }
}