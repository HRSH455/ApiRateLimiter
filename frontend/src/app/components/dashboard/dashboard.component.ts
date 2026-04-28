import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitStats } from '../../models/rate-limit.model';
import { StatusBadgeComponent, MethodBadgeComponent, EmptyStateComponent } from '../../shared';
import { ActivityRequest, ActivityFeedService } from '../../services/activity-feed.service';

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
  private readonly activityFeedService = inject(ActivityFeedService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadStats();

    this.activityFeedService.feed$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(feed => {
      this.activityFeed = feed;
      this.cdr.markForCheck();
    });
  }

  loadStats(): void {
    this.rateLimitService.getStatsPolling(3000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.stats = data;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.stats = null;
        this.errorMessage = 'Unable to load stats: ' + (err?.message || 'network error');
        this.cdr.markForCheck();
      }
    });
  }

  refreshStats(): void {
    this.rateLimitService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Unable to refresh stats: ' + (err?.message || 'network error');
        this.cdr.markForCheck();
      }
    });
  }

  getBlockRate(): number {
    if (!this.stats || this.stats.totalRequests === 0) return 0;
    return Math.round((this.stats.blockedRequests / this.stats.totalRequests) * 100);
  }

  getAllowRate(): number {
    if (!this.stats || this.stats.totalRequests === 0) return 0;
    return Math.round((this.stats.allowedRequests / this.stats.totalRequests) * 100);
  }

  trackByRequest(index: number, item: ActivityRequest): number {
    return item.time.getTime();
  }
}