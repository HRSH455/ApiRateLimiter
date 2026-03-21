import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-request-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-tester.component.html',
  styleUrls: ['./request-tester.component.css']
})
export class RequestTesterComponent {
  endpoint = 'http://localhost:8080/api/public';
  response: any = {};
  headers: { [key: string]: string } = {};
  errorMessage = '';

  constructor(private http: HttpClient) { }

  sendRequest(): void {
    this.errorMessage = '';
    this.http.get(this.endpoint, { observe: 'response' }).subscribe(
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