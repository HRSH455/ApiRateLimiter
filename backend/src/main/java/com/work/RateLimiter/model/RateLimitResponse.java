package com.work.RateLimiter.model;

// Record representing the JSON error response body for rate limit exceeded.
// Fields: message (String), retryAfterSeconds (int)
public record RateLimitResponse(String message, int retryAfterSeconds) {
    
}

