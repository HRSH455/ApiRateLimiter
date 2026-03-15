import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { RateLimitService } from '../../services/rate-limit.service';
import { RateLimitStats } from '../../models/rate-limit.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: RateLimitStats | null = null;
  private subscription: Subscription = new Subscription();

  constructor(private rateLimitService: RateLimitService) { }

  ngOnInit(): void {
    this.loadStats();
    this.subscription.add(
      interval(3000).subscribe(() => this.loadStats())
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadStats(): void {
    this.rateLimitService.getStats().subscribe((data: RateLimitStats) => {
      this.stats = data;
    });
  }

}