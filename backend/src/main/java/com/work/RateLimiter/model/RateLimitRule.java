package com.work.RateLimiter.model;

// Immutable record representing a rate limit rule configuration.
// Fields: limit (int), windowSecs (int), strategy (String), keyPrefix (String)
public record RateLimitRule(int limit, int windowSecs, String strategy, String keyPrefix) {
    
}
