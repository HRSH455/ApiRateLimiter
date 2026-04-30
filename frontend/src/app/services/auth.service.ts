import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE_URL = environment.apiUrl;
  private credentials: string | null = null;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const encoded = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({ 'Authorization': `Basic ${encoded}` });

    return this.http.get(`${this.BASE_URL}/admin/rate-limit/config`, { headers }).pipe(
      tap(() => {
        this.credentials = encoded;
      }),
      catchError((error) => {
        this.credentials = null;
        if (error.status === 401) {
          return throwError(() => new Error('Invalid username or password'));
        }
        return throwError(() => new Error('Server error, try again later'));
      })
    );
  }

  // Called from inline auth modal in request tester
  setCredentials(username: string, password: string): void {
    this.credentials = btoa(`${username}:${password}`);
  }

  clearCredentials(): void {
    this.credentials = null;
  }

  // logout(): void {
  //   this.credentials = null;
  // }

  isLoggedIn(): boolean {
    return this.credentials !== null;
  }

  getAuthHeaders(): HttpHeaders {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }
    return new HttpHeaders({ 'Authorization': `Basic ${this.credentials}` });
  }
}