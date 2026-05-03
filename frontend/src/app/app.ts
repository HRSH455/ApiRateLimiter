import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  title = 'API Rate Limiter';
  isBackendReady = false;
  waitSeconds = 0;
  private timer: any;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.startTimer();
    this.pollBackend();
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.waitSeconds++;
      this.cdr.markForCheck();
    }, 1000);
  }

  private pollBackend() {
    const backendUrl = 'https://apiratelimiter-id8y.onrender.com'; // 🔴 replace with your Render URL
    const poll = () => {
      this.http.get(`${backendUrl}/actuator/health`).subscribe({
        next: () => {
          clearInterval(this.timer);
          this.isBackendReady = true;
          this.cdr.markForCheck();
        },
        error: () => setTimeout(poll, 5000)
      });
    };
    poll();
  }
}