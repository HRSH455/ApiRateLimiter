import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, interval, startWith, switchMap } from 'rxjs';
import { RateLimitRule, RateLimitRuleMap, RateLimitStats } from '../models/rate-limit.model';
import { environment } from '../../environments/environment';

type HttpRequestOptions = {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | {
    [param: string]: string | number | boolean | readonly (string | number | boolean)[];
  };
  reportProgress?: boolean;
  withCredentials?: boolean;
  responseType?: 'json';
};

@Injectable({
  providedIn: 'root'
})

export class RateLimitService {
  private baseUrl = `${environment.apiUrl}/admin/rate-limit`;

  constructor(private http: HttpClient) { }

  private adminHeaders(): { headers: HttpHeaders } {
    const credentials = btoa(`${environment.adminUserName}:${environment.adminPassword}`);
    return {
      headers: new HttpHeaders({
        'Authorization': `Basic ${credentials}`
      })
    };
  }

  // Expose admin headers for request tester
  getAdminHeaders(): { headers: HttpHeaders } {
    return this.adminHeaders();
  }

  // Map-first config API
  getConfigMap(): Observable<RateLimitRuleMap> {
    return this.http.get<RateLimitRuleMap>(`${this.baseUrl}/config`, this.adminHeaders());
  }

  updateConfigMap(config: RateLimitRuleMap): Observable<RateLimitRuleMap> {
    return this.http.post<RateLimitRuleMap>(`${this.baseUrl}/config`, config, this.adminHeaders());
  }

  getStats(): Observable<RateLimitStats> {
    return this.http.get<RateLimitStats>(`${this.baseUrl}/stats`, this.adminHeaders());
  }

  getStatsPolling(periodMs = 3000): Observable<RateLimitStats> {
    return interval(periodMs).pipe(
      startWith(0),
      switchMap(() => this.getStats())
    );
  }

  clearKey(key: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/keys/${encodeURIComponent(key)}`, this.adminHeaders());
  }

  getHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${environment.apiUrl}/actuator/health`);
  }

  // Request tester helpers
  sendGet<T = any>(url: string, options: HttpRequestOptions = {}): Observable<HttpResponse<T>> {
    return this.http.get<T>(url, { ...options ,observe: 'response' as const});
  }

  sendPost<T = any>(url: string, body: any = {}, options: HttpRequestOptions = {}): Observable<HttpResponse<T>> {
    return this.http.post<T>(url, body, { ...options, observe: 'response' as const });
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