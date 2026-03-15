export interface RateLimitRule {
  id: string;
  endpoint: string;
  method: string;
  limit: number;
  windowSeconds: number;
  strategy: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  currentWindow: {
    start: number;
    end: number;
  };
}