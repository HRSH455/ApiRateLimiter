import { Component, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RateLimitService } from '../../services/rate-limit.service';
import { StatusBadgeComponent, MethodBadgeComponent } from '../../shared';

interface Endpoint {
  method: string;
  path: string;
  limit: string;
}

interface RequestHistory {
  status: number;
  path: string;
  duration: number;
}

@Component({
  selector: 'app-request-tester',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, MethodBadgeComponent],
  templateUrl: './request-tester.component.html',
  styleUrls: ['./request-tester.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestTesterComponent {
  userId = '';
  selectedEndpoint: Endpoint | null = null;
  response: any = null;
  headers: { [key: string]: string } = {};
  errorMessage = '';
  isLoading = false;
  showResponseBody = true;
  requestHistory: RequestHistory[] = [];

  readonly endpoints: Endpoint[] = [
    { method: 'GET', path: '/api/public', limit: '100/min' },
    { method: 'POST', path: '/api/auth/login', limit: '5/15min' },
    { method: 'GET', path: '/api/user', limit: '50/min' },
    { method: 'GET', path: '/api/admin', limit: '10/min' }
  ];

  readonly rateLimitService = inject(RateLimitService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.selectedEndpoint = this.endpoints[0];
  }

  selectEndpoint(endpoint: Endpoint): void {
    this.selectedEndpoint = endpoint;
  }

  sendRequest(): void {
    if (!this.selectedEndpoint) return;

    this.isLoading = true;
    this.errorMessage = '';
    const startTime = Date.now();

    const url = this.rateLimitService.withApiBase(this.selectedEndpoint.path);
    const fullUrl = this.userId ? `${url}?userId=${encodeURIComponent(this.userId)}` : url;

    this.rateLimitService.sendGet(fullUrl).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: HttpResponse<any>) => {
        const duration = Date.now() - startTime;
        this.handleResponse(res, duration);
        this.isLoading = false;
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        this.handleError(error, duration);
        this.isLoading = false;
      }
    });
  }

  fireRapidRequests(): void {
    if (!this.selectedEndpoint) return;

    this.isLoading = true;
    this.errorMessage = '';
    let completed = 0;
    const total = 10;

    for (let i = 0; i < total; i++) {
      setTimeout(() => {
        const startTime = Date.now();
        const url = this.rateLimitService.withApiBase(this.selectedEndpoint!.path);
        const fullUrl = this.userId ? `${url}?userId=${encodeURIComponent(this.userId)}` : url;

        this.rateLimitService.sendGet(fullUrl).subscribe({
          next: (res: HttpResponse<any>) => {
            const duration = Date.now() - startTime;
            this.addToHistory(res.status, this.selectedEndpoint!.path, duration);
            completed++;
            if (completed === total) {
              this.isLoading = false;
            }
          },
          error: (error) => {
            const duration = Date.now() - startTime;
            this.addToHistory(error.status || 0, this.selectedEndpoint!.path, duration);
            completed++;
            if (completed === total) {
              this.isLoading = false;
            }
          }
        });
      }, i * 100); // 100ms delay between requests
    }
  }

  private handleResponse(res: HttpResponse<any>, duration: number): void {
    this.response = {
      status: res.status,
      statusText: res.statusText,
      body: res.body,
      duration
    };
    this.headers = {};
    res.headers.keys().forEach(key => {
      this.headers[key] = res.headers.get(key)!;
    });
    this.addToHistory(res.status, this.selectedEndpoint!.path, duration);
  }

  private handleError(error: any, duration: number): void {
    const status = error.status || 0;
    this.response = {
      status,
      statusText: error.statusText || 'Error',
      body: error.error,
      duration
    };
    this.headers = {};
    if (error.headers) {
      error.headers.keys().forEach((key: string) => {
        this.headers[key] = error.headers.get(key);
      });
    }
    this.addToHistory(status, this.selectedEndpoint!.path, duration);

    if (status === 0) {
      this.errorMessage = 'Network error: backend unreachable or CORS blocked the request.';
    } else {
      this.errorMessage = `Error ${status}: ${error.message || error.statusText || 'unknown error'}`;
    }
  }

  private addToHistory(status: number, path: string, duration: number): void {
    this.requestHistory.unshift({ status, path, duration });
    if (this.requestHistory.length > 10) {
      this.requestHistory = this.requestHistory.slice(0, 10);
    }
  }

  toggleResponseBody(): void {
    this.showResponseBody = !this.showResponseBody;
  }

  getRateLimitHeaders(): { key: string; value: string }[] {
    return Object.entries(this.headers)
      .filter(([key]) => key.toLowerCase().startsWith('ratelimit'))
      .map(([key, value]) => ({ key, value }));
  }

  isRateLimited(): boolean {
    return this.response?.status === 429;
  }
}