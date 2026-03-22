import { Component, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RateLimitService } from '../../services/rate-limit.service';

@Component({
  selector: 'app-request-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-tester.component.html',
  styleUrls: ['./request-tester.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestTesterComponent {
  endpoint = '';
  endpoints = ['/api/public', '/api/user', '/api/admin'];
  response: any = {};
  headers: { [key: string]: string } = {};
  errorMessage = '';

  readonly rateLimitService = inject(RateLimitService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.endpoint = this.rateLimitService.withApiBase('/api/public');
  }

  sendRequest(): void {
    this.errorMessage = '';
    this.rateLimitService.sendGet(this.endpoint).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(
      (res: HttpResponse<any>) => {
        this.response = { status: res.status, body: res.body };
        this.headers = {};
        res.headers.keys().forEach(key => {
          this.headers[key] = res.headers.get(key)!;
        });
      },
      (error) => {
        const status = error.status;
        if (status === 0) {
          this.errorMessage = 'Network error: backend unreachable or CORS blocked the request.';
        } else {
          this.errorMessage = `Error ${status}: ${error.message || error.statusText || 'unknown error'}`;
        }

        this.response = { status: status, body: error.error };
        this.headers = {};
        if (error.headers) {
          error.headers.keys().forEach((key: string) => {
            this.headers[key] = error.headers.get(key);
          });
        }
      }
    );
  }

  explainHeaders(): void {
    alert('Rate limit headers explain the current state:\n- RateLimit-Limit: Maximum requests allowed\n- RateLimit-Remaining: Requests left in current window\n- RateLimit-Reset: Unix timestamp when window resets');
  }

}