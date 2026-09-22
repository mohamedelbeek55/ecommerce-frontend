import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import type { NormalizedError } from '../../../core/interceptors/error.interceptor';

/**
 * Page state machine:
 *   loading → (success | error)
 */
type PageState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-email-page',
  imports: [RouterLink],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss',
})
export class VerifyEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('error');
      this.errorMessage.set(
        'Missing verification token. Please use the link from your email.',
      );
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.state.set('success');
      },
      error: (err: NormalizedError) => {
        this.state.set('error');
        this.errorMessage.set(
          err.messages[0] ?? 'Verification failed. The link may be invalid or expired.',
        );
      },
    });
  }
}