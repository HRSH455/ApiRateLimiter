export interface RateLimitRule {
  limit: number;
  // Backend contract uses windowSecs; keep windowSeconds optional for UI compatibility.
  windowSecs: number;
  windowSeconds?: number;
  strategy: string;
  keyPrefix?: string;
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
  activeKeys: number;
}