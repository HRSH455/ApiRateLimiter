import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, interval, startWith, switchMap } from 'rxjs';
import { RateLimitRule, RateLimitRuleMap, RateLimitStats } from '../models/rate-limit.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RateLimitService {
  private baseUrl = `${environment.apiUrl}/admin/rate-limit`;

  constructor(private http: HttpClient) { }

  // Map-first config API
  getConfigMap(): Observable<RateLimitRuleMap> {
    return this.http.get<RateLimitRuleMap>(`${this.baseUrl}/config`);
  }

  updateConfigMap(config: RateLimitRuleMap): Observable<RateLimitRuleMap> {
    // Backend supports both PUT and POST; prefer POST for compatibility with spec
    return this.http.post<RateLimitRuleMap>(`${this.baseUrl}/config`, config);
  }

  getStats(): Observable<RateLimitStats> {
    return this.http.get<RateLimitStats>(`${this.baseUrl}/stats`);
  }

  getStatsPolling(periodMs = 3000): Observable<RateLimitStats> {
    return interval(periodMs).pipe(
      startWith(0),
      switchMap(() => this.getStats())
    );
  }

  clearKey(key: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/keys/${encodeURIComponent(key)}`);
  }

  getHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${environment.apiUrl}/actuator/health`);
  }

  // Request tester helpers (no HttpClient in components)
  sendGet<T = any>(url: string): Observable<HttpResponse<T>> {
    return this.http.get<T>(url, { observe: 'response' });
  }

  withApiBase(path: string): string {
    return `${environment.apiUrl}${path}`;
  }

  // Helpers to adapt map<path, rule> to array and back for tables
  mapToRows(mapInput: RateLimitRuleMap): Array<{ path: string; rule: RateLimitRule }> {
    return Object.entries(mapInput).map(([path, rule]) => ({ path, rule }));
  }

  rowsToMap(rows: Array<{ path: string; rule: RateLimitRule }>): RateLimitRuleMap {
    return rows.reduce<RateLimitRuleMap>((acc, row) => {
      acc[row.path] = row.rule;
      return acc;
    }, {} as RateLimitRuleMap);
  }
}