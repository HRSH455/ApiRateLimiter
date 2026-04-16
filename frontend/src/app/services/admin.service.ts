import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface RateLimitRule {
  keyPrefix: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  activeKeys: number;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly BASE_URL = 'http://localhost:8080/admin/rate-limit';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getStats(): Observable<RateLimitStats> {
    return this.http.get<RateLimitStats>(`${this.BASE_URL}/stats`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getConfig(): Observable<Record<string, RateLimitRule>> {
    return this.http.get<Record<string, RateLimitRule>>(`${this.BASE_URL}/config`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateConfig(rules: Record<string, RateLimitRule>): Observable<Record<string, RateLimitRule>> {
    return this.http.put<Record<string, RateLimitRule>>(`${this.BASE_URL}/config`, rules, {
      headers: this.auth.getAuthHeaders()
    });
  }

  clearKey(key: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/keys/${key}`, {
      headers: this.auth.getAuthHeaders()
    });
  }
}