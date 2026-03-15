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

  constructor(private http: HttpClient) { }

  sendRequest(): void {
    this.http.get(this.endpoint, { observe: 'response' }).subscribe(
      (res: HttpResponse<any>) => {
        this.response = { status: res.status, body: res.body };
        this.headers = {};
        res.headers.keys().forEach(key => {
          this.headers[key] = res.headers.get(key)!;
        });
      },
      (error) => {
        this.response = { status: error.status, body: error.error };
        this.headers = {};
        if (error.headers) {
          error.headers.keys().forEach((key: string) => {
            this.headers[key] = error.headers.get(key);
          });
        }
      }
    );
  }

}