import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { RateLimitService } from '../../services/rate-limit.service';
import { StatusBadgeComponent, MethodBadgeComponent } from '../../shared';
import { ActivityFeedService } from '../../services/activity-feed.service';

interface Endpoint {
  method: 'GET';
  path: string;
  limit: string;
  requiresAuth?: boolean;
  custom?: boolean;
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

  // Custom endpoint fields
  showCustomForm = false;
  customPath = '';
  customRequiresAuth = false;

  readonly endpoints: Endpoint[] = [
    { method: 'GET', path: '/api/public',  limit: '100/min' },
    { method: 'GET', path: '/api/user',    limit: '50/min' },
    { method: 'GET', path: '/api/admin',   limit: '10/min', requiresAuth: true }
  ];

  customEndpoints: Endpoint[] = [];

  private readonly cdr              = inject(ChangeDetectorRef);
  private readonly destroyRef       = inject(DestroyRef);
  private readonly activityFeedService = inject(ActivityFeedService);
  readonly rateLimitService         = inject(RateLimitService);

  constructor() {
    this.selectedEndpoint = this.endpoints[0];
  }

  get allEndpoints(): Endpoint[] {
    return [...this.endpoints, ...this.customEndpoints];
  }

  selectEndpoint(endpoint: Endpoint): void {
    this.selectedEndpoint = endpoint;
  }

  toggleCustomForm(): void {
    this.showCustomForm = !this.showCustomForm;
    this.cdr.markForCheck();
  }

  addCustomEndpoint(): void {
    const path = this.customPath.trim();
    if (!path) return;
    const normalized = path.startsWith('/') ? path : '/' + path;
    const endpoint: Endpoint = {
      method: 'GET',
      path: normalized,
      limit: 'unknown',
      requiresAuth: this.customRequiresAuth,
      custom: true
    };
    this.customEndpoints = [...this.customEndpoints, endpoint];
    this.selectedEndpoint = endpoint;
    this.customPath = '';
    this.customRequiresAuth = false;
    this.showCustomForm = false;
    this.cdr.markForCheck();
  }

  removeCustomEndpoint(endpoint: Endpoint): void {
    this.customEndpoints = this.customEndpoints.filter(e => e !== endpoint);
    if (this.selectedEndpoint === endpoint) {
      this.selectedEndpoint = this.endpoints[0];
    }
    this.cdr.markForCheck();
  }

  private buildHttpOptions(): object {
    if (this.selectedEndpoint?.requiresAuth) {
      return this.rateLimitService.getAdminHeaders();
    }
    return {};
  }

  sendRequest(): void {
    if (!this.selectedEndpoint) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const startTime = Date.now();
    const url = this.rateLimitService.withApiBase(this.selectedEndpoint.path);
    const fullUrl = this.userId
      ? `${url}?userId=${encodeURIComponent(this.userId)}`
      : url;
    const httpOptions = this.buildHttpOptions();

    this.rateLimitService
      .sendGet(fullUrl, httpOptions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: HttpResponse<any>) => {
          const duration = Date.now() - startTime;
          this.handleResponse(res, duration);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.handleError(error, duration);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  fireRapidRequests(): void {
    if (!this.selectedEndpoint) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    let completed = 0;
    const total = 10;
    // BUG FIX: capture snapshot before the loop — user could switch endpoints mid-fire
    const endpoint = this.selectedEndpoint;
    const httpOptions = this.buildHttpOptions();

    for (let i = 0; i < total; i++) {
      setTimeout(() => {
        const startTime = Date.now();
        const url = this.rateLimitService.withApiBase(endpoint.path);
        const fullUrl = this.userId
          ? `${url}?userId=${encodeURIComponent(this.userId)}`
          : url;

        // BUG FIX: use take(1) — this is inside a method, not construction time
        this.rateLimitService.sendGet(fullUrl, httpOptions).pipe(take(1)).subscribe({
          next: (res: HttpResponse<any>) => {
            const duration = Date.now() - startTime;
            this.addToHistory(res.status, endpoint.path, duration, endpoint);
            completed++;
            if (completed === total) {
              this.isLoading = false;
            }
            this.cdr.markForCheck();
          },
          error: (error) => {
            const duration = Date.now() - startTime;
            this.addToHistory(error.status || 0, endpoint.path, duration, endpoint);
            completed++;
            if (completed === total) {
              this.isLoading = false;
            }
            this.cdr.markForCheck();
          }
        });
      }, i * 100);
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
    } else if (status === 401) {
      this.errorMessage = 'Unauthorized: check admin credentials in environment.ts.';
    } else if (status === 429) {
      this.errorMessage = `Rate limited: too many requests to ${this.selectedEndpoint?.path}.`;
    } else {
      this.errorMessage = `Error ${status}: ${error.message || error.statusText || 'unknown error'}`;
    }
  }

  // BUG FIX: accept optional endpoint arg so fireRapidRequests can pass its snapshot
  private addToHistory(status: number, path: string, duration: number, endpoint?: Endpoint): void {
    this.requestHistory = [{ status, path, duration }, ...this.requestHistory].slice(0, 10);

    this.activityFeedService.push({
      time: new Date(),
      method: (endpoint ?? this.selectedEndpoint)?.method ?? 'GET',
      path,
      status,
      duration
    });
  }

  toggleResponseBody(): void {
    this.showResponseBody = !this.showResponseBody;
    this.cdr.markForCheck();
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