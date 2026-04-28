import { TestBed } from '@angular/core/testing';

import { ActivityFeedService } from './activity-feed.service';

describe('ActivityFeedService', () => {
  let service: ActivityFeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityFeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
