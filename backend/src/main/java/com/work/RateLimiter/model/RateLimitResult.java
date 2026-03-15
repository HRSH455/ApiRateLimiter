package com.work.RateLimiter.model;

import java.time.Instant;
import java.time.Duration;

// Immutable record representing the result of a rate limit check.
// Fields: allowed (boolean), limit (int), remaining (int), resetAt (Instant), retryAfter (Duration, nullable)
public record RateLimitResult(boolean allowed, int limit, int remaining, Instant resetAt, Duration retryAfter) {
    
}