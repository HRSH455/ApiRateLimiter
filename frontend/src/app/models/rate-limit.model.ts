export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
  strategy: string;
  keyPrefix?: string;
  // Optional fields used by the frontend for editing, not sent to the backend.
  endpoint?: string;
  method?: string;
}

export type RateLimitRuleMap = Record<string, RateLimitRule>;

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