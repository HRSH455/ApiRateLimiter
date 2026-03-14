            // Angular service for communicating with Spring Boot admin endpoints.
// Inject HttpClient. Base URL from environment.apiUrl.
// Methods: getStats(), getConfig(), updateConfig(), clearKey()
// getStats() should be called on an interval (every 3 seconds) for live dashboard.
// Return Observables. Do not subscribe here — let components do that.
@Injectable({ providedIn: 'root' })
export class RateLimitService {