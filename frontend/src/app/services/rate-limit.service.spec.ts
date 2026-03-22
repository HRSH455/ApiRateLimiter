import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RateLimitService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(RateLimitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads config map', () => {
    const payload = { '/api/public': { limit: 100, windowSecs: 60, strategy: 'fixed', keyPrefix: 'public' } };
    service.getConfigMap().subscribe((data) => {
      expect(data['/api/public'].limit).toBe(100);
    });

    const req = httpMock.expectOne('http://localhost:8080/admin/rate-limit/config');
    expect(req.request.method).toBe('GET');
    req.flush(payload);
  });

  it('posts config map updates', () => {
    const payload = { '/api/public': { limit: 101, windowSecs: 60, strategy: 'fixed', keyPrefix: 'public' } };
    service.updateConfigMap(payload).subscribe((data) => {
      expect(data['/api/public'].limit).toBe(101);
    });

    const req = httpMock.expectOne('http://localhost:8080/admin/rate-limit/config');
    expect(req.request.method).toBe('POST');
    req.flush(payload);
  });
});

