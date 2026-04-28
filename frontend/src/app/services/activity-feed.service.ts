// src/app/services/activity-feed.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ActivityRequest {
  time: Date;
  method: string;
  path: string;
  status: number;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityFeedService {
  private feed = new BehaviorSubject<ActivityRequest[]>([]);
  feed$ = this.feed.asObservable();

  push(entry: ActivityRequest): void {
    const current = this.feed.getValue();
    this.feed.next([entry, ...current].slice(0, 10));
  }
}