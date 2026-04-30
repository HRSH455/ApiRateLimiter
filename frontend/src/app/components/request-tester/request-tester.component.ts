import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitRuleMap } from '../../models/rate-limit.model';
import { StatusBadgeComponent, MethodBadgeComponent } from '../../shared';
import { ActivityFeedService } from '../../services/activity-feed.service';
import { AuthService } from '../../services/auth.service';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface Endpoint {
  method: HttpMethod;
  path: string;
  limit: string;
  requiresAuth?: boolean;
  fromConfig?: boolean;
  custom?: boolean;
}

interface RequestHistory {
  status: number;
  path: string;
  method: HttpMethod;
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
export class RequestTesterComponent implements OnInit {
  userId = '';
  selectedEndpoint: Endpoint | null = null;
  response: any = null;
  headers: { [key: string]: string } = {};
  errorMessage = '';
  isLoading = false;
  configLoading = false;
  showResponseBody = true;
  requestHistory: RequestHistory[] = [];

  showCustomForm = false;
  customPath = '';
  customMethod: HttpMethod = 'GET';
  customRequiresAuth = false;

  configEndpoints: Endpoint[] = [];
  customEndpoints: Endpoint[] = [];

  showAuthPrompt = false;
  authUsername = '';
  authPassword = '';
  authError = '';

  readonly httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

  readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activityFeedService = inject(ActivityFeedService);
  readonly rateLimitService = inject(RateLimitService);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.loadConfigEndpoints();
  }

  loadConfigEndpoints(): void {
    this.configLoading = true;
    this.cdr.markForCheck();

    this.rateLimitService.getConfigMap().pipe(take(1)).subscribe({
      next: (config: RateLimitRuleMap) => {
        this.configEndpoints = Object.entries(config).map(([path, rule]) => ({
          method: 'GET' as HttpMethod,
          path,
          limit: `${rule.limit}/${rule.windowSecs}s`,
          requiresAuth: path.includes('admin'),
          fromConfig: true
        }));

        if (!this.selectedEndpoint && this.configEndpoints.length > 0) {
          this.selectedEndpoint = this.configEndpoints[0];
        }

        this.configLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.configLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get allEndpoints(): Endpoint[] {
    return [...this.configEndpoints, ...this.customEndpoints];
  }

  selectEndpoint(endpoint: Endpoint): void {
    this.selectedEndpoint = endpoint;
    this.response = null;
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  toggleCustomForm(): void {
    this.showCustomForm = !this.showCustomForm;
    this.cdr.markForCheck();
  }

  addCustomEndpoint(): void {
    const path = this.customPath.trim();
    if (!path) return;

    const normalized = path.startsWith('/') ? path : '/' + path;

    if (this.allEndpoints.some(e => e.path === normalized && e.method === this.customMethod)) {
      this.errorMessage = `${this.customMethod} ${normalized} already exists in the list.`;
      this.cdr.markForCheck();
      return;
    }

    const endpoint: Endpoint = {
      method: this.customMethod,
      path: normalized,
      limit: 'unknown',
      requiresAuth: this.customRequiresAuth,
      custom: true
    };

    this.customEndpoints = [...this.customEndpoints, endpoint];
    this.selectedEndpoint = endpoint;
    this.customPath = '';
    this.customMethod = 'GET';
    this.customRequiresAuth = false;
    this.showCustomForm = false;
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  removeCustomEndpoint(endpoint: Endpoint): void {
    this.customEndpoints = this.customEndpoints.filter(e => e !== endpoint);
    if (this.selectedEndpoint === endpoint) {
      this.selectedEndpoint = this.allEndpoints[0] ?? null;
    }
    this.cdr.markForCheck();
  }

  private buildHttpOptions(): object {
    if (this.selectedEndpoint?.requiresAuth) {
      return { headers: this.authService.getAuthHeaders() };
    }
    return {};
  }

  private buildHeadersMap(httpHeaders: any): { [key: string]: string } {
    const map: { [key: string]: string } = {};
    if (httpHeaders?.keys) {
      httpHeaders.keys().forEach((key: string) => {
        map[key] = httpHeaders.get(key)!;
      });
    }
    return map;
  }

  sendRequest(): void {
    if (!this.selectedEndpoint) return;

    if (this.selectedEndpoint.requiresAuth && !this.authService.isLoggedIn()) {
      this.showAuthPrompt = true;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const startTime = Date.now();
    const endpoint = this.selectedEndpoint;
    const url = this.rateLimitService.withApiBase(endpoint.path);
    const fullUrl = this.userId ? `${url}?userId=${encodeURIComponent(this.userId)}` : url;
    const httpOptions = this.buildHttpOptions();

    const request$ = endpoint.method === 'GET'
      ? this.rateLimitService.sendGet(fullUrl, httpOptions)
      : this.rateLimitService.sendPost(fullUrl, {}, httpOptions);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: HttpResponse<any>) => {
        this.handleResponse(res, Date.now() - startTime);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.handleError(error, Date.now() - startTime);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  submitAuth(): void {
    this.authService.setCredentials(this.authUsername, this.authPassword);

    this.rateLimitService.sendGet(
      this.rateLimitService.withApiBase('/admin/rate-limit/stats'),
      { headers: this.authService.getAuthHeaders() }
    ).pipe(take(1)).subscribe({
      next: () => {
        this.showAuthPrompt = false;
        this.authError = '';
        this.authUsername = '';
        this.authPassword = '';
        this.sendRequest();
        this.cdr.markForCheck();
      },
      error: () => {
        this.authError = 'Invalid credentials. Try again.';
        this.authService.clearCredentials();
        this.cdr.markForCheck();
      }
    });
  }

  fireRapidRequests(): void {
    if (!this.selectedEndpoint) return;

    if (this.selectedEndpoint.requiresAuth && !this.authService.isLoggedIn()) {
      this.showAuthPrompt = true;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    let completed = 0;
    const total = 10;
    const endpoint = this.selectedEndpoint;
    const httpOptions = this.buildHttpOptions();

    for (let i = 0; i < total; i++) {
      setTimeout(() => {
        const startTime = Date.now();
        const url = this.rateLimitService.withApiBase(endpoint.path);
        const fullUrl = this.userId ? `${url}?userId=${encodeURIComponent(this.userId)}` : url;

        const request$ = endpoint.method === 'GET'
          ? this.rateLimitService.sendGet(fullUrl, httpOptions)
          : this.rateLimitService.sendPost(fullUrl, {}, httpOptions);

        request$.pipe(take(1)).subscribe({
          next: (res: HttpResponse<any>) => {
            const duration = Date.now() - startTime;

            // new object references — OnPush safe
            this.response = { status: res.status, statusText: res.statusText, body: res.body, duration };
            this.headers = this.buildHeadersMap(res.headers);

            this.addToHistory(res.status, endpoint.path, duration, endpoint);
            completed++;
            if (completed === total) this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            const duration = Date.now() - startTime;

            // new object references — OnPush safe
            this.response = { status: error.status || 0, statusText: error.statusText || 'Error', body: error.error, duration };
            this.headers = this.buildHeadersMap(error.headers);

            this.addToHistory(error.status || 0, endpoint.path, duration, endpoint);
            completed++;
            if (completed === total) {
              this.isLoading = false;
              if (error.status === 429) {
                this.errorMessage = `Rate limited: too many requests to ${endpoint.path}.`;
              }
            }
            this.cdr.markForCheck();
          }
        });
      }, i * 100);
    }
  }

  private handleResponse(res: HttpResponse<any>, duration: number): void {
    this.response = { status: res.status, statusText: res.statusText, body: res.body, duration };
    this.headers = this.buildHeadersMap(res.headers);
    this.addToHistory(res.status, this.selectedEndpoint!.path, duration);
    this.cdr.markForCheck();
  }

  private handleError(error: any, duration: number): void {
    const status = error.status || 0;
    this.response = { status, statusText: error.statusText || 'Error', body: error.error, duration };
    this.headers = this.buildHeadersMap(error.headers);
    this.addToHistory(status, this.selectedEndpoint!.path, duration);

    if (status === 0) {
      this.errorMessage = 'Network error: backend unreachable or CORS blocked the request.';
    } else if (status === 401) {
      this.errorMessage = this.selectedEndpoint?.requiresAuth
        ? 'Unauthorized: check admin credentials in environment.ts.'
        : 'Unauthorized: this endpoint requires auth. Enable "Requires Auth" when adding it.';
    } else if (status === 404) {
      this.errorMessage = this.selectedEndpoint?.fromConfig
        ? `Not found: ${this.selectedEndpoint.path} has a rate limit rule but no backend handler. Check DemoApiController.`
        : `Not found: ${this.selectedEndpoint?.path} doesn't exist on the backend.`;
    } else if (status === 429) {
      this.errorMessage = `Rate limited: too many requests to ${this.selectedEndpoint?.path}.`;
    } else {
      this.errorMessage = `Error ${status}: ${error.message || error.statusText || 'unknown error'}`;
    }

    this.cdr.markForCheck();
  }

  private addToHistory(status: number, path: string, duration: number, endpoint?: Endpoint): void {
    const method = (endpoint ?? this.selectedEndpoint)?.method ?? 'GET';
    this.requestHistory = [{ status, path, method, duration }, ...this.requestHistory].slice(0, 10);
    this.activityFeedService.push({ time: new Date(), method, path, status, duration });
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