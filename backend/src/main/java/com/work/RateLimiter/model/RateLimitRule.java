package com.work.RateLimiter.model;


// Immutable record representing the result of a rate limit check.
// Fields: allowed (boolean), limit (int), remaining (int),
//         resetAt (Instant), retryAfter (Duration, nullable)
// Use Java 21 record syntax.
public record RateLimitRule() {
    
}
