import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RateLimitRule, RateLimitRuleMap, RateLimitStats } from '../models/rate-limit.model';

@Injectable({
  providedIn: 'root'
})
export class RateLimitService {
  private baseUrl = 'http://localhost:8080/admin/rate-limit';

  constructor(private http: HttpClient) { }

  getConfig(): Observable<RateLimitRuleMap> {
    return this.http.get<RateLimitRuleMap>(`${this.baseUrl}/config`);
  }

  updateConfig(config: RateLimitRuleMap): Observable<RateLimitRuleMap> {
    return this.http.put<RateLimitRuleMap>(`${this.baseUrl}/config`, config);
  }

  getStats(): Observable<RateLimitStats> {
    return this.http.get<RateLimitStats>(`${this.baseUrl}/stats`);
  }

  testRequest(endpoint: string): Observable<any> {
    return this.http.get(endpoint);
  }
}