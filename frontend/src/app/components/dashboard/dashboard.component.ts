import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitStats } from '../../models/rate-limit.model';
import { StatusBadgeComponent, MethodBadgeComponent, EmptyStateComponent } from '../../shared';

interface ActivityRequest {
  time: Date;
  method: string;
  path: string;
  status: number;
  duration: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, MethodBadgeComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  stats: RateLimitStats | null = null;
  errorMessage = '';
  activityFeed: ActivityRequest[] = [];

  private readonly rateLimitService = inject(RateLimitService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.rateLimitService.getStatsPolling(3000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.stats = data;
        this.errorMessage = '';
        this.updateActivityFeed(data);
      },
      error: (err) => {
        this.stats = null;
        this.errorMessage = 'Unable to load stats: ' + (err?.message || 'network error');
      }
    });
  }

  refreshStats(): void {
    this.rateLimitService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.errorMessage = '';
        this.updateActivityFeed(data);
      },
      error: (err) => {
        this.errorMessage = 'Unable to refresh stats: ' + (err?.message || 'network error');
      }
    });
  }

  getBlockRate(): number {
    if (!this.stats || this.stats.totalRequests === 0) {
      return 0;
    }
    return Math.round((this.stats.blockedRequests / this.stats.totalRequests) * 100);
  }

  private updateActivityFeed(stats: RateLimitStats): void {
    // Mock activity feed - in real app, this would come from backend
    // For now, generate some sample data based on stats
    this.activityFeed = [
      {
        time: new Date(),
        method: 'GET',
        path: '/api/public',
        status: 200,
        duration: Math.floor(Math.random() * 100) + 50
      },
      {
        time: new Date(Date.now() - 2000),
        method: 'POST',
        path: '/api/auth/login',
        status: 429,
        duration: Math.floor(Math.random() * 50) + 10
      },
      {
        time: new Date(Date.now() - 5000),
        method: 'GET',
        path: '/api/search',
        status: 200,
        duration: Math.floor(Math.random() * 200) + 100
      }
    ];
  }

  trackByRequest(index: number, item: ActivityRequest): any {
    return item.time.getTime();
  }
}