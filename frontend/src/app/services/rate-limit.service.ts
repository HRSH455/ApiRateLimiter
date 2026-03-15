import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RateLimitRule, RateLimitStats } from '../models/rate-limit.model';

@Injectable({
  providedIn: 'root'
})
export class RateLimitService {
  private baseUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  getConfig(): Observable<RateLimitRule[]> {
    return this.http.get<RateLimitRule[]>(`${this.baseUrl}/config`);
  }

  updateConfig(config: RateLimitRule[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/config`, config);
  }

  getStats(): Observable<RateLimitStats> {
    return this.http.get<RateLimitStats>(`${this.baseUrl}/stats`);
  }

  testRequest(endpoint: string): Observable<any> {
    return this.http.get(endpoint);
  }
}