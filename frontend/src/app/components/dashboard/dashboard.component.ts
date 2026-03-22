import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitStats } from '../../models/rate-limit.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  stats: RateLimitStats | null = null;
  errorMessage = '';

  private readonly rateLimitService = inject(RateLimitService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.rateLimitService.getStatsPolling(3000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.stats = data;
        this.errorMessage = '';
      },
      error: (err) => {
        this.stats = null;
        this.errorMessage = 'Unable to load stats: ' + (err?.message || 'network error');
      }
    });
  }

}